create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text not null check (position('@' in email) > 1),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_deletion_requests_status_requested_at_idx
  on public.account_deletion_requests (status, requested_at);

alter table public.account_deletion_requests enable row level security;

drop policy if exists "Users can read own account deletion requests"
  on public.account_deletion_requests;

create policy "Users can read own account deletion requests"
  on public.account_deletion_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on public.account_deletion_requests to authenticated;

create or replace function public.request_account_deletion()
returns table (
  id uuid,
  email text,
  status text,
  requested_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_current_email text := nullif(auth.jwt()->>'email', '');
begin
  if v_current_user_id is null then
    raise exception 'request_account_deletion requires an authenticated user'
      using errcode = '28000';
  end if;

  if v_current_email is null then
    select users.email
    into v_current_email
    from auth.users as users
    where users.id = v_current_user_id;
  end if;

  if v_current_email is null then
    raise exception 'request_account_deletion requires an account email'
      using errcode = '23502';
  end if;

  return query
  insert into public.account_deletion_requests as deletion_request (
    user_id,
    email,
    status
  )
  values (
    v_current_user_id,
    v_current_email,
    'pending'
  )
  on conflict (user_id)
  do update set
    email = excluded.email,
    status = 'pending',
    updated_at = now()
  returning
    deletion_request.id,
    deletion_request.email,
    deletion_request.status,
    deletion_request.requested_at,
    deletion_request.updated_at;
end;
$$;

revoke all on function public.request_account_deletion() from public;

grant execute on function public.request_account_deletion() to authenticated;
