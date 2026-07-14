-- BestDish security hardening: enable Row-Level Security (RLS) on all public tables.
--
-- WHY THIS EXISTS:
-- Tables are created via `prisma db push`, which does NOT enable RLS. Supabase ships
-- a public anon key in the browser bundle and exposes every table in the `public`
-- schema through its PostgREST REST API. Any table WITHOUT RLS is therefore fully
-- readable / writable / deletable by anyone who has that public key.
--
-- The app itself never uses the anon key for table access (it uses Prisma over a
-- direct Postgres connection, plus the service_role key for storage), so enabling
-- RLS with no policies locks out the public REST API without breaking anything.
--
-- RE-RUN THIS after any database reset / rebuild. `ENABLE ROW LEVEL SECURITY` is
-- idempotent, so it is safe to run repeatedly.
--
-- Apply via the Supabase SQL editor, or:
--   psql "$DIRECT_URL" -f prisma/security.sql

alter table public."City"       enable row level security;
alter table public."Restaurant" enable row level security;
alter table public."Dish"       enable row level security;
alter table public."Review"     enable row level security;
alter table public."User"       enable row level security;
