# Validation Examples

This directory contains example files to test the GraphQL schema validation feature.

## Files

### `example-schema.graphql`
A comprehensive GraphQL schema with various types (User, Profile, Post, etc.) demonstrating:
- Required and optional fields
- Nested objects
- Arrays
- Enums
- Different scalar types (String, Int, Float, Boolean, ID)

### `valid-user-data.json`
Complete and valid user data that matches the schema perfectly. All required fields are present with correct types.

### `invalid-user-data.json`
Invalid user data with several issues:
- Missing required fields (username, role, createdAt)
- Missing nested required field (country in location)
- Type mismatch (age is string instead of Int)
- Extra field not in schema (extraField)

## Usage

### Quick Test

```bash
# Test with valid data (should pass)
npm run validate examples/example-schema.graphql examples/valid-user-data.json User

# Test with invalid data (should fail and show errors)
npm run validate examples/example-schema.graphql examples/invalid-user-data.json User
```

### With Your Own Data

1. Create your GraphQL schema file (`.graphql` or `.txt`)
2. Create your JSON data file
3. Run the validator:

```bash
npm run validate path/to/schema.graphql path/to/data.json TypeName
```

## Example: Creating Your Own Test

### 1. Create a schema file: `my-schema.graphql`

```graphql
type Product {
  id: ID!
  name: String!
  price: Float!
  inStock: Boolean!
  category: Category!
  tags: [String!]
}

enum Category {
  ELECTRONICS
  CLOTHING
  BOOKS
}
```

### 2. Create a data file: `my-product.json`

```json
{
  "id": "prod-123",
  "name": "Laptop",
  "price": 999.99,
  "inStock": true,
  "category": "ELECTRONICS",
  "tags": ["computers", "tech"]
}
```

### 3. Validate

```bash
npm run validate my-schema.graphql my-product.json Product
```

## Expected Output

### ✅ Valid Data
```
✅ Validation passed! Your data matches the schema perfectly.
```

### ❌ Invalid Data
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

## Using the API

If you prefer to use the API endpoint:

1. Start the dev server:
```bash
npm run dev
```

2. Make a POST request:
```bash
curl -X POST http://localhost:3000/api/validate-data \
  -H "Content-Type: application/json" \
  -d @request.json
```

Where `request.json` contains:
```json
{
  "schemaText": "type User { id: ID! email: String! }",
  "data": { "id": "1", "email": "test@example.com" },
  "typeName": "User"
}
```

## Programmatic Usage

```typescript
import { validateDataAgainstSchema, formatValidationReport } from '@/lib/utils/schema-validator';
import { readFileSync } from 'fs';

const schemaText = readFileSync('examples/example-schema.graphql', 'utf-8');
const data = JSON.parse(readFileSync('examples/valid-user-data.json', 'utf-8'));

const result = validateDataAgainstSchema(schemaText, data, 'User');

if (result.valid) {
  console.log('✅ Valid!');
} else {
  console.log(formatValidationReport(result));
}
```

## What Gets Validated?

- ✅ **Required fields** - All fields marked with `!` must be present
- ✅ **Type matching** - Values must match their declared types
- ✅ **Nested objects** - All nested objects are validated recursively
- ✅ **Arrays** - Array items are validated against their type
- ✅ **Enums** - Values must be valid enum values
- ✅ **Extra fields** - Fields not in schema are reported

## Tips

1. **Start with a simple schema** - Test with a basic type first
2. **Check one type at a time** - Validate individual types separately
3. **Use nested validation** - The validator handles deep nesting automatically
4. **Review error paths** - Error paths show exact location of issues (e.g., `profile.location.country`)
5. **Required vs Optional** - Only required fields (`!`) will cause validation to fail if missing

