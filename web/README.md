# Ideas Taxonomy - Web App

A full-stack web application for the Ideas Taxonomy CMS, built with Next.js and Supabase.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Hosting**: Vercel (recommended)

## Getting Started

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Go to Authentication > Settings and enable Email auth
4. Create your admin user in Authentication > Users

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Get your keys from Supabase Dashboard > Settings > API.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Migrating Existing Content

If you have existing Markdown content from the Jekyll/Electron setup:

```bash
npx ts-node scripts/migrate-from-markdown.ts
```

## Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── ideas/              # Public ideas pages
│   │   ├── stories/            # Public stories pages
│   │   ├── sprints/            # Public sprints pages
│   │   ├── updates/            # Public updates pages
│   │   ├── figures/            # Public figures pages
│   │   ├── materials/          # Public materials pages
│   │   ├── admin/              # Protected admin CMS
│   │   └── auth/               # Authentication pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities and Supabase clients
│   └── types/                  # TypeScript type definitions
├── supabase/
│   └── schema.sql              # Database schema
└── scripts/
    └── migrate-from-markdown.ts # Migration script
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (only needed for migrations)
