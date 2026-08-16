# PMS Stationery

PMS is a complete e-commerce and admin management platform for a stationery retail business. The project combines a customer-facing storefront with a protected business dashboard, making it suitable for a real-world store that needs both sales and operations management in one system.

This repository is designed to be easy for a future developer to understand, run locally, and deploy without confusion.

## Project status

This project is complete and ready for local development, demoing, staging, and deployment.

## Business overview

PMS serves as a modern online store for pens, stationery, office essentials, and creative/art supplies. It is built to support:

- browsing products by category and collection
- product detail exploration with variants and stock visibility
- cart management and checkout
- customer authentication and account management
- order placement and order tracking
- store operations via an admin dashboard
- media management, email notifications, and payment processing

The solution is structured around a public storefront and a private admin experience, with a clear separation between the user journey and the business operations layer.

## What this app includes

### Customer-facing features

- responsive homepage with hero section, category browsing, promotional cards, and product carousels
- collection and search pages
- product detail pages with gallery, pricing, stock details, variants, and related items
- cart drawer and persistent cart management
- guest browsing with auth gating at checkout
- signup/login experience
- customer account pages for profile and address management
- order history and order confirmation flow
- COD and Razorpay-compatible checkout flow

### Admin-side features

- protected admin dashboard
- Google-based admin authentication
- product creation and editing
- category creation and management
- promotion management
- order management with status tracking
- customer management and reporting
- inventory monitoring and low-stock alerts
- analytics and revenue dashboard views
- review moderation and admin activity logging
- store settings configuration

### Platform features

- Next.js App Router
- TypeScript throughout the app
- Prisma ORM with PostgreSQL
- Supabase for database and auth integration
- Cloudinary for media upload and image hosting
- Resend for email sending
- Razorpay payment integration
- Zustand for cart state
- responsive UI with Tailwind CSS and shadcn-style component patterns

## Recommended stack summary

| Area | Technology |
| --- | --- |
| Frontend framework | Next.js 16 |
| UI library | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Component patterns | shadcn/ui-inspired components |
| Animation | Framer Motion |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | Supabase Auth + Google admin auth |
| Media | Cloudinary |
| Emails | Resend |
| Payments | Razorpay + COD |
| State management | Zustand |
| Deployment target | Vercel |

## Architecture overview

This project follows a modern full-stack Next.js structure:

- app routes handle the storefront, admin pages, and API endpoints
- server actions and route handlers manage business logic
- prisma/schema.prisma defines the database and model relationships
- Supabase provides PostgreSQL, authentication, and connected storage
- Cloudinary handles uploaded product images and media assets
- frontend state is kept lightweight for shopping cart behavior and UI state

The architecture is built to keep the codebase understandable:

- customer routes live under `app/(store)`
- admin routes live under `app/(admin)`
- business logic is organized in `lib/actions` and related folders
- shared UI components live under `components/`

## Repository structure

```bash
.
├── README.md
├── .gitignore
├── apps/
│   └── storefront/
│       ├── app/
│       │   ├── (store)/
│       │   ├── (admin)/
│       │   ├── api/
│       │   └── layout.tsx
│       ├── components/
│       │   ├── store/
│       │   ├── admin/
│       │   └── ui/
│       ├── lib/
│       │   ├── actions/
│       │   ├── auth/
│       │   ├── email/
│       │   ├── supabase/
│       │   ├── cloudinary/
│       │   ├── checkout/
│       │   └── utils/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       ├── public/
│       ├── .env
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       └── README.md
└── .env.local
```

## Main app folders

### `apps/storefront/app/`

Contains the route-based application structure.

Relevant areas include:

- storefront pages: home, product, category, cart, checkout, account
- admin pages: dashboard, products, orders, customers, settings, inventory, promotions
- API handlers for payments, webhooks, and media upload

### `apps/storefront/components/`

Contains reusable UI blocks. The codebase separates:

- `components/store/` for public storefront UI
- `components/admin/` for admin dashboard functionality
- `components/ui/` for shared primitives

### `apps/storefront/lib/`

This is the application logic layer.

Important sections:

- `lib/actions/` for server actions and business logic
- `lib/auth/` for auth helpers and permission checks
- `lib/supabase/` for Supabase client configuration and server helpers
- `lib/email/` for email templates and sending logic
- `lib/cloudinary/` for image upload processing
- `lib/checkout/` and `lib/orders/` for order flow logic
- `lib/prisma.ts` for the database client

### `apps/storefront/prisma/`

Contains the Prisma schema and database seed logic.

The main schema file is:

- `apps/storefront/prisma/schema.prisma`

This file controls models for:

- User
- Address
- Category
- Product
- ProductVariant
- Cart and CartItem
- Wishlist
- Order and OrderItem
- Review and ReviewReply
- Promotion
- StoreSettings

## Prerequisites

Before starting local development, install the following:

- Node.js 20+
- npm
- PostgreSQL database access or a Supabase project
- Cloudinary account
- Resend account
- Razorpay account
- a Git client

## Required environment variables

Create a local environment file in `apps/storefront/.env.local` or use the existing `.env` pattern based on your setup.

Example:

