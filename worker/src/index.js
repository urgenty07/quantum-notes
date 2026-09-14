const encoder = new TextEncoder();
const decoder = new TextDecoder();
const POST_PATH = /^src\/content\/blog\/[a-z0-9](?:[a-z0-9\/-]*[a-z0-9])?\.mdx?$/;
const MAX_POST_BYTES = 750_000;
const COMPETITIONS_PATH = "src/data/competitions.json";
const MAX_COMPETITION_RECORDS = 50;
const GITHUB_API_VERSION = "2026-03-10";

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      console.error("Worker request failed", error);
      return json({ error: "服务暂时不可用，请稍后重试。" }, 500, request, env);
    }
  }
};

async function route(request, env) {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/health") {
    return json({ ok: true, service: "zephyr-blog-admin" }, 200, request, env);
  }

  if (request.method === "GET" && url.pathname === "/auth/start") {
    requireConfig(env);
    const verifier = randomToken(48);
    const challenge = base64Url(await crypto.subtle.digest("SHA-256", encoder.encode(verifier)));
    const state = await seal({ kind: "oauth", verifier, exp: Date.now() + 10 * 60_000 }, env.SESSION_SECRET);
    const callback = `${url.origin}/auth/callback`;
    const authorize = new URL("https://github.com/login/oauth/authorize");
    authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    authorize.searchParams.set("redirect_uri", callback);
    authorize.searchParams.set("state", state);
    authorize.searchParams.set("code_challenge", challenge);
    authorize.searchParams.set("code_challenge_method", "S256");
    return Response.redirect(authorize, 302);
  }

  if (request.method === "GET" && url.pathname === "/auth/callback") {
    return finishOAuth(request, env);
  }

  if (url.pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") return corsPreflight(request, env);
    if (!isAllowedOrigin(request, env)) return json({ error: "不允许的来源。" }, 403, request, env);
    const session = await authenticate(request, env);
    if (!session) return json({ error: "登录已过期，请重新登录。" }, 401, request, env);

    if (request.method === "GET" && url.pathname === "/api/session") {
      return json({ login: session.login, expiresAt: session.exp }, 200, request, env);
    }
    if (request.method === "GET" && url.pathname === "/api/posts") {
      return listPosts(request, env, session.token);
    }
    if (request.method === "GET" && url.pathname === "/api/post") {
      return getPost(request, env, session.token, url.searchParams.get("path"));
    }
    if (request.method === "PUT" && url.pathname === "/api/post") {
      return savePost(request, env, session.token);
    }
    if (request.method === "DELETE" && url.pathname === "/api/post") {
      return deletePost(request, env, session.token);
    }
    if (request.method === "GET" && url.pathname === "/api/competitions") {
      return getCompetitions(request, env, session.token);
    }
    if (request.method === "PUT" && url.pathname === "/api/competitions") {
      return saveCompetitions(request, env, session.token);
    }
  }

  return json({ error: "Not found" }, 404, request, env);
}

async function finishOAuth(request, env) {
  requireConfig(env);
  const url = new URL(request.url);
  const fallback = env.ADMIN_URL;
  try {
    if (url.searchParams.get("error")) throw new Error("oauth_denied");
    const code = url.searchParams.get("code");
    const rawState = url.searchParams.get("state");
    if (!code || !rawState) throw new Error("missing_callback_data");
    const state = await open(rawState, env.SESSION_SECRET);
    if (state.kind !== "oauth" || !state.verifier || state.exp < Date.now()) throw new Error("invalid_state");

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${url.origin}/auth/callback`,
        code_verifier: state.verifier
      })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error("token_exchange_failed");

    const user = await github(tokenData.access_token, "/user");
    if (String(user.login).toLowerCase() !== env.ALLOWED_USER.toLowerCase()) {
      throw new Error("account_not_allowed");
    }

    const lifetimeSeconds = Math.min(Number(tokenData.expires_in) || 28_800, 27_000);
    const session = await seal({
      kind: "session",
      login: user.login,
      token: tokenData.access_token,
      exp: Date.now() + lifetimeSeconds * 1000
    }, env.SESSION_SECRET);
    return Response.redirect(`${fallback}#session=${encodeURIComponent(session)}`, 302);
  } catch (error) {
    console.error("OAuth callback failed", error);
    return Response.redirect(`${fallback}#auth_error=login_failed`, 302);
  }
}

