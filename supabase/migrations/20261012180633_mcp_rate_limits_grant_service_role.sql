-- The rate-limit counter runs as service_role (curatit_rate_limit_hit is granted to it alone),
-- but private.rate_limits had no grants for that role: new tables in private get none by
-- default, and the first migration's dry run ran as the owner, which hid it. The previous
-- migration (…_mcp_rate_limits_grants) was recorded as applied but its file was empty, so this
-- one carries the grant. Until it's applied the counter fails on every call: reads run
-- unlimited (fail-open) and briefs are refused (fail-closed).
grant select, insert, update, delete on private.rate_limits to service_role;
