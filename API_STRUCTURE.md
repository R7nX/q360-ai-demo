# API_STRUCTURE.md — Q360 REST API Reference

> Human-readable breakdown of the Q360 v25.01.001 REST API. Based on `Q360 v25.01.001.openapi.yaml` and the Getting Started guide.

---

## Overview

| Property | Value |
|----------|-------|
| Base URL | `http://rest.q360.online` |
| Auth | HTTP Basic Authentication |
| Auth User Type | `Q360API` users only |
| Content-Type | `multipart/form-data` for write operations |
| Live Docs | `{{base_url}}/APIDocumentation` (Beta, auto-generated) |

---

## Authentication

All API requests require Basic Auth in the header:

```
Authorization: Basic <base64(username:password)>
```

**Rules:**
- Only users with the Q360 user type `Q360API` can authenticate
- The user must have both the **active flag** and **login flag** set
- Do NOT use the `Director` user or regular web users for API calls
- Scope each API user to only the tables/data sources it needs

**Sandbox Credentials:** see `.env.local` (never commit credentials)

---

## Endpoint Groups

The API has four groups of endpoints:

| Tag | Purpose |
|-----|---------|
| **Data Dictionary** | Schema discovery — list tables, get column definitions |
| **Data Source** | Permission pre-checks — verify user access before querying |
| **Record** | CRUD operations — list, create, update, delete records |

---

## Endpoints

### 1. Data Dictionary — Table Names

**Purpose:** Discover all available tables and views.

```
GET {{base_url}}/api/DataDict?_a=tableList
```

| Parameter | Required | Value |
|-----------|----------|-------|
| `_a` | Yes | `tableList` |

**Notes:**
- Returns all tables and views exposed to the API
- Only **tables** support Create, Update, Delete
- **Views** can be read via Data Sources but cannot be written to
- Use this first when exploring the schema for the first time

---

### 2. Data Dictionary — Column Definitions

**Purpose:** Get column names, types, and metadata for a specific table.

```
GET {{base_url}}/api/DataDict?_a=columnList&_t=<tablename>
```

| Parameter | Required | Value |
|-----------|----------|-------|
| `_a` | Yes | `columnList` |
| `_t` | Yes | Table name (e.g., `dispatch`, `customer`) |

**Notes:**
- Use this to discover valid column names before building Record requests
- Helps avoid field name errors in Create/Update payloads

---

### 3. Data Source — Access List

**Purpose:** Check which Data Sources a specific user is allowed to query.

```
GET {{base_url}}/api/UserID?_a=datasourceAccessList&userid={{api_username}}
```

| Parameter | Required | Value |
|-----------|----------|-------|
| `_a` | Yes | `datasourceAccessList` |
| `userid` | Yes | The Q360API username to check |

**Recommended pattern:** Always call this before Record List to confirm the user has permission.

---

### 4. Record — List

**Purpose:** Query rows from a table or view (data source) with filtering, sorting, and pagination.

```
POST {{base_url}}/api/Record/{{tablename}}?_a=list
```

Or using query param form:
```
POST {{base_url}}/api/Record?_a=list&_tablename={{tablename}}
```

**Body** (form-data):

| Field | Required | Description |
|-------|----------|-------------|
| `jsonRequest` | Yes | JSON object controlling columns, filters, sort, pagination |

**jsonRequest Schema:**
```json
{
  "columns": ["col1", "col2"],
  "filters": [
    { "field": "column", "op": "=", "value": "example" }
  ],
  "orderBy": [
    { "field": "column", "dir": "ASC" }
  ],
  "offset": 0,
  "limit": 100
}
```

**Supported Filter Operators:** `=`, `!=`, `<`, `>`, `<=`, `>=`, `like`, `isnull`, `isnotnull`

**LIKE syntax** uses MSSQL wildcards: `%` (any chars) and `_` (single char)

**Pagination pattern:**
```
Request 1: offset=0,   limit=100
Request 2: offset=100, limit=100
...
Stop when: returned rows < limit  OR  hasmore outvar = "N"
```

**Notes:**
- Only **table-based** data sources work here (no stored procedures)
- User must have permission to the data source
- Use `columns` to reduce payload size — don't fetch everything unless needed

---

### 5. Record — Create

**Purpose:** Insert one or more new records into a table.

```
PUT {{base_url}}/api/Record
```

**Body** (form-data):

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `_tablename` | Yes | — | Target table |
| `jsonRequest` | Yes | — | JSON with record data |
| `_outputdata` | No | `N` | `Y` = return full created row data |
| `_preview` | No | `N` | `Y` = run logic but do NOT insert |

