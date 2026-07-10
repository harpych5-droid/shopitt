-- =====================================================================
-- Shopitt — Production Migration Package (Phase 2)
-- Target: External Supabase project (jcjarvyyubsoxbhuajdx)
-- Idempotent where possible. Run once in the Supabase SQL Editor.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists pgcrypto;

-- =====================================================================
-- 1. POSTS — multi-image, drop_title, discovery flags
-- =====================================================================
alter table public.posts
  add column if not exists drop_title text,
  add column if not exists media_urls text[] not null default '{}',
  add column if not exists is_discovery boolean not null default false,
  add column if not exists discovery_category text,
  add column if not exists featured boolean not null default false,
  add column if not exists featured_at timestamptz;

create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_user_id    on public.posts (user_id);
create index if not exists idx_posts_available  on public.posts (is_available) where is_available;
create index if not exists idx_posts_discovery  on public.posts (discovery_category) where is_discovery;
create index if not exists idx_posts_featured   on public.posts (featured_at desc) where featured;

-- =====================================================================
-- 2. ORDERS — extra address / notes columns for the order sheet
-- =====================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  quantity int not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending', -- pending|confirmed|shipped|delivered|cancelled
  buyer_name text,
  buyer_phone text,
  province text,
  city text,
  address text,
  notes text,
  delivery_type text,
  delivery_fee numeric default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists province text,
  add column if not exists city text,
  add column if not exists notes text,
  add column if not exists quantity int default 1,
  add column if not exists total_price numeric default 0;

create index if not exists idx_orders_buyer  on public.orders (buyer_id, created_at desc);
create index if not exists idx_orders_seller on public.orders (seller_id, created_at desc);
create index if not exists idx_orders_status on public.orders (status);

grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;

alter table public.orders enable row level security;

drop policy if exists "orders_select_involved" on public.orders;
create policy "orders_select_involved" on public.orders
  for select to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "orders_insert_buyer" on public.orders;
create policy "orders_insert_buyer" on public.orders
  for insert to authenticated
  with check (auth.uid() = buyer_id);

drop policy if exists "orders_update_involved" on public.orders;
create policy "orders_update_involved" on public.orders
  for update to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- =====================================================================
-- 3. COMMENTS — replies, likes, indexes
-- =====================================================================
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  parent_comment_id uuid references public.post_comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.post_comments
  add column if not exists parent_comment_id uuid references public.post_comments(id) on delete cascade;

create index if not exists idx_comments_post on public.post_comments (post_id, created_at);
create index if not exists idx_comments_parent on public.post_comments (parent_comment_id);

grant select, insert, delete on public.post_comments to authenticated;
grant select on public.post_comments to anon;
grant all on public.post_comments to service_role;

alter table public.post_comments enable row level security;

