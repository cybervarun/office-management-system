The key instruction to Claude should be: **do not treat the redesign as permission to remove functionality**. The existing application should be treated as the functional specification, while the new design becomes the presentation layer.

Use this prompt in Claude Code:

# Claude Code — IT Inventory & Ticketing System

## Complete UI Redesign + Full Functionality Restoration

You are working on my existing **IT Inventory & Ticketing** application.

The application was recently redesigned, but the redesign has effectively destroyed or disconnected much of the application's existing functionality.

The current browser state looks like this:

* Sidebar is visible.
* Main content area is blank.
* Most/all previous page content, buttons, fields, tables, forms, actions, and workflows are missing or disconnected.
* The application needs to be redesigned again, but this time the redesign MUST preserve and restore the complete functional system.

The objective is:

> **Create a modern, professional enterprise UI while bringing back EVERY existing button, field, form, table, action, workflow, API integration, database operation, navigation item, and business function that existed in the project.**

This is NOT a request to create a pretty mockup.

This is a request to build a **fully functional application with a new UI**.

---

# 1. CRITICAL RULE — FUNCTIONALITY MUST NEVER BE LOST

Treat the existing project as the **functional source of truth**.

Treat the new design as the **visual/presentation layer**.

Do NOT simplify the application by removing functionality.

Do NOT assume that something is unnecessary simply because it is not visible in the current UI.

Before redesigning anything, inspect the entire repository and reconstruct the application's functional inventory.

The final application must retain or restore:

* all navigation
* all pages
* all routes
* all buttons
* all actions
* all forms
* all input fields
* all dropdowns
* all selectors
* all checkboxes
* all radio buttons
* all tables
* all filters
* all search fields
* all pagination
* all CRUD operations
* all modals
* all confirmation dialogs
* all status changes
* all assignment functions
* all ticket workflows
* all asset workflows
* all reports
* all audit functionality
* all authentication
* all RBAC
* all API calls
* all database operations
* all validation
* all error handling
* all existing business logic

If functionality exists in code but is currently disconnected from the UI, reconnect it.

If functionality existed in the previous implementation but was accidentally removed during redesign, reconstruct it from:

* git history
* existing source files
* API routes
* backend controllers
* database schema
* service functions
* old components
* unused components
* imports
* route definitions
* documentation
* package structure
* database queries
* types/interfaces
* existing tests

Do not invent unnecessary replacement functionality when the original implementation can be recovered.

---

# 2. DO NOT START BY WRITING NEW UI

First perform a complete repository audit.

Do NOT immediately start modifying React components.

First understand the system.

Inspect:

```text
package.json
package-lock.json
README
frontend
backend
src
components
pages
layouts
routes
services
hooks
contexts
stores
utils
types
API clients
controllers
routes
middleware
database
SQL scripts
migrations
schemas
authentication
RBAC
configuration
```

Use the actual repository structure rather than assuming these directories exist.

Also inspect git history.

Run:

```bash
git status
git log --oneline --all --decorate -30
```

Determine whether the previous functional UI can be recovered from git history.

If useful, inspect previous commits to identify:

* previous pages
* previous components
* previous forms
* previous fields
* previous buttons
* previous workflows
* previous routes
* previous dashboard
* previous inventory UI
* previous ticket UI

Do not destroy existing work.

---

# 3. BUILD A FUNCTIONAL INVENTORY BEFORE REDESIGN

Create an internal inventory of EVERYTHING the application is supposed to do.

For example:

```text
APPLICATION
│
├── Authentication
│   ├── Login
│   ├── Logout
│   ├── Session
│   ├── Current User
│   └── RBAC
│
├── Dashboard
│   ├── Statistics
│   ├── Inventory summary
│   ├── Ticket summary
│   ├── Recent activity
│   ├── Alerts
│   └── Quick actions
│
├── Inventory
│   ├── Asset list
│   ├── Search
│   ├── Filter
│   ├── Sort
│   ├── Pagination
│   ├── Add asset
│   ├── Edit asset
│   ├── View asset
│   ├── Delete/decommission
│   ├── Asset movement
│   ├── Assignment
│   ├── Warranty
│   ├── AMC
│   └── History
│
├── Tickets
│   ├── Ticket list
│   ├── Create ticket
│   ├── View ticket
│   ├── Edit ticket
│   ├── Assign ticket
│   ├── Change status
│   ├── Priority
│   ├── Team
│   ├── Comments
│   ├── History
│   ├── Search
│   ├── Filter
│   └── Pagination
│
├── Users
├── Teams
├── Reports
├── Audit Log
├── Settings
└── Administration
```

