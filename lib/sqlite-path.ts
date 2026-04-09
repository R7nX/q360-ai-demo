import path from "path";

export const DEFAULT_SQLITE_DB_FILENAME = "mock.db";

export function resolveFileDatabasePath(databaseUrl: string | null | undefined): string | null {
  const trimmedDatabaseUrl = databaseUrl?.trim();
  if (!trimmedDatabaseUrl?.startsWith("file:")) {
    return null;
  }

  const filePath = trimmedDatabaseUrl.slice("file:".length).trim();
  if (!filePath) {
    return null;
  }

  return path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath.replace(/^\.\//, ""));
}

export function getSqliteDbPath(
  databaseUrl: string | null | undefined = process.env.DATABASE_URL,
): string {
  return (
    resolveFileDatabasePath(databaseUrl) ??
    path.resolve(process.cwd(), DEFAULT_SQLITE_DB_FILENAME)
  );
}
