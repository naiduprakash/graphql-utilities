# GraphQL Utilities

A Next.js application for GraphQL query generation, schema validation, and operations management.

## Features

- 🚀 GraphQL Query Generation from schemas
- ✅ Schema Validation and Parsing
- 🔍 **JSON Data Validation against GraphQL Schema**
- 📝 Monaco Editor Integration
- 🔄 Redux State Management with Persistence
- 💪 Full TypeScript Support
- 🎨 Modern UI with Tailwind CSS
- 📦 Optimized Production Builds

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Redux Toolkit
- **Deployment**: Azure App Service

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Deployment to Azure App Service

### Prerequisites

- Azure App Service created
- Azure CLI installed and logged in (`az login`)
- Node.js 18+

### One-Time Azure Configuration

Configure these settings in Azure Portal → App Service → Configuration:

**Startup Command**: `node server.js`

**App Settings**:
- `NODE_ENV=production`
- `SCM_DO_BUILD_DURING_DEPLOYMENT=false`
- `ENABLE_ORYX_BUILD=false`
- `WEBSITE_NODE_DEFAULT_VERSION=~22`

### Deploy

```bash
npm run deploy
```

The script will ask for:
- Azure App Service Name
- Resource Group Name  
- Skip build? (default: no)

Shows progress with timestamps and duration for each step.

### Quick Redeploy

Skip rebuild for faster deployment:
```bash
npm run deploy -- --skip-build
```

### View Logs

```bash
az webapp log tail --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Check TypeScript types |
| `npm run deploy` | Deploy to Azure (with build) |
| `npm run deploy -- --skip-build` | Deploy to Azure (skip build) |
| `npm run validate` | Validate JSON data against schema |
| `npm run test:validation` | Run validation tests |

## Project Structure

```
├── app/                    # Next.js App Router pages & API routes
├── components/             # React components
│   ├── features/           # Feature-specific components
│   ├── layout/             # Layout components
│   └── ui/                 # Reusable UI components
├── lib/                    # Shared utilities and logic
│   ├── constants/          # App-wide constants
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Redux store and slices
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── public/                 # Static assets
└── scripts/                # Build and deployment scripts
```

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## JSON Data Validation

Validate your JSON data against GraphQL schemas to check for missing or incorrect fields!

### 🎨 Web UI (New!)

Access the beautiful web interface:

```bash
npm run dev
```

Then navigate to http://localhost:3000/data-validation

**Features:**
- 🖥️ Three-column layout with Monaco editors
- 🔍 Live validation with instant results
- 🎨 Dark mode support
- 📊 Color-coded error reporting
- ✨ Syntax highlighting and auto-completion

### 💻 Command Line

```bash
# Run tests to verify it works
npm run test:validation

# Validate your data
npm run validate <schema-file> <data-file> <type-name>

# Example with provided samples
npm run validate examples/example-schema.graphql examples/valid-user-data.json User
```

**Features:**
- ✅ Detects missing required fields
- ✅ Detects type mismatches  
- ✅ Detects extra fields not in schema
- ✅ Supports nested objects and arrays
- ✅ Detailed error reporting

### 📚 Documentation

- [UI User Guide](./DATA_VALIDATION_UI_GUIDE.md) - Complete UI walkthrough
- [Quick Start Guide](./QUICKSTART_VALIDATION.md) - Get started in 2 minutes
- [Full API Documentation](./VALIDATION_GUIDE.md) - Complete guide with examples
- [Examples](./examples/README.md) - Sample schemas and data
- [Feature Summary](./FEATURE_SUMMARY.md) - Overview of all capabilities

## Configuration

All configuration is provided by users through the application UI:
- GraphQL Endpoint URLs
- Authentication Tokens
- Custom Headers

No hardcoded configuration exists in the codebase.

## License

MIT
