# Quick Start Guide

Get your GraphQL Utilities application up and running in minutes.

## 🚀 Local Development

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Build for Production

```bash
npm run build
npm start
```

## ☁️ Deploy to Azure App Service

### Prerequisites
- Azure subscription
- Azure CLI installed
- Azure App Service created

### Step 1: Configure

Edit `deploy.config.js`:

```javascript
module.exports = {
  appName: 'your-app-name',
  resourceGroup: 'your-resource-group',
  // ...
};
```

### Step 2: Login to Azure

```bash
az login
```

### Step 3: Deploy

```bash
npm run deploy
```

## 📝 Project Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Check TypeScript types |
| `npm run deploy` | Deploy to Azure |
| `npm run deploy:dry-run` | Preview deployment |

## 📚 Next Steps

- Read the full [README.md](./README.md)
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide
- Explore the application features

## 🆘 Need Help?

- **Build fails?** Run `npm run clean` then `npm install`
- **Type errors?** Run `npm run type-check`
- **Deployment issues?** Check [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🎯 Quick Tips

1. Use `npm run type-check` before committing
2. Configure environment variables in `.env.local` for local development
3. Set up GitHub Actions for automatic deployment (see `.github/workflows/azure-deploy.yml`)
4. Monitor your app with Azure Application Insights

Happy coding! 🎉
