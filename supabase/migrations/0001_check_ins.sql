-- 0001_check_ins.sql
-- The journal's memory. One row per completed one-minute check-in.
-- "Capture early, interpret later" — we persist every check-in from the first
-- morning; the intelligence on top arrives far later. (See PHILOSOPHY.md.)

create extension if not exists "pgcrypto";

create table if not exists public.check_ins (
  id          uuid        primary key default gen_random_uuid(),
  device_id   text        not null,
  created_at  timestamptz not null default now(),
  answers     jsonb       not null,   -- the 5 raw answers (option index per question key)
  qualities   jsonb       not null,   -- the tallied qualities
  outcome     text        not null    -- the read-out / cluster: balanced | single | mixed
);

-- Read path for a future "your tendencies" view: fetch a device's history by time.
create index if not exists check_ins_device_created_idx
  on public.check_ins (device_id, created_at desc);

-- Row Level Security.
-- This is an ANONYMOUS device journal: there is no auth/login, so writes come in
-- as the `anon` role using the public anon key. We therefore allow anon INSERT.
-- We deliberately do NOT grant anon SELECT/UPDATE/DELETE here — at this phase the
-- app only writes (capture). Reads belong to a later, scoped phase (e.g. a policy
-- that returns only rows matching the caller's own device_id, enforced server-side
-- once we have a server context). Least privilege: grant exactly what's used today.
alter table public.check_ins enable row level security;

drop policy if exists "anon can insert check-ins" on public.check_ins;
create policy "anon can insert check-ins"
  on public.check_ins
  for insert
  to anon
  with check (true);
