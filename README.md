# My SaaS - Business Management Platform

A modern, full-stack SaaS application for managing clients, invoices, projects, appointments, and team collaboration. Built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-darkblue?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)

## 🚀 Features

- **Dashboard** - Real-time analytics with charts (Bar & Pie) showing revenue, pending payments, and invoice distribution
- **Schedule** - Weekly calendar view to manage appointments and meetings
- **Clients** - Full client database with search, filtering, and status management
- **Invoices** - Create, edit, and track invoices with PDF generation and CSV export
- **Projects** - Track projects with budgets, status, and descriptions
- **Team** - Invite team members via email with role-based access control
- **Settings** - Business configuration and personal profile management
- **AI Assistant** - Chatbot powered by Groq API (Llama 3) for business insights
- **Authentication** - Secure login with NextAuth.js and JWT sessions
- **Dark/Light Mode** - Full theme support

## 📸 Screenshots

### Dashboard
![Dashboard](./apps/web/public/2.png)

### Schedule
![Schedule](./apps/web/public/3.png)

### Clients
![Clients](./apps/web/public/4.png)

### Invoices
![Invoices](./apps/web/public/5.png)

### Projects
![Projects](./apps/web/public/6.png)

### AI Assistant
![AI Assistant](./apps/web/public/12.png)

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible UI components
- **Recharts** - Data visualization charts
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Relational database (via Neon)
- **NextAuth.js** - Authentication and session management

### AI & Integrations
- **Groq API** - Fast AI inference with Llama 3
- **Resend** - Email delivery for team invitations
- **UploadThing** - File uploads for avatars and attachments

## 📦 Installation

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database (or Neon free tier)
- Groq API key (free at console.groq.com)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/chavarriajosue866-hue/mi-saas.git
cd mi-saas

2. Install dependencies:
pnpm install

3. Set up environment variables:
Create a .env.local file in apps/web/ with:
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GROQ_API_KEY="gsk_..."
RESEND_API_KEY="re_..."
UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."

4. Run database migrations:
cd packages/db
pnpm prisma migrate deploy

5. Start the development server:
cd apps/web
pnpm dev

6. See the application
Open http://localhost:3000 to see the application.

🤝 Contributing
Contributions, issues, and feature requests are welcome!
👨‍💻 Author
Built with ❤️ for freelancers and small businesses.
Star this repo if you find it helpful! ⭐
