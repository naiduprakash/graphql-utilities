# Data Validation UI - User Guide

## Overview

The Data Validation UI provides an intuitive interface to validate JSON data against GraphQL schemas directly in your browser.

## Accessing the Feature

1. **From Home Page**: Click the "Data Validation" card
2. **From Header Menu**: Click "Data Validation" in the top navigation
3. **Direct URL**: Navigate to `/data-validation`

## Interface Layout

The Data Validation page has a **three-column layout**:

```
┌─────────────────┬─────────────────┬─────────────────┐
│  GraphQL Schema │   JSON Data     │    Results      │
│   (Editor 1)    │  (Editor 2)     │   (Panel)       │
└─────────────────┴─────────────────┴─────────────────┘
```

### Left Column: GraphQL Schema Editor
- **Language**: GraphQL SDL
- **Purpose**: Define your GraphQL schema
- **Features**: 
  - Syntax highlighting
  - Auto-completion
  - Error detection

### Middle Column: JSON Data Editor
- **Language**: JSON
- **Purpose**: Enter the data you want to validate
- **Features**: 
  - JSON syntax highlighting
  - Auto-formatting
  - Bracket matching

### Right Column: Results Panel
- **Purpose**: Display validation results
- **Shows**:
  - Overall validation status (✅ Pass or ❌ Fail)
  - Missing fields with details
  - Type errors with expected vs actual
  - Extra fields not in schema

## How to Use

### Step 1: Enter GraphQL Schema

Paste or type your GraphQL schema in the left editor:

```graphql
type User {
  id: ID!
  email: String!
  username: String!
  age: Int
  isActive: Boolean!
}
```

### Step 2: Enter JSON Data

Paste or type your JSON data in the middle editor:

```json
{
  "id": "1",
  "email": "john@example.com",
  "username": "johndoe",
  "isActive": true
}
```

### Step 3: Set Type Name

In the top bar, enter the GraphQL type name you want to validate against (e.g., `User`).

### Step 4: Validate

Click the **"Validate Data"** button in the top right.

### Step 5: Review Results

The results panel will show:

#### ✅ Success Example
```
✅ Validation Passed!
Your data matches the schema perfectly.
```

#### ❌ Issues Example
```
❌ Validation Issues Found
Found 2 issues that need attention.

📋 Missing Fields (1)
  username
  Type: String! (REQUIRED)
  Parent: User

⚠️ Type Errors (1)
  age
  Expected: Int → Got: string
```

## Features in Detail

### 1. Missing Fields Detection

**What it shows:**
- Field path (e.g., `profile.location.city`)
- Expected type (e.g., `String!`)
- Whether it's required or optional
- Parent type name

**Visual indicators:**
- 🔴 Red badge for REQUIRED fields
- Red-tinted cards for visibility

### 2. Type Errors

**What it shows:**
- Field path where the error occurred
- Expected type (green badge)
- Actual type received (red badge)
- Visual arrow showing the mismatch

**Example:**
```
posts[0].publishedAt
Expected: String → Got: number
```

### 3. Extra Fields

**What it shows:**
- Fields in your data that aren't in the schema
- These are warnings, not errors
- Useful for finding typos or outdated fields

**Visual indicators:**
- 🔵 Blue-tinted cards (informational)
- Don't fail validation

### 4. Nested Object Support

The validator recursively checks nested objects:

```json
{
  "user": {
    "profile": {
      "location": {
        "city": "Missing country here!"
      }
    }
  }
}
```

Result shows: `user.profile.location.country` is missing

### 5. Array Validation

Arrays are validated item by item:

```json
{
  "posts": [
    { "id": "1", "title": "Post 1" },
    { "id": "2" }  // Missing title!
  ]
}
```

Result shows: `posts[1].title` is missing

## Default Example

The page loads with a working example:
- **Schema**: User type with Profile and Posts
- **Data**: Sample user data with intentional gaps
- **Type**: User

This helps you understand the interface before using your own data.

## Tips & Best Practices

### ✅ Do's

1. **Start Simple**: Test with a basic schema first
2. **Use Valid JSON**: Ensure your JSON is properly formatted
3. **Check Type Names**: GraphQL type names are case-sensitive
4. **Review All Issues**: Fix required fields first, then type errors
5. **Use for Testing**: Validate test fixtures and mock data

