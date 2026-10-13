# VELO E-Commerce

<p align="center">
  A full-stack, production-ready e-commerce platform built with <strong>Next.js</strong>, <strong>Express</strong>, <strong>Prisma</strong>, and <strong>PostgreSQL</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## Architecture Overview

```
velo/
├── frontend/             # Next.js App Router (Storefront & Admin Dashboard)
├── backend/              # Express API (Auth, Products, Orders, Admin)
└── shared/               # Shared types and utilities
```

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Storefront** | Next.js, React, Tailwind CSS | Responsive customer UI with cart & checkout |
| **Admin Portal** | Next.js, Lucide Icons | Dashboard for products, orders, categories, and users |
| **Backend API** | Express.js, TypeScript | RESTful endpoints with JWT auth and rate limiting |
| **Database** | PostgreSQL + Prisma ORM | Relational schema with migrations and seeders |
| **Media & Mail** | Cloudinary & Nodemailer | Direct image upload signing and automated order emails |

---

## Key Features

- **Storefront**: Dynamic product catalog, category filters, fuzzy search, and persistent cart.
- **Checkout**: Multi-step checkout workflow with customer details, shipping, and order review.
- **Admin Suite**: Secure dashboard for inventory tracking, order status updates, and user management.
- **Media Management**: Direct-to-Cloudinary image uploads with backend signature verification.
- **Transactional Emails**: Automated order confirmation, shipping, and delivery notifications.
- **Security**: Strict `.gitignore` policy, environment isolation, bcrypt hashing, and JWT tokens.

---

## Getting Started

### Prerequisites

- Node.js `18.x` or higher
- PostgreSQL instance running locally or hosted

---

### 1. Backend Setup

```bash
cd backend
npm install

# Copy environment template and configure your database
cp .env.example .env

# Push Prisma schema to your database
npm run db:push

# (Optional) Seed initial admin user
# ALLOW_DEV_SEED=true npm run db:seed

# Start the API server
npm run dev
```

> Backend will run at `http://localhost:3001`

---

### 2. Frontend Setup

```bash
cd frontend
npm install

# Copy environment template
cp .env.example .env.local

# Start the Next.js development server
npm run dev
```

> Frontend will run at `http://localhost:3000`

---

## Environment Variables

Both apps use safe `.env.example` templates. Refer to them before launching:

| File | Key Variables |
| :--- | :--- |
| [`backend/.env.example`](backend/.env.example) | `DATABASE_URL`, `JWT_SECRET`, `GMAIL_USER`, `GMAIL_PASSWORD`, `CLOUDINARY_*` |
| [`frontend/.env.example`](frontend/.env.example) | `NEXT_PUBLIC_API_URL` |

---

## API Summary

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Public | Register new customer account |
| `/api/auth/login` | `POST` | Public | Customer authentication |
| `/api/admin/login` | `POST` | Public | Admin portal authentication |
| `/api/products` | `GET` | Public | Paginated product list with search/filter |
| `/api/products/signature/upload` | `GET` | Admin / Manager | Generate Cloudinary upload signature |
| `/api/orders` | `POST` | Customer / Guest | Create a new order |
| `/api/orders` | `GET` | Admin | View orders with status filtering |
| `/api/health` | `GET` | Public | System and database health status |

---

## License

ISC License.
