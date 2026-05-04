-- Reset today's video analyzer usage count for this account.
-- Missing rows are read as analysis_count = 0 by get_current_video_analyzer_usage().
delete from public.video_analyzer_daily_usage as daily_usage
using auth.users as app_user
where daily_usage.user_id = app_user.id
  and lower(app_user.email) = lower('penkin.evgeniy@gmail.com')
  and daily_usage.usage_date = (timezone('utc', now()))::date;
