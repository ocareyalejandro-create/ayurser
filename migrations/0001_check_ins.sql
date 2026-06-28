-- 0001_check_ins.sql
-- The journal's memory. One row per completed one-minute check-in.
-- "Capture early, interpret later" — we persist every check-in from the first
-- morning; the intelligence on top arrives far later. (See PHILOSOPHY.md.)
--
-- Plain Postgres (Neon / Vercel Postgres). All access is server-side via the
-- secret connection string in a Next.js Route Handler — the browser never
-- touches the database. There is therefore NO Row Level Security / anon policy
-- here (that was specific to the old browser-anon-insert approach).

create extension if not exists "pgcrypto";

create table if not exists check_ins (
  id          uuid        primary key default gen_random_uuid(),
  device_id   text        not null,
  created_at  timestamptz not null default now(),
  answers     jsonb       not null,   -- the 5 raw answers (option index per question key)
  qualities   jsonb       not null,   -- the tallied qualities
  outcome     text        not null    -- the read-out / cluster: balanced | single | mixed
);

-- Read path for a future "your tendencies" view: fetch a device's history by time.
create index if not exists check_ins_device_created_idx
  on check_ins (device_id, created_at desc);
