Summary
Enhance the Library Sidebar with powerful filtering/sorting and a denser, power-user layout; make the running state obvious at-a-glance; and redesign the Add App flow to classify apps by type: terminal (process), browser (bookmark), or both.

Why
- Quickly find apps (recently used, running now, A–Z)
- Fit many more items in the sidebar without scrolling
- Clear status affordances beyond a small blue word
- Capture the “what is this?” intent during Add App to streamline fields and validation

Scope
1) Sidebar Filters & Sorting
- Filters:
  - Running only (toggle)
  - Recently used: This month, Last month, Last 3 months
- Sorting:
  - A–Z / Z–A
  - Recently used (desc)
- Behavior:
  - Composable filter + sort (e.g., Running + A–Z)
  - Persist last choice in localStorage
  - Reasonable defaults: sort by Recently used, no filters

2) Clear Running Indicators (Sidebar)
- Replace textual “Running/Stopped” with compact, accessible visuals:
  - Running: solid blue dot + subtle pulse (CSS animation), tooltip “Running”
  - Starting/Stopping: animated spinner/bar, tooltip reflects state
  - Stopped: muted grey dot (no animation), tooltip “Stopped”
- Remove verbose words in list items; rely on iconography and color

3) Sidebar Density (Power-user compact list)
- Target item height ~36–44px (configurable via CSS variables)
- Tighten paddings/line-heights; truncate secondary text
- Replace verbose labels with icons (bookmark/process) and one subtle metadata line (e.g., cwd or domain)
- Goal: fit ~18–24 items at default window height (vs ~8 today)

4) App Type Classification
- Add appType: 'process' | 'bookmark' | 'both' to AppConfig (TS + Rust + JSON schema)
- Sidebar shows small glyph for type:
  - process: terminal icon
  - bookmark: external-link icon
  - both: combined/badged icon

5) Add App Modal – “What is this?” first
- New first step/section: select app type
  - a) Terminal + Browser launcher (both)
  - b) Just Browser (bookmark)
  - c) Just Terminal (process)
- Dynamic fields by type:
  - process: Launch Commands (multiline), Working Dir
  - bookmark: URL only
  - both: Launch Commands + URL (+ Working Dir)
- Validation:
  - Require fields appropriate to selection; remove global requirement of Launch Commands
  - Helpful inline hints and examples

Data Model & Storage
- Add appType to AppConfig (TS + Rust serde) and oddbox-config.schema.json
- Track lastUsedAt (ISO string) + increment useCount on Start/Open
- Migration: existing apps infer appType:
  - has launchCommands only => process
  - has url only => bookmark
  - has both => both
- Back-compat: existing configs load; default appType inferred at runtime if missing

UI/UX Details
- Filters control placed at top of sidebar beneath search (icons + compact chips)
- Status colors follow project scheme (blue active, red only for destructive)
- Tooltips for all icons; ensure high-contrast focus states
- Persist user choices in localStorage

Acceptance Criteria
- Sidebar can filter by Running and by recent usage windows; sort A–Z/Z–A and by Recently used
- Filter + sort selections persist across app restarts
- Running/Starting/Stopped states render with clear icons/animation; words removed from list rows
- Sidebar density increased to roughly 36–44px rows; >18 items visible at default window
- App type icon visible per item (process/bookmark/both)
- Add App flow begins with type selection and shows context-appropriate fields
- Validation requires only fields relevant to type; URL-only apps can be created
- lastUsedAt/useCount update when starting processes or opening bookmarks
- JSON schema, TS types, and Rust structs updated; old configs still work

Verification Steps
- Create each type (process, bookmark, both); all save and load
- Start process app: terminal shows output; browser opens if configured
- Open bookmark app: launches default browser; no process tracked; terminal shows “Opening …” line
- Filters: Running shows only active; Recently used windows change results appropriately
- Sorting: A–Z/Z–A/Recently used reorder the list as expected
- Restart app: filter/sort choices persist
- Confirm row height and densified layout in CSS devtools (~36–44px)
- Import/export round-trips appType and timing fields

Out of Scope (for this ticket)
- Groups/folders in sidebar
- Advanced analytics beyond lastUsedAt/useCount
- Custom theming for density; start with one compact mode

Tech Notes
- Types/Schema: update TS AppConfig, Rust models, JSON schema; migration utility for inference
- State: persist filter/sort in localStorage; new context or extend existing sidebar state
- Events: bump lastUsedAt/useCount in process start success and bookmark open actions
- Accessibility: aria-labels/tooltips for status/type icons; ensure animations respect reduced motion
