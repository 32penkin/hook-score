create table if not exists public.ai_result_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  reporter_email text,
  result_id text not null check (length(btrim(result_id)) > 0),
  report_reason text not null default 'offensive_or_incorrect_ai_content',
  result jsonb not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists ai_result_reports_status_created_at_idx
  on public.ai_result_reports (status, created_at desc);

create index if not exists ai_result_reports_result_id_idx
  on public.ai_result_reports (result_id);

alter table public.ai_result_reports enable row level security;

create or replace function public.report_ai_result(
  p_result_id text,
  p_result jsonb,
  p_report_reason text default 'offensive_or_incorrect_ai_content'
)
returns table (
  id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_current_email text := nullif(auth.jwt()->>'email', '');
  v_report_reason text := coalesce(nullif(btrim(p_report_reason), ''), 'offensive_or_incorrect_ai_content');
begin
  if p_result_id is null or length(btrim(p_result_id)) = 0 then
    raise exception 'report_ai_result requires a result id'
      using errcode = '23502';
  end if;

  if p_result is null then
    raise exception 'report_ai_result requires a result payload'
      using errcode = '23502';
  end if;

  return query
  insert into public.ai_result_reports (
    user_id,
    reporter_email,
    result_id,
    report_reason,
    result
  )
  values (
    v_current_user_id,
    v_current_email,
    btrim(p_result_id),
    v_report_reason,
    p_result
  )
  returning
    ai_result_reports.id,
    ai_result_reports.created_at;
end;
$$;

revoke all on function public.report_ai_result(text, jsonb, text) from public;

grant execute on function public.report_ai_result(text, jsonb, text) to anon;
grant execute on function public.report_ai_result(text, jsonb, text) to authenticated;
