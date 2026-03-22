-- Create searches table
create table if not exists searches (
  id uuid default gen_random_uuid() primary key,
  query text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on query column for faster searches
create index if not exists searches_query_idx on searches (query);

-- Create index on created_at for ordering
create index if not exists searches_created_at_idx on searches (created_at);

-- Enable RLS (Row Level Security)
alter table searches enable row level security;

-- Create policy to allow all users to insert and select their own searches
create policy "Users can insert their own searches" on searches 
  for insert with check (true);

create policy "Users can view their own searches" on searches 
  for select using (true);
