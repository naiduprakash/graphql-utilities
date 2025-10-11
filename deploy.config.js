// Azure App Service Deployment Configuration
// Update these values according to your Azure setup

module.exports = {
  // Azure App Service Configuration
  appName: 'YOUR_APP_NAME', // Replace with your Azure App Service name
  resourceGroup: 'YOUR_RESOURCE_GROUP', // Replace with your resource group name
  
  // App Service Settings
  nodeVersion: '18-lts',
  
  // Build Configuration
  buildCommand: 'npm run build',
  zipFileName: 'deployment.zip',
  
  // Environment Variables
  environmentVariables: {
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    SCM_DO_BUILD_DURING_DEPLOYMENT: 'true'
  },
  
  // Files to include in deployment package
  filesToInclude: [
    'app',
    'components',
    'lib',
    'public',
    '.next',
    'package.json',
    'package-lock.json',
    'next.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    'tsconfig.json'
  ]
};
