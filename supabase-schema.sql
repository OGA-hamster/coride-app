-- Run this whole file once in the Supabase SQL editor.

create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  full_name text not null,
  women_only_filter boolean default false,
  created_at timestamptz default now()
);

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  start_point text not null,
  end_point text not null,
  pickup_time text not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references routes(id) not null,
  sender_id uuid references auth.users(id) not null,
  recipient_id uuid references auth.users(id) not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references routes(id),
  rater_id uuid references auth.users(id) not null,
  ratee_id uuid references auth.users(id) not null,
  stars int not null check (stars between 1 and 5),
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table routes enable row level security;
alter table messages enable row level security;
alter table ratings enable row level security;

create policy "Anyone can read profiles" on profiles for select using (true);
create policy "Users manage their own profile" on profiles for all using (auth.uid() = id);

create policy "Anyone can read active routes" on routes for select using (true);
create policy "Users manage their own routes" on routes for insert with check (auth.uid() = user_id);
create policy "Users update their own routes" on routes for update using (auth.uid() = user_id);
create policy "Users delete their own routes" on routes for delete using (auth.uid() = user_id);

create policy "Users read their own messages" on messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "Users send messages" on messages for insert
  with check (auth.uid() = sender_id);

create policy "Anyone can read ratings" on ratings for select using (true);
create policy "Users submit ratings" on ratings for insert
  with check (auth.uid() = rater_id);
