-- Create a table for follows
create table if not exists follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  
  -- Prevent self-follows and duplicate follows
  constraint proper_follow check (follower_id != following_id),
  unique(follower_id, following_id)
);

-- Enable RLS
alter table follows enable row level security;

-- Policies
create policy "Anyone can read follows" on follows
  for select using (true);

create policy "Authenticated users can follow" on follows
  for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow" on follows
  for delete using (auth.uid() = follower_id);
