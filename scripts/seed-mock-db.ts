#!/usr/bin/env tsx
/**
 * seed-mock-db.ts
 *
 * Fetches the schema for a Q360 table from the Data Dictionary API,
 * generates realistic synthetic data, and seeds it into a local SQLite database.
 *
 * Usage:
 *   npx tsx scripts/seed-mock-db.ts <tablename> [count]
 *
 * Examples:
 *   npx tsx scripts/seed-mock-db.ts dispatch 20
 *   npx tsx scripts/seed-mock-db.ts customer 15
 *   npx tsx scripts/seed-mock-db.ts projects 10
 *
 * Notes:
 *   - Requires Q360_BASE_URL, Q360_API_USERNAME, Q360_API_PASSWORD in .env.local
 *   - The Q360 Data Dictionary API (schema fetching) must be accessible
 *   - Synthetic data is generated based on column names and types
 *   - Re-running will DROP and re-create the table (fresh seed each time)
 *   - Output database: mock.db (gitignored)
 *
 * AWS migration:
 *   When moving to AWS RDS, swap the Database import for a pg client
 *   and update DATABASE_URL in your environment. Schema and insert logic stays the same.
 */

import Database from 'better-sqlite3'
import { faker } from '@faker-js/faker'

// Load .env.local (Node 20+ built-in — no dotenv needed)
try {
  process.loadEnvFile('.env.local')
} catch {
  // .env.local not found — fall back to system environment variables
}

// ─── Config ────────────────────────────────────────────────────────────────

const TABLE  = process.argv[2]
const COUNT  = parseInt(process.argv[3] ?? '20', 10)

if (!TABLE) {
  console.error('Usage: npx tsx scripts/seed-mock-db.ts <tablename> [count]')
  process.exit(1)
}

const BASE_URL = process.env.Q360_BASE_URL
const USERNAME = process.env.Q360_API_USERNAME
const PASSWORD = process.env.Q360_API_PASSWORD
const DB_PATH  = 'mock.db'

if (!BASE_URL || !USERNAME || !PASSWORD) {
  console.error('Missing required env vars: Q360_BASE_URL, Q360_API_USERNAME, Q360_API_PASSWORD')
  console.error('Copy .env.example to .env.local and fill in your credentials.')
  process.exit(1)
}

const AUTH_HEADER = 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')

// ─── Types ─────────────────────────────────────────────────────────────────

interface Q360Column {
  name: string
  type: string
  nullable: boolean
}

// ─── Q360 Schema Fetching ───────────────────────────────────────────────────

async function fetchColumns(table: string): Promise<Q360Column[]> {
  const url = `${BASE_URL}/api/DataDict?_a=columnList&_t=${table}`
  const res = await fetch(url, { headers: { Authorization: AUTH_HEADER } })

  if (!res.ok) {
    throw new Error(`Q360 API returned ${res.status} ${res.statusText} for table "${table}"`)
  }

  const json = await res.json()

  // Q360 API wraps responses — handle both flat arrays and nested payload shapes
  const raw = json.payload ?? json
  const columns: unknown[] = Array.isArray(raw)
    ? raw
    : (raw.columns ?? raw.data ?? raw.records ?? [])

  if (!columns.length) {
    throw new Error(
      `No columns returned for table "${table}". ` +
      `Check that the table name is correct and your API user has access.`
    )
  }

  // Normalize — the API may return PascalCase or lowercase key names
  return columns.map((col: any) => ({
    name:     col.columnname ?? col.ColumnName ?? col.name     ?? col.Name     ?? '',
    type:     col.datatype   ?? col.DataType   ?? col.type     ?? col.Type     ?? 'varchar',
    nullable: col.nullable   ?? col.Nullable   ?? col.required === false ?? true,
  })).filter(c => c.name.length > 0)
}

// ─── Type Mapping ──────────────────────────────────────────────────────────

function toSQLiteType(datatype: string): 'TEXT' | 'INTEGER' | 'REAL' {
  const t = datatype.toLowerCase()
  if (['int', 'bigint', 'smallint', 'tinyint', 'bit'].includes(t)) return 'INTEGER'
  if (['decimal', 'numeric', 'float', 'real', 'money', 'smallmoney'].includes(t)) return 'REAL'
  return 'TEXT'
}

// ─── Synthetic Data Generation ─────────────────────────────────────────────

const STATUS_CODES  = ['OPEN', 'CLOSED', 'PENDING', 'IN PROGRESS', 'ON HOLD', 'CANCELLED']
const PROBLEM_TYPES = ['HARDWARE', 'SOFTWARE', 'NETWORK', 'ELECTRICAL', 'MECHANICAL', 'OTHER']
const PRIORITIES    = [1, 2, 3, 4, 5]

