# Unit and SBG Code Design

## Goal

Standardize operational unit codes and pawned-item codes across registration, admin inventory, APIs, all role views, and PostgreSQL.

## Unit identity

The unit name and unit code remain separate:

- `units.name` stores the operational name exactly as entered, such as `UPC Ranotana` or `UPC Wanea`.
- `units.code` stores the generated operational code, such as `CP-MND-11793`.
- `units.domicile` stores the selected Indonesian province.

The form accepts only a five-digit unit number. The application derives the three-letter region code from the selected province and displays a live read-only preview:

```text
CP-{REGION}-{UNIT_NUMBER}
```

Examples:

- Sulawesi Utara + `11793` becomes `CP-MND-11793`.
- Sulawesi Utara + `11787` becomes `CP-MND-11787`.

The backend rebuilds the full unit code from the submitted province and five-digit number. It never trusts a client-generated prefix.

## Province region codes

One shared mapping is used by create forms, edit forms, validation, services, and tests:

| Province | Code |
| --- | --- |
| Aceh | BNA |
| Bali | DPS |
| Banten | SER |
| Bengkulu | BKL |
| DI Yogyakarta | YGY |
| DKI Jakarta | JKT |
| Gorontalo | GTO |
| Jambi | JBI |
| Jawa Barat | BDG |
| Jawa Tengah | SMG |
| Jawa Timur | SBY |
| Kalimantan Barat | PTK |
| Kalimantan Selatan | BJB |
| Kalimantan Tengah | PLK |
| Kalimantan Timur | SMD |
| Kalimantan Utara | TJS |
| Kepulauan Bangka Belitung | PKP |
| Kepulauan Riau | TPI |
| Lampung | BDL |
| Maluku | AMQ |
| Maluku Utara | TTE |
| Nusa Tenggara Barat | MTR |
| Nusa Tenggara Timur | KPG |
| Papua | JYP |
| Papua Barat | MNN |
| Papua Barat Daya | SOQ |
| Papua Pegunungan | WMN |
| Papua Selatan | MKQ |
| Papua Tengah | NBX |
| Riau | PKU |
| Sulawesi Barat | MJU |
| Sulawesi Selatan | MKS |
| Sulawesi Tengah | PLU |
| Sulawesi Tenggara | KDI |
| Sulawesi Utara | MND |
| Sumatera Barat | PDG |
| Sumatera Selatan | PLB |
| Sumatera Utara | MDN |

## SBG item identity

Admins do not type an item code. PostgreSQL generates an eleven-digit sequence value and the service combines it with the unit's five-digit number:

```text
SBG-{5_DIGIT_UNIT_NUMBER}{11_DIGIT_SEQUENCE}
```

The stored and displayed value contains exactly 16 digits after `SBG-`.

Example:

```text
SBG-1178725010004741
```

The first five digits (`11787`) identify the owning unit. The remaining eleven digits uniquely identify the SBG record.

## Data migration

The migration is transactional and idempotent:

1. Set `UPC Ranotana` to `CP-MND-11793`.
2. Set `UPC Wanea` to `CP-MND-11787`.
3. Normalize other operational unit codes to the new five-digit format where an existing numeric suffix is available.
4. Create and initialize the PostgreSQL SBG sequence.
5. Rewrite every existing `barang.code` into a unique `SBG-` code derived from its owning unit.
6. Keep every `units.name`, address, domicile, relation, item name, transaction, bid, media, and audit row unchanged.

The unique indexes on `units.code` and `barang.code` remain the final database uniqueness guards.

## Cross-role synchronization

All role surfaces already read `units.code` and `barang.code` from shared database records. Once create/update services and stored data use the canonical formats, these surfaces receive the same values automatically:

- superadmin unit management and monitoring;
- admin-unit profile, inventory, marketing, and history;
- buyer catalog, transaction, receipt, wishlist, and violation history;
- superadmin item detail and transaction receipt.

No duplicate display-only code field is introduced.

## Error handling

- Unit numbers must contain exactly five digits.
- A province without a configured region code is rejected.
- Duplicate full unit codes are rejected.
- SBG generation happens inside the item creation transaction.
- A generated SBG code that exceeds the eleven-digit sequence capacity is rejected.

## Verification

- Unit-code tests cover province mapping, parsing, formatting, and validation.
- Item-service tests prove generated codes use the correct unit prefix and 16-digit SBG format.
- Form tests prove users type only five digits and see the automatic full-code preview.
- Migration tests prove unit names are untouched and legacy item codes are rewritten.
- Relevant tests, the full suite, TypeScript, and the production build must pass.