drop policy if exists "comments_read_all"     on public.post_comments;
create policy "comments_read_all" on public.post_comments for select using (true);
drop policy if exists "comments_insert_self"  on public.post_comments;
create policy "comments_insert_self" on public.post_comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "comments_delete_self"  on public.post_comments;
create policy "comments_delete_self" on public.post_comments for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.comment_likes (
  comment_id uuid not null references public.post_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

grant select, insert, delete on public.comment_likes to authenticated;
grant all on public.comment_likes to service_role;

alter table public.comment_likes enable row level security;
drop policy if exists "clikes_read_all"    on public.comment_likes;
create policy "clikes_read_all" on public.comment_likes for select using (true);
drop policy if exists "clikes_insert_self" on public.comment_likes;
create policy "clikes_insert_self" on public.comment_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "clikes_delete_self" on public.comment_likes;
create policy "clikes_delete_self" on public.comment_likes for delete to authenticated using (auth.uid() = user_id);

-- =====================================================================
-- 4. NOTIFICATIONS — complete schema + read tracking
-- =====================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null,          -- like|comment|reply|comment_like|follow|order|order_status|message|announcement|mention
  title text,
  body text,
  message text,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.post_comments(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists comment_id uuid references public.post_comments(id) on delete cascade,
  add column if not exists order_id uuid references public.orders(id) on delete cascade,
  add column if not exists read_at timestamptz;

create index if not exists idx_notif_user_unread on public.notifications (user_id, is_read, created_at desc);
create index if not exists idx_notif_user_recent on public.notifications (user_id, created_at desc);

grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;

alter table public.notifications enable row level security;

drop policy if exists "notifs_read_self"   on public.notifications;
create policy "notifs_read_self"   on public.notifications for select to authenticated using (auth.uid() = user_id);
drop policy if exists "notifs_update_self" on public.notifications;
create policy "notifs_update_self" on public.notifications for update to authenticated using (auth.uid() = user_id);

-- =====================================================================
-- 5. SUBSCRIPTIONS — plans + user subscription state
-- =====================================================================
create table if not exists public.subscription_plans (
  id text primary key,                     -- 'free' | 'growth' | 'business' | 'brand'
  name text not null,
  price_zmw numeric not null default 0,
  billing_period text not null default 'monthly',
  benefits jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.subscription_plans to anon, authenticated;
grant all on public.subscription_plans to service_role;
alter table public.subscription_plans enable row level security;
drop policy if exists "plans_read_all" on public.subscription_plans;
create policy "plans_read_all" on public.subscription_plans for select using (true);

insert into public.subscription_plans (id, name, price_zmw, benefits, sort_order) values
  ('free',     'Free',     0,   '["Up to 100 completed sales or 90 days","Basic seller tools"]', 1),
  ('growth',   'Growth',   40,  '["Unlimited selling","Better analytics","Growth badge","Priority support"]', 2),
  ('business', 'Business', 100, '["Advanced analytics","Better visibility","Business badge","Priority discovery"]', 3),
  ('brand',    'Brand',    0,   '["Verified Brand badge","Editorial opportunities","Featured placement","Premium support"]', 4)
on conflict (id) do update set
  name = excluded.name,
  price_zmw = excluded.price_zmw,
  benefits = excluded.benefits,
  sort_order = excluded.sort_order;

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id),
  status text not null default 'active',       -- active|trialing|expired|cancelled
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  sales_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subs_status on public.user_subscriptions (status);

grant select, insert, update on public.user_subscriptions to authenticated;
grant all on public.user_subscriptions to service_role;
alter table public.user_subscriptions enable row level security;

drop policy if exists "subs_read_self"   on public.user_subscriptions;
create policy "subs_read_self"   on public.user_subscriptions for select to authenticated using (auth.uid() = user_id);
drop policy if exists "subs_insert_self" on public.user_subscriptions;
create policy "subs_insert_self" on public.user_subscriptions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "subs_update_self" on public.user_subscriptions;
create policy "subs_update_self" on public.user_subscriptions for update to authenticated using (auth.uid() = user_id);

-- =====================================================================
-- 6. DISCOVERY — sections, items, categories, featured creators
-- =====================================================================
create table if not exists public.discovery_categories (
  slug text primary key,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

insert into public.discovery_categories (slug, name, sort_order) values
  ('streetwear',  'Streetwear',      1),
  ('luxury',      'Luxury',          2),
  ('campus',      'Campus Fits',     3),
  ('formal',      'Formal',          4),
  ('vintage',     'Vintage',         5),
  ('sneakers',    'Sneakers',        6),
  ('accessories', 'Accessories',     7),
  ('beauty',      'Beauty',          8),
  ('creative',    'Creative Ideas',  9)
on conflict (slug) do nothing;

grant select on public.discovery_categories to anon, authenticated;
grant all on public.discovery_categories to service_role;
alter table public.discovery_categories enable row level security;
drop policy if exists "dcat_read_all" on public.discovery_categories;
create policy "dcat_read_all" on public.discovery_categories for select using (true);

create table if not exists public.discovery_sections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  layout text not null default 'card',   -- card|tall|creator|hero
  category_slug text references public.discovery_categories(slug) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.discovery_sections to anon, authenticated;
grant all on public.discovery_sections to service_role;
alter table public.discovery_sections enable row level security;
drop policy if exists "dsec_read_all" on public.discovery_sections;
create policy "dsec_read_all" on public.discovery_sections for select using (is_active);

create table if not exists public.discovery_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.discovery_sections(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  creator_id uuid references auth.users(id) on delete cascade,
  sort_order int not null default 0,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_ditems_section on public.discovery_items (section_id, sort_order);

grant select on public.discovery_items to anon, authenticated;
grant all on public.discovery_items to service_role;
alter table public.discovery_items enable row level security;
drop policy if exists "ditems_read_all" on public.discovery_items;
create policy "ditems_read_all" on public.discovery_items for select using (true);

create table if not exists public.featured_creators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  featured_at timestamptz not null default now(),
  sort_order int not null default 0
);

grant select on public.featured_creators to anon, authenticated;
grant all on public.featured_creators to service_role;
alter table public.featured_creators enable row level security;
drop policy if exists "fcrea_read_all" on public.featured_creators;
create policy "fcrea_read_all" on public.featured_creators for select using (true);

-- =====================================================================
-- 7. ADMIN — reports, suspensions, announcements
-- =====================================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null,  -- 'post' | 'user' | 'comment'
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open', -- open|reviewing|resolved|dismissed
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

grant select, insert on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
drop policy if exists "reports_insert_self" on public.reports;
create policy "reports_insert_self" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
drop policy if exists "reports_read_admin"  on public.reports;
create policy "reports_read_admin"  on public.reports for select to authenticated using (public.has_role(auth.uid(), 'admin'));
drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports for update to authenticated using (public.has_role(auth.uid(), 'admin'));

create table if not exists public.user_suspensions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  suspended_at timestamptz not null default now(),
  suspended_by uuid references auth.users(id) on delete set null,
  reason text,
  expires_at timestamptz
);

grant select on public.user_suspensions to authenticated;
grant all on public.user_suspensions to service_role;
alter table public.user_suspensions enable row level security;
drop policy if exists "susp_admin_all" on public.user_suspensions;
create policy "susp_admin_all" on public.user_suspensions for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table if not exists public.admin_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  audience text not null default 'all', -- all|sellers|buyers
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select on public.admin_announcements to authenticated;
grant all on public.admin_announcements to service_role;
alter table public.admin_announcements enable row level security;
drop policy if exists "ann_read_all" on public.admin_announcements;
create policy "ann_read_all" on public.admin_announcements for select using (true);
drop policy if exists "ann_admin_write" on public.admin_announcements;
create policy "ann_admin_write" on public.admin_announcements for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- 8. NOTIFICATION TRIGGERS
-- =====================================================================
create or replace function public.notify_on_new_follower()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, title, body)
  values (new.following_id, new.follower_id, 'follow', 'New follower', 'Someone started following you');
  return new;
end $$;
drop trigger if exists trg_notify_follower on public.followers;
create trigger trg_notify_follower after insert on public.followers
  for each row execute function public.notify_on_new_follower();

create or replace function public.notify_on_post_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_title text;
begin
  select user_id, title into v_owner, v_title from public.posts where id = new.post_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id, title, body)
    values (v_owner, new.user_id, 'like', new.post_id, 'New like', coalesce(v_title,'Your post') || ' was liked');
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_post_like on public.post_likes;
create trigger trg_notify_post_like after insert on public.post_likes
  for each row execute function public.notify_on_post_like();

