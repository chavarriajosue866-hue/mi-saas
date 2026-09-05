# SaaS Multi-tenant Platform

A full-stack multi-tenant SaaS platform featuring authentication, user management, file uploads, and password recovery.

## ️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + NextAuth
- **Backend**: Fastify + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Emails**: Resend
- **Documentation**: Swagger/OpenAPI

##  Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your actual keys

# Initialize database
pnpm --filter @mi-saas/db db:push

# Start development server
pnpm dev