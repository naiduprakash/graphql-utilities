# 🎉 Get Started with Data Validation UI

## ✅ What's New

You now have a **beautiful web interface** for validating JSON data against GraphQL schemas!

## 🚀 Start Using It Right Now

The dev server is already running! Just open your browser:

### 👉 http://localhost:3000/data-validation

Or click "Data Validation" in the top menu at http://localhost:3000

## 🎨 What You'll See

A clean three-column interface:

```
┌─────────────────────────────────────────────────────────────┐
│  📄 GraphQL Schema  │  📊 JSON Data  │  ✅ Validation Results │
│                     │                │                        │
│  type User {        │  {             │  Results appear here   │
│    id: ID!          │    "id": "1",  │  after you click       │
│    email: String!   │    "email":    │  "Validate Data"       │
│    ...              │    "..."       │                        │
│  }                  │  }             │  Shows:                │
│                     │                │  • Missing fields      │
│  (Monaco Editor)    │  (Monaco)      │  • Type errors         │
│                     │                │  • Extra fields        │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Quick Tutorial (2 minutes)

### Step 1: Look at the Pre-Loaded Example
The page loads with a working example showing:
- A User schema (left panel)
- Sample user data (middle panel)  
- Instructions in results panel (right)

### Step 2: Validate the Example
1. Look at the top bar: Type is set to `User`
2. Click the **"Validate Data"** button (blue, top right)
3. See the results appear in the right panel

### Step 3: Try Your Own Data

**Easy Test - Intentionally Break It:**
1. In the middle panel (JSON Data), delete the `"email"` line
2. Click **"Validate Data"** again
3. See the error: "Missing field: email (String! - REQUIRED)"

**Fix It:**
1. Add back the email field
2. Validate again
3. See it pass! ✅

### Step 4: Try Your Own Schema

Replace the schema (left panel) with your own:

```graphql
type Product {
  id: ID!
  name: String!
  price: Float!
}
```

Replace the data (middle panel):

```json
{
  "id": "123",
  "name": "Laptop",
  "price": 999.99
}
```

Change the type name to `Product` (top bar) and validate!

## 🎯 Common Use Cases

### 1. Validate API Responses
- **Schema**: Your GraphQL type definition
- **Data**: Response from your API
- **Type**: The response type name

### 2. Check Form Data
- **Schema**: Your input type
- **Data**: Form values as JSON
- **Type**: Input type name

### 3. Verify Test Fixtures
- **Schema**: Your schema
- **Data**: Test data
- **Type**: Tested type

## ✨ Cool Features to Try

### 1. Dark Mode
Click the moon/sun icon in the top right header!

### 2. Monaco Editor Features
The editors are powered by VS Code's engine:
- Auto-completion (start typing)
- Syntax highlighting
- Error detection
- Find/Replace (Ctrl/Cmd + F)
- Format (Alt + Shift + F)

### 3. Nested Object Validation
Try data with nested objects:

```json
{
  "user": {
    "profile": {
      "location": {
        "city": "San Francisco"
      }
    }
  }
}
```

The validator will check ALL levels and show paths like: `user.profile.location.country`

### 4. Array Validation
Try arrays:

```json
{
  "posts": [
    { "id": "1", "title": "First" },
    { "id": "2" }
  ]
}
```

The validator checks each item: `posts[1].title` is missing

## 🐛 Quick Troubleshooting

### "Type 'X' not found in schema"
➡️ Check the type name in the top bar (case-sensitive!)

### Results panel shows nothing
➡️ Click the "Validate Data" button

### Invalid JSON error
➡️ Check your JSON syntax in the middle panel

### Server not responding
➡️ The server is running on port 3000 (already confirmed!)

## 🎨 Navigation

### From Home Page
http://localhost:3000 → Click "Data Validation" card

### From Header
Any page → Click "Data Validation" in top menu

### Direct Link
http://localhost:3000/data-validation

## 📱 Also Available via CLI

If you prefer command line:

```bash
# Create your files
echo 'type User { id: ID! }' > my-schema.graphql
echo '{"id": "1"}' > my-data.json

# Validate
npm run validate my-schema.graphql my-data.json User
```

## 🎓 Learn More

### Quick References
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - One-page reference
- [examples/](./examples/) - Ready-to-use examples

### Detailed Guides
- [DATA_VALIDATION_UI_GUIDE.md](./DATA_VALIDATION_UI_GUIDE.md) - Complete UI guide
- [VALIDATION_GUIDE.md](./VALIDATION_GUIDE.md) - Full API documentation
- [FEATURE_SUMMARY.md](./FEATURE_SUMMARY.md) - Everything that was built

### Examples
```bash
# Try the included examples
npm run validate examples/example-schema.graphql examples/valid-user-data.json User
npm run validate examples/example-schema.graphql examples/invalid-user-data.json User
```

## 💡 Pro Tips

1. **Save frequently**: Use Ctrl/Cmd + S to format and save
2. **Start simple**: Begin with basic types before complex schemas
3. **Check paths**: Error paths show exactly where issues are
4. **Use examples**: The pre-loaded example is a great starting point
5. **Dark mode**: Easier on the eyes for long sessions

## 🎉 You're Ready!

Everything is set up and working. The UI is live at:

### 👉 http://localhost:3000/data-validation

Just open it and start validating! The interface is intuitive and includes helpful examples.

## 🆘 Need Help?

1. **UI Questions**: See [DATA_VALIDATION_UI_GUIDE.md](./DATA_VALIDATION_UI_GUIDE.md)
2. **API Questions**: See [VALIDATION_GUIDE.md](./VALIDATION_GUIDE.md)
3. **Examples**: Check [examples/README.md](./examples/README.md)
4. **Quick Lookup**: See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

---

**Happy Validating!** 🚀✨

The interface is intuitive, well-documented, and ready to use. Give it a try!

