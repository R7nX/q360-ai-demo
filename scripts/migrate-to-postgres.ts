#!/usr/bin/env tsx
/**
 * migrate-to-postgres.ts
 *
 * One-time migration: copies all data from local mock.db (SQLite)
 * into a hosted PostgreSQL database.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-postgres.ts
 *
 * Requires in .env.local:
 *   DATABASE_URL=postgresql://q360user:changeme123@10.10.10.36:5432/q360demo
 */

import Database from 'better-sqlite3'
import { Client } from 'pg'
import * as path from 'path'
import * as fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SQLITE_PATH = path.resolve(process.cwd(), 'mock.db')
const PG_URL = process.env.DATABASE_URL

if (!PG_URL) {
  console.error('ERROR: DATABASE_URL not set in .env.local')
  process.exit(1)
}

if (!fs.existsSync(SQLITE_PATH)) {
  console.error(`ERROR: mock.db not found at ${SQLITE_PATH}`)
  process.exit(1)
}

// SQLite type → PostgreSQL type
function mapType(sqliteType: string): string {
  switch (sqliteType.toUpperCase()) {
    case 'INTEGER': return 'INTEGER'
    case 'REAL':    return 'FLOAT8'
    default:        return 'TEXT'
  }
}

async function migrate() {
  const sqlite = new Database(SQLITE_PATH, { readonly: true })
  const pg = new Client({ connectionString: PG_URL })
  await pg.connect()

  // Get list of tables from SQLite
  const tables = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as { name: string }[]

  console.log(`Found ${tables.length} table(s): ${tables.map(t => t.name).join(', ')}`)

  for (const { name: table } of tables) {
    console.log(`\nMigrating table: ${table}`)

    // Get column info from SQLite
    const columns = sqlite.prepare(`PRAGMA table_info("${table}")`).all() as {
      name: string
      type: string
    }[]

    // Build CREATE TABLE statement
    const colDefs = columns
      .map(c => `"${c.name}" ${mapType(c.type)}`)
      .join(',\n  ')

    await pg.query(`DROP TABLE IF EXISTS "${table}"`)
    await pg.query(`CREATE TABLE "${table}" (\n  ${colDefs}\n)`)
    console.log(`  Created table "${table}" with ${columns.length} columns`)

    // Fetch all rows from SQLite
    const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[]
    console.log(`  Migrating ${rows.length} rows...`)

    if (rows.length === 0) continue

    // Insert in batches
    const colNames = columns.map(c => `"${c.name}"`).join(', ')
    let inserted = 0

    for (const row of rows) {
      const values = columns.map(c => row[c.name] ?? null)
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
      await pg.query(
        `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders})`,
        values
      )
      inserted++
    }

    console.log(`  Done — ${inserted} rows inserted`)
  }

  sqlite.close()
  await pg.end()
  console.log('\nMigration complete.')
}

migrate().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