async function authenticate(request, env) {
  try {
    requireConfig(env);
    const authorization = request.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) return null;
    const session = await open(authorization.slice(7), env.SESSION_SECRET);
    if (session.kind !== "session" || session.exp < Date.now() || !session.token) return null;
    if (String(session.login).toLowerCase() !== env.ALLOWED_USER.toLowerCase()) return null;
    return session;
  } catch {
    return null;
  }
}

async function listPosts(request, env, token) {
  const result = await github(token, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/src/content/blog?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`);
  if (!Array.isArray(result)) return json({ error: "文章目录格式异常。" }, 502, request, env);
  const posts = result
    .filter((item) => item.type === "file" && POST_PATH.test(item.path))
    .map(({ name, path, sha }) => ({ name, path, sha }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return json({ posts }, 200, request, env);
}

async function getPost(request, env, token, path) {
  if (!validPostPath(path)) return json({ error: "文章路径无效。" }, 400, request, env);
  const result = await github(token, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`);
  if (result.type !== "file" || !result.content) return json({ error: "文章内容不可用。" }, 502, request, env);
  const bytes = Uint8Array.from(atob(result.content.replace(/\n/g, "")), (char) => char.charCodeAt(0));
  return json({ path: result.path, sha: result.sha, content: decoder.decode(bytes) }, 200, request, env);
}