### ❌ Don'ts

1. **Don't paste huge files**: Editor may slow down
2. **Don't forget Type Name**: It's required in the top bar
3. **Don't ignore Extra Fields**: They might be typos
4. **Don't mix data types**: If schema says Int, don't use string

## Common Use Cases

### 1. API Response Validation

**Scenario**: Check if your API response matches your schema

1. Copy your GraphQL schema
2. Paste an API response as JSON
3. Validate against the response type

### 2. Form Data Validation

**Scenario**: Validate form data before submission

1. Define your input type as schema
2. Convert form data to JSON
3. Validate before sending to server

### 3. Test Data Quality

**Scenario**: Ensure test fixtures are valid

1. Load your schema
2. Paste test fixture JSON
3. Verify all required fields are present

### 4. Schema Migration

**Scenario**: Check existing data against new schema

1. Load your new schema
2. Paste production data samples
3. Identify what needs migration

## Keyboard Shortcuts

Monaco Editor supports standard shortcuts:

- `Ctrl/Cmd + S`: Save (auto-validates)
- `Ctrl/Cmd + F`: Find
- `Ctrl/Cmd + H`: Find and Replace
- `Ctrl/Cmd + /`: Toggle Comment
- `Alt + Shift + F`: Format Document

## Dark Mode

The UI supports dark mode:
- Toggle using the moon/sun icon in the header
- Setting persists across sessions
- All three panels adapt automatically

## Troubleshooting

### "Type 'X' not found in schema"

**Solution**: 
- Check type name spelling (case-sensitive)
- Ensure type exists in your schema
- Example: Use `User` not `user`

### "Invalid JSON data"

**Solution**:
- Validate your JSON syntax
- Use a JSON formatter if needed
- Check for trailing commas (not allowed)

### Editor is slow

**Solution**:
- Reduce file size
- Use smaller data samples
- Close other browser tabs

### Results not updating

**Solution**:
- Click "Validate Data" button again
- Check browser console for errors
- Refresh the page if needed

## Browser Support

Works best with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- ✅ Fast for typical use cases (< 1000 lines)
- ✅ Handles nested objects up to 10 levels deep
- ✅ Validates arrays with hundreds of items
- ⚠️ May slow with very large schemas (> 5000 lines)

## Integration with Other Tools

### Export Results

Copy validation results to:
- Bug reports
- Documentation
- Team communication

### Use with CLI

For automated validation, use the CLI:
```bash
npm run validate schema.graphql data.json User
```

## What Gets Validated

| Feature | Validated | Notes |
|---------|-----------|-------|
| Required fields (`!`) | ✅ Yes | Fails if missing |
| Optional fields | ✅ Yes | Warning if missing |
| Type matching | ✅ Yes | String, Int, Float, Boolean, ID |
| Nested objects | ✅ Yes | Recursive validation |
| Arrays | ✅ Yes | Item-by-item |
| Enums | ✅ Yes | Value must be in enum |
| Extra fields | ✅ Yes | Warning only |
| Business logic | ❌ No | Only structural validation |
| Custom scalars | ⚠️ Partial | Treated as String |

## Example Walkthrough

### Complete Example

**Schema:**
```graphql
type Product {
  id: ID!
  name: String!
  price: Float!
  inStock: Boolean!
  tags: [String!]
}
```

**Valid Data:**
```json
{
  "id": "prod-123",
  "name": "Laptop",
  "price": 999.99,
  "inStock": true,
  "tags": ["electronics", "computers"]
}
```

**Result:** ✅ Validation passed!

**Invalid Data:**
```json
{
  "id": "prod-123",
  "name": "Laptop",
  "price": "999.99",
  "tags": ["electronics"]
}
```

**Result:** ❌ 2 issues
1. Missing field: `inStock` (Boolean! - REQUIRED)
2. Type error: `price` expected Float, got string

## Need Help?

- 📖 See [VALIDATION_GUIDE.md](./VALIDATION_GUIDE.md) for API details
- 🚀 See [QUICKSTART_VALIDATION.md](./QUICKSTART_VALIDATION.md) for CLI usage
- 📝 See [examples/](./examples/) for sample files

---

**Happy Validating!** 🎉

