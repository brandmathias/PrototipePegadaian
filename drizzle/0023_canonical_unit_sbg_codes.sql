create sequence if not exists "barang_sbg_number_seq"
  increment by 1
  minvalue 1
  start with 1
  cache 1;
--> statement-breakpoint
create temporary table "_unit_code_targets" on commit drop as
select
  "id",
  case
    when lower(trim("name")) = 'upc ranotana' then 'CP-MND-11793'
    when lower(trim("name")) = 'upc wanea' then 'CP-MND-11787'
    else
      'CP-' ||
      case lower(regexp_replace(trim("domicile"), '\s+', ' ', 'g'))
        when 'aceh' then 'BNA'
        when 'nanggroe aceh darussalam' then 'BNA'
        when 'bali' then 'DPS'
        when 'banten' then 'SER'
        when 'bengkulu' then 'BKL'
        when 'di yogyakarta' then 'YGY'
        when 'daerah istimewa yogyakarta' then 'YGY'
        when 'yogyakarta' then 'YGY'
        when 'dki jakarta' then 'JKT'
        when 'gorontalo' then 'GTO'
        when 'jambi' then 'JBI'
        when 'jawa barat' then 'BDG'
        when 'jawa tengah' then 'SMG'
        when 'jawa timur' then 'SBY'
        when 'kalimantan barat' then 'PTK'
        when 'kalimantan selatan' then 'BJB'
        when 'kalimantan tengah' then 'PLK'
        when 'kalimantan timur' then 'SMD'
        when 'kalimantan utara' then 'TJS'
        when 'kepulauan bangka belitung' then 'PKP'
        when 'bangka belitung' then 'PKP'
        when 'kepulauan riau' then 'TPI'
        when 'lampung' then 'BDL'
        when 'maluku' then 'AMQ'
        when 'maluku utara' then 'TTE'
        when 'nusa tenggara barat' then 'MTR'
        when 'nusa tenggara timur' then 'KPG'
        when 'papua' then 'JYP'
        when 'papua barat' then 'MNN'
        when 'papua barat daya' then 'SOQ'
        when 'papua pegunungan' then 'WMN'
        when 'papua selatan' then 'MKQ'
        when 'papua tengah' then 'NBX'
        when 'riau' then 'PKU'
        when 'sulawesi barat' then 'MJU'
        when 'sulawesi selatan' then 'MKS'
        when 'sulawesi tengah' then 'PLU'
        when 'sulawesi tenggara' then 'KDI'
        when 'sulawesi utara' then 'MND'
        when 'sumatera barat' then 'PDG'
        when 'sumatera selatan' then 'PLB'
        when 'sumatera utara' then 'MDN'
      end ||
      '-' ||
      lpad(substring(trim("code") from '([0-9]{1,5})$'), 5, '0')
  end as "new_code"
from "units";
--> statement-breakpoint
do $$
declare
  invalid_units text;
  duplicate_codes text;
begin
  select string_agg("id", ', ' order by "id")
  into invalid_units
  from "_unit_code_targets"
  where "new_code" is null
     or "new_code" !~ '^CP-[A-Z]{3}-[0-9]{5}$';

  if invalid_units is not null then
    raise exception 'Kode unit tidak dapat dimigrasikan untuk unit: %', invalid_units;
  end if;

  select string_agg("new_code", ', ' order by "new_code")
  into duplicate_codes
  from (
    select "new_code"
    from "_unit_code_targets"
    group by "new_code"
    having count(*) > 1
  ) duplicates;

  if duplicate_codes is not null then
    raise exception 'Hasil migrasi menghasilkan kode unit duplikat: %', duplicate_codes;
  end if;
end $$;
--> statement-breakpoint
update "units" as unit_record
set "code" = '__UNIT_CODE_MIGRATION__' || md5(unit_record."id")
from "_unit_code_targets" as target
where target."id" = unit_record."id";
--> statement-breakpoint
update "units" as unit_record
set
  "code" = target."new_code",
  "updated_at" = now()
from "_unit_code_targets" as target
where target."id" = unit_record."id";
--> statement-breakpoint
do $$
declare
  current_max bigint;
begin
  select max(right("code", 11)::bigint)
  into current_max
  from "barang"
  where "code" ~ '^SBG-[0-9]{16}$';

  if current_max is null then
    perform setval('barang_sbg_number_seq', 1, false);
  else
    perform setval('barang_sbg_number_seq', current_max, true);
  end if;
end $$;
--> statement-breakpoint
with allocated_codes as materialized (
  select
    item."id",
    'SBG-' ||
      right(unit_record."code", 5) ||
      lpad(nextval('barang_sbg_number_seq')::text, 11, '0') as "new_code"
  from "barang" as item
  inner join "units" as unit_record on unit_record."id" = item."unit_id"
  where item."code" !~ '^SBG-[0-9]{16}$'
     or substring(item."code" from 5 for 5) <> right(unit_record."code", 5)
  order by item."created_at", item."id"
)
update "barang" as item
set
  "code" = allocated_codes."new_code",
  "updated_at" = now()
from allocated_codes
where allocated_codes."id" = item."id";
--> statement-breakpoint
do $$
declare
  invalid_unit_count bigint;
  invalid_item_count bigint;
  duplicate_item_count bigint;
begin
  select count(*)
  into invalid_unit_count
  from "units"
  where "code" !~ '^CP-[A-Z]{3}-[0-9]{5}$';

  select count(*)
  into invalid_item_count
  from "barang" as item
  inner join "units" as unit_record on unit_record."id" = item."unit_id"
  where item."code" !~ '^SBG-[0-9]{16}$'
     or substring(item."code" from 5 for 5) <> right(unit_record."code", 5);

  select count(*)
  into duplicate_item_count
  from (
    select "code"
    from "barang"
    group by "code"
    having count(*) > 1
  ) duplicates;

  if invalid_unit_count > 0 or invalid_item_count > 0 or duplicate_item_count > 0 then
    raise exception
      'Audit migrasi gagal: % kode unit invalid, % kode barang invalid, % kode barang duplikat.',
      invalid_unit_count,
      invalid_item_count,
      duplicate_item_count;
  end if;
end $$;
