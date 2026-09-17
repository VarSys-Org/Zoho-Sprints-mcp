# Changelog

All notable changes to this fork will be documented in this file.

## [Unreleased]

### Fixed

- `list_subitems` now forwards pagination parameters and removes the root item
  that Zoho incorrectly includes in descendant responses.
- Large item-tree and attachment responses now preserve every actionable
  record, including item IDs, parent links, descriptions, and attachment
  metadata, instead of showing only the first 20 records.

## [1.0.2] - 2026-08-11

### Added

- `edit_comment` operation for modifying existing comments without delete+recreate
- `list_subitems` operation for listing all subitems of an item
- `update_subitem` operation for updating subitem fields (name, description, status, points, dates)
- `delete_subitem` operation for deleting a subitem
- `list_attachments` operation for listing all attachments on an item
- `delete_attachment` operation for deleting an attachment
- `put()` HTTP method in API client for proper partial updates
- Response formatter now summarizes large list responses (>8KB) instead of dumping raw JSON
- `toolResult` now catches `{error}` and `{code: 7700}` error shapes, not just `{status: "failure"}`

### Fixed

- **CRITICAL: `pick()` falsy value bug** -- Fields set to `"0"`, `"false"`, or `""` were silently dropped. Now uses `!== undefined && !== null` check.
- **Auth failure handler** -- Uncommented code 7700 handler for auto token refresh on Zoho auth failures
- **Timesheet endpoints** -- All 4 operations fixed (list, add_item_log, add_general, get_details, delete)
- **Timesheet field names** -- `hours` -> `duration`, `logdate` -> `date`, `billstatus` -> `isbillable`
- **Timesheet content-type** -- Changed from form-urlencoded to multipart/form-data

### Changed

- `manage_items` tool now has 27 operations (was 21)
- `manage_timesheets` tool now has 5 operations (was 4, all broken)
- Tool descriptions updated to include new operations
- Input schemas updated with new fields (`subitemId`, `attachmentId`)

## [1.0.1] - 2026-08-10 (original upstream)

### Fixed

- Timesheet API endpoints and field names
- Added `get_details` and `delete` operations for timesheets

## [1.0.0] - 2026-04-17 (original upstream)

### Added

- Initial release with 15 tools and 127 operations
