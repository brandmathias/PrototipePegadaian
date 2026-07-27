select
  u.name,
  u.email,
  u.phone_number,
  u.national_id,
  bp.status as buyer_profile_status,
  count(pu.id) as pelanggaran_tercatat,
  max(bl.total_violations) as level_aktif,
  max(bl.blocked_until) as dibatasi_sampai
from "user" u
left join buyer_profile bp on bp.user_id = u.id
left join pelanggaran_user pu on pu.user_id = u.id and pu.id like '94000000-0000-4000-8000-%'
left join blacklist bl on bl.user_id = u.id and bl.id like '9a000000-0000-4000-8000-%'
where lower(u.email) in ('lazuardi@gmail.com','anindita@gmail.com','rendra@gmail.com','savera@gmail.com','mahesa@gmail.com')
group by u.id, bp.status
order by lower(u.email);

select
  b.code,
  b.name as barang,
  p.iteration,
  p.status as status_pemasaran,
  count(distinct bid.id) as jumlah_peserta,
  count(distinct rsb.id) as riwayat_status
from barang b
join pemasaran p on p.barang_id = b.id
left join bids bid on bid.pemasaran_id = p.id
left join riwayat_status_barang rsb on rsb.barang_id = b.id
where b.id like '91000000-0000-4000-8000-%'
group by b.id, p.id
order by b.code;

select count(*) as rendra_bid_setelah_level_dua
from bids bid
join "user" u on u.id = bid.user_id
where bid.pemasaran_id = '92000000-0000-4000-8000-000000000103'
  and lower(u.email) = 'rendra@gmail.com';
