create table if not exists public.video_analyzer_guest_usage (
  device_id uuid primary key,
  analysis_count integer not null default 0 check (analysis_count >= 0),
  first_seen_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table public.video_analyzer_guest_usage enable row level security;

revoke all on table public.video_analyzer_guest_usage from anon;
revoke all on table public.video_analyzer_guest_usage from authenticated;

create or replace function public.get_guest_video_analyzer_usage(
  p_device_id uuid
)
returns table (
  usage_date date,
  analysis_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_usage_date date := (timezone('utc', now()))::date;
begin
  if p_device_id is null then
    raise exception 'get_guest_video_analyzer_usage requires a device id'
      using errcode = '22023';
  end if;

  return query
  select
    v_current_usage_date,
    coalesce(
      (
        select guest_usage.analysis_count
        from public.video_analyzer_guest_usage as guest_usage
        where guest_usage.device_id = p_device_id
      ),
      0
    )::integer;
end;
$$;

create or replace function public.record_guest_video_analyzer_use(
  p_device_id uuid
)
returns table (
  usage_date date,
  analysis_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_usage_date date := (timezone('utc', now()))::date;
  v_guest_analysis_limit constant integer := 1;
  v_recorded_analysis_count integer;
begin
  if p_device_id is null then
    raise exception 'record_guest_video_analyzer_use requires a device id'
      using errcode = '22023';
  end if;

  insert into public.video_analyzer_guest_usage as guest_usage (
    device_id,
    analysis_count,
    last_used_at
  )
  values (
    p_device_id,
    1,
    now()
  )
  on conflict on constraint video_analyzer_guest_usage_pkey
  do update set
    analysis_count = guest_usage.analysis_count + 1,
    last_used_at = now()
  where guest_usage.analysis_count < v_guest_analysis_limit
  returning guest_usage.analysis_count into v_recorded_analysis_count;

  if not found then
    raise exception 'Free hook check already used. Log in or register to keep analyzing.'
      using errcode = 'P0001';
  end if;

  return query
  select
    v_current_usage_date,
    v_recorded_analysis_count;
end;
$$;

revoke all on function public.get_guest_video_analyzer_usage(uuid) from public;
revoke all on function public.record_guest_video_analyzer_use(uuid) from public;

grant execute on function public.get_guest_video_analyzer_usage(uuid) to anon;
grant execute on function public.record_guest_video_analyzer_use(uuid) to anon;
