import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

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

  afterEach(() => {
    clearListActionCache();
    server.resetHandlers();
    vi.unstubAllEnvs();
  });

  afterAll(() => {
    server.close();
  });

  it("returns mock project and task rows in mock mode", async () => {
    vi.stubEnv("Q360_MOCK_MODE", "true");

    const [projects, tasks] = await Promise.all([listProjectRows(), listTaskRows()]);

    expect(projects.sourceName).toBe("Project");
    expect(tasks.sourceName).toBe("Task");
    expect(projects.rows.length).toBeGreaterThan(0);
    expect(tasks.rows.length).toBeGreaterThan(0);
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
