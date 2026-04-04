# Archive Folder

Keep `docs/archive/` lean. It is the place for historical snapshots, exports, or housekeeping notes that would otherwise clutter `docs/`.

Examples of archived content:
- SQL schema dumps, migration backups, and database audit summaries that are valuable for reference but not part of the active narrative.
- Retired planning notes or summaries that show why past decisions were made.
- Build artifacts, logs, or external exports that must stay versioned but are not part of the living documentation.

Guidelines:
1. Do not edit archive files unless you are on a deliberate cleanup/restore path. Instead, move the file back to `docs/` and refresh it there.
2. Use clear file names so the archived context is discoverable later (e.g., `sql/`, `build/`, `notes/` subdirectories).
3. When adding new archive content, explain why it cannot live under `docs/` yet and what future action should promote or retire it.
