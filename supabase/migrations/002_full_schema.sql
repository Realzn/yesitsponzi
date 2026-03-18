-- ═══════════════════════════════════════════════════════════
-- YESITSPONZI — Migration 002 : Full schema + smart rearrangement
-- ═══════════════════════════════════════════════════════════

-- ── Add columns to existing members table ──────────────────
alter table members
  add column if not exists user_id    uuid references auth.users(id),
  add column if not exists parent_id  uuid references members(id),
  add column if not exists position   int default 0,
  add column if not exists depth      int default 0,
  add column if not exists status     text default 'active';

-- ── User profiles ───────────────────────────────────────────
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  pseudo     text not null,
  avatar     text default '🦅',
  promo      text,
  link       text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "public_read"   on profiles for select using (true);
create policy "own_write"     on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- ── Trigger: auto-create profile on signup ──────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, pseudo)
  values (new.id, coalesce(new.raw_user_meta_data->>'pseudo', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Applications table ──────────────────────────────────────
create table if not exists applications (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    uuid references auth.users(id) on delete cascade,
  target_pyramid  uuid references pyramids(id) on delete cascade,
  from_pyramid    uuid references pyramids(id) on delete set null,
  message         text,
  status          text default 'pending',  -- pending | accepted | refused
  created_at      timestamptz default now()
);
alter table applications enable row level security;
create policy "open" on applications for all using (true) with check (true);

-- ── Indexes ─────────────────────────────────────────────────
create index if not exists idx_members_pyramid  on members(pyramid_id);
create index if not exists idx_members_parent   on members(parent_id);
create index if not exists idx_members_user     on members(user_id);
create index if not exists idx_members_depth    on members(pyramid_id, depth);
create index if not exists idx_members_status   on members(pyramid_id, status);
create index if not exists idx_apps_applicant   on applications(applicant_id);
create index if not exists idx_apps_target      on applications(target_pyramid, status);

-- Realtime
alter publication supabase_realtime add table applications;
alter publication supabase_realtime add table profiles;

-- ═══════════════════════════════════════════════════════════
-- RPC: LEAVE PYRAMID — Smart rearrangement algorithm
-- ═══════════════════════════════════════════════════════════
create or replace function leave_pyramid(
  p_user_id    uuid,
  p_pyramid_id uuid
) returns jsonb as $$
declare
  v_node       members%rowtype;
  v_promoted   uuid;
  v_children   uuid[];
  v_other_kids uuid[];
  v_is_creator boolean;
begin
  -- 1. Find the leaving node
  select * into v_node
  from   members
  where  user_id = p_user_id
    and  pyramid_id = p_pyramid_id
    and  status = 'active'
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'member_not_found');
  end if;

  -- Check if creator
  v_is_creator := (v_node.parent_id is null);

  -- 2. Get direct children
  select array_agg(id order by joined_at asc)
  into   v_children
  from   members
  where  parent_id = v_node.id and status = 'active';

  -- Case A: No children — simple removal
  if v_children is null or array_length(v_children, 1) = 0 then
    update members set status = 'left' where id = v_node.id;

  -- Case B: Has children
  else
    -- First child becomes promoted
    v_promoted  := v_children[1];
    -- Other children will be reattached to promoted
    v_other_kids := v_children[2:];

    -- Promote first child to leaving node's position
    update members
    set    parent_id = v_node.parent_id,
           position  = v_node.position,
           depth     = v_node.depth
    where  id = v_promoted;

    -- Reattach other children to promoted node
    if v_other_kids is not null and array_length(v_other_kids, 1) > 0 then
      update members
      set    parent_id = v_promoted,
             depth     = v_node.depth + 1
      where  id = any(v_other_kids)
        and  parent_id = v_node.id;
    end if;

    -- Recursively recalculate depths for the whole promoted subtree
    with recursive subtree as (
      select id, v_node.depth::int as new_depth
      from   members where id = v_promoted
      union all
      select m.id, s.new_depth + 1
      from   members m
      join   subtree s on m.parent_id = s.id
      where  m.status = 'active'
    )
    update members m
    set    depth = s.new_depth
    from   subtree s
    where  m.id = s.id;

    -- If creator leaves, update pyramid owner
    if v_is_creator then
      update pyramids set pseudo = (
        select pseudo from members
        join profiles on profiles.id = members.user_id
        where members.id = v_promoted
      ) where id = p_pyramid_id;
    end if;

    -- Mark leaving node
    update members set status = 'left' where id = v_node.id;
  end if;

  return jsonb_build_object('ok', true, 'promoted', v_promoted);
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════════════════════
-- RPC: JOIN PYRAMID — BFS slot finder + insert
-- ═══════════════════════════════════════════════════════════
create or replace function join_pyramid(
  p_user_id     uuid,
  p_pyramid_id  uuid,
  p_pseudo      text,
  p_promo       text default null,
  p_link        text default null,
  p_emoji       text default '👤',
  p_max_children int default 3
) returns jsonb as $$
declare
  v_parent_id uuid;
  v_depth     int;
  v_pos       int;
begin
  -- Find the first available parent (BFS: shallowest node with < max_children)
  select m.id, m.depth,
         coalesce((select count(*) from members c where c.parent_id = m.id and c.status = 'active'), 0) as kids
  into   v_parent_id, v_depth
  from   members m
  where  m.pyramid_id = p_pyramid_id
    and  m.status = 'active'
    and  (select count(*) from members c where c.parent_id = m.id and c.status = 'active') < p_max_children
  order by m.depth asc, m.joined_at asc
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_slot_available');
  end if;

  -- Get next position
  select coalesce(max(position), -1) + 1
  into   v_pos
  from   members
  where  parent_id = v_parent_id and status = 'active';

  -- Insert member
  insert into members (pyramid_id, user_id, parent_id, position, depth, pseudo, promo, link, emoji, status)
  values (p_pyramid_id, p_user_id, v_parent_id, v_pos, v_depth + 1, p_pseudo, p_promo, p_link, p_emoji, 'active');

  return jsonb_build_object('ok', true, 'depth', v_depth + 1, 'parent', v_parent_id);
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════════════════════
-- RPC: GET PYRAMID TREE — Full recursive tree read
-- ═══════════════════════════════════════════════════════════
create or replace function get_pyramid_tree(p_pyramid_id uuid)
returns jsonb as $$
declare
  v_result jsonb;
begin
  with recursive tree as (
    select m.id, m.user_id, m.parent_id, m.depth, m.position, m.pseudo,
           m.promo, m.link, m.emoji, m.joined_at,
           p.pseudo as user_pseudo, p.avatar, p.link as user_link
    from   members m
    left join profiles p on p.id = m.user_id
    where  m.pyramid_id = p_pyramid_id and m.status = 'active' and m.parent_id is null
    union all
    select m.id, m.user_id, m.parent_id, m.depth, m.position, m.pseudo,
           m.promo, m.link, m.emoji, m.joined_at,
           p.pseudo, p.avatar, p.link
    from   members m
    left join profiles p on p.id = m.user_id
    join   tree t on m.parent_id = t.id
    where  m.status = 'active'
  )
  select jsonb_agg(row_to_json(tree) order by depth, position)
  into   v_result from tree;

  return coalesce(v_result, '[]'::jsonb);
end;
$$ language plpgsql security definer;
