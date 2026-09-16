# Zoho Sprints REST API — Offline Reference
> **Source:** Verified from https://sprints.zoho.com/apidoc.html + MCP implementation cross-check  
> **Last Updated:** 2026-08-21 | **API Version:** v1

---

## Table of Contents
1. [Overview & Base URLs](#1-overview--base-urls)
2. [Authentication](#2-authentication)
3. [Request Headers](#3-request-headers)
4. [Pagination](#4-pagination)
5. [Rate Limiting & Retries](#5-rate-limiting--retries)
6. [Portal / Workspace](#6-portal--workspace)
7. [Projects](#7-projects)
8. [Sprints](#8-sprints)
9. [Items (Work Items)](#9-items-work-items)
10. [Epics](#10-epics)
11. [Releases](#11-releases)
12. [Timesheets](#12-timesheets)
13. [Meetings](#13-meetings)
14. [Users](#14-users)
15. [Project Settings](#15-project-settings)
16. [Checklists](#16-checklists)
17. [Webhooks](#17-webhooks)
18. [OKR](#18-okr)
19. [Expenses](#19-expenses)
20. [Custom Modules](#20-custom-modules)
21. [Common Field Values](#21-common-field-values)

---

## 1. Overview & Base URLs

### Data Centers

| Region | Sprints App URL | API Base URL | Accounts URL |
|---|---|---|---|
| **US** | `sprints.zoho.com` | `https://sprintsapi.zoho.com/zsapi` | `https://accounts.zoho.com` |
| **EU** | `sprints.zoho.eu` | `https://sprintsapi.zoho.eu/zsapi` | `https://accounts.zoho.eu` |
| **India** | `sprints.zoho.in` | `https://sprintsapi.zoho.in/zsapi` | `https://accounts.zoho.in` |
| **Australia** | `sprints.zoho.com.au` | `https://sprintsapi.zoho.com.au/zsapi` | `https://accounts.zoho.com.au` |
| **China** | `sprints.zoho.com.cn` | `https://sprintsapi.zoho.com.cn/zsapi` | `https://accounts.zoho.com.cn` |
| **Japan** | `sprints.zoho.jp` | `https://sprintsapi.zoho.jp/zsapi` | `https://accounts.zoho.jp` |
| **Saudi Arabia** | `sprints.zoho.sa` | `https://sprintsapi.zoho.sa/zsapi` | `https://accounts.zoho.sa` |
| **Canada** | `sprints.zohocloud.ca` | `https://sprintsapi.zohocloud.ca/zsapi` | `https://accounts.zohocloud.ca` |

### URL Pattern
```
{API_BASE_URL}/team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/
```

The `teamId` is the **portal ID** (also called `zsoid`). Retrieve it from `GET /teams/`.

---

## 2. Authentication

### OAuth 2.0 Scopes

| Scope | Access |
|---|---|
| `ZohoSprints.portals.ALL` | Workspace read/write |
| `ZohoSprints.projects.ALL` | Projects read/write |
| `ZohoSprints.sprints.ALL` | Sprints read/write |
| `ZohoSprints.items.ALL` | Work items read/write |
| `ZohoSprints.epics.ALL` | Epics read/write |
| `ZohoSprints.releases.ALL` | Releases read/write |
| `ZohoSprints.timesheets.ALL` | Timesheets read/write |
| `ZohoSprints.meetings.ALL` | Meetings read/write |
| `ZohoSprints.users.ALL` | Users read/write |
| `ZohoSprints.webhooks.ALL` | Webhooks read/write |
| `ZohoSprints.okr.ALL` | OKR read/write |
| `ZohoSprints.expenses.ALL` | Expenses read/write |

> **Tip:** Use comma-separated scopes:
> `ZohoSprints.portals.ALL,ZohoSprints.projects.ALL,ZohoSprints.sprints.ALL,ZohoSprints.items.ALL,ZohoSprints.epics.ALL,ZohoSprints.releases.ALL,ZohoSprints.timesheets.ALL,ZohoSprints.meetings.ALL,ZohoSprints.users.ALL`

### Token Refresh
```http
POST https://accounts.zoho.{domain}/oauth/v2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token={token}&client_id={id}&client_secret={secret}
```

Response: `{ "access_token": "...", "token_type": "Bearer", "expires_in": 3600 }`

Tokens expire in **60 minutes**. Recommended: refresh proactively at ~57 minutes.

### Error Codes (Authentication)
- HTTP `401` — token expired or invalid
- JSON `{ "code": 7700, "message": "Authentication failed" }` — Zoho auth failure (can arrive with any HTTP status)

---

## 3. Request Headers

### Required on Every API Call
```
Authorization: Zoho-oauthtoken {access_token}
```

### Recommended Zoho-Specific Headers
These internal headers improve response quality:

| Header | Value | Effect |
|---|---|---|
| `X-ZA-CONVERT-RESPONSE` | `true` | Converts internal Zoho response format to standard JSON |
| `X-ZA-UI-VERSION` | `v2` | Requests v2 response schema (more complete data) |
| `X-ZA-REQSIZE` | `large` | Returns larger response payloads (more fields) |

### Content Types
- **Form data (most POSTs):** `Content-Type: application/x-www-form-urlencoded`
- **JSON body (epics, releases, OKR, etc.):** `Content-Type: application/json`
- **Timesheet logs:** `multipart/form-data`

---

## 4. Pagination

Most list endpoints support:

| Parameter | Type | Description |
|---|---|---|
| `index` | string | Starting record index (1-based). Default: `"1"` |
| `range` | string | Number of records per page. Max varies by endpoint (typically 50-100) |

The response typically includes `totalCount`, `index`, and `range` fields.

---

## 5. Rate Limiting & Retries

- **Rate limit:** ~30 requests/minute (synced via `x-rate-limit` response header)
- **HTTP 429:** Server sends `Retry-After` header with seconds to wait
- **Recommended retry:** Exponential backoff — 1s, 2s, 4s (max 3 retries)

---

## 6. Portal / Workspace

### List Portals (Get Team ID)
```http
GET /teams/
```
Response: `portals[]` array. Each has `zsoid` (= teamId) and `team_name`.

### Get Workspace Settings
```http
GET /team/{teamId}/settings/
```

### Get Link Types
```http
GET /team/{teamId}/linktype/?action=data
```

### Get Tags
```http
GET /team/{teamId}/tags/?action=data&index=1&range=100
```

### Create Tag
```http
POST /team/{teamId}/tag/
name={name}&color={hexColor}
```
| Param | Required | Description |
|---|---|---|
| `name` | YES | Tag name |
| `color` | NO | Hex color, e.g. `#fa335c` |

### Delete Tag
```http
DELETE /team/{teamId}/tag/{tagId}/
```

### Delete Link Type
```http
DELETE /team/{teamId}/linktype/{linktypeId}/
```

### Get Global Log Hours
```http
GET /team/{teamId}/portfolio/{viewType}/modules/{moduleId}/view/{viewNumber}/?action=data&index=1&range=50
```
| Param | Values | Description |
|---|---|---|
| `viewType` | `0`=Team, `1`=My | View scope |
| `viewNumber` | `10` if Team, `12` if My | Internal view ID |

### Get Workspace Members
```http
GET /team/{teamId}/members/
```

---

## 7. Projects

### List Projects
```http
GET /team/{teamId}/projects/?action=data&index=1&range=50
```
| Param | Values | Description |
|---|---|---|
| `projectstatus` | `1`=Active, `2`=Archive, `6`=Template | Filter by status |
| `viewby` | `0`=All, `1`=Favorites, `2`=Group, `3`=Owner | Grouping |
| `searchvalue` | string | Search by project name |

### Get All Projects (Overview)
```http
GET /team/{teamId}/projects/?action=allprojects
```

### Get Project Details
```http
GET /team/{teamId}/projects/{projectId}/?action=details
```

### Get Backlog ID
```http
GET /team/{teamId}/projects/{projectId}/?action=getbacklog
```
Returns the backlog sprint ID. Use this ID as `sprintId` for backlog item operations.

### Create Project
```http
POST /team/{teamId}/projects/
Content-Type: application/x-www-form-urlencoded

name={name}&owner={userId}&projgroup={groupId}
```
| Param | Required | Description |
|---|---|---|
| `name` | YES | Project name |
| `owner` | YES | Owner user ID |
| `projgroup` | YES | Project group ID |
| `desc` | NO | Description |
| `prefix` | NO | Up to 3-char prefix for item numbering |
| `estimationtype` | NO | `0`=Fibonacci, `2`=Custom |
| `startdate` | NO | ISO date e.g. `2025-01-01T00:00:00+05:30` |
| `enddate` | NO | ISO date |
| `clonefrom` | NO | Template project ID |
| `projectlayoutid` | NO | Project layout ID |
| `itemlayoutid` | NO | Item layout ID |
| `epiclayoutid` | NO | Epic layout ID |
| `meetinglayoutid` | NO | Meeting layout ID |

### Update Project
```http
POST /team/{teamId}/projects/{projectId}/
name={name}&owner={userId}&projgroup={groupId}&status={status}
```
All params are optional.

### Delete Project
```http
DELETE /team/{teamId}/projects/{projectId}/
```

### List Project Groups
```http
GET /team/{teamId}/projectgroups/?action=data&index=1&range=50
```

### Create Project Group
```http
POST /team/{teamId}/projectgroups/
action=create&name={name}
```

### Get Project Priorities
```http
GET /team/{teamId}/projects/{projectId}/priority/?action=data&index=1&range=25
```

---

## 8. Sprints

### List Sprints
```http
GET /team/{teamId}/projects/{projectId}/sprints/?action=data&type=[1,2]&index=1&range=50
```
| Param | Values | Description |
|---|---|---|
| `type` | JSON array | `1`=Upcoming, `2`=Active, `3`=Completed, `4`=Canceled. Default: `[1,2]` |
| `searchvalue` | string | Search by sprint name |

### Get Sprint Details
```http
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/?action=details
```

### Create Sprint
```http
POST /team/{teamId}/projects/{projectId}/sprints/
name={name}
```
| Param | Required | Description |
|---|---|---|
| `name` | YES | Sprint name |
| `description` | NO | Description |
| `startdate` | NO | ISO date |
| `enddate` | NO | ISO date |
| `duration` | NO | e.g. `2w` — max 8w with strict scrum, 30w without |
| `scrummaster` | NO | User ID |
| `users` | NO | JSON array of user IDs |

### Update Sprint
```http
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/
name={name}&description={desc}&startdate={date}&enddate={date}
```
All params optional.

### Sprint Lifecycle
```http
# Start sprint
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/start/

# Complete sprint (all items must be closed first)
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/complete/
action=complete

# Cancel sprint (all items must be closed first)
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/cancel/
action=cancel

# Replan sprint
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/replan/

# Reopen completed/cancelled sprint
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/reopen/
```

### Delete Sprint
```http
DELETE /team/{teamId}/projects/{projectId}/sprints/{sprintId}/
```

### Sprint Comments
```http
# List comments (get moduleId from get_modules for "Sprints")
GET /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/{sprintId}/notes/?action=data&index=1&range=20

# Add comment (accepts HTML content)
POST /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/{sprintId}/notes/
action=addnotes&name={commentHtml}

# Delete comment
DELETE /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/{sprintId}/notes/{notesId}/
```

---

## 9. Items (Work Items)

### List Items in Sprint/Backlog
```http
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/?action=data&index=1&range=50
```
| Param | Description |
|---|---|
| `subitem` | `"true"` to include subitems |
| `searchby` | `"id"`, `"name"`, or `"both"` |
| `searchvalue` | Search term |
| `filter` | JSON: `{"I-owner":["userId"],"I-enddate":["overdue"],"queryType":1,"jsontmpl":"item_default"}` |

### Get Item Count
```http
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/?action=itemcountdata
```
Same filter params as list.

### Get Item Details
```http
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/?action=details
```

### Get Multiple Items
```http
GET /team/{teamId}/projects/{projectId}/item/?action=multipledetails&itemidarr=[id1,id2]
```
| Param | Description |
|---|---|
| `itemidarr` | JSON array of item IDs |
| `itemnoarr` | JSON array of item numbers (alternative) |

### Get Item Activity
```http
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/activity/?index=1&range=20
```

### Create Item
```http
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/
Content-Type: application/x-www-form-urlencoded

name={name}&projitemtypeid={typeId}&projpriorityid={priorityId}
```
| Param | Required | Description |
|---|---|---|
| `name` | YES | Item name |
| `projitemtypeid` | YES | Item type ID (from `get_item_types`) |
| `projpriorityid` | YES | Priority ID (from `get_priorities`) |
| `description` | NO | HTML description |
| `statusid` | NO | Status ID (from `get_project_status`) |
| `epicid` | NO | Epic ID |
| `users` | NO | JSON array of user IDs |
| `point` | NO | Story point index |
| `startdate` | NO | ISO date |
| `enddate` | NO | ISO date |
| `duration` | NO | Duration string |

### Update Item
```http
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/
name={name}&statusid={id}&projpriorityid={id}
```
| Param | Description |
|---|---|
| `name` | Item name |
| `description` | HTML description |
| `projitemtypeid` | Item type ID |
| `projpriorityid` | Priority ID |
| `epicid` | Epic ID |
| `statusid` | Status ID |
| `chkdependent` | `"false"` to skip linked-item status check |
| `newusers` | JSON array of user IDs to add |
| `delusers` | JSON array of user IDs to remove |
| `point` | Story points index |
| `startdate` | ISO date |
| `enddate` | ISO date |

### Move Items to Another Sprint/Project
```http
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/bulkupdate/
action=moveitem&itemidarr=[id1,id2]&tosprintid={sprintId}
```
| Param | Required | Description |
|---|---|---|
| `itemidarr` | YES | JSON array of item IDs |
| `tosprintid` | YES | Target sprint ID |
| `toprojectid` | NO | Target project ID (cross-project move) |

### Delete Item
```http
DELETE /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/
```

### Item Comments
```http
# List comments
GET /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/{itemId}/notes/?action=data&index=1&range=20

# Add comment (HTML content)
POST /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/{itemId}/notes/
action=addnotes&name={commentHtml}

# Edit comment
POST /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/{itemId}/notes/{notesId}/
action=editnotes&name={commentHtml}

# Delete comment
DELETE /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/{itemId}/notes/{notesId}/
```

### Linked Items
```http
# Get linked items
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/linkitem/?action=data

# Link items
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/linkitem/
action=linkitems&linkitemobj={"directlink":["itemId"]}&linktosprintid={id}&linktoprojectid={id}&linktypeid={id}

# Remove link
DELETE /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/linkitem/
linktypeid={id}&linktoprojectid={id}&destitemid={id}
```

### Tags
```http
# Get item tags
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/tags/?action=itemassociatedtagIds

# Update item tags
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/tags/
action=associateupdate&reassociate={true|false}&newtags=[tagId1,tagId2]
```
`reassociate=true` replaces all tags; `false` appends.

### Followers
```http
# Get followers
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/followers/?action=getfollowers

# Update followers
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/followers/
action=updatefollowers&newusers=[userId]&delusers=[userId]
```

### Timer
```http
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/timer/?action=itemtimer&itemIdArr=[id1,id2]
```

### Subitems
```http
# List subitems
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/subitem/?action=data

# Create subitem (same required params as create item)
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/subitem/
name={name}&projitemtypeid={typeId}&projpriorityid={priorityId}

# Update subitem
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/subitem/{subitemId}/
name={name}&statusid={id}

# Delete subitem
DELETE /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/subitem/{subitemId}/
```

### Attachments
```http
# List attachments
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/attachments/?action=notes&index=1&range=50

# Delete attachment
DELETE /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/attachment/{attachmentId}/
```

### Block / Unblock
```http
# Block item
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/
action=blockitem&blockreason={reason}

# Unblock item
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/
action=unblockitem
```

### Associate Items with Epic
```http
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/associate/
epicid={epicId}&rootitemidarr=[itemId1,itemId2]
```

---

## 10. Epics

### List Epics
```http
GET /team/{teamId}/projects/{projectId}/epic/?action=data&index=1&range=50
```
| Param | Values | Description |
|---|---|---|
| `viewtype` | `0`=Active, `1`=Archive | Filter by epic status |
| `searchvalue` | string | Search by epic name |

### Get Epic Details
```http
GET /team/{teamId}/projects/{projectId}/epic/{epicId}/?action=details
```

### Get Sprints Associated with Epic
```http
GET /team/{teamId}/projects/{projectId}/epic/{epicId}/sprint/?action=data&index=1&range=50
```

### Create Epic
```http
POST /team/{teamId}/projects/{projectId}/epic/
Content-Type: application/json

{"name": "Epic Name", "owner": "userId", "desc": "html", "color": "#3CB371"}
```
| Field | Required | Description |
|---|---|---|
| `name` | YES | Epic name |
| `owner` | YES | Owner user ID |
| `desc` | NO | HTML description |
| `color` | NO | Hex color e.g. `#3CB371` |

### Update Epic
```http
POST /team/{teamId}/projects/{projectId}/epic/{epicId}/
Content-Type: application/json

{"name": "New Name", "type": 0, "color": "#hex"}
```
| Field | Values | Description |
|---|---|---|
| `name` | string | New name |
| `owner` | userId | New owner |
| `desc` | HTML | Description |
| `type` | `0`=Active, `1`=Archive | Status |
| `color` | hex | Color |

### Delete Epic
```http
DELETE /team/{teamId}/projects/{projectId}/epic/{epicId}/
```

---

## 11. Releases

### List Releases
```http
GET /team/{teamId}/projects/{projectId}/release/?action=data&index=1&range=50
```
| Param | Description |
|---|---|
| `stagetype` | Filter by stage type |
| `searchvalue` | Search by release name |

### Get Release Details
```http
GET /team/{teamId}/projects/{projectId}/release/{releaseId}/?action=data
```

### Get Release Stages
```http
GET /team/{teamId}/projects/{projectId}/releasestatus/?action=data&index=1&range=25
```

### Create Release
```http
POST /team/{teamId}/projects/{projectId}/release/
Content-Type: application/json

{"name": "v1.0", "startdate": "2025-01-01T00:00:00+05:30", "enddate": "2025-03-31T00:00:00+05:30"}
```
| Field | Required | Description |
|---|---|---|
| `name` | YES | Release name |
| `startdate` | YES | ISO date |
| `enddate` | YES | ISO date |
| `statusId` | NO | Release stage ID |
| `color` | NO | Hex color |
| `goal` | NO | Release goal text |
| `ownerIds` | NO | JSON array of owner user IDs |

### Create Release Stage
```http
POST /team/{teamId}/projects/{projectId}/releasestatus/
Content-Type: application/json

{"name": "In Progress", "type": "open", "color": "#hex"}
```
`type` values: `"open"`, `"closed"`

### Associate Items with Release
```http
POST /team/{teamId}/projects/{projectId}/release/{releaseId}/item/associate/
sprintid={sprintId}&rootitemidarr=[itemId1,itemId2]
```

### Delete Release
```http
DELETE /team/{teamId}/projects/{projectId}/release/{releaseId}/
```

### Delete Release Stage
```http
DELETE /team/{teamId}/projects/{projectId}/releasestatus/{releasestatusId}/
```

---

## 12. Timesheets

### List Timesheet Logs
```http
GET /team/{teamId}/projects/{projectId}/timesheet/?action=listview&index=1&range=50&logtypes=[0]&listviewtype=1
```

### Add Item Log Hours
```http
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/timesheet/?action=additemlog
Content-Type: multipart/form-data

users={zpuid}&date={date}&duration={hh:mm}&isbillable={1|0}&notes={text}
```
| Field | Required | Description |
|---|---|---|
| `users` | YES | User ZPUID |
| `date` | YES | `2025-01-15` or `2025-01-15T09:00:00+05:30` |
| `duration` | YES | Format: `hh:mm` e.g. `02:30` |
| `isbillable` | NO | `1`=Billable (default), `0`=Non-billable |
| `notes` | NO | Log description |

### Add General Log Hours (Not Item-Specific)
```http
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/timesheet/?action=addgenerallog
Content-Type: multipart/form-data

users={zpuid}&date={date}&duration={hh:mm}&isbillable={1|0}&notes={text}
```

### Get Log Details
```http
GET /team/{teamId}/projects/{projectId}/timesheet/{logId}/?action=logdetails
```

### Delete Log
```http
DELETE /team/{teamId}/projects/{projectId}/timesheet/{logId}/
```

---

## 13. Meetings

### List Project Meetings
```http
GET /team/{teamId}/projects/{projectId}/meetings/?action=data&index=1&range=20
```

### List Sprint Meetings
```http
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/meeting/?action=data&index=1&range=20
```

### Get Meeting Details
```http
GET /team/{teamId}/projects/{projectId}/meetings/{meetingId}/?action=data
```

### Schedule Meeting
```http
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/meeting/
title={title}&type={type}&scheduledon={datetime}&duration={mins}&participants={userIds}&remindbefore={mins}
```
| Param | Required | Values/Description |
|---|---|---|
| `title` | YES | Meeting title |
| `type` | YES | `1`=Scrum, `2`=Sprint Planning, `3`=Retrospective, `4`=Sprint Review, `5`=Other |
| `scheduledon` | YES | Format: `MM-dd-yyyy hh:mm a` e.g. `01-15-2025 10:00 AM` |
| `duration` | YES | Duration in minutes |
| `participants` | YES | Comma-separated user IDs |
| `remindbefore` | YES | Remind before in minutes |
| `location` | NO | Meeting location |
| `description` | NO | Meeting description |

### Delete Meeting
```http
DELETE /team/{teamId}/projects/{projectId}/meetings/{meetingId}/
```

### Meeting Comments
```http
# List comments
GET /team/{teamId}/projects/{projectId}/meetings/{meetingId}/notes/?action=data&index=1&range=20

# Add comment
POST /team/{teamId}/projects/{projectId}/meetings/{meetingId}/notes/
note={text}

# Delete comment
DELETE /team/{teamId}/projects/{projectId}/meetings/{meetingId}/notes/{notesId}/
```

---

## 14. Users

### List Workspace Users
```http
GET /team/{teamId}/users/?action=data&index=1&range=50
```
Optional: `type={userType}` to filter.

### List Project Users
```http
GET /team/{teamId}/projects/{projectId}/users/?action=data&index=1&range=50
```

### List Sprint Users
```http
GET /team/{teamId}/projects/{projectId}/sprints/{sprintId}/users/?action=alldata
```

### Add Workspace User
```http
POST /team/{teamId}/users/
users=[{"email": "user@example.com", "role": "member"}]&projids=[projectId]
```

### Add/Update Project Users
```http
POST /team/{teamId}/projects/{projectId}/users/
newusers=[userId]&oldusers=[userId]
```

### Add Sprint User
```http
POST /team/{teamId}/projects/{projectId}/sprints/{sprintId}/users/
users=[userId]
```

### Remove Workspace User
```http
DELETE /team/{teamId}/users/{userId}/
```

### Remove Project User
```http
DELETE /team/{teamId}/projects/{projectId}/users/{userId}/
```

### Remove Sprint User
```http
DELETE /team/{teamId}/projects/{projectId}/sprints/{sprintId}/users/{userId}/
```

---

## 15. Project Settings

### Get Item Types
```http
GET /team/{teamId}/projects/{projectId}/itemtype/?action=data&index=1&range=25
```
Returns types like: Story, Task, Bug, etc.

### Get Priority Types
```http
GET /team/{teamId}/projects/{projectId}/priority/?action=data&index=1&range=25
```

### Get Item Statuses
```http
GET /team/{teamId}/projects/{projectId}/itemstatus/?action=data&index=1&range=25
```

### Create Item Status
```http
POST /team/{teamId}/projects/{projectId}/itemstatus/
name={name}&type={type}&color={hexColor}
```
| Param | Required | Values | Description |
|---|---|---|---|
| `name` | YES | string | Status name |
| `type` | YES | `open`, `inprogress`, `closed` | Status category |
| `color` | NO | hex | Status color |

### Update Item Status
```http
POST /team/{teamId}/projects/{projectId}/itemstatus/{statusId}/
name={name}&type={type}
```

### Delete Item Status
```http
DELETE /team/{teamId}/projects/{projectId}/itemstatus/{statusId}/
```

### Get Modules (for moduleId lookup)
```http
GET /team/{teamId}/settings/customization/modules/?action=data&index=1&range=25
```
Returns module IDs for Items, Sprints, Epics, Meetings, Expenses, etc. Required for comments and custom fields.

### Get Custom Layouts
```http
GET /team/{teamId}/settings/customization/modules/{moduleId}/layout/?action=data&index=1&range=25
```

### Get Custom Fields (Global)
```http
GET /team/{teamId}/settings/customization/modules/{moduleId}/fields/?action=data
```

### Get Layout Fields
```http
GET /team/{teamId}/settings/customization/modules/{moduleId}/layout/{layoutId}/?action=formfields
```

### Get Project Custom Fields
```http
GET /team/{teamId}/projects/{projectId}/modules/{moduleId}/?action=formfields
```

---

## 16. Checklists

All checklist endpoints are under: `/team/{teamId}/projects/{projectId}/sprints/{sprintId}/item/{itemId}/`

### List Checklist Groups
```http
GET .../clgroup/?action=data&index=1&range=20
```

### List Checklist Items in Group
```http
GET .../clgroup/{checklistGroupId}/clitem/?action=data&index=1&range=20
```

### Create Checklist Group
```http
POST .../clgroup/
action=addclgroup&clgroupname={name}
```

### Add Checklist Item
```http
POST .../clgroup/{checklistGroupId}/clitem/
clitemname={name}&visibility={0|1}&ownerid={userId}&priority={0|1|2|3}
```
| Param | Required | Values | Description |
|---|---|---|---|
| `clitemname` | YES | string | Checklist item name |
| `visibility` | YES | `0`=Public, `1`=Private | Visibility |
| `ownerid` | YES | userId | Assigned user |
| `priority` | YES | `0`=None, `1`=Low, `2`=Medium, `3`=High | Priority |

### Change Status (Complete/Reopen)
```http
POST .../clgroup/{checklistGroupId}/clitem/{checklistId}/
action=changestatus&status={0|1}
```
`0`=Reopen, `1`=Complete

### Edit Checklist Item
```http
POST .../clgroup/{checklistGroupId}/clitem/{checklistId}/
action=editclitem&clitemname={name}&togroupid={groupId}&visibility={0|1}&ownerid={userId}&priority={0|1|2|3}
```

### Rename Checklist Group
```http
POST .../clgroup/{checklistGroupId}/
action=editclgroup&clgroupname={newName}
```

### Delete Checklist Item
```http
DELETE .../clgroup/{checklistGroupId}/clitem/{checklistId}/
```

### Delete Checklist Group
```http
DELETE .../clgroup/{checklistGroupId}/
```

---

## 17. Webhooks

### Get Available Placeholders
```http
GET /team/{teamId}/webhooks/placeholders/?action=data
```

### Get Available Triggers
```http
GET /team/{teamId}/webhooks/triggers/?action=data
```

### List Project Webhooks
```http
GET /team/{teamId}/projects/{projectId}/webhooks/?action=data&index=1&range=20
```

### Get Webhook Details
```http
GET /team/{teamId}/projects/{projectId}/webhooks/{webhookId}/?action=data
```

### Create Webhook
```http
POST /team/{teamId}/projects/{projectId}/webhooks/
name={name}&url={callbackUrl}&triggers={triggerId1,triggerId2}&secretToken={token}
```
| Param | Required | Description |
|---|---|---|
| `name` | YES | Webhook name |
| `url` | YES | Callback URL |
| `triggers` | YES | Comma-separated trigger IDs (from get_triggers) |
| `secretToken` | YES | Secret for HMAC verification |
| `customHeaders` | NO | JSON object of custom headers |

### Update Webhook
```http
POST /team/{teamId}/projects/{projectId}/webhooks/{webhookId}/
name={name}&url={url}&triggers={ids}&secretToken={token}
```

### Delete Webhook
```http
DELETE /team/{teamId}/projects/{projectId}/webhooks/{webhookId}/
```

### Execute Webhook Function
```http
POST /team/{teamId}/projects/{projectId}/webhooks/{webhookId}/execute/
```

---

## 18. OKR

### Get OKR Statuses
```http
GET /team/{teamId}/okrsettings/status/
```

### List OKRs
```http
GET /team/{teamId}/okrs/?action=data&index=1&range=50
```

### Create OKR (Root Objective)
```http
POST /team/{teamId}/okrs/
Content-Type: application/json

{"title": "...", "type": 1, "ownerId": "userId", "statusId": "id", "startDate": "2025-01-01T00:00:00+05:30", "endDate": "..."}
```
| Field | Required | Description |
|---|---|---|
| `title` | YES | Objective title |
| `type` | YES | `1` for objective |
| `ownerId` | YES | Owner user ID |
| `statusId` | YES | Status ID from `get_statuses` |
| `startDate` | YES | ISO date |
| `endDate` | YES | ISO date |
| `description` | NO | Description |

### Delete OKR
```http
DELETE /team/{teamId}/okrs/{okrId}/
```

---

## 19. Expenses

### Get Expense Categories
```http
GET /team/{teamId}/expensecategories/?action=data&index=1&range=25
```

### List Expenses
```http
GET /team/{teamId}/projects/{projectId}/expenses/?action=data&expensetype=0&index=1&range=50
```
| Param | Values | Description |
|---|---|---|
| `expensetype` | `0`=One-time, `1`=Recurring | Type filter |
| `filter` | JSON | Filter object |
| `searchvalue` | string | Search by name |

### Get Expense Details
```http
GET /team/{teamId}/projects/{projectId}/expenses/{expenseId}/?action=details
```

### Create Expense
```http
POST /team/{teamId}/projects/{projectId}/expenses/
Content-Type: application/json

{"data": {"name": "Travel", "amount": "500", "expensedate": "2025-01-15T00:00:00+05:30"}}
```
| Field | Required | Description |
|---|---|---|
| `name` | YES | Expense name |
| `amount` | YES | Amount (string) |
| `expensedate` | YES | ISO date |
| `categoryidorname` | NO | Category ID or name |
| `description` | NO | Description |
| `ownerid` | NO | Owner user ID |
| `usergroupid` | NO | User group ID |
| `sprintid` | NO | Associated sprint ID |
| `releaseid` | NO | Associated release ID |

### Delete Expenses (Bulk via POST)
```http
POST /team/{teamId}/projects/{projectId}/expenses/
action=delete&expenseidarr=[id1,id2]
```
Note: Uses POST + `action=delete` instead of HTTP DELETE (Zoho's pattern for bulk deletes).

### Expense Comments
```http
# List
GET /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/{expenseId}/notes/?action=data&index=1&range=20

# Add
POST /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/{expenseId}/notes/
action=addnotes&name={commentHtml}

# Delete
DELETE /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/{expenseId}/notes/{notesId}/
```

---

## 20. Custom Modules

Custom modules are user-defined data types in Zoho Sprints. The `moduleId` comes from the modules settings API.

### List Global Records
```http
GET /team/{teamId}/modules/{moduleId}/portfolioview/?action=data&index=1&range=50
```

### List Project Records
```http
GET /team/{teamId}/projects/{projectId}/modules/{moduleId}/portfolioview/?action=data&index=1&range=50
```

### Get Global Record Details
```http
GET /team/{teamId}/modules/{moduleId}/entity/{recordId}/?action=details
```

### Get Project Record Details
```http
GET /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/{recordId}/?action=details
```

### Add Global Record
```http
POST /team/{teamId}/modules/{moduleId}/entity/
name={name}&statusid={statusId}&projectid={projectId}&owners=[userId]&description={desc}
```

### Add Project Record
```http
POST /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/
name={name}&statusid={statusId}&owners=[userId]&description={desc}
```

### Delete Global Record
```http
DELETE /team/{teamId}/modules/{moduleId}/entity/{recordId}/
```

### Delete Project Record
```http
DELETE /team/{teamId}/projects/{projectId}/modules/{moduleId}/entity/{recordId}/
```

### Associate/Move Records to Another Project
```http
POST /team/{teamId}/projects/{projectId}/modules/{moduleId}/entities/action/associate/
toprojectid={projectId}&entityidarr=[id1,id2]
```

### Get Statuses for Layout
```http
GET /team/{teamId}/modules/{moduleId}/layout/{layoutId}/entity/status/?action=data&index=1&range=50
```

---

## 21. Common Field Values

### Item Type IDs
Retrieve from `GET .../itemtype/?action=data`  
Common types: Story, Task, Bug, Feature, Improvement (names are project-configurable)

### Priority IDs
Retrieve from `GET .../priority/?action=data`  
Common: None, Low, Medium, High, Urgent

### Status IDs
Retrieve from `GET .../itemstatus/?action=data`  
Common: Open, In Progress, Done (names are customizable per project)

### Module IDs (for comments, custom fields)
Retrieve from `GET /team/{teamId}/settings/customization/modules/?action=data`

Typical module names and their uses:
| Module Name | Used for |
|---|---|
| Items | Item comments, item custom fields |
| Sprints | Sprint comments |
| Epics | Epic custom fields |
| Meetings | Meeting records |
| Expenses | Expense comments |
| Releases | Release records |
| Custom modules | User-defined modules |

### Date Formats
| Context | Format | Example |
|---|---|---|
| Most date fields | ISO 8601 with TZ | `2025-01-15T00:00:00+05:30` |
| Meeting `scheduledon` | `MM-dd-yyyy hh:mm a` | `01-15-2025 10:00 AM` |
| Timesheet `date` | ISO date or full ISO | `2025-01-15` |
| Sprint `duration` | Week string | `2w` (max 8w strict / 30w relaxed) |

### Boolean-ish String Values
Zoho uses string-encoded booleans in query params: `"true"` / `"false"`, `"1"` / `"0"`

### Sprint `type` Filter Values
| Value | Meaning |
|---|---|
| `[1]` | Upcoming only |
| `[2]` | Active only |
| `[1,2]` | Upcoming + Active (default) |
| `[3]` | Completed only |
| `[4]` | Canceled only |
| `[1,2,3,4]` | All sprints |

### Item Status `type` Categories
| Value | Meaning |
|---|---|
| `open` | Not started |
| `inprogress` | In progress |
| `closed` | Done/closed |

---

*This reference was derived from the live Zoho Sprints API documentation at `sprints.zoho.com/apidoc.html` and cross-validated against the `zoho-sprints-mcp` source code implementation. For the authoritative reference, always check `sprints.zoho.{your-domain}/apidoc.html`.*
