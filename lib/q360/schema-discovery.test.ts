import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  clearQ360DiscoveryCache,
  getDatasourceAccessList,
  getPhase0DiscoverySummary,
  getTableList,
  getTableSchema,
} from "@/lib/q360/schema-discovery";

const server = setupServer();

describe("schema discovery", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.resetHandlers();
    clearQ360DiscoveryCache();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  afterAll(() => {
    server.close();
  });

  it("returns normalized discovery objects from live-style Q360 responses", async () => {
    vi.stubEnv("Q360_BASE_URL", "https://example.test");
    vi.stubEnv("Q360_API_USER", "api-user");
    vi.stubEnv("Q360_API_PASSWORD", "api-password");

    server.use(
      http.get("https://example.test/api/UserID", () =>
        HttpResponse.json({
          code: 200,
          message: "",
          payload: {
            result: [
              {
                accessflag: "Y",
                datasource: "GRIDVIEW_ActiveProjects",
                gridviewname: "",
                pkname: "PROJECTNO",
                seq: "1",
                sourcetype: "VIEW",
                sqlreportdatasourcepermno: "99",
                tabledef_editcondition: null,
                userid: "api-user",
              },
            ],
          },
          success: true,
        }),
      ),
      http.get("https://example.test/api/DataDict", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("_a") === "tableList") {
          return HttpResponse.json({
            code: 200,
            message: "",
            payload: {
              result: [
                {
                  table_dbf: "GRIDVIEW_ActiveProjects",
                  table_type: "VIEW",
                },
              ],
            },
            success: true,
          });
        }

        return HttpResponse.json({
          code: 200,
          message: "",
          payload: {
            result: [
              {
                field_name: "PROJECTNO",
                field_web_title: "Project No",
                mandatoryflag: "Y",
                p_key: "T",
                sqltype: "VARCHAR",
                table_dbf: "GRIDVIEW_ActiveProjects",
              },
              {
                field_name: "TITLE",
                field_web_title: "Title",
                mandatoryflag: "N",
                p_key: "F",
                sqltype: "VARCHAR",
                table_dbf: "GRIDVIEW_ActiveProjects",
              },
            ],
          },
          success: true,
        });
      }),
    );

    const [accessList, tableList, schema] = await Promise.all([
      getDatasourceAccessList(),
      getTableList(),
      getTableSchema("GRIDVIEW_ActiveProjects"),
    ]);

    expect(accessList[0]?.datasource).toBe("GRIDVIEW_ACTIVEPROJECTS");
    expect(tableList[0]?.table_type).toBe("VIEW");
    expect(schema.primaryKey).toBe("PROJECTNO");
    expect(schema.fields).toHaveLength(2);
  });

  it("caches schema discovery results and avoids a second HTTP request", async () => {
    vi.stubEnv("Q360_BASE_URL", "https://example.test");
    vi.stubEnv("Q360_API_USER", "api-user");
    vi.stubEnv("Q360_API_PASSWORD", "api-password");

    let schemaRequestCount = 0;

    server.use(
      http.get("https://example.test/api/DataDict", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("_a") === "tableList") {
          return HttpResponse.json({
            code: 200,
            message: "",
            payload: { result: [] },
            success: true,
          });
        }

        schemaRequestCount += 1;
        return HttpResponse.json({
          code: 200,
          message: "",
          payload: {
            result: [
              {
                field_name: "PROJECTNO",
                field_web_title: "Project No",
                mandatoryflag: "Y",
                p_key: "T",
                sqltype: "VARCHAR",
                table_dbf: "PROJECTS",
              },
            ],
          },
          success: true,
        });
      }),
    );

    const firstSchema = await getTableSchema("PROJECTS");
    const secondSchema = await getTableSchema("PROJECTS");

    expect(firstSchema.primaryKey).toBe("PROJECTNO");
    expect(secondSchema.primaryKey).toBe("PROJECTNO");
    expect(schemaRequestCount).toBe(1);
  });

  it("builds a Phase 0 discovery summary in mock mode", async () => {
    vi.stubEnv("Q360_MOCK_MODE", "true");

    const summary = await getPhase0DiscoverySummary();

    expect(summary.accessListError).toBeNull();
    expect(summary.mockMode).toBe(true);
    expect(summary.candidateSourceCount).toBeGreaterThan(10);
    expect(summary.businessAreas).toHaveLength(5);
    expect(summary.businessAreas[0]?.recommendedSource).toBe("LDView_Project");
    expect(summary.businessAreas[0]?.candidates[0]?.primaryKey).toBeTruthy();
    expect(
      summary.businessAreas.find((area) => area.areaKey === "commercialPipeline")
        ?.matchedSourceCount,
    ).toBeGreaterThan(0);
  });

  it("returns a partial discovery summary when datasource access lookup fails", async () => {
    vi.stubEnv("Q360_BASE_URL", "https://example.test");
    vi.stubEnv("Q360_API_USER", "api-user");
    vi.stubEnv("Q360_API_PASSWORD", "api-password");

    server.use(
      http.get("https://example.test/api/UserID", () =>
        HttpResponse.json(
          {
            code: 403,
            message: "Access denied. Invalid or unauthorized endpoint.",
            payload: { _error: [] },
            success: false,
          },
          { status: 403 },
        ),
      ),
      http.get("https://example.test/api/DataDict", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("_a") === "tableList") {
          return HttpResponse.json({
            code: 200,
            message: "",
            payload: {
              result: [
                {
                  table_dbf: "PROJECTS",
                  table_type: "TABLE",
                },
              ],
            },
            success: true,
          });
        }

        return HttpResponse.json({
          code: 200,
          message: "",
          payload: {
            result: [
              {
                field_name: "PROJECTNO",
                field_web_title: "Project No",
                mandatoryflag: "Y",
                p_key: "T",
                sqltype: "VARCHAR",
                table_dbf: "PROJECTS",
              },
            ],
          },
          success: true,
        });
      }),
    );

    const summary = await getPhase0DiscoverySummary();

    expect(summary.accessListError).toContain("Access denied");
    expect(summary.accessListCount).toBe(0);
    expect(summary.tableListCount).toBe(1);
    expect(summary.businessAreas).toHaveLength(5);
  });
});
