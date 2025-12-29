# Project Structure Documentation

This document outlines the architecture and file structure of the **Stock-App** monorepo.

## Overview

The project is built as a **Monorepo** using **Turborepo** for build orchestration and **pnpm** for package management. It enforces strict boundaries between applications (`apps/`) and shared logic/libraries (`packages/`).

## Directory Layout

```
.
├── apps/                 # Deployable applications
│   ├── api/              # Backend API (Express + Drizzle + MariaDB)
│   └── web/              # Frontend Web App (React + Vite + Material UI)
├── packages/             # Shared internal libraries
│   ├── config/           # Shared configuration (TSConfig, ESLint)
│   ├── ui/               # Shared React UI components (Material UI)
│   └── logger/           # Shared logging utility (Placeholder)
├── .github/              # CI/CD Workflows
├── turbo.json            # Turborepo build pipeline configuration
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── package.json          # Root configuration and scripts
```

## detailed Breakdown

### Apps (`/apps`)

These are the consumer applications. They depend on packages from `/packages`.

#### `apps/web`

- **Stack**: React, Vite, Material UI
- **Purpose**: The main user interface for the Stock App.
- **Key Files**:
  - `vite.config.ts`: Vite configuration.
  - `src/main.tsx`: Entry point.
  - `src/App.tsx`: Main application component.

#### `apps/api`

- **Stack**: Node.js, Express, Drizzle ORM, MariaDB
- **Purpose**: The REST API backend.
- **Key Files**:
  - `src/index.ts`: Server entry point.
  - `src/db.ts`: Database connection and Drizzle client.

### Packages (`/packages`)

These are internal libraries used to share code and configuration.

#### `@repo/ui` (`packages/ui`)

- **Purpose**: Shared UI component library.
- **Description**: Exports Material UI components and themes for consistent design across apps.
- **Exports**: `RepoButton`, etc.

#### `@repo/config` (`packages/config`)

- **Purpose**: Shared developer tooling configuration.
- **Content**:
  - `tsconfig.base.json`: Base TypeScript configuration extended by all apps/packages.
  - `eslint.config.mjs`: Shared ESLint rules.

## Key Configuration Files

- **`turbo.json`**: Defines the task dependencies (e.g., `build` dependencies) and caching behavior.
- **`pnpm-workspace.yaml`**: a Defines the root of the workspace and which directories contain packages.
- **`.prettierrc`**: Code formatting rules.