**jsonRequest Schema:**
```json
{
  "griddata": {
    "record": [
      { "column1": "value", "column2": "value" }
    ]
  }
}
```

**Notes:**
- `record` is an array — supports bulk inserts
- Q360 runs server-side create logic (`[TableName]_Record_Create`) which applies defaults and business rules
- JSON values override defaults when valid
- Use `_preview=Y` to test payloads without inserting
- Use `_outputdata=Y` when you need generated keys or computed values back

---

### 6. Record — Update

**Purpose:** Modify one or more existing records in a table.

```
PATCH {{base_url}}/api/Record
```

**Body** (form-data):

| Field | Required | Description |
|-------|----------|-------------|
| `_tablename` | Yes | Target table |
| `jsonRequest` | Yes | JSON with primary key + changed columns only |

**jsonRequest Schema:**
```json
{
  "griddata": {
    "record": [
      { "primarykey": "12345", "column1": "new value" }
    ]
  }
}
```

**Notes:**
- Only include columns you want to change — omitted columns stay unchanged
- Always include the primary key to target the correct row
- If primary key is missing, Q360 may attempt a create (not recommended — use PUT instead)
- Q360 runs server-side save logic (`[TableName]_Record_Save`) on every update

---

### 7. Record — Delete

**Purpose:** Remove one or more records from a table.

```
DELETE {{base_url}}/api/Record
```

**Body** (form-data):

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `_tablename` | Yes | — | Target table |
| `jsonRequest` | Yes | — | JSON with primary keys to delete |
| `ValidateOnly` | No | `N` | `Y` = validate but do NOT delete |

**jsonRequest Schema:**
```json
{
  "griddata": {
    "record": [
      { "primarykey": "12345" }
    ]
  }
}
```

**Notes:**
- Only primary key matters in each record object — extra fields are ignored
- Q360 enforces referential integrity — deletion may be blocked if related records exist
- No partial deletes: if one row fails validation, the entire batch is rejected
- Use `ValidateOnly=Y` to safely test before deleting

---

## Key Q360 Data Entities

Based on the API schema, these are the core entities available in Q360. Use Data Dictionary endpoints to get the exact column names.

| Entity | Table Name | Key Fields |
|--------|-----------|-----------|
| **Dispatch (Service Call)** | `dispatch` | `dispatchno`, `callno`, `customerno`, `siteno`, `statuscode`, `problem`, `solution`, `priority`, `techassigned`, `date`, `closedate` |
| **Customer** | `customer` | `customerno`, `company`, `type`, `status`, `defcurrency`, `defprice` |
| **Site** | `site` | `siteno`, `sitename`, `address`, `city`, `state`, `zip`, `phone`, `zone` |
| **Project** | `projects` | `projectno`, `title`, `projectscheduleno` |
| **Service Contract** | `servicecontract` | `servicecontractno`, `contype`, `statuscode`, `title` |
| **Time Bill** | `timebill` | `tbstarttime`, `tbendtime`, `traveltime`, `techassigned` |
| **Machine / Equipment** | `machine` | `machineno`, `description` |
| **User** | (various) | `userid`, `fullname`, `email` |

---

## Recommended Development Workflow

1. Set up Postman environment with `base_url`, `api_username`, `api_password`
2. Run **Table Names** (`GET /api/DataDict?_a=tableList`) to explore available tables
3. Run **Data Source Access List** to confirm permissions for your API user
4. Run **Column Definitions** (`GET /api/DataDict?_a=columnList&_t=<table>`) to understand schema
5. Run **Record List** to read data from a table
6. Use **Record Create** with `_preview=Y` first to test new record payloads
7. Use **Record Update** to modify existing records (always include primary key)
8. Use **Record Delete** with `ValidateOnly=Y` first before committing deletes

---

## Response Structure (Standard)

All write endpoints return:

```json
{
  "code": 200,
  "success": true,
  "message": "",
  "payload": { ... },
  "outvars": {
    "primarykey": "...",
    "_editguid": "...",
    "reverttoken": "..."
  }
}
```

On failure:
```json
{
  "code": 400,
  "success": false,
  "message": "Error description here"
}
```

---

## Important Constraints

| Constraint | Detail |
|-----------|--------|
| Write targets | Tables only (not views) |
| Read sources | Tables and views (via Data Sources) |
| Bulk operations | Supported for Create, Update, Delete (pass array in `record`) |
| Partial deletes | NOT supported — all or nothing per batch |
| Credentials | Must be server-side only — never expose in frontend code |
| Custom endpoints | More endpoints exist beyond this collection — check `{{base_url}}/APIDocumentation` |
