# GraphQL Schema Data Validation Guide

This guide explains how to validate your JSON data against a GraphQL schema to check for missing or incorrect fields.

## Features

- ✅ Detects **missing required fields**
- ✅ Detects **missing optional fields**
- ✅ Detects **type mismatches** (e.g., expecting number but got string)
- ✅ Detects **extra fields** not defined in schema
- ✅ Supports **nested objects** and **arrays**
- ✅ Supports all GraphQL types: Scalars, Objects, Enums, Lists, NonNull

## Quick Start

### Method 1: Using the API Endpoint

Start the development server:

```bash
npm run dev
```

Make a POST request to `/api/validate-data`:

```bash
curl -X POST http://localhost:3000/api/validate-data \
  -H "Content-Type: application/json" \
  -d '{
    "schemaText": "type User { id: ID! email: String! name: String }",
    "data": { "id": "1", "email": "test@example.com" },
    "typeName": "User"
  }'
```

### Method 2: Using the Command-Line Script

```bash
node scripts/validate-data.js <schema-file> <data-file> <type-name>
```

Example:
```bash
node scripts/validate-data.js examples/example-schema.graphql examples/valid-user-data.json User
```

### Method 3: Programmatic Usage

```typescript
import { validateDataAgainstSchema, formatValidationReport } from '@/lib/utils/schema-validator';

const schemaText = `
  type User {
    id: ID!
    email: String!
    name: String
  }
`;

const data = {
  id: "1",
  email: "test@example.com"
  // missing 'name' (optional, so it's okay)
};

const result = validateDataAgainstSchema(schemaText, data, 'User');

if (result.valid) {
  console.log('✅ Data is valid!');
} else {
  console.log(formatValidationReport(result));
}
```

## Example Output

### Valid Data
```
✅ Validation passed! Your data matches the schema perfectly.
```

### Invalid Data
```
❌ Validation failed! Issues found:

📋 MISSING FIELDS:
──────────────────────────────────────────────────
  • username
    Type: String! (REQUIRED)
    Parent: User

  • role
    Type: UserRole! (REQUIRED)
    Parent: User

  • createdAt
    Type: String! (REQUIRED)
    Parent: User

  • profile.location.country
    Type: String! (REQUIRED)
    Parent: Location


⚠️  TYPE ERRORS:
──────────────────────────────────────────────────
  • age
    Expected: Int
    Got: string


⚡ EXTRA FIELDS (not in schema):
──────────────────────────────────────────────────
  • extraField
    Field 'extraField' not found in type 'User'
```

## API Reference

### Endpoint: `/api/validate-data`

**Method:** POST

**Request Body:**
```json
{
  "schemaText": "string (GraphQL SDL)",
  "data": "object (JSON data to validate)",
  "typeName": "string (GraphQL type name, e.g., 'User')"
}
```

**Response:**
```json
{
  "result": {
    "valid": "boolean",
    "missingFields": [
      {
        "path": "string",
        "fieldName": "string",
        "fieldType": "string",
        "required": "boolean",
        "parentType": "string"
      }
    ],
    "extraFields": [
      {
        "path": "string",
        "fieldName": "string",
        "reason": "string"
      }
    ],
    "typeErrors": [
      {
        "path": "string",
        "fieldName": "string",
        "expectedType": "string",
        "actualType": "string"
      }
    ]
  },
  "report": "string (human-readable report)"
}
```

## Utility Functions

### `validateDataAgainstSchema(schemaText, data, typeName)`

Validates JSON data against a GraphQL type.

**Parameters:**
- `schemaText` (string): GraphQL schema in SDL format
- `data` (any): JSON data to validate
- `typeName` (string): Name of the GraphQL type (e.g., 'User', 'Product')

**Returns:** `ValidationResult`

### `formatValidationReport(result)`

Formats a validation result into a human-readable report.

**Parameters:**
- `result` (ValidationResult): Result from `validateDataAgainstSchema`

**Returns:** `string` - Formatted report

## Examples

The `examples/` directory contains:

- `example-schema.graphql` - Sample GraphQL schema
- `valid-user-data.json` - Valid user data that matches the schema
- `invalid-user-data.json` - Invalid data with missing fields and errors

### Test with Valid Data

```bash
node scripts/validate-data.js examples/example-schema.graphql examples/valid-user-data.json User
```

Expected output: ✅ Validation passed!

### Test with Invalid Data

```bash
node scripts/validate-data.js examples/example-schema.graphql examples/invalid-user-data.json User
```

Expected output: ❌ Validation failed with detailed error report

## Common Use Cases

### 1. Validate API Response Data

Check if your API responses match your GraphQL schema:

```typescript
const apiResponse = await fetch('/api/users/1').then(r => r.json());
const result = validateDataAgainstSchema(schema, apiResponse, 'User');
```

### 2. Validate Test Fixtures

Ensure your test data is valid:

```typescript
import testData from './fixtures/user.json';
const result = validateDataAgainstSchema(schema, testData, 'User');
expect(result.valid).toBe(true);
```

### 3. Validate Form Data

Check form submissions before sending to server:

```typescript
const formData = {
  email: form.email.value,
  username: form.username.value,
  // ...
};
const result = validateDataAgainstSchema(schema, formData, 'CreateUserInput');
```

### 4. Migration Validation

Validate existing data after schema changes:

```typescript
const users = await db.users.find({});
users.forEach(user => {
  const result = validateDataAgainstSchema(newSchema, user, 'User');
  if (!result.valid) {
    console.log(`User ${user.id} needs migration:`, result.missingFields);
  }
});
```

## Notes

- The validator checks **structure and types**, not business logic
- Null values are accepted for optional fields
- Extra fields trigger warnings but don't fail validation
- Array items are validated recursively
- Nested objects are fully validated

## Troubleshooting

### Error: "Type 'X' not found in schema"

Make sure the type name matches exactly (case-sensitive):
- ✅ `User`
- ❌ `user`

### Error: "Type 'X' is not an object type"

The validator only works with object types, not scalars, enums, or interfaces.

### Server not running

If using the CLI script, make sure the dev server is running:
```bash
npm run dev
```

## Integration with Existing App

This validator is already integrated into your GraphQL utilities app. You can:

1. Add a new page for data validation
2. Use the API endpoint from other services
3. Add validation to your existing query generation workflow

Would you like me to create a UI component for this feature?

