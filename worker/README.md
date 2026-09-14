# Zephyr Blog Admin Worker

This Worker is the private write gateway used by `/admin`. It authenticates the
single allowed GitHub account and writes only Markdown files under
`src/content/blog/` in the configured repository.

## Required secrets

Configure these with Cloudflare Worker Secrets. Never commit their values:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `SESSION_SECRET` (a long random value)

For local development, copy `.dev.vars.example` to `.dev.vars` and fill it in.
The real `.dev.vars` file is ignored by Git.

## GitHub App

Create a private GitHub App with:

- Callback URL: `https://<worker-name>.<workers-subdomain>.workers.dev/auth/callback`
- Repository permission: **Contents — Read and write**
- Installation scope: only the `quantum-notes` repository

After adding the three Worker secrets, deploy with `npm run worker:deploy`.
