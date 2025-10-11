#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load configuration from external file
let CONFIG;
try {
  CONFIG = require('./deploy.config.js');
} catch (error) {
  console.error('❌ deploy.config.js not found. Please create it first.');
  process.exit(1);
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n${colors.cyan}🔄 ${description}...${colors.reset}`);
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    log(`${colors.green}✅ ${description} completed successfully${colors.reset}`);
    return output;
  } catch (error) {
    log(`${colors.red}❌ ${description} failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

function checkPrerequisites() {
  log(`${colors.bright}${colors.blue}🚀 Starting Azure App Service Deployment${colors.reset}`);
  log(`${colors.yellow}App Name: ${CONFIG.appName}${colors.reset}`);
  log(`${colors.yellow}Resource Group: ${CONFIG.resourceGroup}${colors.reset}`);
  
  // Check if Azure CLI is installed
  try {
    execSync('az --version', { stdio: 'pipe' });
    log(`${colors.green}✅ Azure CLI is installed${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Azure CLI is not installed. Please install it first.${colors.reset}`);
    process.exit(1);
  }

  // Check if logged in to Azure
  try {
    execSync('az account show', { stdio: 'pipe' });
    log(`${colors.green}✅ Logged in to Azure${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Not logged in to Azure. Please run 'az login' first.${colors.reset}`);
    process.exit(1);
  }

  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    log(`${colors.red}❌ package.json not found. Please run this script from the project root.${colors.reset}`);
    process.exit(1);
  }
}

function buildProject() {
  log(`${colors.bright}${colors.magenta}📦 Building Project${colors.reset}`);
  
  // Install dependencies if node_modules doesn't exist
  if (!fs.existsSync('node_modules')) {
    execCommand('npm install', 'Installing dependencies');
  }
  
  // Build the project
  execCommand(CONFIG.buildCommand, 'Building Next.js application');
  
  // Verify build output
  if (!fs.existsSync('.next')) {
    log(`${colors.red}❌ Build failed - .next directory not found${colors.reset}`);
    process.exit(1);
  }
  
  log(`${colors.green}✅ Build completed successfully${colors.reset}`);
}

function createDeploymentPackage() {
  log(`${colors.bright}${colors.magenta}📁 Creating Deployment Package${colors.reset}`);
  
  // Remove existing deployment.zip if it exists
  if (fs.existsSync(CONFIG.zipFileName)) {
    fs.unlinkSync(CONFIG.zipFileName);
    log(`${colors.yellow}🗑️  Removed existing ${CONFIG.zipFileName}${colors.reset}`);
  }
  
  // Wait a moment for file handles to be released
  log(`${colors.yellow}⏳ Waiting for file handles to be released...${colors.reset}`);
  
  // Platform-specific wait command
  const waitCommand = process.platform === 'win32' 
    ? 'timeout /t 3 /nobreak >nul 2>&1' 
    : 'sleep 3';
  execSync(waitCommand, { stdio: 'pipe' });
  
  // Create deployment package with retry logic
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      // Create deployment package (cross-platform)
      const itemsList = CONFIG.filesToInclude.map(item => `'${item}'`).join(', ');
      const powershellCommand = `Compress-Archive -Path ${itemsList} -DestinationPath '${CONFIG.zipFileName}' -Force`;
      
      execCommand(`powershell -Command "${powershellCommand}"`, 'Creating deployment package');
      
      // Verify zip file was created
      if (fs.existsSync(CONFIG.zipFileName)) {
        const stats = fs.statSync(CONFIG.zipFileName);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        log(`${colors.green}✅ Deployment package created: ${CONFIG.zipFileName} (${fileSizeInMB} MB)${colors.reset}`);
        return; // Success, exit the function
      }
    } catch (error) {
      retryCount++;
      if (retryCount < maxRetries) {
        log(`${colors.yellow}⚠️  Attempt ${retryCount} failed, retrying in 5 seconds...${colors.reset}`);
        const retryWaitCommand = process.platform === 'win32' 
          ? 'timeout /t 5 /nobreak >nul 2>&1' 
          : 'sleep 5';
        execSync(retryWaitCommand, { stdio: 'pipe' });
      } else {
        log(`${colors.red}❌ Failed to create deployment package after ${maxRetries} attempts${colors.reset}`);
        process.exit(1);
      }
    }
  }
}

