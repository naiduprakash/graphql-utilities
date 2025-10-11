# Azure App Service Deployment Checklist

Use this checklist to ensure your deployment is configured correctly.

## ✅ Pre-Deployment Checklist

### 1. Azure Resources
- [ ] Azure subscription is active
- [ ] Azure App Service is created
- [ ] Resource Group exists
- [ ] Note your App Service name and Resource Group name

### 2. Local Setup
- [ ] Azure CLI installed (`az --version`)
- [ ] Logged into Azure (`az login`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Dependencies installed (`npm install`)

### 3. Configuration Files

#### `deploy.config.js`
- [ ] Updated `appName` with your Azure App Service name
- [ ] Updated `resourceGroup` with your Resource Group name
- [ ] Verified `nodeVersion` is set to '18-lts'

Example:
```javascript
module.exports = {
  appName: 'my-gql-app',              // ← Replace this
  resourceGroup: 'my-resource-group', // ← Replace this
  nodeVersion: '18-lts',
  // ...
};
```

#### `.github/workflows/azure-deploy.yml` (Optional - for CI/CD)
- [ ] Updated `AZURE_WEBAPP_NAME` in the workflow file
- [ ] Added `AZURE_WEBAPP_PUBLISH_PROFILE` secret to GitHub
  - Get from Azure Portal → App Service → Get publish profile
  - Add to GitHub → Repository Settings → Secrets → Actions

#### `.azure/config` (Optional)
- [ ] Updated with your Azure details

### 4. Environment Variables
- [ ] Listed all required environment variables
- [ ] Configured them in Azure App Service settings

```bash
az webapp config appsettings set \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --settings KEY1=VALUE1 KEY2=VALUE2
```

### 5. Build Test
- [ ] Build completes successfully (`npm run build`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)

## 🚀 Deployment Steps

### Option 1: Using Deployment Script (Recommended)

```bash
npm run deploy
```

### Option 2: Manual Deployment

```bash
# 1. Build
npm run build

# 2. Create package (PowerShell)
Compress-Archive -Path app,components,lib,public,.next,package.json,package-lock.json,next.config.js,tailwind.config.js,postcss.config.js,tsconfig.json -DestinationPath deployment.zip -Force

# 3. Deploy
az webapp deploy --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP --src-path deployment.zip
```

### Option 3: GitHub Actions

Push to `main` branch - deployment happens automatically!

## ✅ Post-Deployment Checklist

### 1. Verify Deployment
- [ ] Application is accessible at `https://YOUR_APP_NAME.azurewebsites.net`
- [ ] No 502/503 errors
- [ ] Home page loads correctly
- [ ] API routes work (check `/api/*` endpoints)

### 2. Check Logs
```bash
az webapp log tail --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP
```

- [ ] No error messages in logs
- [ ] Application started successfully
- [ ] No missing dependencies

### 3. Configuration Verification
```bash
# Check Node.js version
az webapp config show --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP --query "linuxFxVersion"

# Check environment variables
az webapp config appsettings list --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP
```

- [ ] Node.js version is correct (18-lts)
- [ ] Environment variables are set
- [ ] `NODE_ENV=production` is set

### 4. Performance Check
- [ ] Page load time is acceptable
- [ ] Static assets are loading
- [ ] API responses are fast
- [ ] No console errors in browser

## 🔧 Troubleshooting

### Build Failures
```bash
# Clean and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Runtime Errors
1. Check Azure App Service logs
2. Verify environment variables
3. Check Node.js version configuration
4. Ensure startup command is `npm start`

### Performance Issues
1. Scale up to P1V2 or higher plan
2. Enable Application Insights
3. Configure CDN for static assets
4. Optimize bundle size with `npm run analyze`

## 📊 Monitoring Setup (Optional but Recommended)

### Enable Application Insights
```bash
# Create Application Insights
az monitor app-insights component create \
  --app my-app-insights \
  --location eastus \
  --resource-group YOUR_RESOURCE_GROUP \
  --application-type web

# Link to App Service
az webapp config appsettings set \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="<connection-string>"
```

- [ ] Application Insights created
- [ ] Linked to App Service
- [ ] Monitoring dashboard configured

## 🔐 Security Checklist

- [ ] HTTPS is enforced (default in Azure App Service)
- [ ] Security headers configured in `next.config.js`
- [ ] Environment variables are not exposed to client
- [ ] No sensitive data in source code
- [ ] Authentication configured (if required)
- [ ] CORS configured properly (if needed)

## 📈 Performance Optimization

- [ ] Enable Application Insights
- [ ] Configure CDN for static assets
- [ ] Set up auto-scaling rules
- [ ] Enable HTTP/2
- [ ] Optimize images and assets
- [ ] Review bundle size

## 🔄 CI/CD Setup (Optional)

- [ ] GitHub Actions workflow configured
- [ ] Publish profile secret added
- [ ] Test automated deployment
- [ ] Set up staging slot (optional)
- [ ] Configure deployment approvals (optional)

## 📝 Documentation

- [ ] Update README.md with deployment URL
- [ ] Document environment variables
- [ ] Document deployment process for team
- [ ] Add monitoring dashboard links

## ✨ Success Criteria

Your deployment is successful when:

✅ Application is accessible at production URL  
✅ All features work as expected  
✅ API routes respond correctly  
✅ No errors in application logs  
✅ Performance is acceptable  
✅ Monitoring is configured  

---

## Need Help?

- 📖 Read [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
- 🔍 Check logs: `az webapp log tail --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP`
- 🌐 Azure Portal: https://portal.azure.com
- 📚 Azure Docs: https://docs.microsoft.com/azure/app-service/
- 📘 Next.js Docs: https://nextjs.org/docs/deployment

---

**Last Updated**: Ready for deployment ✨

