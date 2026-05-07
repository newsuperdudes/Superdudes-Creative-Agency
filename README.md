<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SUPERDUDES | REALITY PROTOCOL

Production website for [superdudes.agency](https://superdudes.agency).

React 19 + Vite + framer-motion + Tailwind (CDN) + Supabase (asset storage).

## Deployment

> **IMPORTANT: This is the ONLY repo that deploys to `/public_html/` (root) on superdudes.agency.**
>
> DO NOT add FTP deploy workflows targeting `/public_html/` from any other repository.
> This caused a production incident on 2026-05-07 when a placeholder repo overwrote the real site.

- **CI/CD:** GitHub Actions (`deploy.yml`) -- triggers on push to `main` and `workflow_dispatch`
- **Target:** GoDaddy cPanel FTP -> `/public_html/`
- **Branch protection:** PRs required to merge into `main`

## Run Locally

**Prerequisites:** Node.js 20+

1. Copy `.env.example` to `.env.local` and fill in Supabase credentials
2. `npm install`
3. `npm run dev`

## Asset Management

Project images and metadata are stored in Supabase (`assets` table + `superdudes` storage bucket).
Use the built-in AssetManager (Shift+U on the site) to upload/manage assets.
