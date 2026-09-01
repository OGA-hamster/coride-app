# CoRide

A Next.js + Supabase carpool-matching app. Real accounts, route posting,
live matching, in-app chat, and post-ride ratings — every feature from the
prototype, fully working.

## What's inside
- `app/` — home, post-a-route, matches, messages (chat + ratings), account
- `lib/supabase.js` — Supabase client
- `supabase-schema.sql` — run this once in Supabase to create your tables
- `.env.local.example` — copy to `.env.local` and fill in your Supabase keys

## Setup steps (same as Driftline)
1. Create a free project at supabase.com
2. In the Supabase dashboard, open the SQL editor and run everything in `supabase-schema.sql`
3. In Supabase, go to Project settings → API Keys, copy the Project URL and the Publishable key
4. Copy `.env.local.example` to `.env.local` and paste those two values in
5. Run `npm install` then `npm run dev` to test locally at localhost:3000
6. Push this project to a GitHub repo
7. Import that repo in Vercel, add the same two environment variables there, and deploy

## Note on pricing
The Basic/Plus pricing tiers from the prototype are shown as reference for
your business plan but aren't wired to real payments in this build — that
would need a payment processor like Stripe added separately, which we
agreed to leave out for now.
