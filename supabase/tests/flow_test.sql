-- Tes alur & RLS. Gagal = exception (ON_ERROR_STOP).
\set ON_ERROR_STOP 1
create or replace function pg_temp.assert(c boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(c, false) then raise exception 'ASSERT GAGAL: %', msg; end if; raise notice 'ok: %', msg; end $$;

select pg_temp.assert(not exists (select 1 from referral.profiles where email = 'penjual.umkm@example.com'), 'user non-referral tidak dapat profil referral');
select pg_temp.assert((select count(*) from referral.profiles) = 3, '3 profil demo (2 via trigger app=referral, 1 via seed)');
-- 1) create_order via service_role: cookie link
set role service_role;
select pg_temp.assert((referral.create_order('5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e02', 1, 'Tes Link', '6289911111111', null, 'BAGAS', 'wa-grup', 'iphash1')->>'attribution') = 'link', 'cookie link -> attribution link');
-- 2) promo code menang atas cookie + diskon 10%
select pg_temp.assert((select (j->>'attribution') = 'code' and (j->>'code') = 'RINA10' and (j->>'discount')::int = 2500 and (j->>'total')::int = 22500
  from (select referral.create_order('5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e01', 1, 'Tes Kode', '6289922222222', 'rina10', 'BAGAS', null, 'iphash2') j) s), 'promo menang atas cookie + diskon');
select referral.create_order('5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e01', 1, 'Rina', '6281200000001', 'RINA10', null, null, 'iphash3');
select pg_temp.assert((select risk_flags @> '{self_referral}' from referral.orders where buyer_wa = '6281200000001'), 'self referral di-flag');
-- 4) kode promo salah ditolak
do $$ begin perform referral.create_order('5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e01', 1, 'X', '6289933333333', 'NGAWUR', null, null, null);
  raise exception 'harusnya gagal'; exception when others then if sqlerrm = 'harusnya gagal' then raise; end if; raise notice 'ok: kode salah ditolak'; end $$;
-- 5) cookie kode tidak valid diabaikan diam-diam
select pg_temp.assert((referral.create_order('5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e01', 1, 'Y', '6289944444444', null, 'NGAWUR', null, null)->>'attribution') = 'none', 'cookie invalid -> none');
reset role;

-- 6) anon tidak bisa panggil RPC admin / service
set role anon;
do $$ begin perform referral.mark_order_paid('b4c5d6e7-f809-4a1b-8c2d-3e4f5a6b7c01'); raise exception 'harusnya gagal';
  exception when insufficient_privilege then raise notice 'ok: anon ditolak mark_order_paid'; end $$;
do $$ begin perform referral.create_order('5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e01', 1, 'Z', '6289955555555', null, null, null, null); raise exception 'harusnya gagal';
  exception when insufficient_privilege then raise notice 'ok: anon ditolak create_order'; end $$;
select pg_temp.assert((select count(*) from referral.products) = 4, 'anon lihat produk aktif');
reset role;

-- 7) reseller tidak bisa mark paid & tidak lihat orders/komisi orang lain
set role authenticated;
set request.jwt.claim.sub = '0b5e2f8a-1c3d-4e5f-8a6b-7c8d9e0f1a02';
do $$ begin perform referral.mark_order_paid('b4c5d6e7-f809-4a1b-8c2d-3e4f5a6b7c01'); raise exception 'harusnya gagal';
  exception when insufficient_privilege then raise notice 'ok: reseller ditolak mark_order_paid'; end $$;
select pg_temp.assert((select count(*) from referral.orders) = 0, 'reseller tidak bisa baca orders');
select pg_temp.assert((select count(*) from referral.profiles) = 1, 'reseller hanya lihat profil sendiri');
do $$ begin update referral.profiles set role = 'admin' where id = auth.uid(); raise exception 'harusnya gagal';
  exception when insufficient_privilege then raise notice 'ok: reseller tidak bisa ubah role'; end $$;
update referral.profiles set full_name = '[DEMO] Rina P.' where id = auth.uid();

