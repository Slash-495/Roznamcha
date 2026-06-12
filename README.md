# Roznamcha CRM

Roznamcha is a minimal, professional, and beginner-friendly Customer Relationship Management (CRM) tool built for shopkeepers to easily record customers, track purchases, and view business analytics.

🌐 **Live Demo:** [https://roznamcha-ivj4.vercel.app/](https://roznamcha-ivj4.vercel.app/)

## Features

- **Merchant Dashboard:** Real-time overview of total revenue, customers, and top selling products.
- **Customer Management:** Create, edit, and search for customers.
- **Purchase Tracking:** Record single or multi-item purchases and link them instantly to customers.
- **Business Analytics:** Revenue trend charts (powered by Recharts) and automatic average order value calculations.
- **Clean Aesthetic:** A beautiful, responsive, desktop-first UI featuring a white background, subtle borders, and a signature green accent.

## Tech Stack

- **Framework:** Next.js 15
- **Styling:** Tailwind CSS & Shadcn UI
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel

## Running Locally

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.
