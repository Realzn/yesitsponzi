-- ══════════════════════════════════════════════════════════
-- YESITSPONZI — Database schema
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

-- Waitlist
create table if not exists waitlist (
  id         uuid default gen_random_uuid() primary key,
  email      text unique not null,
  created_at timestamptz default now()
);

-- Pyramides créées par les joueurs
create table if not exists pyramids (
  id         uuid default gen_random_uuid() primary key,
  pseudo     text not null,
  name       text not null,
  promo      text,
  link       text,
  emoji      text default '🔺',
  created_at timestamptz default now()
);

-- Membres qui rejoignent une pyramide
create table if not exists members (
  id         uuid default gen_random_uuid() primary key,
  pyramid_id uuid references pyramids(id) on delete cascade not null,
  pseudo     text not null,
  promo      text,
  link       text,
  emoji      text default '👤',
  joined_at  timestamptz default now()
);

-- Messages dans le chat de chaque pyramide
create table if not exists messages (
  id         uuid default gen_random_uuid() primary key,
  pyramid_id uuid references pyramids(id) on delete cascade not null,
  pseudo     text not null,
  body       text not null,
  created_at timestamptz default now()
);

-- ── RLS ─────────────────────────────────────────────────────
alter table waitlist  enable row level security;
alter table pyramids  enable row level security;
alter table members   enable row level security;
alter table messages  enable row level security;

-- Tout le monde peut lire et écrire (site public, pas d'auth)
create policy "public_all" on waitlist for all using (true) with check (true);
create policy "public_all" on pyramids for all using (true) with check (true);
create policy "public_all" on members  for all using (true) with check (true);
create policy "public_all" on messages for all using (true) with check (true);

-- ── Realtime ─────────────────────────────────────────────────
alter publication supabase_realtime add table pyramids;
alter publication supabase_realtime add table members;
alter publication supabase_realtime add table messages;

-- ── Index pour performance ───────────────────────────────────
create index if not exists idx_members_pyramid_id  on members(pyramid_id);
create index if not exists idx_messages_pyramid_id on messages(pyramid_id);
create index if not exists idx_members_joined      on members(joined_at);
create index if not exists idx_messages_created    on messages(created_at);
