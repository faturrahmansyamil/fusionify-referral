set search_path = referral, extensions, public;
-- RPC security definer: semua perubahan data transaksi lewat sini (atomic + dicek perannya).

create or replace function referral.require_admin() returns void
language plpgsql stable security definer set search_path = referral, extensions, public as $$
begin
  if not referral.is_admin() then raise exception 'hanya admin' using errcode = '42501'; end if;
end $$;

create or replace function referral.new_order_ref() returns text
language plpgsql volatile set search_path = referral, extensions, public as $$
declare alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; b bytea; r text; i int;
begin
  loop
    b := gen_random_bytes(6); r := 'FD-';
    for i in 0..5 loop r := r || substr(alphabet, (get_byte(b, i) % 31) + 1, 1); end loop;
    exit when not exists (select 1 from referral.orders where order_ref = r);
  end loop;
  return r;
end $$;

-- Catat klik link referral. Dipanggil server (service role). Return true jika kode valid.
create or replace function referral.log_click(p_code text, p_campaign_slug text, p_visitor_hash text, p_ip_hash text)
returns boolean language plpgsql security definer set search_path = referral, extensions, public as $$
declare v_code referral.referral_codes; v_campaign uuid;
begin
  select c.* into v_code from referral.referral_codes c join referral.profiles p on p.id = c.reseller_id
   where c.code = upper(p_code) and c.active and (c.expires_at is null or c.expires_at > now()) and p.status = 'active';
  if not found then return false; end if;
  select id into v_campaign from referral.campaigns where slug = p_campaign_slug
    and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now());
  -- dedupe: visitor yang sama dalam 30 menit tidak dihitung ulang
  if not exists (select 1 from referral.clicks where code_id = v_code.id and visitor_hash = p_visitor_hash
                 and created_at > now() - interval '30 minutes') then
    insert into referral.clicks (code_id, campaign_id, visitor_hash, ip_hash) values (v_code.id, v_campaign, p_visitor_hash, p_ip_hash);
  end if;
  return true;
end $$;

-- Buat pesanan pending + tentukan atribusi. Kode diketik (promo) MENANG atas cookie link (last-click).
create or replace function referral.create_order(
  p_product_id uuid, p_qty int, p_buyer_name text, p_buyer_wa text,
  p_promo_code text, p_cookie_code text, p_campaign_slug text, p_ip_hash text)
returns jsonb language plpgsql security definer set search_path = referral, extensions, public as $$
declare
  v_product referral.products; v_code referral.referral_codes; v_reseller referral.profiles;
  v_attr text := 'none'; v_discount int := 0; v_flags text[] := '{}'; v_campaign uuid;
  v_ref text; v_subtotal int;
begin
  if p_qty is null or p_qty < 1 or p_qty > 50 then raise exception 'jumlah tidak valid'; end if;
  if p_ip_hash is not null and (select count(*) from referral.orders where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'terlalu banyak pesanan, coba lagi nanti';
  end if;
  select * into v_product from referral.products where id = p_product_id and active;
  if not found then raise exception 'produk tidak ditemukan'; end if;
  v_subtotal := v_product.price * p_qty;

  if nullif(trim(p_promo_code), '') is not null then
    select c.* into v_code from referral.referral_codes c join referral.profiles p on p.id = c.reseller_id
     where c.code = upper(trim(p_promo_code)) and c.active and (c.expires_at is null or c.expires_at > now()) and p.status = 'active';
    if not found then raise exception 'kode promo tidak valid'; end if;
    v_attr := 'code';
    v_discount := floor(v_subtotal * v_code.discount_percent / 100.0);
  elsif nullif(p_cookie_code, '') is not null then
    select c.* into v_code from referral.referral_codes c join referral.profiles p on p.id = c.reseller_id
     where c.code = upper(p_cookie_code) and c.active and (c.expires_at is null or c.expires_at > now()) and p.status = 'active';
    if found then v_attr := 'link'; end if;
  end if;

  if v_attr <> 'none' then
    select * into v_reseller from referral.profiles where id = v_code.reseller_id;
    if v_reseller.whatsapp = p_buyer_wa then v_flags := array_append(v_flags, 'self_referral'); end if;
    if (select count(*) from referral.orders where code_id = v_code.id and created_at > now() - interval '1 hour') >= 10 then
      v_flags := array_append(v_flags, 'velocity');
    end if;
    if exists (select 1 from referral.orders where buyer_wa = p_buyer_wa and code_id is not null and code_id <> v_code.id) then
      v_flags := array_append(v_flags, 'buyer_multi_code');
    end if;
  end if;

  select id into v_campaign from referral.campaigns where slug = p_campaign_slug
    and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now());

  v_ref := referral.new_order_ref();
  insert into referral.orders (order_ref, product_id, qty, unit_price, discount, total, buyer_name, buyer_wa,
    code_id, reseller_id, campaign_id, attribution, ip_hash, risk_flags)
  values (v_ref, v_product.id, p_qty, v_product.price, v_discount, v_subtotal - v_discount, trim(p_buyer_name), p_buyer_wa,
    case when v_attr <> 'none' then v_code.id end, case when v_attr <> 'none' then v_code.reseller_id end,
    v_campaign, v_attr, p_ip_hash, v_flags);

  return jsonb_build_object('order_ref', v_ref, 'product_name', v_product.name, 'qty', p_qty,
    'subtotal', v_subtotal, 'discount', v_discount, 'total', v_subtotal - v_discount,
    'attribution', v_attr, 'code', case when v_attr <> 'none' then v_code.code::text end);
