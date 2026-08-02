-- Reserve a monthly quota slot and create its usage row in one transaction.
-- Status 102 represents an in-flight request and counts toward the quota until
-- the route finalizes the row. Stale reservations become failures and stop
-- consuming quota.
create or replace function usagentleads.reserve_api_usage(
  p_api_key_id uuid,
  p_user_id uuid,
  p_endpoint text,
  p_ip_address text default null,
  p_user_agent text default null,
  p_monthly_limit integer default 10000
)
returns table(allowed boolean, log_id uuid, used integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month_start timestamptz := date_trunc('month', now() at time zone 'utc') at time zone 'utc';
  v_used integer;
  v_log_id uuid;
begin
  if p_monthly_limit < 1 then
    raise exception 'monthly limit must be positive';
  end if;

  -- Serialize reservations for one user and UTC billing month.
  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || v_month_start::text, 0)
  );

  update usagentleads.api_usage_logs
  set status_code = 599
  where user_id = p_user_id
    and status_code = 102
    and created_at < now() - interval '15 minutes';

  select count(*)::integer
  into v_used
  from usagentleads.api_usage_logs
  where user_id = p_user_id
    and created_at >= v_month_start
    and status_code < 400;

  if v_used >= p_monthly_limit then
    return query select false, null::uuid, v_used;
    return;
  end if;

  insert into usagentleads.api_usage_logs (
    api_key_id,
    user_id,
    endpoint,
    status_code,
    ip_address,
    user_agent
  ) values (
    p_api_key_id,
    p_user_id,
    left(p_endpoint, 255),
    102,
    left(p_ip_address, 255),
    left(p_user_agent, 1000)
  )
  returning id into v_log_id;

  return query select true, v_log_id, v_used + 1;
end;
$$;

revoke all on function usagentleads.reserve_api_usage(
  uuid, uuid, text, text, text, integer
) from public, anon, authenticated;
grant execute on function usagentleads.reserve_api_usage(
  uuid, uuid, text, text, text, integer
) to service_role;
