alter table "barang"
  drop constraint if exists "barang_customer_number_13_digit_check";

alter table "barang"
  drop constraint if exists "barang_owner_name_two_words_check";

update "barang" as item
set
  "owner_name" = case
    when lower(trim(item."owner_name")) ~ '^brando([[:space:]]|[0-9]|$)' then 'Brando Mahendra'
    when lower(trim(item."owner_name")) ~ '^andi([[:space:]]|[0-9]|$)' then 'Andi Wijaya'
    when lower(trim(item."owner_name")) ~ '^rizki([[:space:]]|[0-9]|$)' then 'Rizki Pratama'
    when lower(trim(item."owner_name")) ~ '^budi([[:space:]]|[0-9]|$)' then 'Budi Santoso'
    when lower(trim(item."owner_name")) ~ '^dina([[:space:]]|[0-9]|$)' then 'Dina Maharani'
    when lower(trim(item."owner_name")) ~ '^siti([[:space:]]|[0-9]|$)' then 'Siti Rahmawati'
    else trim(concat(
      initcap(coalesce(nullif(trim(regexp_replace(regexp_replace(item."owner_name", '[0-9]+', '', 'g'), '\s+', ' ', 'g')), ''), 'Nasabah')),
      ' Pegadaian'
    ))
  end,
  "updated_at" = now()
where trim(item."owner_name") ~ '[0-9]'
   or array_length(regexp_split_to_array(trim(item."owner_name"), '\s+'), 1) < 2;

with normalized as (
  select
    item."id",
    regexp_replace(item."customer_number", '\D', '', 'g') as digits,
    row_number() over (order by item."created_at", item."id") as sequence_number
  from "barang" as item
),
targets as (
  select
    normalized."id",
    case
      when normalized.digits ~ '^08[0-9]{11}$' then normalized.digits
      when normalized.digits ~ '^8[0-9]{11}$' then concat('0', normalized.digits)
      when normalized.digits ~ '^62[0-9]{11}$' then concat('0', substring(normalized.digits from 3))
      else concat('0899', lpad(normalized.sequence_number::text, 9, '0'))
    end as new_customer_number
  from normalized
  where normalized.digits !~ '^08[0-9]{11}$'
)
update "barang" as item
set
  "customer_number" = targets.new_customer_number,
  "updated_at" = now()
from targets
where targets."id" = item."id";

alter table "barang"
  add constraint "barang_customer_number_13_digit_check"
  check ("customer_number" ~ '^08[0-9]{11}$');

alter table "barang"
  add constraint "barang_owner_name_two_words_check"
  check (
    trim("owner_name") !~ '[0-9]'
    and array_length(regexp_split_to_array(trim("owner_name"), '\s+'), 1) >= 2
  );

do $$
declare
  invalid_count integer;
begin
  select count(*)
    into invalid_count
  from "barang"
  where "customer_number" !~ '^08[0-9]{11}$'
     or trim("owner_name") ~ '[0-9]'
     or array_length(regexp_split_to_array(trim("owner_name"), '\s+'), 1) < 2;

  if invalid_count > 0 then
    raise exception 'Masih ada % data nasabah barang yang belum standar.', invalid_count;
  end if;
end $$;