This is only an example.

Use the repository to discover the REAL functionality.

---

# 4. RECOVER THE ORIGINAL FUNCTIONAL UI

The previous UI is important.

Search git history and source files for the previous implementation.

Look for:

```text
Dashboard
Inventory
Asset
Ticket
Job Ticket
Users
Teams
Reports
Audit
Settings
Admin
```

Also search for:

```text
Add
Edit
Delete
View
Save
Submit
Cancel
Assign
Close
Resolve
Reopen
Export
Import
Search
Filter
Refresh
Reset
Create
Update
Approve
Reject
Move
Transfer
History
```

Find all existing components associated with these functions.

Do NOT assume unused components are useless.

Some may have become orphaned during the redesign.

---

# 5. NEW DESIGN MUST BE BUILT AROUND THE FUNCTIONAL SYSTEM

Now redesign the interface.

The design should look like a professional **Government/Enterprise IT Management System**.

The UI should be:

* clean
* modern
* professional
* information-dense but readable
* consistent
* responsive
* accessible
* keyboard-friendly
* suitable for desktop enterprise use
* suitable for internal government/office environments

Avoid excessive visual decoration.

This is an operational IT management system, not a marketing website.

---

# 6. APPLICATION SHELL

Create a proper application shell.

The layout should contain:

