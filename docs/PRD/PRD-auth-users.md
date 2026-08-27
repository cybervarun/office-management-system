# PRD: Authentication & User Management

## 1. Objective
Implement secure JWT-based authentication with role-based access control and user lifecycle management.

## 2. Scope
### In scope
- Login with email/username + password
- JWT issuance and verification
- RBAC middleware (Admin, Help Desk, IT Team, Network Team, Cybersecurity)
- User CRUD (Admin only)
- Password reset (Admin only)
- Activate/deactivate accounts

### Out of scope
- Password reset email flow
- SSO integration
- MFA/2FA
- Session management beyond JWT expiry

## 3. Users & Roles
| Role | Inventory Read | Inventory Write | User Mgmt | Ticket Create | Ticket Update |
|------|---------------|-----------------|-----------|---------------|---------------|
| Admin | Yes | Yes | Yes | Yes | Yes |
| Help Desk | Yes | Yes | No | Yes | Yes |
| IT Team | Yes | No | No | Yes | Yes |
| Network Team | Yes | No | No | Yes | Yes |
| Cybersecurity | Yes | No | No | Yes | Yes |

## 4. API Endpoints
```
POST   /api/auth/login          → { token, user }
GET    /api/users               → paginated user list
POST   /api/users               → create user (Admin)
PUT    /api/users/:id           → update user (Admin)
PATCH  /api/users/:id/status    → activate/deactivate (Admin)
PATCH  /api/users/:id/password  → reset password (Admin)
```

## 5. Security Rules
- Passwords hashed with bcrypt (10 rounds)
- JWT expires in 8 hours (configurable)
- All protected endpoints require Bearer token
- Inactive users rejected with 403

## 6. Acceptance Criteria
- [ ] Login succeeds with valid credentials, returns JWT in <1s
- [ ] Login fails with 401 for invalid credentials
- [ ] Inactive account returns 403
- [ ] Protected endpoint without token returns 401
- [ ] RBAC correctly allows/denies per role matrix
- [ ] Admin can create, edit, activate/deactivate users
- [ ] Password never appears in API responses
