# Quick Reference - Data Validation

## 🚀 Instant Access

### Web UI
```bash
npm run dev
# → http://localhost:3000/data-validation
```

### CLI
```bash
npm run validate <schema.graphql> <data.json> <TypeName>
```

### API
```bash
POST http://localhost:3000/api/validate-data
{
  "schemaText": "type User { ... }",
  "data": { ... },
  "typeName": "User"
}
```

## 📋 Quick Examples

### Valid Data Example

**Schema:**
```graphql
type User {
  id: ID!
  email: String!
  name: String
}
```

**Data:**
```json
{
  "id": "1",
  "email": "test@example.com",
  "name": "John"
}
```

**Result:** ✅ Validation passed!

### Invalid Data Example

**Schema:**
```graphql
type Product {
  id: ID!
  name: String!
  price: Float!
}
```

**Data:**
```json
{
  "id": "123",
  "name": "Laptop"
}
```

**Result:** ❌ Missing field: `price` (Float! - REQUIRED)

## 🎯 Common Tasks

### Task 1: Validate API Response
```bash
# 1. Save your schema
# 2. Save API response as JSON
# 3. Run:
npm run validate schema.graphql response.json ResponseType
```

### Task 2: Check Test Data
```typescript
import { validateDataAgainstSchema } from '@/lib/utils/schema-validator';

const result = validateDataAgainstSchema(
  schemaText,
  testData,
  'User'
);

expect(result.valid).toBe(true);
```

### Task 3: Validate Before Save
```typescript
const result = validateDataAgainstSchema(schema, formData, 'CreateUserInput');

if (!result.valid) {
  console.log('Validation failed:', result.missingFields);
  return;
}

await saveToDatabase(formData);
```

## 🔍 What Gets Checked?

| Check | Symbol | Impact |
|-------|--------|--------|
| Missing required field | ❌ | Fails validation |
| Missing optional field | ⚠️ | Warning only |
| Type mismatch | ❌ | Fails validation |
| Extra field | ℹ️ | Info only |
| Nested errors | ❌ | Fails validation |

## 💡 Quick Tips

1. **Type names are case-sensitive**: Use `User` not `user`
2. **Check nested paths**: Errors show full path like `profile.location.city`
3. **JSON must be valid**: Use a JSON validator if unsure
4. **Required = `!`**: Fields with `!` must be present
5. **Arrays are checked**: Each item validated individually

## 📊 Output Format

### Console/CLI
```
❌ Validation failed!

📋 MISSING FIELDS:
  • fieldName (Type!) - REQUIRED

⚠️ TYPE ERRORS:
  • fieldName: Expected Type → Got actual

⚡ EXTRA FIELDS:
  • fieldName: not in schema
```

### Programmatic
```typescript
{
  valid: boolean,
  missingFields: [...],
  typeErrors: [...],
  extraFields: [...]
}
```

## 🛠️ Troubleshooting

| Error | Solution |
|-------|----------|
| "Type 'X' not found" | Check type name (case-sensitive) |
| "Invalid JSON" | Validate JSON syntax |
| No output | Check schema syntax |
| Server not running | Run `npm run dev` |

## 📚 Full Documentation

- **UI Guide**: [DATA_VALIDATION_UI_GUIDE.md](./DATA_VALIDATION_UI_GUIDE.md)
- **API Reference**: [VALIDATION_GUIDE.md](./VALIDATION_GUIDE.md)
- **Quick Start**: [QUICKSTART_VALIDATION.md](./QUICKSTART_VALIDATION.md)
- **Examples**: [examples/README.md](./examples/README.md)

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Data Validation    Type: [User]  [Validate Data]  │
├────────────┬────────────┬─────────────────────────┤
│  Schema    │  Data      │  Results                │
│  (Editor)  │  (Editor)  │  • Success/Errors       │
│            │            │  • Missing Fields       │
│  GraphQL   │  JSON      │  • Type Errors          │
│  SDL       │  Object    │  • Extra Fields         │
└────────────┴────────────┴─────────────────────────┘
```

## 🔗 Links

- **Home**: http://localhost:3000
- **Validation**: http://localhost:3000/data-validation
- **Query Gen**: http://localhost:3000/query-generation

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + S`: Format & Validate
- `Ctrl/Cmd + F`: Find
- `Ctrl/Cmd + /`: Comment
- `Alt + Shift + F`: Format

---

**Need more help?** Check the full documentation or run `npm run test:validation` to see it in action!

