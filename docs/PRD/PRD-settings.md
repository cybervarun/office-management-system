# PRD: Settings & Customization

## 1. Objective
Enable full system configurability so any company can customize without code changes.

## 2. Scope
### In scope
- Dropdown value management (add, edit, delete lookup values)
- Custom asset field management (v2)
- Custom ticket status/workflow management (v2)
- Company branding settings (v2)

### Out of scope
- Database schema modification via UI
- Role definition via UI (hardcoded for v1)

## 3. Users & Roles
- Admin: full access to all settings
- Other roles: no access

## 4. Lookup Value Management
```
lookup_values {
  id: SERIAL PK
  lookup_type: VARCHAR(100)  -- asset_category, operating_system, etc.
  name: VARCHAR(255)         -- Display value
  code: VARCHAR(100)         -- Machine-readable slug
  created_at: TIMESTAMP
}
```

## 5. API Endpoints
```
GET    /api/settings/dropdowns      → all lookup values by type
POST   /api/settings/dropdowns      → create new value
PUT    /api/settings/dropdowns/:id  → update value
DELETE /api/settings/dropdowns/:id  → delete value
```

## 6. Acceptance Criteria
- [ ] Admin can add new dropdown value and see it in forms immediately
- [ ] Dropdown values can be edited and deleted
- [ ] Deleting a value in use shows warning (or prevents deletion)
- [ ] Code auto-generated from name (slugified)
- [ ] Settings persist across server restarts
