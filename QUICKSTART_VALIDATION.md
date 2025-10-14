# Quick Start: Schema Validation

Validate your JSON data against GraphQL schemas in 3 easy ways!

## 🚀 Fastest Way (Command Line)

```bash
# Run the test to verify it works
npm run test:validation

# Validate your own data
npm run validate <schema-file> <data-file> <type-name>
```

### Example:
```bash
# Valid data - should pass ✅
npm run validate examples/example-schema.graphql examples/valid-user-data.json User

# Invalid data - should show errors ❌
npm run validate examples/example-schema.graphql examples/invalid-user-data.json User
```

## 📝 Your Own Data

### Step 1: Create schema file
Create `my-schema.graphql`:
```graphql
type Product {
  id: ID!
  name: String!
  price: Float!
}
```

### Step 2: Create data file
Create `my-data.json`:
```json
{
  "id": "123",
  "name": "Laptop",
  "price": 999.99
}
```

### Step 3: Validate
```bash
npm run validate my-schema.graphql my-data.json Product
```

## 🌐 Using the API

### 1. Start server
```bash
npm run dev
```

### 2. Make request

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/validate-data \
  -H "Content-Type: application/json" \
  -d '{
    "schemaText": "type Product { id: ID! name: String! }",
    "data": { "id": "123", "name": "Laptop" },
    "typeName": "Product"
  }'
```

**Using fetch (JavaScript):**
```javascript
const response = await fetch('http://localhost:3000/api/validate-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    schemaText: `type Product { id: ID! name: String! }`,
    data: { id: '123', name: 'Laptop' },
    typeName: 'Product'
  })
});

const result = await response.json();
console.log(result.report);
```

## 💻 In Your Code

```typescript
import { validateDataAgainstSchema, formatValidationReport } from '@/lib/utils/schema-validator';

const schema = `
  type User {
    id: ID!
    email: String!
    name: String
  }
`;

const data = {
  id: '1',
  email: 'john@example.com'
};

const result = validateDataAgainstSchema(schema, data, 'User');

if (result.valid) {
  console.log('✅ Valid!');
} else {
  console.log(formatValidationReport(result));
  
  // Access specific errors
  result.missingFields.forEach(field => {
    console.log(`Missing: ${field.fieldName}`);
  });
}
```

## 📊 What You Get

### ✅ Valid Data
```
✅ Validation passed! Your data matches the schema perfectly.
```

### ❌ Invalid Data
```
❌ Validation failed! Issues found:

📋 MISSING FIELDS:
  • email (String!) - REQUIRED
  • role (UserRole!) - REQUIRED

⚠️  TYPE ERRORS:
  • age: Expected Int, got string

⚡ EXTRA FIELDS:
  • unknownField: not in schema
```

## 🎯 Common Use Cases

### Validate API Responses
```typescript
const apiData = await fetchUserData();
const result = validateDataAgainstSchema(schema, apiData, 'User');
```

### Validate Test Fixtures
```typescript
import testData from './fixtures/user.json';
expect(validateDataAgainstSchema(schema, testData, 'User').valid).toBe(true);
```

### Check Before Database Insert
```typescript
const newUser = { id: '1', email: 'test@example.com' };
const result = validateDataAgainstSchema(schema, newUser, 'User');
if (result.valid) {
  await db.insert(newUser);
}
```

## 📚 Full Documentation

- See [VALIDATION_GUIDE.md](./VALIDATION_GUIDE.md) for complete documentation
- See [examples/README.md](./examples/README.md) for more examples

## 🐛 Troubleshooting

**"Type 'X' not found"**
- Check type name spelling (case-sensitive)
- Make sure type exists in schema

**"is not an object type"**
- Validation works with object types only (not scalars/enums)
- Use the parent object type that contains the field

**Script fails**
- Make sure Node.js 18+ is installed
- Check file paths are correct
- For API: ensure dev server is running (`npm run dev`)

## ⚡ Pro Tips

1. **Batch Validation**: Loop through arrays of data
2. **Migration Helper**: Find data that needs updating
3. **Form Validation**: Check before submission
4. **Test Data Generation**: Ensure mocks are valid
5. **Schema Evolution**: Verify backward compatibility

---

Need help? Check the examples in the `examples/` directory!

