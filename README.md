# Butlog
Independent grade planning app. Next.js, TypeScript, Tailwind, Recharts, Supabase Auth.

## Deploy on Vercel
1. Import the repository in Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`).
3. In Supabase, Authentication > URL Configuration: set the Site URL and Redirect URLs to your deployed domain.

Grading rules live in `lib/grading-systems.ts`; calculations in `lib/engine.ts`.
