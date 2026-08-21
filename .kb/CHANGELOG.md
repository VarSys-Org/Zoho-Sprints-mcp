# Changelog

## [Unreleased]

### Added
- `.kb/` knowledge base directory for project tracking (2026-08-21)
- `docs/zoho-sprints-api-reference.md` — complete offline Zoho Sprints REST API reference (2026-08-21)
- `zod ^4.3.6` as explicit direct dependency in `package.json` (2026-08-21)

### Changed
- `items.ts`: `create` and `create_subitem` now send data as form body instead of URL query params (2026-08-21)

### Fixed
- `types.ts`: Added Canada (`ca`) data center to `ZOHO_DOMAINS` and `ZOHO_ACCOUNTS_DOMAINS` (2026-08-21)
- `sprints.ts`: `add_comment` now converts Markdown to HTML via `markdownToHtml()` — consistent with item comments (2026-08-21)