```text
┌───────────────────────────────────────────────────────────────┐
│ Top Header                                                    │
│ Logo | Search | Notifications | User | Role                  │
├───────────────┬───────────────────────────────────────────────┤
│               │                                               │
│ Sidebar       │ Main Content                                  │
│               │                                               │
│ Dashboard     │ Page Header                                   │
│ Inventory     │ Breadcrumb                                    │
│ Tickets       │                                               │
│ Users         │ Content                                       │
│ Teams         │                                               │
│ Reports       │                                               │
│ Audit         │                                               │
│ Settings      │                                               │
│               │                                               │
│               │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

The exact design can differ, but the application must have a proper content area.

The current state where only the sidebar is visible is NOT acceptable.

---

# 7. SIDEBAR

Keep the existing navigation functions.

Do not simply create decorative navigation items.

Every navigation item must lead to a real page.

For example, if the project contains:

```text
Dashboard
Inventory
Tickets
Users
Teams
Reports
Audit Log
Settings
```

then every item must:

1. navigate correctly
2. render the correct page
3. maintain active state
4. survive browser refresh
5. support direct URL navigation
6. enforce appropriate permissions

If a navigation item exists in the current sidebar but its page is missing, restore the page.

---

# 8. DASHBOARD

Create a real operational dashboard.

Do not use static fake cards.

Use actual API/database data.

Possible sections:

### Summary cards

```text
Total Assets
Active Assets
Available Assets
Under AMC
Warranty Expiring
Open Tickets
Pending Tickets
Critical Tickets
Resolved Tickets
```

Only display metrics supported by the actual system.

### Operational widgets

Examples:

```text
Ticket status distribution
Ticket priority distribution
Recent tickets
Recent asset movements
Recent audit events
Warranty/AMC alerts
```

### Quick actions

Examples:

```text
+ Add Asset
+ Create Ticket
View Open Tickets
View Inventory
Generate Report
```

Every button must actually work.

---

# 9. INVENTORY MANAGEMENT

The Inventory page must be a complete functional module.

It should contain the fields actually supported by the backend/database.

Potential fields include:

```text
Asset ID
Asset Tag
Asset Type
Category
Make
Model
Serial Number
Hostname
IP Address
MAC Address
Operating System
Department
Location
Floor
Room
Assigned User
Assigned Team
Status
Purchase Date
Warranty Start
Warranty End
AMC Start
AMC End
Vendor
Cost
Remarks
```

DO NOT blindly add fields that the backend cannot support.

First inspect the actual database schema and API.

The UI must support the actual data model.

---

# 10. INVENTORY ACTIONS

Every existing action must be restored.

Examples:

```text
View
Edit
Delete
Decommission
Assign
Move
Transfer
History
AMC
Warranty
Export
```

If the existing project supports additional actions, restore those too.

Each action must call the correct backend/API operation.

No fake buttons.

No buttons that only display a toast.

No buttons that do nothing.

---

# 11. ASSET FORM

Build a professional asset form.

Organize fields logically.

For example:

### Identification

```text
Asset Tag
Asset Type
Category
Serial Number
```

### Hardware

```text
Make
Model
Configuration
```

### Network

```text
Hostname
IP Address
MAC Address
```

### Assignment

```text
Department
Location
Floor
Room
Assigned User
Assigned Team
```

### Lifecycle

```text
Status
Purchase Date
Warranty
AMC
Vendor
```

### Additional

```text
Remarks
```

Use actual fields supported by the system.

Implement:

* validation
* required fields
* correct data types
* server-side validation
* loading state
* success state
* error state
* cancel
* save
* edit
* reset where appropriate

---

# 12. ASSET DETAILS

The asset details page/modal must provide a useful operational view.

Include:

```text
Asset information
Assignment
Network information
Lifecycle
Warranty
AMC
Movement history
Audit/history
```

Use tabs if appropriate.

---

# 13. ASSET MOVEMENT

If asset movement functionality exists, restore it completely.

Provide:

```text
Current location
Previous location
From
To
Moved by
Movement date
Reason
Remarks
```

Use actual backend functionality.

Movement history must be traceable.

---

# 14. TICKET MANAGEMENT

Tickets are a major module.

Create a complete ticket management interface.

Include actual fields supported by the project.

Typical fields:

```text
Ticket ID
Title
Description
Category
Subcategory
Priority
Status
Requester
Department
Location
Assigned Team
Assigned Engineer
Asset
Created Date
Updated Date
Due Date
Resolution
Remarks
```

Again, use the actual database/API model.

---

# 15. TICKET WORKFLOW

Restore the complete workflow.

Possible states:

```text
New
Open
Assigned
In Progress
Pending
Resolved
Closed
Reopened
```

Only use states supported by the application.

Actions should include appropriate:

```text
Assign
Reassign
Change Status
Change Priority
Add Comment
Resolve
Close
Reopen
```

Every state transition must be backed by actual business logic.

---

# 16. TICKET DETAILS

Create a professional ticket detail view.

Suggested structure:

```text
Ticket Header
    ↓
Status / Priority / Assignment
    ↓
Description
    ↓
Asset information
    ↓
Requester information
    ↓
Comments
    ↓
Activity History
    ↓
