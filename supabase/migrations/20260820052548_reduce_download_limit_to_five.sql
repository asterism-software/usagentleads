-- Five explicit authorizations are enough for normal retries while keeping
-- access time-bound. Preserve the invariant for any record that has already
-- been authorized more than five times.

alter table usagentleads.purchases
  alter column download_limit set default 5;

update usagentleads.purchases
set download_limit = greatest(5, download_count)
where download_limit > 5;
