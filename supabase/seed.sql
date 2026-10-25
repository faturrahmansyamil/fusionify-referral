set search_path = referral, extensions, public;
-- Data [DEMO]. UUID valid RFC 9562 (versi 4, varian 8/9/a/b) supaya lolos z.uuid().
-- Bagian 1 (produk & kampanye) selalu jalan. Bagian 2 jalan hanya jika user demo.* sudah ada di auth.users.
insert into referral.products (id, name, description, price, commission_type, commission_value, sort) values
 ('5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e01', '[DEMO] Premium Streaming 1 Bulan', 'Akun sharing, garansi 30 hari.', 25000, 'percent', 10, 1),
 ('5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e02', '[DEMO] Fusionify Bot — Paket Starter', 'Bot auto-reply WA/Telegram, 1 bulan.', 150000, 'percent', 15, 2),
 ('5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e03', '[DEMO] Top Up Saldo FTV Pay 100rb', 'Komisi flat per transaksi.', 101500, 'flat', 1000, 3),
 ('5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e04', '[DEMO] Jasa Landing Page UMKM', 'Desain + deploy 1 halaman.', 750000, 'percent', 8, 4)
on conflict (id) do nothing;

insert into referral.campaigns (id, name, slug, utm_source, utm_medium, utm_campaign) values
 ('7e2a1b3c-4d5e-4f60-a172-8394a5b6c701', '[DEMO] Story IG Oktober', 'ig-oktober', 'instagram', 'story', 'oktober'),
 ('7e2a1b3c-4d5e-4f60-a172-8394a5b6c702', '[DEMO] Grup WA Reseller', 'wa-grup', 'whatsapp', 'group', 'reseller')
on conflict (id) do nothing;

do $$
declare r1 uuid; r2 uuid; adm uuid;
begin
  -- User demo yang dibuat lewat Dashboard tidak punya metadata app='referral', jadi profilnya dibuat di sini.
  insert into referral.profiles (id, email, full_name)
  select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', '[DEMO] ' || split_part(u.email, '@', 1))
  from auth.users u where u.email in ('demo.admin@example.com', 'demo.reseller1@example.com', 'demo.reseller2@example.com')
  on conflict (id) do nothing;
  select id into adm from referral.profiles where email = 'demo.admin@example.com';
  select id into r1 from referral.profiles where email = 'demo.reseller1@example.com';
  select id into r2 from referral.profiles where email = 'demo.reseller2@example.com';
  if r1 is null or r2 is null then raise notice 'user demo belum ada, lewati data reseller'; return; end if;
  if adm is not null then update referral.profiles set role = 'admin', status = 'active' where id = adm; end if;
  update referral.profiles set status = 'active', whatsapp = '6281200000001', payout_method = 'DANA', payout_account = '[DEMO] 0812xxxx0001' where id = r1;
  update referral.profiles set status = 'active', whatsapp = '6281200000002', payout_method = 'BCA', payout_account = '[DEMO] xxxx0002' where id = r2;
  insert into referral.referral_codes (id, reseller_id, code, discount_percent) values
   ('9c3b2a1d-5e6f-4a7b-b8c9-d0e1f2a3b401', r1, 'RINA10', 10),
   ('9c3b2a1d-5e6f-4a7b-b8c9-d0e1f2a3b402', r2, 'BAGAS', 5)
  on conflict (id) do nothing;
  insert into referral.orders (id, order_ref, product_id, qty, unit_price, discount, total, buyer_name, buyer_wa, code_id, reseller_id, attribution, created_at) values
   ('b4c5d6e7-f809-4a1b-8c2d-3e4f5a6b7c01', 'FD-DEMO01', '5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e01', 2, 25000, 5000, 45000, '[DEMO] Pembeli A', '6289900000001', '9c3b2a1d-5e6f-4a7b-b8c9-d0e1f2a3b401', r1, 'code', now() - interval '2 days'),
   ('b4c5d6e7-f809-4a1b-8c2d-3e4f5a6b7c02', 'FD-DEMO02', '5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e02', 1, 150000, 0, 150000, '[DEMO] Pembeli B', '6289900000002', '9c3b2a1d-5e6f-4a7b-b8c9-d0e1f2a3b402', r2, 'link', now() - interval '1 day'),
   ('b4c5d6e7-f809-4a1b-8c2d-3e4f5a6b7c03', 'FD-DEMO03', '5d1f0c2e-7a3b-4c4d-9e5f-6a7b8c9d0e03', 1, 101500, 0, 101500, '[DEMO] Pembeli C', '6289900000003', null, null, 'none', now())
  on conflict (id) do nothing;
end $$;