async function savePost(request, env, token) {
  const body = await readJson(request);
  if (!body || !validPostPath(body.path) || typeof body.content !== "string") {
    return json({ error: "文章数据无效。" }, 400, request, env);
  }
  if (encoder.encode(body.content).byteLength > MAX_POST_BYTES) {
    return json({ error: "文章内容过大。" }, 413, request, env);
  }
  if (body.sha !== undefined && !/^[a-f0-9]{40}$/.test(body.sha)) {
    return json({ error: "文章版本标识无效。" }, 400, request, env);
  }
  const payload = {
    message: body.sha ? `Update ${body.path.split("/").pop()} from web editor` : `Create ${body.path.split("/").pop()} from web editor`,
    content: bytesToBase64(encoder.encode(body.content)),
    branch: env.GITHUB_BRANCH,
    ...(body.sha ? { sha: body.sha } : {})
  };
  const result = await github(token, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${body.path}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return json({ path: result.content.path, sha: result.content.sha }, 200, request, env);
}

async function deletePost(request, env, token) {
  const body = await readJson(request);
  if (!body || !validPostPath(body.path) || !/^[a-f0-9]{40}$/.test(body.sha || "")) {
    return json({ error: "删除参数无效。" }, 400, request, env);
  }
  await github(token, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${body.path}`, {
    method: "DELETE",
    body: JSON.stringify({
      message: `Delete ${body.path.split("/").pop()} from web editor`,
      sha: body.sha,
      branch: env.GITHUB_BRANCH
    })
  });
  return json({ ok: true }, 200, request, env);
}

async function getCompetitions(request, env, token) {
  const result = await github(token, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${COMPETITIONS_PATH}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`);
  if (result.type !== "file" || !result.content) return json({ error: "竞赛数据不可用。" }, 502, request, env);
  try {
    const bytes = Uint8Array.from(atob(result.content.replace(/\n/g, "")), (char) => char.charCodeAt(0));
    const achievements = normalizeAchievements(JSON.parse(decoder.decode(bytes)));
    return json({ achievements, sha: result.sha }, 200, request, env);
  } catch (error) {
    console.error("Competition data parsing failed", error);
    return json({ error: "竞赛数据格式异常。" }, 502, request, env);
  }
}

async function saveCompetitions(request, env, token) {
  const body = await readJson(request);
  if (!body || !Array.isArray(body.achievements) || !/^[a-f0-9]{40}$/.test(body.sha || "")) {
    return json({ error: "竞赛数据或版本标识无效。" }, 400, request, env);
  }
  let achievements;
  try {
    achievements = normalizeAchievements(body.achievements);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "竞赛数据无效。" }, 400, request, env);
  }
  const content = `${JSON.stringify(achievements, null, 2)}\n`;
  const result = await github(token, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${COMPETITIONS_PATH}`, {
    method: "PUT",
    body: JSON.stringify({
      message: "Update competition achievements from web editor",
      content: bytesToBase64(encoder.encode(content)),
      branch: env.GITHUB_BRANCH,
      sha: body.sha
    })
  });
  return json({ achievements, sha: result.content.sha }, 200, request, env);
}

function normalizeAchievements(value) {
  if (!Array.isArray(value) || value.length > MAX_COMPETITION_RECORDS) {
    throw new Error("竞赛记录数量无效。");
  }
  const normalized = value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("竞赛记录格式无效。");
    const date = cleanText(item.date, 7, "时间");
    if (!/^\d{4}\.(0[1-9]|1[0-2])$/.test(date)) throw new Error("时间格式应为 YYYY.MM。");
    const topics = Array.isArray(item.topics) ? item.topics.map((topic) => cleanText(topic, 30, "技术标签")) : [];
    if (topics.length > 10) throw new Error("每项竞赛最多填写 10 个技术标签。");
    return {
      index: "",
      date,
      event: cleanText(item.event, 120, "赛事名称"),
      stage: cleanText(item.stage, 50, "赛事阶段"),
      group: cleanText(item.group, 50, "参赛组别"),
      award: cleanText(item.award, 50, "获奖等级"),
      project: cleanText(item.project, 160, "项目名称"),
      summary: cleanText(item.summary, 300, "项目简介"),
      topics: [...new Set(topics)]
    };
  });
  normalized.sort((a, b) => b.date.localeCompare(a.date));
  return normalized.map((item, index) => ({ ...item, index: String(index + 1).padStart(2, "0") }));
}

function cleanText(value, maxLength, label) {
  if (typeof value !== "string") throw new Error(`${label}格式无效。`);
  const cleaned = value.trim().replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ");
  if (!cleaned || cleaned.length > maxLength) throw new Error(`${label}不能为空且不能超过 ${maxLength} 个字符。`);
  return cleaned;
}

async function github(token, path, init = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "zephyr-blog-admin",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      ...(init.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("GitHub API error", response.status, data.message);
    const error = new Error("GitHub request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

function validPostPath(path) {
  return typeof path === "string" && path.length <= 180 && !path.includes("..") && POST_PATH.test(path);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function requireConfig(env) {
  const names = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "SESSION_SECRET", "ALLOWED_ORIGIN", "ADMIN_URL", "GITHUB_OWNER", "GITHUB_REPO", "GITHUB_BRANCH", "ALLOWED_USER"];
  if (names.some((name) => !env[name])) throw new Error("Worker configuration is incomplete");
}

function isAllowedOrigin(request, env) {
  return request.headers.get("Origin") === env.ALLOWED_ORIGIN;
}

function corsHeaders(request, env) {
  if (!isAllowedOrigin(request, env)) return {};
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function corsPreflight(request, env) {
  if (!isAllowedOrigin(request, env)) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}

function json(body, status, request, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders(request, env) }
  });
}

async function encryptionKey(secret) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function seal(value, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(secret);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(value)));
  return `${base64Url(iv)}.${base64Url(encrypted)}`;
}

async function open(token, secret) {
  const [ivPart, dataPart, extra] = token.split(".");
  if (!ivPart || !dataPart || extra) throw new Error("Malformed token");
  const key = await encryptionKey(secret);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(ivPart) }, key, fromBase64Url(dataPart));
  return JSON.parse(decoder.decode(decrypted));
}

function randomToken(size) {
  return base64Url(crypto.getRandomValues(new Uint8Array(size)));
}

function base64Url(value) {
  const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}
