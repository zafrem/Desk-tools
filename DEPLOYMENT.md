# Deployment Guide for GitHub Pages

This project is configured to be deployed to **GitHub Pages** using GitHub Actions.

## Prerequisites

1.  **GitHub Repository**: This project must be pushed to a GitHub repository.
2.  **Settings**: You need to configure the repository settings to allow deployment from GitHub Actions.

## Step-by-Step Guide

### 1. Push to GitHub
Ensure your code is committed and pushed to the `main` branch of your GitHub repository.

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Configure GitHub Pages
1.  Go to your repository on GitHub.
2.  Navigate to **Settings** > **Pages**.
3.  Under **Build and deployment**, select **GitHub Actions** from the "Source" dropdown menu.
4.  (Optional) If you are using a custom domain, configure it here.

### 3. Check the Workflow
The deployment workflow is defined in `.github/workflows/deploy.yml`.
- It triggers on every push to the `main` branch.
- It builds the Next.js app using `npm run build`.
- It uploads the `./out` directory as an artifact.
- It deploys the artifact to GitHub Pages.

### 4. Verify Deployment
After pushing, go to the **Actions** tab in your repository to see the workflow running.
Once it completes (green checkmark), your site will be live at:
`https://<your-username>.github.io/<repo-name>/` (or your custom domain).

## Configuration Details

### `next.config.ts`
The configuration is set for static export:
```typescript
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // ...
};
```

### `.nojekyll`
A `.nojekyll` file is added to the `public/` directory to bypass Jekyll processing on GitHub Pages, ensuring files starting with `_` (like `_next`) are served correctly.

## Troubleshooting

- **404 on Assets**: If CSS or JS files fail to load, you might need to set the `basePath` in `next.config.ts` if your site is not at the root domain (e.g., `username.github.io/repo-name`).
  - Uncomment the `basePath` lines in `next.config.ts` and set it to `/<repo-name>`.
- **Permissions Error**: Ensure the workflow has write permissions. This is set in `deploy.yml`:
  ```yaml
  permissions:
    contents: read
    pages: write
    id-token: write
  ```