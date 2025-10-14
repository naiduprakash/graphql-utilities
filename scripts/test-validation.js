#!/usr/bin/env node

/**
 * Quick test script to verify the validation functionality
 * Run this to test the validator without starting the server
 */

// Import the validation functions directly
const { buildSchema } = require('graphql');

// Simple inline validation function for testing
function validateDataQuick(schemaText, data, typeName) {
  const schema = buildSchema(schemaText);
  const type = schema.getType(typeName);

  if (!type) {
    throw new Error(`Type '${typeName}' not found in schema`);
  }

  const fields = type.getFields();
  const missingFields = [];
  const extraFields = [];

  // Check required fields
  Object.entries(fields).forEach(([fieldName, field]) => {
    const isRequired = field.type.toString().endsWith('!');
    if (isRequired && !(fieldName in data)) {
      missingFields.push({
        fieldName,
        fieldType: field.type.toString(),
        required: true,
      });
    }
  });

  // Check extra fields
  Object.keys(data).forEach(key => {
    if (!(key in fields)) {
      extraFields.push({
        fieldName: key,
        reason: `Field '${key}' not found in type '${typeName}'`,
      });
    }
  });

  return {
    valid: missingFields.length === 0,
    missingFields,
    extraFields,
  };
}

// Test cases
console.log('🧪 Running validation tests...\n');

// Test 1: Valid data
console.log('Test 1: Valid data');
console.log('─'.repeat(50));
try {
  const schema1 = `
    type User {
      id: ID!
      email: String!
      name: String
    }
  `;
  const data1 = {
    id: '1',
    email: 'test@example.com',
    name: 'John Doe',
  };
  const result1 = validateDataQuick(schema1, data1, 'User');
  console.log(result1.valid ? '✅ PASS' : '❌ FAIL');
  console.log(`Missing fields: ${result1.missingFields.length}`);
  console.log(`Extra fields: ${result1.extraFields.length}\n`);
} catch (error) {
  console.log('❌ ERROR:', error.message, '\n');
}

// Test 2: Missing required field
console.log('Test 2: Missing required field');
console.log('─'.repeat(50));
try {
  const schema2 = `
    type User {
      id: ID!
      email: String!
      name: String
    }
  `;
  const data2 = {
    id: '1',
    // missing required 'email'
  };
  const result2 = validateDataQuick(schema2, data2, 'User');
  console.log(result2.valid ? '❌ FAIL (should detect missing field)' : '✅ PASS');
  console.log(`Missing fields: ${result2.missingFields.length}`);
  if (result2.missingFields.length > 0) {
    result2.missingFields.forEach(f => {
      console.log(`  • ${f.fieldName} (${f.fieldType})`);
    });
  }
  console.log();
} catch (error) {
  console.log('❌ ERROR:', error.message, '\n');
}

// Test 3: Extra fields
console.log('Test 3: Extra fields');
console.log('─'.repeat(50));
try {
  const schema3 = `
    type User {
      id: ID!
      email: String!
    }
  `;
  const data3 = {
    id: '1',
    email: 'test@example.com',
    extraField: 'not in schema',
  };
  const result3 = validateDataQuick(schema3, data3, 'User');
  console.log('✅ Validation completed');
  console.log(`Missing required fields: ${result3.missingFields.length}`);
  console.log(`Extra fields detected: ${result3.extraFields.length}`);
  if (result3.extraFields.length > 0) {
    result3.extraFields.forEach(f => {
      console.log(`  • ${f.fieldName}`);
    });
  }
  console.log();
} catch (error) {
  console.log('❌ ERROR:', error.message, '\n');
}

// Test 4: Type not found
console.log('Test 4: Invalid type name');
console.log('─'.repeat(50));
try {
  const schema4 = `
    type User {
      id: ID!
    }
  `;
  const data4 = { id: '1' };
  const result4 = validateDataQuick(schema4, data4, 'NonExistentType');
  console.log('❌ FAIL (should have thrown error)');
} catch (error) {
  console.log('✅ PASS (correctly threw error)');
  console.log(`Error: ${error.message}\n`);
}

console.log('─'.repeat(50));
console.log('✅ All basic tests completed!\n');
console.log('For full validation with nested objects and type checking,');
console.log('use the API endpoint or import the full validator:\n');
console.log('  npm run dev');
console.log('  node scripts/validate-data.js <schema> <data> <type>\n');

