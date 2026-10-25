#!/usr/bin/env bash
# Uji migrasi + seed + alur komisi + RLS di Postgres lokal. Butuh: psql & akses superuser lokal.
set -euo pipefail
cd "$(dirname "$0")/.."
DB=fusionify_ref_test
PSQL="sudo -n -u postgres psql -v ON_ERROR_STOP=1 -q"
DB=${1:-$DB}; KEEP=${KEEP:-0}
if [ "$KEEP" = 0 ]; then sudo -n -u postgres dropdb --if-exists $DB; sudo -n -u postgres createdb $DB; fi
for f in tests/_supabase_stub.sql migrations/0001_referral_init.sql migrations/0002_referral_rpc.sql migrations/0003_referral_cron.sql tests/_demo_users.sql seed.sql tests/flow_test.sql; do
  echo "== $f"; out=$($PSQL -d $DB -f "$f" 2>&1 >/dev/null) || { echo "$out"; exit 1; }
  echo "$out" | grep -oE 'ok: .*' || true
done
echo "== concurrency: 10 admin klik 'lunas' bersamaan pada 1 order"
$PSQL -d $DB -c "set role service_role; select referral.create_order('5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e04',1,'Paralel','6289977777777','BAGAS',null,null,null)" >/dev/null
OID=$($PSQL -d $DB -tA -c "select id from referral.orders where buyer_wa='6289977777777'")
for i in $(seq 1 10); do
  $PSQL -d $DB -c "set role authenticated; set request.jwt.claim.sub='0b5e2f8a-1c3d-4e5f-8a6b-7c8d9e0f1a01'; select referral.mark_order_paid('$OID')" >/dev/null 2>&1 &
done; wait
$PSQL -d $DB -tA -c "select 'komisi='||count(*)||' amount='||coalesce(sum(amount),0) from referral.commissions where order_id='$OID'"
[ "$KEEP" = 0 ] && sudo -n -u postgres dropdb $DB
echo OK
