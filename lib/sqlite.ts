import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export type SqliteColumnInfo = {
  name: string;
  notNull: boolean;
  primaryKeyOrdinal: number;
  type: string;
};

function resolveFileDatabasePath(databaseUrl: string): string | null {
  if (!databaseUrl.startsWith("file:")) {
    return null;
  }

  const filePath = databaseUrl.slice("file:".length).trim();
  if (!filePath) {
    return null;
  }

  return path.isAbsolute(filePath)
    ? filePath
    : path.resolve(
        /* turbopackIgnore: true */ process.cwd(),
        filePath.replace(/^\.\//, ""),
      );
}

export function getSqliteDbPath(): string {
  const configuredPath = process.env.DATABASE_URL?.trim();
  const resolvedConfiguredPath = configuredPath
    ? resolveFileDatabasePath(configuredPath)
    : null;

  return (
    resolvedConfiguredPath ??
    path.join(/* turbopackIgnore: true */ process.cwd(), "mock.db")
  );
}

export function sqliteDbExists(): boolean {
  return fs.existsSync(getSqliteDbPath());
}

function escapeSqliteIdentifier(identifier: string): string {
  return identifier.replace(/"/g, "\"\"");
}

export function openReadonlySqliteDb(): Database.Database | null {
  const dbPath = getSqliteDbPath();
  if (!fs.existsSync(dbPath)) {
    return null;
  }

  return new Database(dbPath, {
    fileMustExist: true,
    readonly: true,
  });
}

function listSqliteTableNamesFromDb(db: Database.Database): string[] {
  const rows = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all() as Array<{ name: string }>;

  return rows.map((row) => row.name);
}

export function listSqliteTableNames(): string[] {
  const db = openReadonlySqliteDb();
  if (!db) {
    return [];
  }

  try {
    return listSqliteTableNamesFromDb(db);
  } finally {
    db.close();
  }
}

export function resolveSqliteTableName(
  tableName: string,
  availableTableNames: readonly string[] = listSqliteTableNames(),
): string | null {
  const normalizedTableName = tableName.trim().toUpperCase();

  return (
    availableTableNames.find(
      (candidateTableName) => candidateTableName.trim().toUpperCase() === normalizedTableName,
    ) ?? null
  );
}

export function readSqliteTableColumns(tableName: string): SqliteColumnInfo[] {
  const db = openReadonlySqliteDb();
  if (!db) {
    throw new Error(
      `Mock mode requires a SQLite database at ${getSqliteDbPath()}, but no database file was found.`,
    );
  }

  try {
    const availableTableNames = listSqliteTableNamesFromDb(db);
    const resolvedTableName = resolveSqliteTableName(tableName, availableTableNames);
    if (!resolvedTableName) {
      throw new Error(`SQLite table ${tableName} was not found in ${getSqliteDbPath()}.`);
    }

    const rows = db
      .prepare(`PRAGMA table_info("${escapeSqliteIdentifier(resolvedTableName)}")`)
      .all() as Array<{
      name: string;
      notnull: number;
      pk: number;
      type: string;
    }>;

    return rows.map((row) => ({
      name: row.name,
      notNull: row.notnull === 1,
      primaryKeyOrdinal: row.pk,
      type: row.type || "TEXT",
    }));
  } finally {
    db.close();
  }
}
