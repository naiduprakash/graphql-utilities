# GraphQL Utilities

A comprehensive Next.js application suite for GraphQL utilities including query generation, schema validation, and more.

## Features

- 🚀 **GraphQL Query Generation** - Generate queries from GraphQL schemas
- 📝 **Schema Validation** - Validate and parse GraphQL schemas
- 🎨 **Monaco Editor Integration** - Professional code editing experience
- 🔄 **Redux State Management** - Robust state management
- 🎯 **TypeScript** - Full type safety
- 💅 **Tailwind CSS** - Modern, responsive UI

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **GraphQL**: Apollo Client
- **Code Editor**: Monaco Editor
- **Deployment**: Azure App Service

## Getting Started

### Prerequisites

- Node.js 18+ and npm 8+
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd gql-query-generation

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm start           # Start production server

# Code Quality
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript type checking

# Deployment
npm run deploy      # Deploy to Azure App Service
npm run deploy:dry-run  # Preview deployment
```

## Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── api/             # API routes
│   └── query-generation/ # Query generation page
├── components/          # React components
│   ├── layout/         # Layout components
│   ├── panels/         # Panel components
│   └── ui/             # UI components
├── lib/                # Utilities and libraries
│   ├── hooks/          # Custom React hooks
│   ├── store/          # Redux store and slices
│   └── utils/          # Utility functions
├── public/             # Static assets
└── deploy.config.js    # Azure deployment configuration
```

## Deployment

### Azure App Service

This application is configured for deployment to Azure App Service.

#### Quick Deploy

1. Update `deploy.config.js` with your Azure details:
   ```javascript
   module.exports = {
     appName: 'your-app-name',
     resourceGroup: 'your-resource-group',
     // ...
   };
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

#### CI/CD with GitHub Actions

1. Set up Azure Web App publish profile as a GitHub secret named `AZURE_WEBAPP_PUBLISH_PROFILE`
2. Update `.github/workflows/azure-deploy.yml` with your app name
3. Push to `main` branch to trigger automatic deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
NODE_ENV=development
CUSTOM_KEY=your_custom_key
```

For production, set environment variables in Azure App Service:

```bash
az webapp config appsettings set \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --settings NODE_ENV=production
```

## Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use ESLint for code linting
- Follow the existing project structure
- Write type-safe code

### Components

- Place reusable UI components in `components/ui/`
- Place feature-specific components in appropriate subdirectories
- Use TypeScript interfaces for props

### State Management

- Redux slices are in `lib/store/slices/`
- Use Redux Toolkit for state management
- Keep state normalized and flat

## Troubleshooting

### Build Issues

```bash
# Clean build cache
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Type Errors

```bash
# Run type checking
npm run type-check
```

### Deployment Issues

```bash
# View Azure logs
az webapp log tail --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:
- Check existing GitHub Issues
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Consult [Next.js documentation](https://nextjs.org/docs)