end $$;

-- Admin menandai lunas → komisi dibuat (pending, hold 7 hari). Row lock: aman dari klik ganda.
create or replace function referral.mark_order_paid(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = referral, extensions, public as $$
declare v_order referral.orders; v_product referral.products; v_amount int := 0;
begin
  perform referral.require_admin();
  select * into v_order from referral.orders where id = p_order_id for update;
  if not found then raise exception 'pesanan tidak ditemukan'; end if;
  if v_order.status <> 'pending' then raise exception 'pesanan sudah berstatus %', v_order.status; end if;
  update referral.orders set status = 'paid', paid_at = now(), paid_by = auth.uid() where id = p_order_id;

  if v_order.reseller_id is not null then
    select * into v_product from referral.products where id = v_order.product_id;
    v_amount := case v_product.commission_type
      when 'percent' then floor(v_order.total * v_product.commission_value / 100.0)
      else v_product.commission_value * v_order.qty end;
    insert into referral.commissions (order_id, reseller_id, order_ref, product_name, order_total, amount, hold_until, risk_flags)
    values (v_order.id, v_order.reseller_id, v_order.order_ref, v_product.name, v_order.total, v_amount,
            now() + interval '7 days', v_order.risk_flags);
  end if;
  insert into referral.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'mark_paid', 'order', v_order.order_ref, jsonb_build_object('commission', v_amount));
  return jsonb_build_object('order_ref', v_order.order_ref, 'commission', v_amount);
end $$;

-- Batal (pending) atau refund (paid). Refund membatalkan komisi yang belum dibayar.
create or replace function referral.set_order_status(p_order_id uuid, p_status referral.order_status)
returns void language plpgsql security definer set search_path = referral, extensions, public as $$
declare v_order referral.orders;
begin
  perform referral.require_admin();
  select * into v_order from referral.orders where id = p_order_id for update;
  if not found then raise exception 'pesanan tidak ditemukan'; end if;
  if p_status = 'cancelled' and v_order.status = 'pending' then
    update referral.orders set status = 'cancelled' where id = p_order_id;
  elsif p_status = 'refunded' and v_order.status = 'paid' then
    if exists (select 1 from referral.commissions where order_id = p_order_id and (status = 'paid' or payout_id is not null)) then
      raise exception 'komisi sudah masuk payout, tangani manual';
    end if;
    update referral.orders set status = 'refunded' where id = p_order_id;
    update referral.commissions set status = 'void' where order_id = p_order_id;
  else
    raise exception 'perubahan status % -> % tidak diizinkan', v_order.status, p_status;
  end if;
  insert into referral.audit_log (actor, action, entity, entity_id) values (auth.uid(), 'status_' || p_status, 'order', v_order.order_ref);
end $$;

-- Komisi lewat masa hold & tanpa flag → approved. Bisa dipanggil admin atau pg_cron (role postgres).
create or replace function referral.approve_matured_commissions()
returns integer language plpgsql security definer set search_path = referral, extensions, public as $$
declare n int;
begin
  if not (referral.is_admin() or session_user = 'postgres') then raise exception 'hanya admin' using errcode = '42501'; end if;
  update referral.commissions set status = 'approved'
   where status = 'pending' and hold_until <= now() and cardinality(risk_flags) = 0;
  get diagnostics n = row_count;
  return n;
end $$;

