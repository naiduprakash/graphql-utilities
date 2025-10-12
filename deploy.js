#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

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

function execCommand(command, description, silent = false) {
  const startTime = Date.now();
  log(`\n${colors.cyan}🔄 [${new Date().toLocaleTimeString()}] ${description}...${colors.reset}`);
  try {
    const output = execSync(command, { 
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`${colors.green}✅ [${duration}s] ${description} completed successfully${colors.reset}`);
    return output;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`${colors.red}❌ [${duration}s] ${description} failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function getDeploymentConfig() {
  log(`${colors.bright}${colors.blue}🚀 Azure App Service Deployment${colors.reset}\n`);
  log(`${colors.yellow}Please provide the following information:${colors.reset}\n`);

  const config = {};

  // Ask for App Service name
  while (!config.appName) {
    config.appName = await askQuestion('Azure App Service Name: ');
    if (!config.appName) {
      log(`${colors.red}App Service name is required!${colors.reset}`);
    }
  }

  // Ask for Resource Group
  while (!config.resourceGroup) {
    config.resourceGroup = await askQuestion('Resource Group Name: ');
    if (!config.resourceGroup) {
      log(`${colors.red}Resource Group name is required!${colors.reset}`);
    }
  }

  // Ask if user wants to skip build
  const skipBuildAnswer = await askQuestion('\nSkip build step? (yes/no) [no]: ');
  config.skipBuild = skipBuildAnswer.toLowerCase() === 'yes' || skipBuildAnswer.toLowerCase() === 'y';

  log(`\n${colors.green}Configuration:${colors.reset}`);
  log(`  App Name: ${config.appName}`);
  log(`  Resource Group: ${config.resourceGroup}`);
  log(`  Skip Build: ${config.skipBuild ? 'Yes' : 'No'}`);

  // Confirm deployment
  const confirm = await askQuestion('\nProceed with deployment? (yes/no) [yes]: ');
  if (confirm.toLowerCase() === 'no' || confirm.toLowerCase() === 'n') {
    log(`${colors.yellow}Deployment cancelled.${colors.reset}`);
    rl.close();
    process.exit(0);
  }

  return config;
}

function checkPrerequisites() {
  log(`${colors.bright}${colors.magenta}📋 Checking Prerequisites${colors.reset}`);
  
  // Check if Azure CLI is installed
  try {
    execSync('az --version', { stdio: 'pipe' });
    log(`${colors.green}✅ Azure CLI is installed${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Azure CLI is not installed. Please install it first.${colors.reset}`);
    log(`${colors.cyan}Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${colors.reset}`);
    rl.close();
    process.exit(1);
  }

  // Check if logged in to Azure
  try {
    execSync('az account show', { stdio: 'pipe' });
    log(`${colors.green}✅ Logged in to Azure${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Not logged in to Azure. Please run 'az login' first.${colors.reset}`);
    rl.close();
    process.exit(1);
  }

  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    log(`${colors.red}❌ package.json not found. Please run this script from the project root.${colors.reset}`);
    rl.close();
    process.exit(1);
  }

  log(`${colors.green}✅ All prerequisites met${colors.reset}`);
}

function buildProject(skipBuild = false) {
  const stepStart = Date.now();
  
  if (skipBuild) {
    log(`${colors.bright}${colors.magenta}📦 [${new Date().toLocaleTimeString()}] Verifying Existing Build${colors.reset}`);
    
    // Verify standalone build exists
    if (!fs.existsSync('.next/standalone')) {
      log(`${colors.red}❌ No standalone build found. Please run a full build first.${colors.reset}`);
      log(`${colors.yellow}Run deployment without --skip-build flag or choose 'no' when asked to skip build.${colors.reset}`);
      process.exit(1);
    }
    
    if (!fs.existsSync('.next/static')) {
      log(`${colors.red}❌ Static files not found. Please run a full build first.${colors.reset}`);
      process.exit(1);
    }
    
    const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
    log(`${colors.green}✅ [${duration}s] Existing build verified - skipping rebuild${colors.reset}`);
    return;
  }
  
  log(`${colors.bright}${colors.magenta}📦 [${new Date().toLocaleTimeString()}] Building Project${colors.reset}`);
  
  // Clean previous build
  if (fs.existsSync('.next')) {
    log(`${colors.yellow}🗑️  Cleaning previous build...${colors.reset}`);
    if (process.platform === 'win32') {
      execCommand('rmdir /s /q .next', 'Removing .next directory', true);
    } else {
      execCommand('rm -rf .next', 'Removing .next directory', true);
    }
  }

  // Install dependencies if node_modules doesn't exist
  if (!fs.existsSync('node_modules')) {
    execCommand('npm install', 'Installing dependencies');
  }
  
  // Build the project
  execCommand('npm run build', 'Building Next.js application');
  
  // Verify build output
  if (!fs.existsSync('.next')) {
    log(`${colors.red}❌ Build failed - .next directory not found${colors.reset}`);
    rl.close();
    process.exit(1);
  }
  
  // Verify standalone build was created
  if (!fs.existsSync('.next/standalone')) {
    log(`${colors.red}❌ Standalone build not created. Check next.config.js has output: 'standalone'${colors.reset}`);
    rl.close();
    process.exit(1);
  }
  
  const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
  log(`${colors.green}✅ [${duration}s] Build completed successfully${colors.reset}`);
}

function createDeploymentPackage() {
  const stepStart = Date.now();
  log(`${colors.bright}${colors.magenta}📁 [${new Date().toLocaleTimeString()}] Creating Deployment Package${colors.reset}`);
  
  const zipFileName = 'deployment.zip';
  
  // Remove existing deployment.zip if it exists
  if (fs.existsSync(zipFileName)) {
    fs.unlinkSync(zipFileName);
    log(`${colors.yellow}🗑️  Removed existing ${zipFileName}${colors.reset}`);
  }
  
  // Create a temporary directory structure for standalone deployment
  const tempDir = 'temp_deploy';
  if (fs.existsSync(tempDir)) {
    if (process.platform === 'win32') {
      execSync(`rmdir /s /q ${tempDir}`, { stdio: 'pipe' });
    } else {
      execSync(`rm -rf ${tempDir}`, { stdio: 'pipe' });
    }
  }
  fs.mkdirSync(tempDir);
  
  log(`${colors.yellow}⏳ Preparing standalone deployment package...${colors.reset}`);
  
  // Copy standalone build files
  const copyCommands = process.platform === 'win32' ? [
    `xcopy /E /I /Y .next\\standalone\\* ${tempDir}`,
    `xcopy /E /I /Y .next\\static ${tempDir}\\.next\\static`,
    `xcopy /E /I /Y public ${tempDir}\\public`,
    `copy /Y package.json ${tempDir}`,
  ] : [
    `cp -r .next/standalone/* ${tempDir}/`,
    `cp -r .next/static ${tempDir}/.next/`,
    `cp -r public ${tempDir}/`,
    `cp package.json ${tempDir}/`,
  ];
  
  try {
    copyCommands.forEach(cmd => {
      execSync(cmd, { stdio: 'pipe' });
    });
    log(`${colors.green}✅ Standalone files prepared${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Failed to prepare standalone files: ${error.message}${colors.reset}`);
    rl.close();
    process.exit(1);
  }
  
  // Wait a moment for file operations to complete
  const waitCommand = process.platform === 'win32' 
    ? 'timeout /t 2 /nobreak >nul 2>&1' 
    : 'sleep 2';
  
  try {
    execSync(waitCommand, { stdio: 'pipe' });
  } catch (e) {
    // Ignore timeout command errors
  }
  
  // Create deployment package with retry logic
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      // Use Node.js script to create cross-platform ZIP with Unix paths
      // This ensures the ZIP contains forward slashes even on Windows
      execCommand(`node create-deployment-zip.js ${tempDir} ${zipFileName}`, 'Creating deployment package', false);
      
      // Verify zip file was created
      if (fs.existsSync(zipFileName)) {
        const stats = fs.statSync(zipFileName);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
        log(`${colors.green}✅ [${duration}s] Deployment package created: ${zipFileName} (${fileSizeInMB} MB)${colors.reset}`);
        
        // Clean up temp directory
        if (process.platform === 'win32') {
          execSync(`rmdir /s /q ${tempDir}`, { stdio: 'pipe' });
        } else {
          execSync(`rm -rf ${tempDir}`, { stdio: 'pipe' });
        }
        
        return zipFileName;
      }
    } catch (error) {
      retryCount++;
      if (retryCount < maxRetries) {
        log(`${colors.yellow}⚠️  Attempt ${retryCount} failed, retrying in 3 seconds...${colors.reset}`);
        const retryWaitCommand = process.platform === 'win32' 
          ? 'timeout /t 3 /nobreak >nul 2>&1' 
          : 'sleep 3';
        try {
          execSync(retryWaitCommand, { stdio: 'pipe' });
        } catch (e) {
          // Ignore
        }
      } else {
        log(`${colors.red}❌ Failed to create deployment package after ${maxRetries} attempts${colors.reset}`);
        // Clean up temp directory
        try {
          if (process.platform === 'win32') {
            execSync(`rmdir /s /q ${tempDir}`, { stdio: 'pipe' });
          } else {
            execSync(`rm -rf ${tempDir}`, { stdio: 'pipe' });
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        rl.close();
        process.exit(1);
      }
    }
  }
}

function configureAppService(config) {
  log(`${colors.bright}${colors.magenta}⚙️  [${new Date().toLocaleTimeString()}] Azure Configuration${colors.reset}`);
  log(`${colors.yellow}ℹ️  Skipping configuration - manage settings via Azure Portal${colors.reset}`);
  log(`\n${colors.cyan}Recommended settings in Azure Portal:${colors.reset}`);
  log(`  ${colors.bright}Startup Command:${colors.reset} node server.js`);
  log(`  ${colors.bright}App Settings:${colors.reset}`);
  log(`    - NODE_ENV=production`);
  log(`    - NEXT_TELEMETRY_DISABLED=1`);
  log(`    - SCM_DO_BUILD_DURING_DEPLOYMENT=false`);
  log(`    - ENABLE_ORYX_BUILD=false`);
  log(`    - WEBSITE_NODE_DEFAULT_VERSION=~22 (or your preferred version)\n`);
}

function deployToAzure(config, zipFileName) {
  const stepStart = Date.now();
  log(`${colors.bright}${colors.magenta}🚀 [${new Date().toLocaleTimeString()}] Deploying to Azure${colors.reset}`);
  
  // Deploy the pre-built application (no build on server)
  execCommand(
    `az webapp deploy --name ${config.appName} --resource-group ${config.resourceGroup} --src-path ${zipFileName} --type zip --clean true --restart true`,
    'Deploying application to Azure App Service'
  );
  
  const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
  log(`${colors.green}✅ [${duration}s] Deployment to Azure completed${colors.reset}`);
}

function getAppUrl(config) {
  log(`${colors.bright}${colors.magenta}🔗 Getting Application URL${colors.reset}`);
  
  try {
    const url = execSync(
      `az webapp show --name ${config.appName} --resource-group ${config.resourceGroup} --query "defaultHostName" --output tsv`,
      { encoding: 'utf8' }
    ).trim();
    
    log(`\n${colors.bright}${colors.green}🎉 Deployment Successful!${colors.reset}`);
    log(`${colors.bright}${colors.cyan}Your application is available at: https://${url}${colors.reset}\n`);
    
    return url;
  } catch (error) {
    log(`${colors.yellow}⚠️  Could not retrieve application URL: ${error.message}${colors.reset}`);
    log(`${colors.cyan}You can find your app URL in the Azure portal${colors.reset}`);
  }
}

function cleanup(zipFileName) {
  // Clean up deployment file
  if (fs.existsSync(zipFileName)) {
    try {
      fs.unlinkSync(zipFileName);
      log(`${colors.yellow}🗑️  Cleaned up ${zipFileName}${colors.reset}`);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

function showNextSteps(config) {
  log(`\n${colors.bright}${colors.magenta}📋 Next Steps${colors.reset}`);
  
  log(`\n${colors.cyan}1. Verify settings in Azure Portal:${colors.reset}`);
  log(`   - Startup Command: node server.js`);
  log(`   - App Settings: NODE_ENV, SCM_DO_BUILD_DURING_DEPLOYMENT, etc.`);
  
  log(`\n${colors.cyan}2. View live logs:${colors.reset}`);
  log(`   az webapp log tail --name ${config.appName} --resource-group ${config.resourceGroup}`);
  
  log(`\n${colors.cyan}3. Access your app:${colors.reset}`);
  log(`   https://${config.appName}.azurewebsites.net\n`);
}

// Main execution
async function main() {
  const totalStart = Date.now();
  let config;
  let zipFileName;
  
  try {
    log(`${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.blue}   🚀 Azure Deployment Started   ${colors.reset}`);
    log(`${colors.bright}${colors.blue}   📅 ${new Date().toLocaleString()}   ${colors.reset}`);
    log(`${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
    
    // Check for command line flag
    const skipBuildFlag = process.argv.includes('--skip-build') || process.argv.includes('-s');
    
    checkPrerequisites();
    config = await getDeploymentConfig();
    rl.close();
    
    // Use command line flag if provided, otherwise use config from prompt
    const shouldSkipBuild = skipBuildFlag || config.skipBuild;
    
    buildProject(shouldSkipBuild);
    zipFileName = createDeploymentPackage();
    configureAppService(config);
    deployToAzure(config, zipFileName);
    getAppUrl(config);
    cleanup(zipFileName);
    showNextSteps(config);
    
    const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(2);
    log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.green}   🎉 Deployment Successful!   ${colors.reset}`);
    log(`${colors.bright}${colors.green}   ⏱️  Total Time: ${totalDuration}s   ${colors.reset}`);
    log(`${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
    
  } catch (error) {
    const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(2);
    log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
    log(`${colors.red}   ❌ Deployment Failed   ${colors.reset}`);
    log(`${colors.red}   ⏱️  Time Elapsed: ${totalDuration}s   ${colors.reset}`);
    log(`${colors.red}   Error: ${error.message}   ${colors.reset}`);
    log(`${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
    if (zipFileName) {
      cleanup(zipFileName);
    }
    rl.close();
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log(`${colors.bright}${colors.blue}Azure App Service Deployment Script${colors.reset}`);
  log(`${colors.yellow}Usage: npm run deploy [options]${colors.reset}`);
  log(`\n${colors.cyan}Options:${colors.reset}`);
  log(`  --skip-build, -s    Skip the build step (use existing build)`);
  log(`  --help, -h          Show this help message`);
  log(`\n${colors.cyan}This script will:${colors.reset}`);
  log(`  1. Check prerequisites (Azure CLI, login status)`);
  log(`  2. Ask for deployment configuration (interactively)`);
  log(`  3. Build your Next.js application (or skip if --skip-build)`);
  log(`  4. Create deployment package`);
  log(`  5. Deploy to Azure (settings managed via portal)`);
  log(`\n${colors.cyan}Examples:${colors.reset}`);
  log(`  npm run deploy              # Full deployment with build`);
  log(`  npm run deploy -- --skip-build   # Deploy without rebuilding`);
  log(`\n${colors.cyan}Prerequisites:${colors.reset}`);
  log(`  - Azure CLI installed`);
  log(`  - Logged in to Azure (run 'az login')`);
  log(`  - Azure App Service already created`);
  process.exit(0);
}

// Run the deployment
main();
