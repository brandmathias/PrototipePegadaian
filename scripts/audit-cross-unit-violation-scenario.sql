\pset pager off

-- Status akhir akun dan pembatasan aktif.
select
  u.name,
  lower(u.email) as email,
  u.is_active,
  coalesce(bl.total_violations, 0) as level,
  un.name as unit_pelanggaran_terakhir,
  timezone('Asia/Jakarta', bl.blocked_at) as mulai_wib,
  timezone('Asia/Jakarta', bl.blocked_until) as berakhir_wib
from "user" u
left join blacklist bl on bl.user_id = u.id and bl.is_active = true
left join units un on un.id = bl.unit_id
where lower(u.email) = any(array[
  'yoga@gmail.com',
  'tiara@gmail.com',
  'reza@gmail.com',
  'ilham@gmail.com'
])
order by lower(u.email);

-- Kronologi pelanggaran, barang, unit, harga Vickrey, dan foto yang dipakai bersama.
select
  u.name as buyer,
  row_number() over (partition by pu.user_id order by pu.created_at) as level,
  un.name as unit,
  b.name as barang,
  timezone('Asia/Jakarta', p.ends_at) as lelang_selesai_wib,
  timezone('Asia/Jakarta', t.payment_deadline) as pelanggaran_wib,
  p.final_price,
  mb.url as foto
from pelanggaran_user pu
inner join "user" u on u.id = pu.user_id
inner join units un on un.id = pu.unit_id
inner join pemasaran p on p.id = pu.pemasaran_id
inner join barang b on b.id = p.barang_id
inner join transaksi t on t.id = pu.transaksi_id
left join lateral (
  select url
  from media_barang
  where barang_id = b.id
  order by sort_order, created_at
  limit 1
) mb on true
where pu.id like '44000000-0000-4000-8000-%'
order by pu.created_at;

-- Jumlah peserta dan transisi status per barang untuk audit riwayat pemasaran.
select
  b.name as barang,
  un.name as unit,
  count(distinct bid.user_id) as peserta,
  count(distinct r.id) as transisi_status,
  min(r.created_at) = b.created_at as riwayat_dimulai_saat_barang_masuk,
  max(r.created_at) = t.payment_deadline as riwayat_berakhir_saat_gagal_bayar
from barang b
inner join units un on un.id = b.unit_id
inner join pemasaran p on p.barang_id = b.id
inner join bids bid on bid.pemasaran_id = p.id
inner join transaksi t on t.pemasaran_id = p.id
inner join riwayat_status_barang r on r.barang_id = b.id
where b.id like '41000000-0000-4000-8000-%'
group by b.id, b.name, un.name, b.created_at, t.payment_deadline
order by b.created_at;
