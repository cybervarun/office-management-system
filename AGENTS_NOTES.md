# AGENTS.md — Ambiguity Notes

> **Purpose:** Capture ambiguous or unclear lines from AGENTS.md with proposed rewrites.
> **Source:** Block 1, Day 1 Context Framework Review
> **Used by:** Block 4 (Finalise AGENTS.md) as primary input

---

| # | Original Text (from AGENTS.md) | Ambiguity / Issue | Proposed Rewrite |
|---|-------------------------------|-------------------|------------------|
| 1 | "DB access always uses parameterized queries via `executeQuery(query, params)`" | The current code uses MSSQL syntax (`@param`, `{ name, type, value }`). The Migration section says to switch to `pg` (`$1`, `$2`, `[vals]`). It is unclear whether `executeQuery(query, params)` refers to the MSSQL wrapper or the target PostgreSQL pattern. This creates confusion about which syntax is the canonical convention. | "DB access uses parameterized queries. During MSSQL migration, use the existing `executeQuery(query, params)` wrapper. After migration to PostgreSQL, use `pool.query(text, [values])` with `$1, $2` positional syntax. Never concatenate values into SQL strings." |
| 2 | "Asset ID = first 8 chars of SHA-256(serial_number \|\| mac_address)" | The actual code in `inventoryService.js:27` generates 12 uppercase hex characters with an `ASSET-` prefix: ``. The AGENTS.md rule says 8 chars, no prefix. This is a direct contradiction between documented rule and implementation. | "Asset ID = first 8 lowercase hex characters of SHA-256(serial_number \|\| mac_address). Format: plain hex string (e.g., `a3f2b1c0`). No prefix. Regenerate after MSSQL→PostgreSQL migration to match." |
| 3 | "Security headers on every response (HSTS, X-Frame-Options, nosniff, X-XSS-Protection)" | The ARCHITECTURE.md middleware stack lists "Security Headers" as the first middleware, but AGENTS.md does not specify which headers are required or how to verify they are applied. No explicit enforcement rule is stated. | "Security headers middleware must be applied to every route. Required headers: `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 0`. Verify in `app.js` or equivalent entry point before Phase 1." |
| 4 | "Controllers are thin — no business logic" | `inventoryController.js:addDropdownValue` contains business logic (validation, normalization, dedup check, INSERT). `ticketController.js:searchUsers` queries the database directly. These violate the thin-controller rule. | "Controllers must only: (1) extract input from req, (2) call a service method, (3) return res.json() with appropriate status. All validation, normalization, dedup, and database logic belongs in services. If a controller requires a DB query, move it to a service." |
| 5 | "Do not use `any` in TypeScript or skip validation" | The project uses plain JavaScript (`.js` files), not TypeScript. The `any` rule is irrelevant and confusing. Additionally, "skip validation" is vague — which validations are required? | "Do not skip request validation on any endpoint. Use `express-validator` chains or manual checks in controllers before calling services. (This project uses JavaScript, not TypeScript — the `any` rule does not apply.)" |
| 6 | "Pagination envelope: `{ data: [...], pagination: { page, pageSize, total, totalPages } }`" | The `paginatedResponse()` utility is used in controllers, but its exact shape is not defined in AGENTS.md. Services return `{ data, total }` but the controller-layer envelope shape may differ. | "The `paginatedResponse(data, total, pagination)` utility in `backend/utils/pagination.js` returns `{ data, pagination: { page, pageSize, total, totalPages } }`. Services return `{ data, total }`. Controllers must wrap service results with `paginatedResponse()` before sending to the client." |
| 7 | "EditUser in userService.js uses dynamic SQL: `UPDATE users SET ${fields.join(", ")}`" | Column names are interpolated directly into the SQL string (line 60 of userService.js). While the VALUES are parameterized, the column names come from a whitelist (`payload` keys), which is safer than arbitrary input but still violates the "no string concatenation" rule as written. | "Dynamic column selection is acceptable only when the column names come from a hardcoded allowlist (e.g., `ALLOWED_UPDATE_FIELDS`). Document this exception in AGENTS.md under Architecture Rules: 'Column names may be interpolated from a hardcoded allowlist; values must always be parameterized.'" |
| 8 | "JWT secret must be ≥32 characters, stored in `.env`" | There is no validation that the JWT_SECRET actually meets the 32-character minimum at runtime. A short or missing secret would be silently accepted. | "Add startup validation: on server boot, check `process.env.JWT_SECRET.length >= 32`. Throw a fatal error if the secret is missing or too short. Document this check in the Commands section as part of the dev startup sequence." |
| 9 | The 6 invariants in ARCHITECTURE.md are not cross-referenced in AGENTS.md | AGENTS.md lists "Architecture Rules" but does not enumerate the 6 key invariants from ARCHITECTURE.md. Agents reading AGENTS.md in isolation would not know these are mandatory. | "Add a 'Key Invariants' section to AGENTS.md that lists the 6 invariants from ARCHITECTURE.md as non-negotiable rules. Cross-reference: 'See docs/ARCHITECTURE.md for full details.'" |
| 10 | "Do not commit `.env` files or secrets" | There is no `.env.example` file referenced or created. Agents may not know which variables are required. | "Create `backend/.env.example` with all required variables and placeholder values. Reference this file in AGENTS.md under Environment Variables so new developers know what to configure." |

---

## Notes

- **How to use this file:**
  1. Read AGENTS.md end-to-end (Block 1, 10:00–11:30).
  2. For each ambiguous, vague, or missing convention, add a row above.
  3. Include the exact original text, describe the ambiguity, and propose a clearer rewrite.
  4. This file is consumed by Block 4 to resolve issues before finalising AGENTS.md v1.0.

- **Ambiguity types to look for:**
  - Missing scope (e.g., "validate all input" — which inputs?)
  - Unclear format (e.g., "structured error responses" — what shape?)
  - Conflicting rules (e.g., pagination envelope shape vs. existing code)
  - Unspecified defaults (e.g., what is the default page size?)
  - Documentation vs. implementation mismatch (e.g., Asset ID format)
