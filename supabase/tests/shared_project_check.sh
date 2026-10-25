#!/usr/bin/env bash
# Bukti tidak bentrok: 1 database berisi umkm-auto-order (public) + fusionify-referral (referral).
# Pakai: bash supabase/tests/shared_project_check.sh [/path/ke/umkm-order]
set -euo pipefail
cd "$(dirname "$0")/.."
UMKM=${1:-/workspace/umkm-order}/supabase
DB=shared_check
PSQL="sudo -n -u postgres psql -v ON_ERROR_STOP=1 -q -d $DB"
TMP=$(mktemp -d); chmod 755 "$TMP"
sudo -n -u postgres dropdb --if-exists $DB; sudo -n -u postgres createdb $DB

echo "== umkm: stub + 0001 + 0002 + seed"
for f in "$UMKM/tests/_supabase_stub.sql" "$UMKM/migrations/0001_init.sql" "$UMKM/migrations/0002_stock_quota_zones.sql" "$UMKM/seed.sql"; do
  $PSQL -f "$f" >/dev/null
done
sudo -n -u postgres pg_dump -d $DB --schema=public --schema-only | grep -v "^\\\\\(un\\)\?restrict " > "$TMP/public_before.sql"
sudo -n -u postgres pg_dump -d $DB --schema=public --data-only | grep -v "^\\\\\(un\\)\?restrict " > "$TMP/data_before.sql"
$PSQL -tA -c "select tgname from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal" > "$TMP/trg_before.txt"

echo "== referral: stub (idempotent) + 0001..0003 (tanpa seed dulu, untuk banding skema)"
for f in tests/_supabase_stub.sql migrations/0001_referral_init.sql migrations/0002_referral_rpc.sql migrations/0003_referral_cron.sql; do
  $PSQL -f "$f" >/dev/null
done
sudo -n -u postgres pg_dump -d $DB --schema=public --schema-only | grep -v "^\\\\\(un\\)\?restrict " > "$TMP/public_after.sql"
sudo -n -u postgres pg_dump -d $DB --schema=public --data-only | grep -v "^\\\\\(un\\)\?restrict " > "$TMP/data_after.sql"
if diff -q "$TMP/public_before.sql" "$TMP/public_after.sql" >/dev/null && diff -q "$TMP/data_before.sql" "$TMP/data_after.sql" >/dev/null; then
  echo "pg_dump --schema=public (skema+data) SEBELUM vs SESUDAH migrasi referral: IDENTIK ($(wc -l < "$TMP/public_before.sql") baris skema)"
else echo "BEDA!"; diff "$TMP/public_before.sql" "$TMP/public_after.sql" | head -40; exit 1; fi
echo "trigger auth.users sebelum: [$(paste -sd, "$TMP/trg_before.txt")] sesudah: [$($PSQL -tA -c "select string_agg(tgname, ',') from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal")]"
echo "objek di schema referral: $($PSQL -tA -c "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='referral' and c.relkind='r'") tabel, $($PSQL -tA -c "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='referral'") fungsi, RLS off: $($PSQL -tA -c "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='referral' and c.relkind='r' and not c.relrowsecurity")"
echo "umkm public.create_order masih ada: $($PSQL -tA -c "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname='create_order'")"

echo "== referral: demo users + seed + flow test"
for f in tests/_demo_users.sql seed.sql tests/flow_test.sql; do
  out=$($PSQL -f "$f" 2>&1 >/dev/null) || { echo "$out"; exit 1; }
  n=$(echo "$out" | grep -cE 'ok: ' || true); echo $n | xargs -I{} echo "  $f: {} cek ok"
done
echo "seller umkm tidak punya profil referral: $($PSQL -tA -c "select count(*) = 0 from referral.profiles p join public.sellers s on s.auth_user_id = p.id")"

echo "== umkm: stock_quota_test.sql di DB yang sama (id disesuaikan ke seed umkm saat ini, salinan sementara)"
sed -e 's/11111111-1111-1111-1111-111111111111/5e11e700-0000-4000-8000-000000000001/g' \
    -e 's/22222222-0000-0000-0000-00000000000\([0-9]\)/a0d0c700-0000-4000-8000-00000000000\1/g' \
    "$UMKM/tests/stock_quota_test.sql" > "$TMP/umkm_test.sql"; chmod 644 "$TMP/umkm_test.sql"
$PSQL -f "$TMP/umkm_test.sql" >/dev/null && echo "  umkm stock_quota_test: LULUS"
echo "== umkm: konkurensi stok (20 order paralel, stok 10)"
$PSQL -c "update public.products set stock=10, daily_quota=null where name='[DEMO] Tumpeng Mini'"
for i in $(seq 1 20); do
  $PSQL -c "select public.create_order('5e11e700-0000-4000-8000-000000000001','web','cod','Paralel $i',null,null,null,'[{\"product_id\":\"a0d0c700-0000-4000-8000-000000000006\",\"qty\":1}]',current_date+5,null)" >/dev/null 2>&1 &
done; wait
$PSQL -tA -c "select '  stok='||stock||' order_berhasil='||(select count(*) from public.customers where name like 'Paralel%') from public.products where name='[DEMO] Tumpeng Mini'"
sudo -n -u postgres dropdb $DB; rm -rf "$TMP"
echo OK