function generateValue(col: Q360Column): string | number | null {
  const name       = col.name.toLowerCase()
  const sqliteType = toSQLiteType(col.type)

  // Randomly null some optional-looking fields
  if (col.nullable && (name.includes('solution') || name.includes('note') || name.includes('close'))) {
    if (Math.random() < 0.3) return null
  }

  // ── Q360-specific field patterns ──────────────────────────────────────

  // Primary / foreign keys  (e.g. dispatchno, customerno, siteno)
  if (name.endsWith('no') && !name.includes('phone')) {
    const prefix = TABLE.substring(0, 3).toUpperCase()
    return `${prefix}-${faker.string.alphanumeric(8).toUpperCase()}`
  }

  // Call / dispatch identifiers (e.g. callno, dispatchno)
  if (name === 'callno' || name === 'dispatchno') {
    return `T${faker.string.numeric(12)}`
  }

  // Status codes
  if (name === 'statuscode' || name === 'status') return faker.helpers.arrayElement(STATUS_CODES)
  if (name === 'contype') return faker.helpers.arrayElement(['FULL', 'PARTS', 'LABOR', 'PM'])

  // Priority
  if (name === 'priority') return faker.helpers.arrayElement(PRIORITIES)

  // Problem / solution descriptions
  if (name === 'problem' || name === 'problemtype') return faker.helpers.arrayElement(PROBLEM_TYPES)
  if (name === 'solution') return faker.lorem.sentence({ min: 5, max: 15 })
  if (name.includes('description') || name.includes('note') || name.includes('detail')) {
    return faker.lorem.sentence()
  }

  // Technician
  if (name.includes('tech') && (name.includes('assign') || name === 'techassigned')) {
    return faker.helpers.arrayElement([null, faker.person.fullName()])
  }
  if (name.startsWith('tech')) return faker.person.fullName()

  // People / contacts
  if (name.includes('caller') && name.includes('name')) return faker.person.fullName()
  if (name.includes('email') || name.includes('mail')) return faker.internet.email()
  if (name.includes('phone') || name.includes('fax')) return faker.phone.number({ style: 'national' })
  if (name.includes('firstname') || name === 'first') return faker.person.firstName()
  if (name.includes('lastname')  || name === 'last')  return faker.person.lastName()
  if (name === 'fullname' || name.includes('contact')) return faker.person.fullName()

  // Company / customer
  if (name === 'company' || name.includes('companyname')) return faker.company.name()
  if (name === 'title' && TABLE === 'projects') return `${faker.company.buzzAdjective()} ${faker.company.buzzNoun()} Project`
  if (name === 'title') return faker.company.catchPhrase()

  // Location
  if (name.includes('address') || name === 'addr') return faker.location.streetAddress()
  if (name === 'city') return faker.location.city()
  if (name === 'state') return faker.location.state({ abbreviated: true })
  if (name.includes('zip') || name.includes('postal')) return faker.location.zipCode()
  if (name.includes('country')) return 'US'
  if (name === 'zone') return faker.helpers.arrayElement(['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL'])

  // Dates and times
  if (name === 'date' || name === 'opendate' || name === 'calldate') {
    return faker.date.recent({ days: 90 }).toISOString().split('T')[0]
  }
  if (name === 'closedate') {
    return Math.random() < 0.4
      ? faker.date.recent({ days: 30 }).toISOString().split('T')[0]
      : null
  }
  if (name.includes('date') || name.includes('time')) {
    return faker.date.recent({ days: 180 }).toISOString().split('T')[0]
  }

  // Financial
  if (name.includes('price') || name.includes('rate') || name.includes('cost') || name.includes('amount')) {
    return faker.number.float({ min: 50, max: 5000, fractionDigits: 2 })
  }

  // Boolean-ish flags (BIT columns)
  if (sqliteType === 'INTEGER' && (name.includes('flag') || name.includes('active') || name.includes('enable'))) {
    return faker.helpers.arrayElement([0, 1])
  }

  // ── Fallback by SQLite type ──────────────────────────────────────────

  if (sqliteType === 'INTEGER') return faker.number.int({ min: 0, max: 1000 })
  if (sqliteType === 'REAL')    return faker.number.float({ min: 0, max: 10000, fractionDigits: 2 })
  return faker.lorem.word()
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n Fetching schema for table "${TABLE}" from Q360...`)

  let columns: Q360Column[]
  try {
    columns = await fetchColumns(TABLE)
    console.log(` Found ${columns.length} columns: ${columns.map(c => c.name).join(', ')}\n`)
  } catch (err) {
    console.error(` Failed to fetch schema:`, err)
    process.exit(1)
  }

  // Create / open SQLite database
  const db = new Database(DB_PATH)

  // Build CREATE TABLE statement
  const colDefs = columns
    .map(c => `"${c.name}" ${toSQLiteType(c.type)}`)
    .join(',\n  ')

  db.prepare(`DROP TABLE IF EXISTS "${TABLE}"`).run()
  db.prepare(`CREATE TABLE "${TABLE}" (\n  ${colDefs}\n)`).run()
  console.log(` Created table "${TABLE}" in ${DB_PATH}`)

  // Prepare INSERT
  const colNames    = columns.map(c => `"${c.name}"`).join(', ')
  const placeholders = columns.map(() => '?').join(', ')
  const insert      = db.prepare(`INSERT INTO "${TABLE}" (${colNames}) VALUES (${placeholders})`)

  // Generate rows and insert in a single transaction
  const insertAll = db.transaction((rows: (string | number | null)[][]) => {
    for (const row of rows) insert.run(row)
  })

  const rows = Array.from({ length: COUNT }, () =>
    columns.map(c => generateValue(c))
  )

  insertAll(rows)
  db.close()

  console.log(` Seeded ${COUNT} synthetic rows into "${TABLE}"\n`)
  console.log(` Database: ${DB_PATH}`)
  console.log(` To seed another table: npx tsx scripts/seed-mock-db.ts <tablename> [count]\n`)
}

main()
