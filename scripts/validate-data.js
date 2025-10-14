#!/usr/bin/env node

/**
 * Command-line script to validate JSON data against GraphQL schema
 * 
 * Usage:
 *   node scripts/validate-data.js <schema-file> <data-file> <type-name>
 * 
 * Example:
 *   node scripts/validate-data.js examples/schema.graphql examples/data.json User
 */

const fs = require('fs');
const path = require('path');

// Simple validation function (Node.js compatible version)
async function validateData(schemaPath, dataPath, typeName) {
  try {
    // Read files
    const schemaText = fs.readFileSync(schemaPath, 'utf-8');
    const dataText = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(dataText);

    console.log('📊 Validating data against schema...\n');
    console.log(`Schema: ${schemaPath}`);
    console.log(`Data: ${dataPath}`);
    console.log(`Type: ${typeName}\n`);
    console.log('─'.repeat(60));

    // Call the API endpoint
    const response = await fetch('http://localhost:3000/api/validate-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schemaText,
        data,
        typeName,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('\n❌ Error:', result.error);
      process.exit(1);
    }

    // Display the report
    console.log('\n' + result.report);

    // Exit with appropriate code
    process.exit(result.result.valid ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('Usage: node scripts/validate-data.js <schema-file> <data-file> <type-name>');
  console.log('\nExample:');
  console.log('  node scripts/validate-data.js examples/schema.graphql examples/data.json User');
  process.exit(1);
}

const [schemaPath, dataPath, typeName] = args;

// Validate file existence
if (!fs.existsSync(schemaPath)) {
  console.error(`❌ Schema file not found: ${schemaPath}`);
  process.exit(1);
}

if (!fs.existsSync(dataPath)) {
  console.error(`❌ Data file not found: ${dataPath}`);
  process.exit(1);
}

// Run validation
validateData(schemaPath, dataPath, typeName);

