# Project Overview
- **Goal:** [Insert 1-sentence description of what the app does and the core demo flow]
- **Context:** Hackathon MVP. Prioritize working end-to-end features, clean UI, and speed over enterprise scalability or edge-case abstractions.

# Tech Stack
- **Frontend:** React (Vite), TypeScript, Tailwind CSS, Lucide Icons, shadcn/ui
- **Backend:** Node.js, Express (TypeScript)
- **Database & Auth:** Supabase (PostgreSQL, Supabase Auth, `@supabase/supabase-js`)
- **AI / External APIs:** [e.g., Anthropic SDK / OpenAI SDK / Stripe]

# Architecture & Boundaries
- **Frontend-to-Supabase:** Use the Supabase client directly in React for standard CRUD operations, Auth, and Realtime listeners. Do NOT build Express endpoints for basic database reads/writes.
- **Node.js Backend Role:** Reserve the `/server` Express app strictly for operations requiring secret environment variables (LLM calls, webhooks, third-party API keys).
- **Database Security:** Assume Supabase Row Level Security (RLS) is DISABLED during rapid prototyping unless explicitly instructed otherwise. Do not write RLS policies unless asked.

# Directory Structure
- `/client` - React frontend (`src/components`, `src/pages`, `src/lib/supabase.ts`, `src/types`)
- `/server` - Express backend (`src/routes`, `src/services`, `src/index.ts`)
- `/supabase` - SQL schema files and seed scripts (`schema.sql`, `seed.sql`)

# Coding Standards & Rules
1. **No Placeholders or Mocks:** Never leave `// TODO` comments, mocked API responses, or dummy `setTimeout` delays. Write real, functional integrations.
2. **Type Safety:** Keep frontend and backend TypeScript interfaces strictly aligned with the Supabase database schema in `/supabase/schema.sql`.
3. **Minimal Dependencies:** Do not install new npm packages without asking first. Stick to Tailwind CSS and existing libraries.
4. **Error Handling:** Always wrap external API calls and Supabase queries in `try/catch` blocks and surface clear, user-friendly toast/UI error states for live demos.
5. **UI Polish:** Build responsive, high-contrast UIs. Always include loading skeletons/spinners and realistic empty states.

# Common Commands
- **Start Frontend:** `cd client && npm run dev`
- **Start Backend:** `cd server && npm run dev`
- **Typecheck:** `npm run typecheck`

# Workflow Instructions
- Before building any multi-file feature, enter Plan Mode, outline the exact files to create/modify, and ask clarifying questions if database columns or API payloads are ambiguous.
- After modifying database tables, immediately update `/supabase/schema.sql` and corresponding TypeScript types.
