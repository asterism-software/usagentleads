create table if not exists usagentleads.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_state text,
  default_page_size smallint not null default 25,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_default_state_check
    check (
      default_state is null or default_state in (
        'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
        'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
        'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
        'VA','WA','WV','WI','WY','DC'
      )
    ),
  constraint user_preferences_default_page_size_check
    check (default_page_size in (25, 50, 100))
);

alter table usagentleads.user_preferences enable row level security;

drop policy if exists "Users can view own dashboard preferences"
  on usagentleads.user_preferences;
create policy "Users can view own dashboard preferences"
  on usagentleads.user_preferences
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own dashboard preferences"
  on usagentleads.user_preferences;
create policy "Users can create own dashboard preferences"
  on usagentleads.user_preferences
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own dashboard preferences"
  on usagentleads.user_preferences;
create policy "Users can update own dashboard preferences"
  on usagentleads.user_preferences
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant usage on schema usagentleads to authenticated, service_role;
grant select, insert, update on usagentleads.user_preferences to authenticated;
grant all on usagentleads.user_preferences to service_role;
revoke all on usagentleads.user_preferences from anon;
