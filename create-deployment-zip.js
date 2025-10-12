#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = process.argv[2] || 'temp_deploy';
const outputZip = process.argv[3] || 'deployment.zip';

console.log(`Creating deployment ZIP from: ${sourceDir}`);
console.log(`Output file: ${outputZip}`);

// Use PowerShell but with a wrapper script that ensures forward slashes
// Create a temporary PowerShell script that creates the ZIP with correct paths
try {
  if (process.platform === 'win32') {
    // On Windows: Create PowerShell script that forces forward slashes in ZIP entries
    const sourcePath = path.resolve(sourceDir).replace(/\\/g, '/');
    const destPath = path.resolve(outputZip).replace(/\\/g, '/');
    
    const psScript = `
$ErrorActionPreference = "Stop"
$source = "${sourcePath}"
$destination = "${destPath}"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Delete existing zip if it exists
if (Test-Path $destination) {
    Remove-Item $destination -Force
}

# Create new zip
$zip = [System.IO.Compression.ZipFile]::Open($destination, 'Create')

try {
    # Get all files recursively
    $files = Get-ChildItem -Path $source -Recurse -File

    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($source.Length + 1)
        # CRITICAL: Replace ALL backslashes with forward slashes
        $zipPath = $relativePath -replace '\\\\', '/'
        
        Write-Host "Adding: $zipPath"
        
        $entry = $zip.CreateEntry($zipPath)
        $entryStream = $entry.Open()
        $fileStream = [System.IO.File]::OpenRead($file.FullName)
        $fileStream.CopyTo($entryStream)
        $fileStream.Close()
        $entryStream.Close()
    }
} finally {
    $zip.Dispose()
}

Write-Host "ZIP created successfully"
`.trim();

    // Write the PowerShell script to a temporary file
    const tempScriptPath = 'temp_zip_script.ps1';
    fs.writeFileSync(tempScriptPath, psScript, 'utf8');
    
    console.log('Creating ZIP with Unix-style paths...');
    execSync(`powershell -ExecutionPolicy Bypass -File ${tempScriptPath}`, { stdio: 'inherit' });
    
    // Clean up the temporary script
    fs.unlinkSync(tempScriptPath);
    
  } else {
    // On Unix systems, use zip command
    const zipCommand = `cd "${sourceDir}" && zip -r "../${outputZip}" .`;
    console.log(`Running: ${zipCommand}`);
    execSync(zipCommand, { stdio: 'inherit', shell: '/bin/bash' });
  }
  
  // Verify the zip was created
  if (fs.existsSync(outputZip)) {
    const stats = fs.statSync(outputZip);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ ZIP created successfully: ${outputZip} (${sizeMB} MB)`);
    process.exit(0);
  } else {
    console.error('❌ ZIP file was not created');
    process.exit(1);
  }
} catch (error) {
  console.error(`❌ Failed to create ZIP: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}

