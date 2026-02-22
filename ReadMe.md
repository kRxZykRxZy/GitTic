# GitTic

A comprehensive development platform combining Git hosting, CI/CD pipelines, collaborative editing, cluster management, and AI-powered features.

## Features

- **Git Hosting**: Full-featured Git repository hosting with branch management
- **Issues & Pull Requests**: Track work and collaborate on code reviews
- **CI/CD Pipelines**: Automated workflows and deployments
- **Collaborative Editor**: Real-time code collaboration
- **Cluster Management**: Manage and scale your infrastructure
- **AI Integration**: AI-powered code assistance and insights
- **Organizations**: Team and organization management
- **Security**: Built-in security scanning and insights

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start the platform
pnpm start

# Development mode
pnpm dev
```

## Development

This is a monorepo managed with pnpm workspaces containing:

- `packages/frontend` - React/Vite frontend application
- `packages/backend` - Express.js API server
- `packages/auth` - Authentication utilities
- `packages/git` - Git operations
- `packages/ai` - AI integration
- `packages/cluster` - Cluster management
- `packages/editor` - Collaborative editor
- `packages/utils` - Shared utilities
- `packages/shared` - Shared types and configs

## License

MIT 
