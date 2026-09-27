-- Liquid City - Supabase schema for the organizer questionnaire + planning engine.
--
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- The backend works fine without these tables (it falls back to in-memory
-- storage), but data won't survive a server restart until these exist.

create table if not exists event_models (
    id uuid primary key,
    raw_submission jsonb not null,
    structured_model jsonb not null,
    created_at timestamptz not null default now()
);

create table if not exists plans (
    id uuid primary key,
    event_model_id uuid references event_models(id) on delete cascade,
    plan jsonb not null,
    created_at timestamptz not null default now()
);

-- Existing simulation-related tables used by the earlier crowd-management
-- backend (events / partners), kept here for convenience if you want
-- persistence for those too. Both are optional - event_service.py and
-- partner_service.py fall back to in-memory storage if these are absent.

create table if not exists events (
    id uuid primary key,
    name text not null,
    location text not null,
    expected_attendance integer not null,
    current_attendance integer not null default 0,
    status text not null default 'scheduled'
);

create table if not exists partners (
    id uuid primary key,
    name text not null,
    type text not null,
    capacity integer not null default 100,
    occupancy numeric not null default 0,
    waiting_time numeric not null default 0,
    rating numeric not null default 4.0,
    offer numeric not null default 0,
    verified boolean not null default true
);

-- Indexes to make lookups by event fast.
create index if not exists idx_plans_event_model_id on plans(event_model_id);
create index if not exists idx_event_models_created_at on event_models(created_at desc);

-- NOTE: Row Level Security is left disabled here for hackathon simplicity.
-- If you deploy this beyond a demo, enable RLS and add policies before
-- exposing the Supabase URL/anon key to a public frontend:
--   alter table event_models enable row level security;
--   alter table plans enable row level security;
