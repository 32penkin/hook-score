alter table public.video_analyzer_promo_codes
  drop constraint if exists video_analyzer_promo_codes_used_by_user_id_fkey;

alter table public.video_analyzer_promo_codes
  add constraint video_analyzer_promo_codes_used_by_user_id_fkey
  foreign key (used_by_user_id)
  references auth.users(id)
  on delete set null;

alter table public.video_analyzer_promo_codes
  drop constraint if exists video_analyzer_promo_codes_used_state;

alter table public.video_analyzer_promo_codes
  add constraint video_analyzer_promo_codes_used_state
  check (
    (
      is_used = false
      and used_at is null
      and used_by_user_id is null
    )
    or (
      is_used = true
      and used_at is not null
    )
  );