```env
DATABASE_URL="postgresql://username:password@host:5432/dbname"
DIRECT_URL="postgresql://username:password@host:5432/dbname"

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

Important notes:

- never commit real secret keys to Git
- keep all sensitive values in local environment files only
- use your actual Supabase and payment credentials for real deployment

## Local development setup

From the repository root:

```bash
cd apps/storefront
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Then open these in the browser:

- storefront: http://localhost:3000
- admin login: http://localhost:3000/admin/login

## Common scripts

Use these commands from `apps/storefront`:

```bash
npm run dev      # start the Next.js development server
npm run build    # build production output
npm run start    # run the production server
npm run lint     # run project lint checks
```

## Database setup and Prisma

The app uses Prisma to connect to PostgreSQL. The main schema is defined here:

```bash
apps/storefront/prisma/schema.prisma
```

Typical setup flow:

```bash
cd apps/storefront
npx prisma generate
npx prisma db push
```

This ensures:

- Prisma client is generated
- your database schema matches the application model definitions
- the app can query and mutate database records correctly

If you want to seed sample data, use the Prisma seed entry defined in the package configuration.

## Authentication and access model

The application uses a combined authentication strategy:

- customer auth is handled via Supabase auth and user records
- admin auth is protected and uses an authorized Google sign-in flow
- business logic checks whether the user is an admin before allowing access to admin pages
- access verification is centralized in the `lib/auth` layer

This keeps admin access controlled and prevents accidental exposure of internal business features.

## Customer flow

A typical customer journey looks like this:

1. customer lands on the homepage
2. customer browses categories and product sections
3. customer explores product detail pages and selects variants
4. customer adds products to cart
5. customer proceeds to checkout
6. customer logs in or registers if required
7. customer fills the shipping and address information
8. customer selects COD or online payment
9. order is created and confirmation is shown
10. customer can later check their order history from the account area

## Admin flow

A typical admin operation looks like this:

1. admin logs into the protected admin portal
2. admin reviews business overview dashboard metrics
3. admin manages products, inventory, and media
4. admin updates orders and tracks statuses
5. admin reviews customer data and sales reports
6. admin updates promotions and store settings
7. admin monitors low-stock items and business health

## Payments and orders

The store is built with a retail order flow that includes:

- product and variant pricing
- order totals and subtotal calculations
- checkout validations
- online payment flow via Razorpay
- COD flow for local retail use
- order confirmation email flow
- order tracking and status updates

The code for payment handling and webhooks is organized under the app and lib layers and should be reviewed if you are extending the payments logic.

## Media and email integrations

### Cloudinary

Used for product image uploads and media management. It is necessary for the product media workflow used by the admin dashboard.

### Resend

Used for sending transactional emails such as order confirmations, welcome flow, and admin notifications.

## Deployment guidance

This project is built to deploy on Vercel.

### Recommended deployment flow

1. push the repo to GitHub
2. import the project to Vercel
3. configure all required environment variables in the Vercel project settings
4. connect the Supabase database and ensure auth/storage is configured
5. deploy the app
6. verify storefront, admin login, and checkout flow in production

### Production checklist

- DATABASE_URL is valid in production
- DIRECT_URL is configured if required by your database setup
- Supabase env vars are mapped correctly
- Cloudinary keys are valid
- Razorpay keys are valid for the live environment
- admin user authentication is configured correctly
- production domain is set in `NEXT_PUBLIC_SITE_URL`

## Troubleshooting

### Prisma errors

If Prisma commands fail:

```bash
cd apps/storefront
npx prisma generate
npx prisma db push
```

Also confirm `DATABASE_URL` and `DIRECT_URL` are correct.

### App won’t start

Check:

- Node version is 20 or newer
- dependencies are installed
- environment variables are loaded correctly
- port 3000 is not already in use

### Auth or admin login issues

Check:

- Supabase URL and anon key are correct
- service role key is valid
- admin user exists in the database and has the correct role
- redirect URLs are configured for the environment

### Image upload issues

Check:

- Cloudinary env keys are present
- upload permissions are valid
- file types and sizes are accepted by your upload logic

### Payment issues

Check:

- Razorpay key values are valid
- webhook configuration is set correctly if you use callback handling
- test/live keys match the environment you are using

## Future developer handoff notes

For the next developer or maintainer, the most important files to know are:

- `apps/storefront/package.json` — app scripts and dependencies
- `apps/storefront/prisma/schema.prisma` — data model and schema definitions
- `apps/storefront/app/(store)/page.tsx` — main public storefront landing page
- `apps/storefront/app/(admin)/admin/(protected)/dashboard/page.tsx` — admin dashboard overview
- `apps/storefront/lib/actions/` — business logic for storefront and admin behavior
- `apps/storefront/lib/auth/` — auth and permissions
- `apps/storefront/components/store/` — customer UI
- `apps/storefront/components/admin/` — admin UI

## Final note

This project was built as a full business-ready stationery e-commerce platform. It is structured to be maintainable and easy to extend for future enhancements such as additional product types, new payment methods, ERP integrations, shipping integrations, or advanced marketing features.

The codebase is intended to be a clean starting point for future development, with clear separation between customer experience, business logic, and admin operations.

## License

This project is intended for the PMS Stationery business and is meant for internal operational use, deployment, and future maintenance under the project owner’s direction.
