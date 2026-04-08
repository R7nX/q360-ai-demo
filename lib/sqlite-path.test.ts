import path from "path";
import { describe, expect, it } from "vitest";

import { DEFAULT_SQLITE_DB_FILENAME, getSqliteDbPath, resolveFileDatabasePath } from "@/lib/sqlite-path";

describe("sqlite-path", () => {
  it("returns null for non-file database urls", () => {
    expect(resolveFileDatabasePath("postgresql://example")).toBeNull();
    expect(resolveFileDatabasePath("")).toBeNull();
    expect(resolveFileDatabasePath(undefined)).toBeNull();
  });

  it("resolves absolute file database urls", () => {
    expect(resolveFileDatabasePath("file:/tmp/q360.sqlite")).toBe("/tmp/q360.sqlite");
  });

  it("resolves relative file database urls from the current working directory", () => {
    expect(resolveFileDatabasePath("file:./data/q360.sqlite")).toBe(
      path.resolve(process.cwd(), "data/q360.sqlite"),
    );
  });

  it("falls back to the default mock db path", () => {
    expect(getSqliteDbPath(undefined)).toBe(
      path.resolve(process.cwd(), DEFAULT_SQLITE_DB_FILENAME),
    );
  });

  it("prefers a file-based database url when one is configured", () => {
    expect(getSqliteDbPath("file:./custom/mock.sqlite")).toBe(
      path.resolve(process.cwd(), "custom/mock.sqlite"),
    );
  });
});
