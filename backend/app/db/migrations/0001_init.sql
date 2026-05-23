-- KerjaCerdas — initial schema for Supabase (Postgres + pgvector).
-- Generated from backend/app/db/schemas.py. Apply via Supabase SQL editor or psql.

create extension if not exists "vector";
create extension if not exists "pgcrypto";

-- Embeddings are 768-dim (Gemini text-embedding-004).
do $$ begin
  create type user_role as enum ('seeker', 'employer', 'admin');
  create type education_level as enum ('SMA', 'D3', 'D4', 'S1', 'S2', 'S3');
  create type application_status as enum
    ('applied', 'reviewed', 'interview', 'offered', 'rejected', 'withdrawn');
  create type verification_status as enum
    ('unverified', 'pending', 'verified', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role user_role not null,
  is_active boolean default true,
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists seeker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  full_name text not null,
  headline text default '',
  nik text,
  nik_verified verification_status default 'unverified',
  date_of_birth text,
  region_code text not null,
  preferred_regions text[] default '{}',
  skills jsonb default '[]',
  experience jsonb default '[]',
  education jsonb default '[]',
  resume_text text default '',
  salary_expectation_min int default 0,
  salary_expectation_max int default 0,
  open_to_remote boolean default true,
  embedding vector(768),
  embedding_model text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists seeker_embedding_idx
  on seeker_profiles using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists employers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  company_name text not null,
  npwp text,
  industry text default '',
  size text default 'sme',
  region_code text not null,
  website text,
  description text default '',
  verified verification_status default 'unverified',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists job_postings (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid references employers(id) on delete cascade,
  title text not null,
  kbji_code text default '',
  description text not null,
  responsibilities text[] default '{}',
  required_skills text[] default '{}',
  nice_to_have_skills text[] default '{}',
  education_min education_level default 'S1',
  experience_years_min int default 0,
  region_code text not null,
  remote_allowed boolean default false,
  salary_min int default 0,
  salary_max int default 0,
  is_active boolean default true,
  embedding vector(768),
  embedding_model text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists job_embedding_idx
  on job_postings using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists job_active_region_idx on job_postings (is_active, region_code);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references job_postings(id) on delete cascade,
  seeker_id uuid references seeker_profiles(id) on delete cascade,
  status application_status default 'applied',
  cover_letter text default '',
  match_score float default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (job_id, seeker_id)
);

create table if not exists match_bundles (
  id uuid primary key default gen_random_uuid(),
  subject_kind text not null,
  subject_id uuid not null,
  top_k int not null,
  results jsonb not null,
  embedding_model text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists skill_gap_results (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid references seeker_profiles(id) on delete cascade,
  target_job_id uuid references job_postings(id) on delete set null,
  missing_skills text[] default '{}',
  matching_skills text[] default '{}',
  gap_severity text not null,
  match_percentage float not null,
  recommended_courses jsonb default '[]',
  estimated_readiness_months int default 0,
  summary text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  seeker_id uuid references seeker_profiles(id) on delete set null,
  title text default '',
  messages jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- k-NN RPCs called by SupabaseRepository.knn_by_embedding
create or replace function match_job_postings(
  query_embedding vector(768), match_count int
) returns setof job_postings language sql stable as $$
  select * from job_postings
  where is_active and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_seeker_profiles(
  query_embedding vector(768), match_count int
) returns setof seeker_profiles language sql stable as $$
  select * from seeker_profiles
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;
