Read CLAUDE.md thoroughly to understand our project boundaries, tech stack, and rules. 

We are building [Project Name]: [1–2 sentence description of what the app does and who it is for].

Our core demo user flow ("Golden Path") is:
1. [Step 1: e.g., User lands on the dashboard and sees active items]
2. [Step 2: e.g., User submits a form/prompt which calls our Node.js backend to process with AI]
3. [Step 3: e.g., Result is saved to Supabase and updates the UI in real time]

Using Plan Mode, create an implementation plan to scaffold the entire monorepo from scratch:
1. Database: Write `/supabase/schema.sql` with the exact tables needed for this flow, plus `/supabase/seed.sql` with realistic demo data.
2. Backend (`/server`): Set up a clean TypeScript Express server with CORS, `.env.example`, and the core API route(s) needed for secret API/AI operations.
3. Frontend (`/client`): Scaffold a React + Vite + TypeScript + Tailwind CSS app connected to `@supabase/supabase-js`, complete with TypeScript types matching our SQL schema, loading states, and a polished, demo-ready UI for the Golden Path.

Before writing any code, outline the exact files you plan to create and ask me any clarifying questions about the database fields, UI layout, or external API payloads.
