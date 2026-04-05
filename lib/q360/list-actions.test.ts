import Database from "better-sqlite3";
import fs from "fs";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import os from "os";
import path from "path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  clearListActionCache,
  listProjectRows,
  listTaskRows,
} from "@/lib/q360/list-actions";

const server = setupServer();
const tempDirectories = new Set<string>();

function createTempDb(setup: (db: Database.Database) => void): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "q360-team1-list-actions-"));
  tempDirectories.add(tempDir);

  const dbPath = path.join(tempDir, "feature1.sqlite");
  const db = new Database(dbPath);

  try {
    setup(db);
  } finally {
    db.close();
  }

  return dbPath;
}

describe("Q360 list-action adapter", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    clearListActionCache();
    server.resetHandlers();
    vi.unstubAllEnvs();
    for (const tempDirectory of tempDirectories) {
      fs.rmSync(tempDirectory, { force: true, recursive: true });
    }
    tempDirectories.clear();
  });

  afterAll(() => {
    server.close();
  });

  it("returns project and task rows from mock.db in mock mode", async () => {
    const dbPath = createTempDb((db) => {
      db.exec(`
        CREATE TABLE projects (
          PROJECTNO TEXT PRIMARY KEY,
          TITLE TEXT,
          CUSTOMERNO TEXT,
          STATUSCODE TEXT,
          ENDDATE TEXT,
          PROJECTLEADER TEXT,
          MODDATE TEXT
        );
        CREATE TABLE projectschedule (
          PROJECTSCHEDULENO TEXT PRIMARY KEY,
          PROJECTNO TEXT,
          TITLE TEXT,
          STATUSCODE TEXT,
          ENDDATE TEXT,
          ASSIGNEE TEXT,
          SCHED TEXT,
          MODDATE TEXT
        );
      `);

      db.prepare(`
        INSERT INTO projects (PROJECTNO, TITLE, CUSTOMERNO, STATUSCODE, ENDDATE, PROJECTLEADER, MODDATE)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        "P-DB-1001",
        "SQLite Project",
        "C10025",
        "ACTIVE",
        "2026-03-28 00:00:00.000",
        "JMILLER",
        "2026-03-21 10:00:00.000",
      );
      db.prepare(`
        INSERT INTO projectschedule (PROJECTSCHEDULENO, PROJECTNO, TITLE, STATUSCODE, ENDDATE, ASSIGNEE, SCHED, MODDATE)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "TS-DB-1001",
        "P-DB-1001",
        "SQLite Task",
        "INPROGRESS",
        "2026-03-24 00:00:00.000",
        "JMILLER",
        "Generated from mock.db",
        "2026-03-23 09:30:00.000",
      );
    });

    vi.stubEnv("USE_MOCK_DATA", "true");
    vi.stubEnv("DATABASE_URL", `file:${dbPath}`);

    const [projects, tasks] = await Promise.all([listProjectRows(), listTaskRows()]);

    expect(projects.sourceName).toBe("mock.db:projects");
    expect(tasks.sourceName).toBe("mock.db:projectschedule");
    expect(projects.rows).toHaveLength(1);
    expect(tasks.rows).toHaveLength(1);
    expect(projects.rows[0]?.PROJECTNO).toBe("P-DB-1001");
    expect(tasks.rows[0]?.PROJECTSCHEDULENO).toBe("TS-DB-1001");
  });

  it("requires actual SQLite project and task tables in mock mode", async () => {
    const missingDbPath = path.join(os.tmpdir(), "q360-team1-list-actions-missing.sqlite");

    vi.stubEnv("USE_MOCK_DATA", "true");
    vi.stubEnv("DATABASE_URL", `file:${missingDbPath}`);

    await expect(listProjectRows()).rejects.toThrow(
      "Mock mode requires actual SQLite table(s) for Project reads.",
    );
    await expect(listTaskRows()).rejects.toThrow(
      "Mock mode requires actual SQLite table(s) for Task reads.",
    );
  });

  it("parses live-style project and task GET list responses", async () => {
    vi.stubEnv("Q360_BASE_URL", "https://example.test");
    vi.stubEnv("Q360_API_USER", "api-user");
    vi.stubEnv("Q360_API_PASSWORD", "api-password");

    server.use(
      http.get("https://example.test/api/Project", () =>
        HttpResponse.json({
          code: 200,
          message: "",
          payload: {
            result: [
              {
                customerno: "C10025",
                enddate: "2026-03-28 00:00:00.000",
                projectleader: "JMILLER",
                projectno: "P-1001",
                statuscode: "ACTIVE",
                title: "Campus AV Refresh",
              },
            ],
          },
          success: true,
        }),
      ),
      http.get("https://example.test/api/Task", () =>
        HttpResponse.json({
          code: 200,
          message: "",
          payload: {
            result: [
              {
                assignee: "JMILLER",
                enddate: "2026-03-19 00:00:00.000",
                projectno: "P-1001",
                projectscheduleno: "TS-1001",
                statuscode: "INPROGRESS",
                title: "Secure procurement approval",
              },
            ],
          },
          success: true,
        }),
      ),
    );

    const [projects, tasks] = await Promise.all([listProjectRows(), listTaskRows()]);

    expect(projects.rows).toHaveLength(1);
    expect(tasks.rows).toHaveLength(1);
    expect(projects.rows[0]?.projectno).toBe("P-1001");
    expect(tasks.rows[0]?.projectscheduleno).toBe("TS-1001");
  });
});