-- Review manual untuk komisi yang kena flag fraud.
create or replace function referral.review_commission(p_commission_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = referral, extensions, public as $$
declare v referral.commissions;
begin
  perform referral.require_admin();
  select * into v from referral.commissions where id = p_commission_id for update;
  if not found or v.status <> 'pending' then raise exception 'komisi tidak bisa direview'; end if;
  if p_approve then
    if v.hold_until > now() then raise exception 'masih dalam masa hold sampai %', v.hold_until; end if;
    update referral.commissions set status = 'approved' where id = v.id;
  else
    update referral.commissions set status = 'void' where id = v.id;
  end if;
  insert into referral.audit_log (actor, action, entity, entity_id) values (auth.uid(), case when p_approve then 'approve' else 'void' end, 'commission', v.order_ref);
end $$;

-- Kumpulkan semua komisi approved milik reseller ke satu payout (draft).
create or replace function referral.create_payout(p_reseller_id uuid)
returns uuid language plpgsql security definer set search_path = referral, extensions, public as $$
declare v_id uuid; v_total int;
begin
  perform referral.require_admin();
  perform 1 from referral.commissions where reseller_id = p_reseller_id and status = 'approved' and payout_id is null for update;
  select coalesce(sum(amount), 0) into v_total from referral.commissions
   where reseller_id = p_reseller_id and status = 'approved' and payout_id is null;
  if v_total = 0 then raise exception 'tidak ada komisi approved'; end if;
  insert into referral.payouts (reseller_id, total) values (p_reseller_id, v_total) returning id into v_id;
  update referral.commissions set payout_id = v_id where reseller_id = p_reseller_id and status = 'approved' and payout_id is null;
  insert into referral.audit_log (actor, action, entity, entity_id, detail) values (auth.uid(), 'create', 'payout', v_id::text, jsonb_build_object('total', v_total));
  return v_id;
end $$;

-- Admin sudah transfer manual → tandai lunas + simpan link bukti.
create or replace function referral.mark_payout_paid(p_payout_id uuid, p_proof_url text)
returns void language plpgsql security definer set search_path = referral, extensions, public as $$
begin
  perform referral.require_admin();
  if p_proof_url !~ '^https://' then raise exception 'link bukti harus https'; end if;
  update referral.payouts set status = 'paid', paid_at = now(), proof_url = p_proof_url where id = p_payout_id and status = 'draft';
  if not found then raise exception 'payout tidak ditemukan atau sudah dibayar'; end if;
  update referral.commissions set status = 'paid' where payout_id = p_payout_id;
  insert into referral.audit_log (actor, action, entity, entity_id) values (auth.uid(), 'paid', 'payout', p_payout_id::text);
end $$;

create or replace function referral.set_reseller_status(p_profile_id uuid, p_status referral.reseller_status)
returns void language plpgsql security definer set search_path = referral, extensions, public as $$
begin
  perform referral.require_admin();
  update referral.profiles set status = p_status where id = p_profile_id and role = 'reseller';
  if not found then raise exception 'reseller tidak ditemukan'; end if;
  insert into referral.audit_log (actor, action, entity, entity_id) values (auth.uid(), 'status_' || p_status, 'profile', p_profile_id::text);
end $$;

-- Slip komisi publik via token acak (tanpa data pembeli).
create or replace function referral.get_slip(p_token text)
returns jsonb language sql stable security definer set search_path = referral, extensions, public as $$
  select jsonb_build_object(
    'reseller', coalesce(nullif(split_part(pr.full_name, ' ', 1), ''), 'Reseller'),
    'total', p.total, 'status', p.status, 'created_at', p.created_at, 'paid_at', p.paid_at, 'proof_url', p.proof_url,
    'items', coalesce((select jsonb_agg(jsonb_build_object('order_ref', c.order_ref, 'product', c.product_name,
        'order_total', c.order_total, 'amount', c.amount, 'date', c.created_at) order by c.created_at)
      from referral.commissions c where c.payout_id = p.id), '[]'::jsonb))
  from referral.payouts p join referral.profiles pr on pr.id = p.reseller_id
  where p_token ~ '^[0-9a-f]{48}$' and p.slip_token = p_token
$$;

-- Papan peringkat: nama depan saja, komisi non-void sejak p_from.
create or replace function referral.leaderboard(p_from timestamptz)
returns table (name text, orders bigint, commission bigint)
language sql stable security definer set search_path = referral, extensions, public as $$
  select coalesce(nullif(split_part(pr.full_name, ' ', 1), ''), 'Reseller'), count(*), sum(c.amount)
  from referral.commissions c join referral.profiles pr on pr.id = c.reseller_id
  where c.status <> 'void' and c.created_at >= p_from
  group by pr.id, pr.full_name order by 3 desc, 2 desc limit 10
$$;

-- ===== Hak eksekusi =====
revoke execute on all functions in schema referral from public, anon, authenticated;
grant execute on all functions in schema referral to service_role;
grant execute on function referral.is_admin() to anon, authenticated;
grant execute on function referral.get_slip(text) to anon, authenticated;
grant execute on function referral.leaderboard(timestamptz) to authenticated;
grant execute on function referral.mark_order_paid(uuid), referral.set_order_status(uuid, referral.order_status),
  referral.approve_matured_commissions(), referral.review_commission(uuid, boolean), referral.create_payout(uuid),
  referral.mark_payout_paid(uuid, text), referral.set_reseller_status(uuid, referral.reseller_status) to authenticated;
grant execute on function referral.log_click(text, text, text, text),
  referral.create_order(uuid, int, text, text, text, text, text, text) to service_role;