create or replace function public.notify_on_new_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_parent_owner uuid;
begin
  if new.parent_comment_id is not null then
    select user_id into v_parent_owner from public.post_comments where id = new.parent_comment_id;
    if v_parent_owner is not null and v_parent_owner <> new.user_id then
      insert into public.notifications (user_id, actor_id, type, post_id, comment_id, title, body)
      values (v_parent_owner, new.user_id, 'reply', new.post_id, new.id, 'New reply', new.text);
    end if;
  end if;
  select user_id into v_owner from public.posts where id = new.post_id;
  if v_owner is not null and v_owner <> new.user_id and (v_parent_owner is null or v_owner <> v_parent_owner) then
    insert into public.notifications (user_id, actor_id, type, post_id, comment_id, title, body)
    values (v_owner, new.user_id, 'comment', new.post_id, new.id, 'New comment', new.text);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_comment on public.post_comments;
create trigger trg_notify_comment after insert on public.post_comments
  for each row execute function public.notify_on_new_comment();

create or replace function public.notify_on_comment_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_post uuid;
begin
  select user_id, post_id into v_owner, v_post from public.post_comments where id = new.comment_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id, comment_id, title, body)
    values (v_owner, new.user_id, 'comment_like', v_post, new.comment_id, 'Your comment was liked', null);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_comment_like on public.comment_likes;
create trigger trg_notify_comment_like after insert on public.comment_likes
  for each row execute function public.notify_on_comment_like();

create or replace function public.notify_on_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, order_id, title, body)
  values (new.seller_id, new.buyer_id, 'order', new.id, 'New order received', 'You have a new order to confirm');
  return new;
end $$;
drop trigger if exists trg_notify_new_order on public.orders;
create trigger trg_notify_new_order after insert on public.orders
  for each row execute function public.notify_on_new_order();

create or replace function public.notify_on_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, actor_id, type, order_id, title, body)
    values (new.buyer_id, new.seller_id, 'order_status', new.id, 'Order ' || new.status, 'Your order status changed to ' || new.status);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_order_status on public.orders;
create trigger trg_notify_order_status after update on public.orders
  for each row execute function public.notify_on_order_status();

-- Broadcast admin announcement to all users
create or replace function public.broadcast_announcement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, title, body)
  select id, new.created_by, 'announcement', new.title, new.body from auth.users;
  return new;
end $$;
drop trigger if exists trg_broadcast_announcement on public.admin_announcements;
create trigger trg_broadcast_announcement after insert on public.admin_announcements
  for each row execute function public.broadcast_announcement();

-- =====================================================================
-- 9. REALTIME
-- =====================================================================
do $$ begin
  perform 1 from pg_publication where pubname = 'supabase_realtime';
  if found then
    alter publication supabase_realtime add table public.notifications;
    alter publication supabase_realtime add table public.post_comments;
    alter publication supabase_realtime add table public.comment_likes;
    alter publication supabase_realtime add table public.orders;
    alter publication supabase_realtime add table public.followers;
  end if;
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- 10. STORAGE — public bucket for post media (multi-image / video)
-- =====================================================================
-- Run in Supabase Dashboard → Storage if you prefer UI:
--   Bucket: post-media | Public: yes | File size limit: 25 MB
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

drop policy if exists "post_media_read_public" on storage.objects;
create policy "post_media_read_public" on storage.objects
  for select using (bucket_id = 'post-media');

drop policy if exists "post_media_upload_self" on storage.objects;
create policy "post_media_upload_self" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-media' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "post_media_delete_self" on storage.objects;
create policy "post_media_delete_self" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-media' and auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================================
-- END
-- =====================================================================