Resolution
```

Use a timeline for history if appropriate.

---

# 17. USERS AND TEAMS

Restore the existing user/team management functionality.

Users should support whatever fields the existing system provides.

Examples:

```text
Name
Employee ID
Username
Email
Department
Team
Role
Status
```

Teams:

```text
Team name
Description
Members
Team lead
Status
```

Do not remove RBAC.

---

# 18. REPORTING

Restore all existing reports.

If export functionality exists, restore it.

Potential formats:

```text
CSV
Excel
PDF
```

Only implement formats supported by the project.

Report filters should actually affect the generated report.

---

# 19. AUDIT LOG

The audit module is security-sensitive.

Display actual audit records.

Possible columns:

```text
Timestamp
User
Action
Module
Record
IP/Client information if already supported
Result
```

Do not fabricate audit records.

Audit records must come from the backend.

---

# 20. SEARCH / FILTER / SORT / PAGINATION

Do not forget these.

Every major table should preserve existing functionality.

Implement where already supported:

```text
Global search
Module search
Filters
Date filters
Status filters
Priority filters
Department filters
Team filters
Location filters
Sorting
Pagination
Reset filters
Refresh
```

The frontend and backend must agree on parameter names.

---

# 21. BUTTON AUDIT

This is mandatory.

After implementing the redesign, inspect EVERY button in the application.

Create an internal audit:

```text
Button
↓
Expected action
↓
Handler
↓
API call
↓
Backend endpoint
↓
Database operation
↓
Result
↓
UI update
```

Every button must fall into one of these categories:

```text
Functional
Disabled intentionally with explanation
```

There must be NO:

```text
Dead button
Placeholder button
Fake button
Decorative action pretending to work
```

Pay special attention to:

```text
+ Add
Save
Update
Delete
Edit
View
Assign
Submit
Close
Cancel
Reset
Search
Filter
Export
Refresh
Back
Next
Previous
```

---

# 22. FIELD AUDIT

Perform the same audit for every form field.

Every field must have:

```text
Label
Input/control
Correct state
Correct data type
Validation
Form binding
API mapping
Backend mapping
Database mapping
```

Trace:

```text
UI field
↓
React state/form
↓
API request
↓
Express controller
↓
service
↓
SQL query
↓
database column
```

There must be no disconnected form fields.

---

# 23. API INTEGRATION

Audit every frontend service.

Find:

```text
fetch
axios
API clients
hooks
queries
mutations
```

Map each to the backend.

Verify:

```text
HTTP method
URL
parameters
headers
authentication
request body
response body
error handling
```

Fix frontend/backend contract mismatches.

---

# 24. DATABASE

The database is the source of actual operational data.

Do NOT replace database operations with static mock data just to make the UI look complete.

Verify:

```text
SQL Server connection
queries
CRUD
relationships
constraints
transactions
error handling
```

Preserve existing data.

Do not run destructive database operations without explicit authorization.

---

# 25. LOADING / EMPTY / ERROR STATES

Every major page must gracefully handle:

### Loading

Show a proper loading state.

### Empty

Show:

```text
No records found
```

with appropriate actions where applicable.

### Error

Show a useful error message and retry option where appropriate.

The entire application must NEVER turn into a blank page because one API call failed.

---

# 26. RESPONSIVENESS

The primary target is desktop enterprise use.

Still ensure the application behaves correctly at:

```text
1920x1080
1600x900
1440x900
1366x768
1280x720
```

The current screenshot demonstrates that the application has a large desktop viewport.

The content area must use the available viewport correctly.

Do not allow the sidebar to consume the entire functional layout.

---

# 27. VISUAL DESIGN SYSTEM

Use a consistent design system.

Define consistent:

```text
Typography
Spacing
Buttons
Inputs
Tables
Cards
Badges
Modals
Tabs
Alerts
Dropdowns
Forms
Page headers
Breadcrumbs
```

Do not style each page independently.

Create reusable components.

Examples:

```text
PageHeader
DataTable
SearchBar
FilterPanel
StatusBadge
PriorityBadge
Modal
ConfirmDialog
FormField
SelectField
DateField
EmptyState
ErrorState
LoadingState
StatCard
```

Reuse them throughout the application.

---

# 28. DO NOT DESTROY THE BACKEND TO FIX THE UI

The redesign should primarily affect the presentation layer.

Do NOT rewrite the backend unless an actual backend problem is discovered.

If backend changes are necessary, make them carefully and preserve API compatibility where possible.

---

# 29. DO NOT USE MOCK DATA AS A PERMANENT SOLUTION

Temporary mock data may be used during UI development if absolutely necessary, but it must NOT remain as the production implementation when a real API/database exists.

Before completion:

```text
No fake inventory
No fake tickets
No fake users
No fake audit logs
No fake dashboard statistics
```

unless the repository explicitly defines them as seed/demo data.

---

# 30. FIX THE CURRENT BLANK SCREEN

The current blank-screen condition must be resolved first.

Trace:

```text
Browser
↓
React entry
↓
App
↓
Router
↓
Layout
↓
Page
↓
Data loading
```

Find the exact failure.

Do not simply hardcode a dashboard.

After fixing it, continue with the full redesign and functionality restoration.

---

# 31. TEST EVERY PAGE

After implementation, manually test every discovered route.

For every page:

```text
Open page
↓
Wait for loading
↓
Verify content
↓
Click every major button
↓
Open forms
↓
Submit valid data
↓
Test validation
↓
Test cancel
↓
Test edit
↓
Test delete where applicable
↓
Test search
↓
Test filter
↓
Test refresh
↓
Test browser refresh
↓
Test direct URL
```

Do not report success simply because the page visually renders.

---

# 32. TEST ALL USER FLOWS

At minimum test:

## Asset lifecycle

```text
Create asset
↓
View asset
↓
Edit asset
↓
Assign asset
↓
Move asset
↓
View history
↓
Decommission/delete if supported
```

## Ticket lifecycle

```text
Create ticket
↓
Assign ticket
↓
Change status
↓
Change priority
↓
Add comment
↓
Resolve
↓
Close
↓
Reopen if supported
```

## Authentication

```text
Login
↓
Load dashboard
↓
Navigate
↓
Permission enforcement
↓
Logout
```

Use the actual workflows implemented by the project.

---

# 33. BROWSER CONSOLE

The browser console must be inspected.

Do not leave unresolved:

```text
React errors
Unhandled promise rejections
Failed imports
404s
500s
CORS errors
TypeErrors
ReferenceErrors
```

Warnings that are harmless may remain, but investigate them rather than ignoring everything.

---

# 34. BUILD VALIDATION

Run all available project checks.

For example:

```bash
npm run build
npm run lint
npm test
```

Only use scripts that actually exist.

Fix failures instead of suppressing them.

---

# 35. SECURITY

This is an internal IT management application.

Do not introduce insecure shortcuts.

Never:

```text
disable authentication
disable authorization
hardcode credentials
expose secrets
use raw SQL interpolation
disable security middleware
disable CORS protection globally
```

Use:

```text
parameterized SQL
input validation
server-side authorization
secure authentication
safe error handling
```

---

# 36. GIT SAFETY

Before major changes:

```bash
git status
```

Do not destroy existing user work.

Do NOT use:

```bash
git reset --hard
git clean -fd
```

unless explicitly authorized.

If useful, create a checkpoint commit before major restructuring.

---

# 37. IMPLEMENTATION ORDER

Follow this order.

## Phase 1 — Discovery

```text
Inspect repository
Inspect git history
Inspect frontend
Inspect backend
Inspect database
Map routes
Map APIs
Map functionality
```

## Phase 2 — Recovery

```text
Fix blank screen
Restore application shell
Restore routes
Reconnect existing components
Reconnect APIs
```

## Phase 3 — Design

```text
Implement new design system
Implement application shell
Implement navigation
Implement page layouts
Implement reusable components
```

## Phase 4 — Functional restoration

```text
Dashboard
Inventory
Assets
Tickets
Users
Teams
Reports
Audit
Settings
Authentication
RBAC
```

Use the actual modules found in the repository.

## Phase 5 — Integration

```text
API
Database
Forms
Validation
CRUD
Search
Filters
Pagination
```

## Phase 6 — Validation

```text
Browser
Console
Network
Build
Lint
Tests
All routes
All major workflows
```

---

# 38. IMPORTANT: DO NOT REMOVE FUNCTIONALITY TO MAKE THE DESIGN CLEANER

If the old UI had 20 fields and the new design only visually needs 8 fields, DO NOT delete the other 12.

Instead:

* group them
* use tabs
* use expandable sections
* use advanced fields
* use a details panel
* use secondary information sections

The design should organize complexity, not eliminate business functionality.

Likewise:

If there were 15 actions, do not reduce them to 3 just because 3 looks cleaner.

Use:

```text
Primary action
Secondary actions
More actions menu
Contextual actions
```

while preserving every function.

---

# 39. THE NEW UI SHOULD FEEL LIKE A REAL ENTERPRISE PRODUCT

Target the quality level of a serious internal IT management platform.

The application should feel coherent across all modules.

Example visual hierarchy:

```text
Application Header
    ↓
