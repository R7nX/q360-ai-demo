import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

type MockPgTable = {
  rows: Record<string, unknown>[];
  schemaName?: string;
  tableName: string;
};

const mockPgTables = new Map<string, MockPgTable>();

function buildMockPgTableKey(tableName: string, schemaName = "public"): string {
  return `${schemaName}.${tableName}`.toUpperCase();
}

function setMockPgTables(tables: MockPgTable[]): void {
  mockPgTables.clear();

  for (const table of tables) {
    mockPgTables.set(
      buildMockPgTableKey(table.tableName, table.schemaName),
      {
        rows: table.rows.map((row) => ({ ...row })),
        schemaName: table.schemaName ?? "public",
        tableName: table.tableName,
      },
    );
  }
}

vi.mock("pg", () => ({
  Pool: class MockPool {
    async end(): Promise<void> {
      return;
    }

    async query(sql: string): Promise<{ rows: Record<string, unknown>[] }> {
      if (sql.includes("information_schema.tables")) {
        return {
          rows: [...mockPgTables.values()].map((table) => ({
            table_name: table.tableName,
            table_schema: table.schemaName ?? "public",
          })),
        };
      }

      const match = sql.match(/FROM\s+"([^"]+)"\."([^"]+)"/i);
      if (!match) {
        throw new Error(`Unexpected PostgreSQL query in test: ${sql}`);
      }

      const [, schemaName, tableName] = match;
      const table = mockPgTables.get(buildMockPgTableKey(tableName, schemaName));

      return {
        rows: table ? table.rows.map((row) => ({ ...row })) : [],
      };
    }
  },
}));

import { clearMockPostgresCache } from "@/lib/q360/mock-postgres";
import {
  clearListActionCache,
  listProjectRows,
  listTaskRows,
} from "@/lib/q360/list-actions";

const server = setupServer();

describe("Q360 list-action adapter", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(async () => {
    await clearMockPostgresCache();
    clearListActionCache();
    mockPgTables.clear();
    server.resetHandlers();
    vi.unstubAllEnvs();
  });

  afterAll(() => {
    server.close();
  });

  it("returns project and task rows from PostgreSQL when DATABASE_URL points to Postgres", async () => {
    setMockPgTables([
      {
        tableName: "projects",
        rows: [
          {
            CUSTOMERNO: "C10025",
            ENDDATE: "2026-03-28 00:00:00.000",
            MODDATE: "2026-03-21 10:00:00.000",
            PROJECTLEADER: "JMILLER",
            PROJECTNO: "P-DB-1001",
            STATUSCODE: "ACTIVE",
            TITLE: "Postgres Project",
          },
        ],
      },
      {
        tableName: "projectschedule",
        rows: [
          {
            ASSIGNEE: "JMILLER",
            ENDDATE: "2026-03-24 00:00:00.000",
            MODDATE: "2026-03-23 09:30:00.000",
            PROJECTNO: "P-DB-1001",
            PROJECTSCHEDULENO: "TS-DB-1001",
            SCHED: "Generated from PostgreSQL",
            STATUSCODE: "INPROGRESS",
            TITLE: "Postgres Task",
          },
        ],
      },
    ]);

    vi.stubEnv("DATABASE_URL", "postgresql://feature1:test@localhost:5432/q360_feature1");

    const [projects, tasks] = await Promise.all([listProjectRows(), listTaskRows()]);

    expect(projects.sourceName).toBe("postgres:projects");
    expect(tasks.sourceName).toBe("postgres:projectschedule");
    expect(projects.rows).toHaveLength(1);
    expect(tasks.rows).toHaveLength(1);
    expect(projects.rows[0]?.PROJECTNO).toBe("P-DB-1001");
    expect(tasks.rows[0]?.PROJECTSCHEDULENO).toBe("TS-DB-1001");
  });

  it("prefers PROJECTSCHEDULE over a generic tasks table when both exist", async () => {
    setMockPgTables([
      {
        tableName: "projectschedule",
        rows: [
          {
            PROJECTNO: "P-DB-2001",
            PROJECTSCHEDULENO: "PS-2001",
            TITLE: "Scheduled Task",
          },
        ],
      },
      {
        tableName: "tasks",
        rows: [
          {
            id: "GENERIC-1",
            title: "Generic task row",
          },
        ],
      },
    ]);

    vi.stubEnv("DATABASE_URL", "postgresql://feature1:test@localhost:5432/q360_feature1");

    const tasks = await listTaskRows();

    expect(tasks.sourceName).toBe("postgres:projectschedule");
    expect(tasks.rows[0]?.PROJECTSCHEDULENO).toBe("PS-2001");
  });

  it("requires actual PostgreSQL project and task tables when Feature 1 is pointed at Postgres", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://feature1:test@localhost:5432/q360_feature1");

    await expect(listProjectRows()).rejects.toThrow(
      "Feature 1 requires actual PostgreSQL table(s) for Project reads.",
    );
    await expect(listTaskRows()).rejects.toThrow(
      "Feature 1 requires actual PostgreSQL table(s) for Task reads.",
    );
  });

  it("does not treat snapshot or detail tables as core project rows", async () => {
    setMockPgTables([
      {
        tableName: "ldview_projectsnapshot",
        rows: [
          {
            ASOFDATE: "2026-03-23 00:00:00.000",
            PROJECTNO: "P-DB-1001",
            SNAPSHOTREVENUE: "71000",
          },
        ],
      },
      {
        tableName: "ldview_projectdetail",
        rows: [
          {
            DESCRIPTION: "Display package",
            PROJECTNO: "P-DB-1001",
          },
        ],
      },
    ]);

    vi.stubEnv("DATABASE_URL", "postgresql://feature1:test@localhost:5432/q360_feature1");

    await expect(listProjectRows()).rejects.toThrow(
      "Feature 1 requires actual PostgreSQL table(s) for Project reads.",
    );
  });

  it("falls back to live Q360 when DATABASE_URL is not PostgreSQL", async () => {
    vi.stubEnv("DATABASE_URL", "mysql://legacy-user:legacy-pass@localhost:3306/q360demo");
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
                projectno: "P-LIVE-1",
                title: "Live Fallback Project",
              },
            ],
          },
          success: true,
        }),
      ),
    );

    const projects = await listProjectRows();

    expect(projects.sourceName).toBe("Project");
    expect(projects.rows[0]?.projectno).toBe("P-LIVE-1");
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
