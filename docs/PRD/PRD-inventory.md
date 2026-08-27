# PRD: Asset & Inventory Management

## 1. Objective
Provide complete IT asset lifecycle management with duplicate prevention, validation, and CSV import/export.

## 2. Scope
### In scope
- Asset CRUD with configurable fields
- Auto-generated Asset ID (SHA-256 prefix)
- Duplicate serial/MAC prevention
- Server-side pagination, search, filters
- CSV import/export
- MAC and IP address validation
- Network asset discovery (v2)

### Out of scope
- Asset deletion (immutable records)
- Asset depreciation calculations
- Barcode/QR code generation

## 3. Users & Roles
- Admin: full read/write
- Help Desk: full read/write
- Other roles: read-only

## 4. Data Model
```
inventory {
  id: SERIAL PK
  asset_id: VARCHAR(50) UNIQUE
  serial_number: VARCHAR(200) UNIQUE NULL
  mac_address: VARCHAR(50) UNIQUE NULL
  asset_category: VARCHAR(200) NOT NULL
  asset_description: VARCHAR(500) NOT NULL
  asset_user: VARCHAR(200) NOT NULL
  asset_current_status: VARCHAR(100) NOT NULL
  ip_address: VARCHAR(50) NULL
  location: VARCHAR(255) NULL
  ... (additional lifecycle fields)
}
```

## 5. API Endpoints
```
GET    /api/inventory             → paginated list
POST   /api/inventory             → create asset
GET    /api/inventory/:id         → asset details
PUT    /api/inventory/:id         → update asset
POST   /api/inventory/import      → CSV import
GET    /api/inventory/export      → CSV export
```

## 6. Asset ID Generation
```
Input: serial_number = "SN12345678"
Process: SHA-256("SN12345678") = "a1b2c3d4..."
Output: asset_id = "a1b2c3d4" (first 8 chars)
```
If both serial and MAC provided, serial takes precedence.

## 7. Acceptance Criteria
- [ ] Duplicate serial_number rejected with clear error
- [ ] Duplicate mac_address rejected with clear error
- [ ] Asset ID auto-generated and unique
- [ ] MAC format validated (XX:XX:XX:XX:XX:XX)
- [ ] IP format validated (dotted quad)
- [ ] CSV import creates assets without duplicates
- [ ] Asset list returns correct pagination total
- [ ] Search by user name, email, phone works
