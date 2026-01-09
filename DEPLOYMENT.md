# Deployment Guide for GitHub Pages

## Quick Setup

### 1. Enable GitHub Pages
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Source", select **GitHub Actions**

### 2. Push to Main Branch
The deployment workflow will automatically trigger when you push to the `main` branch:

```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

### 3. Access Your Site
After the workflow completes (2-5 minutes), your site will be available at:
- `https://<your-username>.github.io/Desk-tools/`

## Configuration Notes

### Base Path (If Using Repository Name)
If deploying to `https://<username>.github.io/Desk-tools/`, uncomment these lines in `next.config.ts`:

```typescript
basePath: '/Desk-tools',
assetPrefix: '/Desk-tools/',
```

### Custom Domain (Optional)
If using a custom domain:
1. Add a `CNAME` file to the `public/` directory with your domain
2. Configure DNS according to [GitHub's documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production (test before deploying)
npm run build

# Preview production build locally
npx serve@latest out
```

## Troubleshooting

### Workflow Failed
- Check the Actions tab for error logs
- Ensure Node.js version matches workflow (v20)
- Verify all dependencies are in `package.json`

### 404 on Page Refresh
This is expected behavior for static exports. The app uses client-side routing.

### Assets Not Loading
Ensure `basePath` and `assetPrefix` are correctly configured in `next.config.ts` if using a repository subdirectory.

## Privacy & Data Storage

All data (Gantt tasks, notes, preferences) is stored locally in IndexedDB. No data is sent to external servers. The static site runs entirely in the browser.
