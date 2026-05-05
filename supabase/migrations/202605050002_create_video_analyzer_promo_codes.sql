create table if not exists public.video_analyzer_promo_codes (
  code text primary key,
  is_used boolean not null default false,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by_user_id uuid references auth.users(id) on delete restrict,
  constraint video_analyzer_promo_codes_code_format
    check (code = upper(code) and code ~ '^[A-Z0-9]{16}$'),
  constraint video_analyzer_promo_codes_used_state
    check (
      (
        is_used = false
        and used_at is null
        and used_by_user_id is null
      )
      or (
        is_used = true
        and used_at is not null
        and used_by_user_id is not null
      )
    )
);

alter table public.video_analyzer_promo_codes enable row level security;

revoke all on table public.video_analyzer_promo_codes from anon;
revoke all on table public.video_analyzer_promo_codes from authenticated;

create or replace function public.redeem_video_analyzer_promo_code(
  p_code text
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
  v_current_user_id uuid := auth.uid();
  v_current_usage_date date := (timezone('utc', now()))::date;
  v_daily_analysis_limit constant integer := 2;
  v_normalized_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_current_analysis_count integer;
  v_redeemed_code text;
begin
  if v_current_user_id is null then
    raise exception 'redeem_video_analyzer_promo_code requires an authenticated user'
      using errcode = '28000';
  end if;

  if v_normalized_code !~ '^[A-Z0-9]{16}$' then
    raise exception 'Promo code must contain 16 letters or numbers.'
      using errcode = '22023';
  end if;

  select daily_usage.analysis_count
  into v_current_analysis_count
  from public.video_analyzer_daily_usage as daily_usage
  where daily_usage.user_id = v_current_user_id
    and daily_usage.usage_date = v_current_usage_date
  for update;

  if coalesce(v_current_analysis_count, 0) < v_daily_analysis_limit then
    raise exception 'Daily video analysis limit has not been reached yet.'
      using errcode = 'P0001';
  end if;

  update public.video_analyzer_promo_codes as promo_code
  set
    is_used = true,
    used_at = now(),
    used_by_user_id = v_current_user_id
  where promo_code.code = v_normalized_code
    and promo_code.is_used = false
  returning promo_code.code into v_redeemed_code;

  if not found then
    raise exception 'Promo code is invalid or already used.'
      using errcode = 'P0001';
  end if;

  update public.video_analyzer_daily_usage as daily_usage
  set
    analysis_count = 0,
    updated_at = now()
  where daily_usage.user_id = v_current_user_id
    and daily_usage.usage_date = v_current_usage_date;

  return query
  select
    v_current_usage_date,
    0;
end;
$$;

revoke all on function public.redeem_video_analyzer_promo_code(text) from public;

grant execute on function public.redeem_video_analyzer_promo_code(text) to authenticated;
