import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { fetchQ360Json, Q360ApiError } from "@/lib/q360/client";

const server = setupServer();

describe("fetchQ360Json", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  afterAll(() => {
    server.close();
  });

  it("returns a validated Q360 envelope on success", async () => {
    vi.stubEnv("Q360_BASE_URL", "https://example.test");
    vi.stubEnv("Q360_API_USER", "api-user");
    vi.stubEnv("Q360_API_PASSWORD", "api-password");

    server.use(
      http.get("https://example.test/api/DataDict", () =>
        HttpResponse.json({
          code: 200,
          message: "",
          payload: { result: [{ table_dbf: "PROJECTS", table_type: "TABLE" }] },
          success: true,
        }),
      ),
    );

    const response = await fetchQ360Json(
      "/api/DataDict?_a=tableList",
      z.object({
        result: z.array(
          z.object({
            table_dbf: z.string(),
            table_type: z.string(),
          }),
        ),
      }),
      { method: "GET" },
    );

    expect(response.success).toBe(true);
    expect(response.payload.result[0]?.table_dbf).toBe("PROJECTS");
    expect(JSON.stringify(response)).not.toContain("api-user");
    expect(JSON.stringify(response)).not.toContain("api-password");
    expect(JSON.stringify(response)).not.toContain("Basic");
  });

  it("throws a structured error and logs Q360 error metadata on HTTP 200 with success false", async () => {
    vi.stubEnv("Q360_BASE_URL", "https://example.test");
    vi.stubEnv("Q360_API_USER", "api-user");
    vi.stubEnv("Q360_API_PASSWORD", "api-password");

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    server.use(
      http.get("https://example.test/api/UserID", () =>
        HttpResponse.json({
          code: 400,
          message: "Permission denied.",
          payload: {
            _error: [
              {
                errormessage: "Permission denied.",
                procname: "UserID_Access",
                referencecode: "NoDatasourceAccess",
              },
            ],
          },
          success: false,
        }),
      ),
    );

    await expect(
      fetchQ360Json(
        "/api/UserID?_a=datasourceAccessList&userid=api-user",
        z.object({ result: z.array(z.unknown()) }),
        { method: "GET" },
      ),
    ).rejects.toBeInstanceOf(Q360ApiError);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[q360]",
      expect.objectContaining({
        path: "/api/UserID?_a=datasourceAccessList&userid=api-user",
        procname: "UserID_Access",
        referencecode: "NoDatasourceAccess",
      }),
    );
  });
});
