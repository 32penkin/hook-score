create table if not exists public.video_analyzer_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  app_analysis_id text not null,
  clip_id text not null,
  score integer not null check (score >= 0 and score <= 100),
  result jsonb not null,
  clip jsonb not null,
  context jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, app_analysis_id)
);

create index if not exists video_analyzer_results_user_created_at_idx
  on public.video_analyzer_results (user_id, created_at desc);

alter table public.video_analyzer_results enable row level security;

drop policy if exists "Users can read own video analyzer results"
  on public.video_analyzer_results;

create policy "Users can read own video analyzer results"
  on public.video_analyzer_results
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on public.video_analyzer_results to authenticated;

create or replace function public.record_video_analyzer_result(
  p_result jsonb,
  p_clip jsonb,
  p_context jsonb
)
returns table (
  id uuid,
  usage_date date,
  daily_analysis_count integer,
  created_at timestamptz,
  result jsonb,
  clip jsonb,
  context jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_current_usage_date date := (timezone('utc', now()))::date;
  v_saved_id uuid;
  v_saved_usage_date date;
  v_saved_created_at timestamptz;
  v_saved_result jsonb;
  v_saved_clip jsonb;
  v_saved_context jsonb;
  v_updated_daily_count integer;
begin
  if v_current_user_id is null then
    raise exception 'record_video_analyzer_result requires an authenticated user'
      using errcode = '28000';
  end if;

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
  returning daily_usage.analysis_count into v_updated_daily_count;

  insert into public.video_analyzer_results as saved_analysis (
    user_id,
    usage_date,
    app_analysis_id,
    clip_id,
    score,
    result,
    clip,
    context
  )
  values (
    v_current_user_id,
    v_current_usage_date,
    p_result->>'id',
    coalesce(p_result->>'clipId', p_clip->>'id'),
    (p_result->>'score')::integer,
    p_result,
    p_clip,
    p_context
  )
  returning
    saved_analysis.id,
    saved_analysis.usage_date,
    saved_analysis.created_at,
    saved_analysis.result,
    saved_analysis.clip,
    saved_analysis.context
  into
    v_saved_id,
    v_saved_usage_date,
    v_saved_created_at,
    v_saved_result,
    v_saved_clip,
    v_saved_context;

  return query
  select
    v_saved_id,
    v_saved_usage_date,
    v_updated_daily_count,
    v_saved_created_at,
    v_saved_result,
    v_saved_clip,
    v_saved_context;
end;
$$;

revoke all on function public.record_video_analyzer_result(jsonb, jsonb, jsonb) from public;

grant execute on function public.record_video_analyzer_result(jsonb, jsonb, jsonb) to authenticated;