-- 8) admin: mark paid → komisi 10% dari total setelah diskon
set request.jwt.claim.sub = '0b5e2f8a-1c3d-4e5f-8a6b-7c8d9e0f1a01';
select pg_temp.assert((referral.mark_order_paid('b4c5d6e7-f809-4a1b-8c2d-3e4f5a6b7c01')->>'commission')::int = 4500, 'komisi 10% x 45000 = 4500');
do $$ begin perform referral.mark_order_paid('b4c5d6e7-f809-4a1b-8c2d-3e4f5a6b7c01'); raise exception 'harusnya gagal';
  exception when others then if sqlerrm = 'harusnya gagal' then raise; end if; raise notice 'ok: mark paid dua kali ditolak'; end $$;
select pg_temp.assert((referral.mark_order_paid('b4c5d6e7-f809-4a1b-8c2d-3e4f5a6b7c03')->>'commission')::int = 0, 'order tanpa reseller -> tanpa komisi');
select pg_temp.assert((select count(*) from referral.commissions where order_ref = 'FD-DEMO03') = 0, 'tidak ada baris komisi tanpa reseller');
-- order self-referral: komisi ikut flag, tidak auto-approve
select referral.mark_order_paid(id) from referral.orders where risk_flags @> '{self_referral}';
-- 9) hold 7 hari: belum approve
select pg_temp.assert(referral.approve_matured_commissions() = 0, 'masih hold -> 0 approve');
reset role;
update referral.commissions set hold_until = now() - interval '1 minute';
set role authenticated;
set request.jwt.claim.sub = '0b5e2f8a-1c3d-4e5f-8a6b-7c8d9e0f1a01';
select pg_temp.assert(referral.approve_matured_commissions() = 1, 'setelah hold -> 1 approve (yang flag tidak)');
select pg_temp.assert((select status from referral.commissions where cardinality(risk_flags) > 0) = 'pending', 'komisi flag tetap pending');
-- 10) payout + slip
select referral.create_payout('0b5e2f8a-1c3d-4e5f-8a6b-7c8d9e0f1a02');
select pg_temp.assert((select total from referral.payouts) = 4500, 'payout total 4500');
do $$ begin perform referral.mark_payout_paid((select id from referral.payouts), 'http://x'); raise exception 'harusnya gagal';
  exception when others then if sqlerrm = 'harusnya gagal' then raise; end if; raise notice 'ok: bukti non-https ditolak'; end $$;
select referral.mark_payout_paid((select id from referral.payouts), 'https://example.com/bukti.jpg');
select pg_temp.assert((select status from referral.commissions where order_ref = 'FD-DEMO01') = 'paid', 'komisi jadi paid');
-- refund setelah payout ditolak
do $$ begin perform referral.set_order_status('b4c5d6e7-f809-4a1b-8c2d-3e4f5a6b7c01', 'refunded'); raise exception 'harusnya gagal';
  exception when others then if sqlerrm = 'harusnya gagal' then raise; end if; raise notice 'ok: refund setelah payout ditolak'; end $$;
-- refund sebelum payout → komisi void
select referral.mark_order_paid('b4c5d6e7-f809-4a1b-8c2d-3e4f5a6b7c02');
select referral.set_order_status('b4c5d6e7-f809-4a1b-8c2d-3e4f5a6b7c02', 'refunded');
select pg_temp.assert((select status from referral.commissions where order_ref = 'FD-DEMO02') = 'void', 'refund -> komisi void');
reset role;
select slip_token as tok from referral.payouts \gset
set role anon;
select pg_temp.assert((referral.get_slip(:'tok')->>'total')::int = 4500 and jsonb_array_length(referral.get_slip(:'tok')->'items') = 1, 'slip publik terbaca (anon)');
select pg_temp.assert(referral.get_slip('abc') is null, 'token ngawur -> null');
reset role;
set role authenticated;
set request.jwt.claim.sub = '0b5e2f8a-1c3d-4e5f-8a6b-7c8d9e0f1a03';
select pg_temp.assert((select count(*) from referral.commissions where reseller_id <> auth.uid()) = 0, 'reseller2 tidak lihat komisi reseller1');
select pg_temp.assert((select count(*) from referral.leaderboard(now() - interval '30 days')) >= 1, 'leaderboard jalan');
reset role;
