create table if not exists public.video_analyzer_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  analysis_count integer not null default 0 check (analysis_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create index if not exists video_analyzer_daily_usage_usage_date_idx
  on public.video_analyzer_daily_usage (usage_date);

alter table public.video_analyzer_daily_usage enable row level security;

drop policy if exists "Users can read own video analyzer daily usage"
  on public.video_analyzer_daily_usage;

create policy "Users can read own video analyzer daily usage"
  on public.video_analyzer_daily_usage
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on public.video_analyzer_daily_usage to authenticated;

create or replace function public.get_current_video_analyzer_usage()
returns table (
  usage_date date,
  analysis_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_current_usage_date date := (timezone('utc', now()))::date;
begin
  if v_current_user_id is null then
    raise exception 'get_current_video_analyzer_usage requires an authenticated user'
      using errcode = '28000';
  end if;

  return query
  select
    v_current_usage_date,
    coalesce(
      (
        select daily_usage.analysis_count
        from public.video_analyzer_daily_usage as daily_usage
        where daily_usage.user_id = v_current_user_id
          and daily_usage.usage_date = v_current_usage_date
      ),
      0
    )::integer;
end;
$$;

create or replace function public.record_video_analyzer_use()
returns table (
  usage_date date,
  analysis_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_current_usage_date date := (timezone('utc', now()))::date;
begin
  if v_current_user_id is null then
    raise exception 'record_video_analyzer_use requires an authenticated user'
      using errcode = '28000';
  end if;

  return query
  insert into public.video_analyzer_daily_usage as daily_usage (
    user_id,
    usage_date,
    analysis_count
  )
  values (
    v_current_user_id,
    v_current_usage_date,
    1
  )
  on conflict on constraint video_analyzer_daily_usage_pkey
  do update set
    analysis_count = daily_usage.analysis_count + 1,
    updated_at = now()
  returning
    daily_usage.usage_date,
    daily_usage.analysis_count;
end;
$$;

revoke all on function public.get_current_video_analyzer_usage() from public;
revoke all on function public.record_video_analyzer_use() from public;

grant execute on function public.get_current_video_analyzer_usage() to authenticated;
grant execute on function public.record_video_analyzer_use() to authenticated;
