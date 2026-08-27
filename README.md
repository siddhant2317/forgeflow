# LineForge

A full-stack manufacturing operations application built as a portfolio project to explore how software can be used to manage parts, Bills of Materials (BOMs), inventory, and production work orders.

The project focuses on practical backend and full-stack concepts such as relational data modeling, authentication, API design, validation, testing, and Docker-based development.

> **Note:** LineForge is an independent portfolio project and is not affiliated with any company or commercial ERP product.

---

## Features

- Parts library with create, update, delete, and search functionality
- Hierarchical Bill of Materials (BOM) management
- Recursive BOM visualization
- Circular BOM detection
- Inventory tracking by part and location
- Low-stock identification
- Production work orders
- Kanban-style work order workflow
- Work order step tracking and completion
- Dashboard with basic production and inventory statistics
- Activity logging
- Email/password authentication
- Google OAuth authentication
- Role-based authorization
- Input validation
- Automated unit and integration tests
- End-to-end testing with Playwright

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Apollo Client

### Backend

- Node.js
- Express.js
- Apollo Server
- GraphQL
- Prisma ORM
- Zod
- JWT
- bcrypt
- Pino

### Database

- PostgreSQL

### Testing

- Vitest
- Playwright

### Development & Infrastructure

- Docker
- Docker Compose
- pnpm workspaces
- GitHub Actions

---

## Project Structure

```text
forgeflow/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   └── src/
│   │       ├── lib/
│   │       ├── resolvers/
│   │       └── schema/
│   │
│   └── web/
│       └── src/
│           ├── lib/
│           └── pages/
│
├── packages/
│   └── shared/
│
├── e2e/
│
├── docker-compose.yml
├── docker-compose.test.yml
├── docker-compose.prod.yml
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json