# PRD Review Notes: Authentication & User Management

> **Review Date:** 2026-08-25
> **PRD File:** `docs/PRD/PRD-auth-users.md`
> **Reviewer:** Agnes (Claude Code)

---

## Acceptance Criteria — Testability Assessment

| # | Criterion | Testable? | Rationale |
|---|-----------|-----------|-----------|
| 1 | Login succeeds with valid credentials, returns JWT in <1s | ✅ | HTTP 200 + token + user object; measure with request timing |
| 2 | Login fails with 401 for invalid credentials | ✅ | HTTP 401 status code + error message |
| 3 | Inactive account returns 403 | ✅ | Create user with `is_active=false`, attempt login → 403 |
| 4 | Protected endpoint without token returns 401 | ✅ | Call any protected endpoint with no Authorization header → 401 |
| 5 | RBAC correctly allows/denies per role matrix | ✅ | Test each endpoint with each role; verify allow/deny matches table |
| 6 | Admin can create, edit, activate/deactivate users | ✅ | Execute each operation as Admin; verify DB state changes |
| 7 | Password never appears in API responses | ✅ | Inspect all response bodies; `password_hash` must not be included |

**All 7 criteria are objectively testable.** ✅

---

## Gaps Identified

### G1 — Password Reset Endpoint Under-Specified (High)
**Location:** Section 4 (API Endpoints), Section 2 (Scope)
**Issue:** The PRD includes `PATCH /api/users/:id/password → reset password (Admin)` in the endpoint list but marks "Password reset email flow" as out of scope. There is no specification of:
- What the request body looks like (new password? or just a flag to generate one?)
- Whether the response returns the new password or a fingerprint
- Password complexity requirements (min length, character classes)
**Current implementation:** `create_admin.js` supports `ADMIN_PASSWORD` env var or `--reset` flag generating a one-time password with SHA-256 fingerprint. This pattern is NOT reflected in the PRD.

### G2 — Missing Token Refresh / Re-authentication Flow (High)
**Location:** Section 5 (Security Rules)
**Issue:** JWT expires in 8 hours. No refresh token mechanism is specified. Users must re-login every 8 hours. This is acceptable for a government system but should be explicitly stated as a design decision.
**Impact:** UX implication — no "stay logged in" or token refresh.

### G3 — Incomplete Role Matrix (Medium)
**Location:** Section 3 (Users & Roles)
**Issue:** The role matrix only covers Inventory and Ticket operations. Missing permissions for:
- Dashboard access (read-only for most roles?)
- Reports access (which roles can view?)
- Settings access (Admin only?)
- User management (Admin only — implied but not explicit in matrix)
**Recommendation:** Add a complete permissions matrix covering all 7 route domains.

### G4 — No Login Throttling / Brute-Force Protection (Medium)
**Location:** Section 5 (Security Rules)
**Issue:** No mention of rate limiting on the login endpoint. Government-grade security should include:
- Rate limiting (e.g., 5 attempts per IP per 15 minutes)
- Account lockout after N failed attempts
- Lockout duration specification
**Recommendation:** Add to security rules or mark as "v2" if out of scope.

### G5 — No Password Complexity Requirements (Low)
**Location:** Section 5 (Security Rules)
**Issue:** Bcrypt 10 rounds is specified, but no password complexity rules (min length, uppercase, numbers, special chars).
**Recommendation:** Define minimum requirements (e.g., ≥12 chars, mixed case, at least one number).

### G6 — "Password Reset" Terminology Ambiguity (Low)
**Location:** Section 2 (Scope)
**Issue:** Scope says "Password reset (Admin only)" is in scope, but also says "Password reset email flow" is out of scope. These are partially contradictory — Admin-initiated reset is in scope, email-based self-service reset is out. The PRD should clarify this distinction.

---

## Recommended Additions

1. **Add to Security Rules:** Password complexity requirements (min length, character classes)
2. **Add to Scope:** Explicitly state "No token refresh — users re-login after 8h expiry"
3. **Expand Role Matrix:** Add Dashboard, Reports, Settings permission rows
4. **Add Login Throttling:** Rate limit on POST /api/auth/login (even if v2)
5. **Clarify Password Reset:** Distinguish between Admin-initiated reset (in scope) and self-service email reset (out of scope)
6. **Add Request/Response Schemas:** For each auth endpoint, define the exact request body and response shape

---

## Alignment with Architecture Invariants

| Invariant | Aligned? | Notes |
|-----------|----------|-------|
| JWT required on every protected endpoint | ✅ | Explicitly stated in Section 5 |
| RBAC enforced at route level | ✅ | Role matrix defined in Section 3 |
| All queries parameterized | N/A (auth is not data-heavy) | N/A |
| Passwords hashed with bcrypt | ✅ | 10 rounds specified |
| Asset ID server-side SHA-256 | N/A (not applicable) | N/A |
| Ticket history immutable | N/A (not applicable) | N/A |

---

## Summary

- **7/7 acceptance criteria** are testable ✅
- **6 gaps** identified (2 High, 2 Medium, 2 Low)
- **Core auth logic is well-specified** — the gaps are in security hardening and completeness
- **Ready for implementation** with the High-priority gaps addressed first
