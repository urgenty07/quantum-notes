# Quantum Notes — 个人技术博客

一个面向 Quantum Computing、Tensor Networks、Quantum Machine Learning 与论文复现记录的个人技术博客。项目使用 Astro + TypeScript 构建，默认生成纯静态 HTML，无数据库、无后端，可部署到 GitHub Pages、Vercel 或 Cloudflare Pages。

## 效果与功能

- 极简、学术感的响应式界面，适配桌面、平板与 375px 手机屏幕
- 首页、博客、文章详情、动态分类、动态标签、项目、About 与 404 页面
- Astro Content Collections 管理 Markdown / MDX 内容并校验 frontmatter
- KaTeX 行内与块级公式、Shiki 代码高亮、文章目录 TOC
- Light / Dark / System 三档主题，保存偏好且首屏无主题闪烁
- SEO、canonical、Open Graph、Twitter Card、sitemap、robots.txt 与 RSS
- GitHub Pages 官方 Actions 自动部署流程

## 技术栈

- [Astro](https://astro.build/) 7
- TypeScript（strict）
- remark-math + rehype-katex + KaTeX
- Astro Sitemap / RSS
- 原生 CSS 与少量原生 JavaScript（未引入 React）

## 本地运行

需要 Node.js 24 LTS 或更高版本，以及 npm。

```bash
npm install
npm run dev
```

开发服务器默认地址为 `http://localhost:4321`。

```bash
npm run check    # 类型与 Astro 检查
npm run build    # 检查并生成 dist/
npm run preview  # 本地预览生产构建
```

## 如何写新文章

以后写博客只需要在 [`src/content/blog/`](src/content/blog/) 新建 `xxx.md`。文件名就是文章 URL，例如 `quantum-note.md` 会生成 `/blog/quantum-note`。

复制下面的 frontmatter 模板：

```md
---
title: "文章标题"
description: "一句话摘要"
pubDate: 2026-09-13
updatedDate: 2026-09-14
tags:
  - Quantum Computing
  - VQE
category: "Quantum Computing"
draft: false
featured: false
---

从这里开始写正文。行内公式示例：$E=mc^2$。

$$
H_{\mathrm{eff}}\Theta = E\Theta
$$
```

`category` 必须是以下四项之一：

- `Quantum Computing`
- `Tensor Network`
- `Quantum Machine Learning`
- `Paper Reading`

设置 `draft: true` 后，文章不会出现在站点或 RSS 中；`featured: true` 会进入首页精选文章。

文章图片可以放在 `src/assets/`，并在 Markdown 中使用相对路径引用；Astro 会在构建时处理资源。代码块注明语言即可获得高亮，例如 `python`、`cpp`、`bash` 或 `json`。

## 修改个人资料

基础资料全部集中在 [`src/config.ts`](src/config.ts)：

- `title` / `author`：你的姓名或站点名称
- `description`：站点简介
- `github`：GitHub 个人主页
- `email`：可留空
- `site`：公开站点域名
- `base`：站点部署路径

首页文案和关注方向在 [`src/pages/index.astro`](src/pages/index.astro)。

About 正文在 [`src/pages/about.astro`](src/pages/about.astro)。

项目卡片在 [`src/data/projects.ts`](src/data/projects.ts)。`github` 字段是可选的；仅在仓库公开后填写，未填写时页面不会渲染无效链接。

## GitHub Pages 部署

项目已包含 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)，push 到 `main` 后会自动执行 `npm ci`、构建并使用 GitHub 官方 Pages Actions 发布。

### 1. 确定站点类型

用户站点仓库名必须是 `USERNAME.github.io`：

```ts
// src/config.ts
site: "https://USERNAME.github.io",
base: "/"
```

项目站点仓库名例如 `blog`，地址为 `USERNAME.github.io/blog`：

```ts
// src/config.ts
site: "https://USERNAME.github.io",
base: "/blog"
```

这是 GitHub Pages 部署只需要修改的一处配置。`base` 必须与仓库名完全一致，且区分大小写。

### 2. 创建并上传仓库

1. 在 GitHub 创建一个空仓库，不要额外生成 README 或 `.gitignore`。
2. 在本项目目录执行（把地址换成你的仓库）：

```bash
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git branch -M main
git push -u origin main
```

3. 打开 GitHub 仓库的 **Settings → Pages**。
4. 在 **Build and deployment → Source** 选择 **GitHub Actions**。
5. 再次 push 到 `main`，或在 **Actions** 页面手动运行 `Deploy Astro site to GitHub Pages`。

首次发布通常需要等待一两分钟。成功后的地址通常是：

- 用户站点：`https://USERNAME.github.io/`
- 项目站点：`https://USERNAME.github.io/REPOSITORY/`

### 自定义域名

先在域名服务商处配置 DNS：根域名通常使用 GitHub 提供的 A/AAAA 记录，子域名通常以 CNAME 指向 `USERNAME.github.io`。然后在 GitHub **Settings → Pages → Custom domain** 填写域名并启用 HTTPS。

GitHub 会管理仓库根目录的 `CNAME` 文件。启用自定义域名后，把 `src/config.ts` 的 `site` 改为完整自定义域名（例如 `https://notes.example.com`），并将 `base` 改为 `/`。

## Vercel 部署

在 Vercel 选择 **Import Git Repository**，框架通常会自动识别为 Astro：

- Build Command：`npm run build`
- Output Directory：`dist`
- Install Command：`npm install`（默认即可）

Vercel 使用根路径部署时，将 `src/config.ts` 的 `site` 改为实际域名，`base` 设置为 `/`。

## Cloudflare Pages 部署

在 Cloudflare Pages 连接 Git 仓库：

- Framework preset：Astro
- Build command：`npm run build`
- Build output directory：`dist`
- Node.js version：`24`

部署到根路径时，同样把 `site` 改为实际域名，`base` 设置为 `/`。

## 目录结构

```text
src/
├── components/       # Header、Footer、文章卡片、项目卡片、主题按钮
├── content/blog/     # Markdown / MDX 文章
├── data/             # 项目数据
├── layouts/          # 全局与文章布局
├── pages/            # 路由页面、RSS、robots.txt
├── styles/           # 全局样式
├── config.ts         # 个人资料与部署配置
└── content.config.ts # Content Collections schema
public/               # favicon 等静态资源
```

## License

代码可按你的需要继续修改和部署。发布文章前，请将示例内容替换或扩展为你自己的笔记，并自行确认引用来源。