Page Header
    ↓
Page Description / Breadcrumb
    ↓
Primary Actions
    ↓
Filters / Search
    ↓
Data / Forms
    ↓
Secondary information
```

Use consistent spacing and hierarchy.

Avoid:

* giant empty areas
* oversized decorative elements
* unnecessary animations
* excessive gradients
* excessive rounded cards
* meaningless icons
* fake metrics
* placeholder text
* empty dashboard widgets

The interface should prioritize operational efficiency.

---

# 40. FINAL FUNCTIONALITY AUDIT

Before declaring completion, perform a final repository-wide search for orphaned functionality.

Search for components/functions that are defined but no longer used.

Examples:

```text
export function ...
export const ...
const handle...
function handle...
```

Identify important functions that are disconnected from the UI.

Reconnect them where appropriate.

Also search for TODO/FIXME items that represent incomplete functionality.

---

# 41. FINAL BUTTON AUDIT

Literally inspect the final application page by page.

For EVERY visible button ask:

```text
What does this button do?
Where is its handler?
Does the handler execute?
Does it call the correct API?
Does the API work?
Does the UI update after success?
Does the UI handle failure?
```

If you cannot answer these questions, the implementation is incomplete.

---

# 42. FINAL FIELD AUDIT

For EVERY visible input:

```text
Where is its state?
Where is its validation?
Where is it submitted?
Which API field receives it?
Which database field stores it?
```

If it is display-only, make that clear.

If it is editable, it must actually work.

---

# 43. FINAL ACCEPTANCE CRITERIA

The project is complete only when:

### UI

* Modern redesigned UI implemented.
* Sidebar works.
* Main content works.
* All pages render.
* Layout is responsive.
* Visual system is consistent.

### Functionality

* Existing functionality restored.
* Buttons work.
* Forms work.
* Fields work.
* Tables work.
* Filters work.
* Search works.
* CRUD works.
* Modals work.
* Navigation works.
* Workflows work.

### Backend

* APIs work.
* Authentication works.
* Authorization works.
* Error handling works.

### Database

* SQL Server works.
* Queries work.
* Existing data is preserved.
* CRUD operations work.

### Quality

* No blank pages.
* No major runtime exceptions.
* No dead buttons.
* No fake production data.
* No broken routes.
* No disconnected forms.

---

# 44. FINAL REPORT

At the end, provide:

## 1. Original Problem

Explain why the previous redesign resulted in the sidebar-only/blank-content state.

## 2. Root Cause

Identify the actual technical root cause.

## 3. Functionality Recovered

List all recovered modules/functions.

## 4. New UI

Explain the new design structure.

## 5. Files Changed

List modified files and purpose.

## 6. Backend Changes

List backend changes.

## 7. Database Changes

List database changes.

## 8. API Changes

List API changes.

## 9. Testing

Report:

```text
Frontend: PASS/FAIL
Backend: PASS/FAIL
Database: PASS/FAIL
Authentication: PASS/FAIL
RBAC: PASS/FAIL
Dashboard: PASS/FAIL
Inventory: PASS/FAIL
Assets: PASS/FAIL
Tickets: PASS/FAIL
Users: PASS/FAIL
Teams: PASS/FAIL
Reports: PASS/FAIL
Audit: PASS/FAIL
Settings: PASS/FAIL
Navigation: PASS/FAIL
Forms: PASS/FAIL
CRUD: PASS/FAIL
Search: PASS/FAIL
Filters: PASS/FAIL
Pagination: PASS/FAIL
Build: PASS/FAIL
Lint: PASS/FAIL
Tests: PASS/FAIL
Browser validation: PASS/FAIL
```

## 10. Remaining Issues

If anything remains unresolved, explicitly state it.

Do not claim success if something remains broken.

---

# 45. FINAL INSTRUCTION TO CLAUDE

You are not being asked to make a mockup.

You are not being asked to create a simplified replacement.

You are not being asked to make only the dashboard look good.

You are being asked to **recover and modernize the entire existing IT Inventory & Ticketing application**.

The existing application contains business logic and functionality that must be preserved.

**The redesign must sit on top of the functionality — not replace it.**

Use this sequence:

```text
DISCOVER
    ↓
UNDERSTAND
    ↓
RECOVER
    ↓
RECONNECT
    ↓
REDESIGN
    ↓
IMPLEMENT
    ↓
INTEGRATE
    ↓
TEST
    ↓
AUDIT
    ↓
FIX
    ↓
TEST AGAIN
```

Do not stop when the UI looks good.

Do not stop when the sidebar works.

Do not stop when the dashboard appears.

Do not stop when `npm run build` succeeds.

Continue until the application is **visually redesigned AND functionally complete**.

The final product must be a working enterprise IT Inventory & Ticketing system, with the new design and the full original feature set restored.
