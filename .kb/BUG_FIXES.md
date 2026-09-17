# Bug Fixes

| Bug | Severity | Root Cause | Fix | Date | Issue # |
|---|---|---|---|---|---|
| Missing Canada (`ca`) data center domain | Medium | `ZOHO_DOMAINS` and `ZOHO_ACCOUNTS_DOMAINS` in `types.ts` omit the `ca` key | Add `ca: "https://sprintsapi.zohocloud.ca/zsapi"` and corresponding accounts URL | 2026-08-21 | local |
| `zod` not in direct dependencies | Medium | `zod` is used in all tool files but not listed in `package.json` `dependencies` | Add `"zod": "^3.x.x"` to `dependencies` in `package.json` | 2026-08-21 | local |
| Sprint `add_comment` doesn't convert Markdown | Minor | `sprints.ts` `add_comment` posts `name` directly; items `add_comment` runs `markdownToHtml()` | Apply `markdownToHtml(p.name!)` in sprint add_comment handler | 2026-08-21 | local |
| Item-tree responses hide records and include the root in `list_subitems` | High | The formatter summarized arrays after 20 records, while Zoho's subitem endpoint also returned the requested root item | Preserve compact actionable fields for complete item/attachment responses, forward pagination, and filter the requested root from `list_subitems` results | 2026-09-17 | LT#2315 |
