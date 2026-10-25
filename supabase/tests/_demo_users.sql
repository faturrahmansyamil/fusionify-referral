-- Akun demo HANYA untuk tes lokal. Di Supabase asli, buat user lewat Dashboard > Authentication dengan email yang sama.
insert into auth.users (id, email, raw_user_meta_data) values
 ('0b5e2f8a-1c3d-4e5f-8a6b-7c8d9e0f1a01', 'demo.admin@example.com',    '{"full_name":"[DEMO] Admin Fusionify","app":"referral"}'),
 ('0b5e2f8a-1c3d-4e5f-8a6b-7c8d9e0f1a02', 'demo.reseller1@example.com','{"full_name":"[DEMO] Rina Pratama","app":"referral"}'),
 ('0b5e2f8a-1c3d-4e5f-8a6b-7c8d9e0f1a03', 'demo.reseller2@example.com','{"full_name":"[DEMO] Bagas Saputra"}');
-- reseller2 sengaja TANPA app=referral (seperti user yang dibuat lewat Dashboard): profil dibuat oleh seed.sql.
-- User umkm (tanpa metadata app) tidak boleh dapat profil referral:
insert into auth.users (id, email, raw_user_meta_data) values ('0b5e2f8a-1c3d-4e5f-8a6b-7c8d9e0f1a09', 'penjual.umkm@example.com', '{}');
