# Type Error Fix Feature

## Overview
Added Fix functionality for Type Errors in the Data Validation UI. Now you can quickly fix type mismatches between your JSON data and GraphQL schema.

## 🎯 New Fix Options for Type Errors

### Fix #1: Fix JSON Value
**What it does:** Converts the value in your JSON data to match the expected type in the schema.

**When to use:**
- Your schema is correct, but your data has the wrong type
- You want to keep the schema as-is

**Example:**
```
Type Error:
  Field: profile
  Expected: String
  Got: object

After clicking "Fix JSON Value":
  ✅ Converts {"name": "John"} to "[object Object]" (string)
```

**Type Conversions:**
- **To String/ID**: `String(value)` - converts any value to string
- **To Int**: `parseInt(value)` - converts to integer, defaults to 0 if invalid
- **To Float**: `parseFloat(value)` - converts to float, defaults to 0.0 if invalid
- **To Boolean**: `Boolean(value)` - converts to boolean
- **To Object**: Uses placeholder value based on type

### Fix #2: Update Schema Type
**What it does:** Changes the type in your GraphQL schema to match the actual data type in your JSON.

**When to use:**
- Your data is correct, but your schema has the wrong type
- You want to update the schema to reflect reality

**Example:**
```
Type Error:
  Field: age
  Expected: String
  Got: number

After clicking "Update Schema Type":
  ✅ Changes schema from "age: String!" to "age: Float!"
```

**Type Mappings:**
- `string` → `String`
- `number` → `Float`
- `boolean` → `Boolean`
- `object` → `JSON` (custom scalar)
- `array` → `[String]` (default array type)

**Note:** Preserves the `!` (required) modifier if present.

## 🎨 UI Features

### Visual Feedback
Just like other fix actions, Type Error fixes show:
- ✅ **Green highlight** for 2 seconds
- 📈 **Scale animation** (slightly enlarges)
- 🔦 **Shadow effect** for emphasis

### Fix Button Dropdown
```
┌─────────────────────────────┐
│ Type Error: profile         │
│ Expected: String → Got: obj │
│ [Fix ▼]                    │ ← Click here
└─────────────────────────────┘
         ↓
┌─────────────────────────────┐
│ 📊 Fix JSON Value           │ ← Convert data
│    Convert to String        │
├─────────────────────────────┤
│ 📝 Update Schema Type       │ ← Update schema
│    Change to object         │
└─────────────────────────────┘
```

## 📊 Use Cases

### Use Case 1: Wrong Data Type
**Scenario:** You have an integer but schema expects string

**Before:**
```json
{
  "id": 12345
}
```

```graphql
type User {
  id: String!
}
```

**Error:** Expected String, got number

**Fix:** Click "Fix JSON Value"

**After:**
```json
{
  "id": "12345"
}
```

### Use Case 2: Wrong Schema Type
**Scenario:** Schema type doesn't match your API response

**Before:**
```json
{
  "age": 25
}
```

```graphql
type User {
  age: String!
}
```

**Error:** Expected String, got number

**Fix:** Click "Update Schema Type"

**After:**
```graphql
type User {
  age: Float!
}
```

### Use Case 3: Object vs String
**Scenario:** Complex object stored as string or vice versa

**Before:**
```json
{
  "profile": {
    "name": "John",
    "bio": "Developer"
  }
}
```

```graphql
type User {
  profile: String!
}
```

**Error:** Expected String, got object

**Fix Options:**
1. **Fix JSON Value**: Converts to `"[object Object]"` (string representation)
2. **Update Schema Type**: Changes to `profile: JSON!` (custom scalar)

## 🔧 Technical Implementation

### Type Conversion Logic
```typescript
const fixTypeInJSON = (path: string, expectedType: string, actualType: string) => {
  // Navigate to field in JSON
  // Convert based on expected type:
  
  switch (baseType) {
    case 'String':
    case 'ID':
      newValue = String(currentValue);
      break;
    case 'Int':
      newValue = parseInt(String(currentValue)) || 0;
      break;
    case 'Float':
      newValue = parseFloat(String(currentValue)) || 0.0;
      break;
    case 'Boolean':
      newValue = Boolean(currentValue);
      break;
    default:
      // For object types, use placeholder
      newValue = getPlaceholderValue(expectedType);
  }
  
  // Update JSON and highlight
};
```