function configureAppService() {
  log(`${colors.bright}${colors.magenta}⚙️  Configuring App Service${colors.reset}`);
  
  // Set Node.js version
  execCommand(
    `az webapp config appsettings set --name ${CONFIG.appName} --resource-group ${CONFIG.resourceGroup} --settings WEBSITE_NODE_DEFAULT_VERSION=${CONFIG.nodeVersion}`,
    'Setting Node.js version'
  );
  
  // Set startup command
  execCommand(
    `az webapp config set --name ${CONFIG.appName} --resource-group ${CONFIG.resourceGroup} --startup-file "npm start"`,
    'Setting startup command'
  );
  
  // Set environment variables
  const envSettings = Object.entries(CONFIG.environmentVariables)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
  
  execCommand(
    `az webapp config appsettings set --name ${CONFIG.appName} --resource-group ${CONFIG.resourceGroup} --settings ${envSettings}`,
    'Setting environment variables'
  );
}

function deployToAzure() {
  log(`${colors.bright}${colors.magenta}🚀 Deploying to Azure${colors.reset}`);
  
  // Install webapp extension if not already installed
  try {
    execSync('az extension show --name webapp', { stdio: 'pipe' });
    log(`${colors.green}✅ Azure webapp extension is installed${colors.reset}`);
  } catch (error) {
    execCommand('az extension add --name webapp', 'Installing Azure webapp extension');
  }
  
  // Deploy the application
  execCommand(
    `az webapp deploy --name ${CONFIG.appName} --resource-group ${CONFIG.resourceGroup} --src-path ${CONFIG.zipFileName}`,
    'Deploying application to Azure App Service'
  );
}

function getAppUrl() {
  log(`${colors.bright}${colors.magenta}🔗 Getting Application URL${colors.reset}`);
  
  try {
    const url = execSync(
      `az webapp show --name ${CONFIG.appName} --resource-group ${CONFIG.resourceGroup} --query "defaultHostName" --output tsv`,
      { encoding: 'utf8' }
    ).trim();
    
    log(`${colors.bright}${colors.green}🎉 Deployment Successful!${colors.reset}`);
    log(`${colors.bright}${colors.cyan}Your application is available at: https://${url}${colors.reset}`);
    
    // Clean up deployment file
    if (fs.existsSync(CONFIG.zipFileName)) {
      fs.unlinkSync(CONFIG.zipFileName);
      log(`${colors.yellow}🗑️  Cleaned up ${CONFIG.zipFileName}${colors.reset}`);
    }
    
  } catch (error) {
    log(`${colors.yellow}⚠️  Could not retrieve application URL: ${error.message}${colors.reset}`);
    log(`${colors.cyan}You can find your app URL in the Azure portal${colors.reset}`);
  }
}

function showLogs() {
  log(`${colors.bright}${colors.magenta}📋 Viewing Application Logs${colors.reset}`);
  log(`${colors.yellow}To view live logs, run:${colors.reset}`);
  log(`${colors.cyan}az webapp log tail --name ${CONFIG.appName} --resource-group ${CONFIG.resourceGroup}${colors.reset}`);
}

// Main execution
async function main() {
  try {
    checkPrerequisites();
    buildProject();
    createDeploymentPackage();
    configureAppService();
    deployToAzure();
    getAppUrl();
    showLogs();
    
    log(`${colors.bright}${colors.green}🎉 Deployment completed successfully!${colors.reset}`);
    
  } catch (error) {
    log(`${colors.red}❌ Deployment failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log(`${colors.bright}${colors.blue}Azure App Service Deployment Script${colors.reset}`);
  log(`${colors.yellow}Usage: node deploy.js [options]${colors.reset}`);
  log(`${colors.cyan}Options:${colors.reset}`);
  log(`  --help, -h     Show this help message`);
  log(`  --dry-run      Show what would be deployed without actually deploying`);
  log(`${colors.cyan}Configuration:${colors.reset}`);
  log(`  Edit the CONFIG object in this script to change deployment settings`);
  process.exit(0);
}

if (process.argv.includes('--dry-run')) {
  log(`${colors.yellow}🔍 Dry run mode - showing what would be deployed${colors.reset}`);
  log(`${colors.cyan}App Name: ${CONFIG.appName}${colors.reset}`);
  log(`${colors.cyan}Resource Group: ${CONFIG.resourceGroup}${colors.reset}`);
  log(`${colors.cyan}Node Version: ${CONFIG.nodeVersion}${colors.reset}`);
  process.exit(0);
}

// Run the deployment
main();
