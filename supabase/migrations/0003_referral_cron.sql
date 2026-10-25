-- OPSIONAL: jadwalkan auto-approve tiap jam dengan pg_cron (gratis di Supabase; aktifkan extension "pg_cron" dulu).
-- Jalankan manual di SQL Editor jika pg_cron sudah aktif:
-- select cron.schedule('approve-commissions', '0 * * * *', $$select referral.approve_matured_commissions()$$);
select 1;