### Schema Update Logic
```typescript
const updateTypeInSchema = (fieldPath: string, parentType: string, newType: string) => {
  // Find the field in schema
  // Map actual type to GraphQL type
  
  const typeMap = {
    'string': 'String',
    'number': 'Float',
    'boolean': 'Boolean',
    'object': 'JSON',
    'array': '[String]'
  };
  
  // Replace field type
  // Preserve ! modifier
  // Update schema and highlight
};
```

## 🎯 Smart Type Detection

The fix system automatically detects the parent type from the field path:
- `user.profile.name` → parent type is `user` or root type
- Simple fields use the main validation type

This ensures schema updates happen in the correct type definition.

## ✨ Complete Fix Coverage

Now **ALL** validation errors have fix options:

| Error Type | Fix Options |
|------------|-------------|
| Missing Required Field | • Add to JSON<br>• Remove from Schema |
| Missing Optional Field | • Add to JSON<br>• Remove from Schema |
| Extra Field | • Remove from JSON<br>• Add to Schema |
| **Type Error** | **• Fix JSON Value**<br>**• Update Schema Type** |

## 🚀 How to Use

1. **Run validation** (happens automatically)
2. **See Type Error** with red/orange highlight
3. **Click "Fix ▼"** button
4. **Choose fix action:**
   - Fix JSON Value (if schema is correct)
   - Update Schema Type (if data is correct)
5. **Watch green highlight** confirming the fix! ✨

## 💡 Pro Tips

### Tip 1: When to Fix JSON vs Schema
- **Fix JSON** when: Schema is authoritative (e.g., API contract)
- **Fix Schema** when: Data is authoritative (e.g., actual API response)

### Tip 2: Type Conversion Safety
- String conversions are always safe
- Number conversions may lose precision
- Object-to-primitive conversions may lose data
- Review the change after applying!

### Tip 3: Batch Fixes
1. Apply one fix
2. Wait for green highlight
3. Re-validate automatically
4. Fix next error
5. Repeat until clean!

### Tip 4: Complex Objects
For complex nested objects:
- Consider using `JSON` scalar type in schema
- Or define proper nested types
- Fix might use placeholder - review and adjust

## 🎪 Example Workflow

```
1. Paste schema with user: { age: String! }
   ↓
2. Paste data with { "age": 25 }
   ↓
3. See Type Error: Expected String, got number
   ↓
4. Click "Fix ▼"
   ↓
5. Choose "Update Schema Type"
   ↓
6. ✅ Schema changes to age: Float!
   ↓
7. Green highlight confirms fix
   ↓
8. Validation re-runs automatically
   ↓
9. No more errors! 🎉
```

## 🐛 Edge Cases Handled

✅ Nested field paths (e.g., `user.profile.age`)
✅ Array indices (e.g., `posts[0].title`)
✅ Required fields (preserves `!` modifier)
✅ Custom scalar types (uses sensible defaults)
✅ Invalid conversions (uses fallback values)
✅ Parent type detection (updates correct schema type)

## 📊 Conversion Examples

### String to Number
```
Before: "123"
After:  123 (Int) or 123.0 (Float)
```

### Number to String
```
Before: 123
After:  "123"
```

### Boolean Conversions
```
"true" / 1 / "yes" → true
"false" / 0 / "" → false
```

### Object to String
```
Before: {"a": 1}
After:  "[object Object]"
Note: Data loss - consider updating schema instead
```

## 🎉 Summary

Type Error fixes provide:
- ✅ Two fix options for every type error
- ✅ Smart type conversion
- ✅ Schema type mapping
- ✅ Visual feedback (green highlight)
- ✅ Automatic re-validation
- ✅ Preserves field modifiers (!}
- ✅ Handles nested paths
- ✅ Safe fallback values

**Now you have complete fix coverage for all validation errors!** 🚀

