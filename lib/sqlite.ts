import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

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
