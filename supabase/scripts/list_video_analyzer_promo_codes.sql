select
  count(*) as total_codes,
  count(*) filter (
    where code ~ '^[A-Z0-9]{16}$' and is_used = false
  ) as valid_codes,
  count(*) filter (
    where is_used = true
  ) as used_codes,
  count(*) filter (
    where code !~ '^[A-Z0-9]{16}$'
  ) as invalid_format_codes
from public.video_analyzer_promo_codes;

select
  code,
  substr(code, 1, 4)
    || '-'
    || substr(code, 5, 4)
    || '-'
    || substr(code, 9, 4)
    || '-'
    || substr(code, 13, 4) as formatted_code,
  code ~ '^[A-Z0-9]{16}$' as has_valid_format,
  is_used = false and code ~ '^[A-Z0-9]{16}$' as is_valid,
  case
    when code !~ '^[A-Z0-9]{16}$' then 'invalid_format'
    when is_used then 'used'
    else 'valid'
  end as status,
  is_used,
  created_at,
  used_at,
  used_by_user_id
from public.video_analyzer_promo_codes
order by
  is_used asc,
  created_at desc,
  code asc;
