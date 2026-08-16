# PMS Stationery Storefront

This is the main application repository for KAPI Pen & Stationery — a fully built storefront and admin system for a stationery business.

The project is implemented as a production-style Next.js e-commerce application with a customer shopping experience, authenticated checkout flow, and a private business dashboard for operations and reporting.

## Project purpose

PMS is designed to support the entire lifecycle of a retail stationery business:

- online product discovery and browsing
- category-based shopping
- cart and checkout experience
- customer accounts and order tracking
- admin inventory and order management
- reporting, promotions, and store configuration

## App overview

### Customer storefront

- homepage with promotional hero sections and category browsing
- collection and search pages
- product detail pages with media galleries and variants
- cart drawer and persistent cart state
- address and checkout flow
- order confirmation and order history
- COD and online payment handling

### Admin dashboard

- protected admin login
- product management
- category and promotion management
- inventory tracking and low-stock alerts
- customer management
- order lifecycle management
- sales and revenue dashboard
- review moderation and activity logging

## Tech stack

| Area | Stack |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui inspired patterns |
| Backend | Next.js app routes and server actions |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | Supabase Auth + admin Google auth |
| Media | Cloudinary |
| Emails | Resend |
| Payments | Razorpay + COD |
| State | Zustand |
| Hosting | Vercel |

## Folder structure

```bash
apps/storefront/
├── app/
│   ├── (store)/
│   ├── (admin)/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── store/
│   ├── admin/
│   └── ui/
├── lib/
│   ├── actions/
│   ├── auth/
│   ├── email/
│   ├── supabase/
│   ├── cloudinary/
│   ├── checkout/
│   └── utils/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── package.json
├── next.config.ts
├── tsconfig.json
├── README.md
├── .env
└── .gitignore
```

## Getting started

### 1. Install dependencies

```bash
cd apps/storefront
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in `apps/storefront` with the required values.

Example:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your-public-razorpay-key-id"

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

RESEND_API_KEY="your-resend-key"
EMAIL_FROM="no-reply@yourdomain.com"
EMAIL_ENABLED="true"
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_EMAILS="admin@yourdomain.com"
```

### 3. Prepare the database

```bash
cd apps/storefront
npx prisma generate
npx prisma db push
```

### 4. Run the app

```bash
npm run dev
```

Open:

- storefront: http://localhost:3000
- admin login: http://localhost:3000/admin/login

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Important files to know

- `prisma/schema.prisma` — database schema and models
- `app/(store)/page.tsx` — homepage
- `app/(admin)/admin/(protected)/dashboard/page.tsx` — admin overview
- `lib/actions/` — core server actions and business logic
- `lib/auth/` — auth and access checks
- `components/store/` — storefront UI
- `components/admin/` — dashboard UI

## Deployment

This app is configured for Vercel deployment.

To deploy:

1. connect the repository to Vercel
2. add all required env variables in the Vercel dashboard
3. deploy the project
4. verify storefront and admin flows in the production environment

## Notes

This is a complete implementation intended for future maintenance and feature extension. It is well structured for a future developer to continue building on top of it without having to reverse-engineer the whole project.
