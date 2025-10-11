# Azure App Service Deployment Guide

This guide covers deploying the GraphQL Utilities Next.js application to Azure App Service.

## Prerequisites

- ✅ Azure subscription with an App Service already created
- ✅ Azure CLI installed ([Download](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- ✅ Node.js 18+ and npm 8+
- ✅ Git (optional, for source control deployment)

## Quick Start

### 1. Configure Deployment Settings

Edit `deploy.config.js` with your Azure App Service details:

```javascript
module.exports = {
  appName: 'YOUR_APP_NAME',        // Your Azure App Service name
  resourceGroup: 'YOUR_RESOURCE_GROUP', // Your Azure Resource Group
  nodeVersion: '18-lts',
  // ... other settings
};
```

### 2. Login to Azure

```bash
az login
```

### 3. Deploy Using the Deployment Script

```bash
npm run deploy
```

That's it! The script will:
- ✅ Build your Next.js application
- ✅ Create a deployment package
- ✅ Configure App Service settings
- ✅ Deploy to Azure
- ✅ Provide the application URL

## Manual Deployment (Alternative)

If you prefer manual deployment:

### Step 1: Build the Application

```bash
npm install
npm run build
```

### Step 2: Configure App Service

```bash
# Set your variables
APP_NAME="your-app-name"
RESOURCE_GROUP="your-resource-group"

# Configure Node.js runtime
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings WEBSITE_NODE_DEFAULT_VERSION="18-lts"

# Set startup command
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --startup-file "npm start"

# Set environment variables
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings NODE_ENV="production" NEXT_TELEMETRY_DISABLED="1"
```

### Step 3: Deploy

**Option A: ZIP Deployment**

```bash
# Create deployment package (Windows PowerShell)
Compress-Archive -Path app,components,lib,.next,package.json,package-lock.json,next.config.js,tailwind.config.js,postcss.config.js,tsconfig.json -DestinationPath deployment.zip -Force

# Deploy
az webapp deploy \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --src-path deployment.zip
```

**Option B: GitHub Actions (CI/CD)**

See `.github/workflows/azure-deploy.yml` for automated deployment setup.

## Environment Variables

Configure these in Azure App Service:

### Required
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`

### Optional
- `CUSTOM_KEY` - For custom configuration
- Add any other environment variables your app needs

## Monitoring and Troubleshooting

### View Live Logs

```bash
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP
```

### View Application Logs in Azure Portal

1. Go to Azure Portal
2. Navigate to your App Service
3. Select "Log stream" from the left menu

### Common Issues

**Build Failures**
- Ensure Node.js version is 18+
- Check `npm install` completes successfully
- Verify TypeScript compilation passes

**Runtime Errors**
- Check Application Logs in Azure Portal
- Verify environment variables are set
- Ensure startup command is `npm start`

**Performance Issues**
- Scale up App Service plan (consider P1V2 or higher for production)
- Enable Application Insights for monitoring
- Consider Azure CDN for static assets

## Deployment Script Commands

```bash
# Deploy to Azure
npm run deploy

# Dry run (see what would be deployed)
npm run deploy:dry-run

# View help
node deploy.js --help
```

## Architecture

- **Runtime**: Node.js 18 LTS on Linux
- **Framework**: Next.js 14 with App Router
- **Features**: SSR, API Routes, Static Assets
- **Build Tool**: SWC (built into Next.js)

## Security

The application includes:
- HTTPS enforced by default
- Security headers configured in `next.config.js`
- Environment variables secured in Azure App Service
- No sensitive data in client-side code

## Performance Optimization

- **SWC minification** for optimized bundles
- **Static Generation** where applicable
- **Image optimization** with Next.js Image component
- Consider adding **Azure CDN** for global distribution

## Next Steps

After deployment:

1. **Enable Application Insights** for monitoring
2. **Set up custom domain** if needed
3. **Configure SSL certificate** for custom domains
4. **Set up deployment slots** for staging environment
5. **Enable auto-scaling** based on traffic

## Support

For issues:
- Check Azure App Service logs
- Review Application Insights metrics
- Consult [Next.js deployment docs](https://nextjs.org/docs/deployment)
- Consult [Azure App Service docs](https://docs.microsoft.com/en-us/azure/app-service/)
