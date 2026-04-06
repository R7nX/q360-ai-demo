/**
 * Black-box CLI tests for the unified seeding scripts.
 *
 * The sandbox blocks child-process spawning, so these tests compile the
 * TypeScript CLI to a temporary CommonJS bundle and execute it inside an
 * isolated worker thread. That keeps the tests external to the script body
 * while remaining CI-friendly in this environment.
 */
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { Worker } from "node:worker_threads";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import ts from "typescript";

type CliResult = {
  status: number;
  stdout: string;
  stderr: string;
};

type MockQ360Response = {
  tableList?: unknown[];
  columnsByTable?: Record<string, unknown[]>;
  respondWithEmptyColumns?: boolean;
  statusCode?: number;
};

const repoRoot = path.resolve(__dirname, "../..");
const sourceScriptsDir = path.join(repoRoot, "scripts");
const compiledRoot = fs.mkdtempSync(path.join(repoRoot, ".tmp-seed-cli-"));
const compiledScriptsDir = path.join(compiledRoot, "scripts");
const seedScriptPath = path.join(compiledScriptsDir, "seed.js");
const seedDataPath = path.join(compiledScriptsDir, "seed-data.js");
const seedProfilesPath = path.join(compiledScriptsDir, "seed-profiles.js");
const seedValidatePath = path.join(compiledScriptsDir, "seed-validate.js");
const seedEnrichPath = path.join(compiledScriptsDir, "seed-enrich.js");

beforeAll(() => {
  fs.mkdirSync(compiledScriptsDir, { recursive: true });
  compileSeedScript("seed-data.ts", "seed-data.js");
  compileSeedScript("seed-profiles.ts", "seed-profiles.js");
  compileSeedScript("seed-validate.ts", "seed-validate.js");
  compileSeedScript("seed-enrich.ts", "seed-enrich.js");
  compileSeedScript("seed.ts", "seed.js");
});

afterAll(() => {
  fs.rmSync(compiledRoot, { recursive: true, force: true });
});

function compileSeedScript(sourceFile: string, outputFile: string) {
  const sourcePath = path.join(sourceScriptsDir, sourceFile);
  const outputPath = path.join(compiledScriptsDir, outputFile);
  const sourceText = fs.readFileSync(sourcePath, "utf8");
  const result = ts.transpileModule(sourceText, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      resolveJsonModule: true,
    },
    fileName: sourcePath,
  });

  fs.writeFileSync(outputPath, result.outputText, "utf8");
}

function createTempWorkdir(prefix: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function baseEnv(overrides: Record<string, string | undefined> = {}) {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.Q360_BASE_URL;
  delete env.Q360_API_USERNAME;
  delete env.Q360_API_PASSWORD;
  delete env.DATABASE_URL;
  delete env.USE_MOCK_DATA;
  env.SEED_SKIP_ENV_FILE = "true";

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }

  return env;
}

function buildWorkerSource() {
  return `
    const { parentPort, workerData } = require("node:worker_threads");
    const { format } = require("node:util");

    class ExitSignal extends Error {
      constructor(code) {
        super("process.exit(" + code + ")");
        this.name = "ExitSignal";
        this.code = code;
      }
    }

    let stdout = "";
    let stderr = "";
    let settled = false;
    let doneTimer = null;

    function finish(message) {
      if (settled) return;
      settled = true;
      if (doneTimer) clearTimeout(doneTimer);
      parentPort.postMessage({ ...message, stdout, stderr });
    }

    function scheduleDone() {
      if (settled) return;
      if (doneTimer) clearTimeout(doneTimer);
      doneTimer = setTimeout(() => finish({ kind: "done", status: 0 }), workerData.quietMs);
    }

    console.log = (...args) => {
      stdout += format(...args) + "\\n";
      scheduleDone();
    };

    console.error = (...args) => {
      stderr += format(...args) + "\\n";
      scheduleDone();
    };

    process.argv = [process.execPath, workerData.seedScriptPath, ...workerData.args];
    Object.keys(process.env).forEach((key) => delete process.env[key]);
    Object.assign(process.env, workerData.env);

    process.exit = (code = 0) => {
      throw new ExitSignal(typeof code === "number" ? code : 0);
    };

    process.on("uncaughtException", (err) => {
      if (err instanceof ExitSignal) {
        finish({ kind: "exit", status: err.code });
      } else {
        finish({
          kind: "error",
          status: 1,
          error: { message: err?.message ?? String(err), stack: err?.stack ?? null },
        });
      }
    });

    process.on("unhandledRejection", (reason) => {
      if (reason instanceof ExitSignal) {
        finish({ kind: "exit", status: reason.code });
      } else {
        finish({
          kind: "error",
          status: 1,
          error: { message: reason?.message ?? String(reason), stack: reason?.stack ?? null },
        });
      }
    });

    try {
      delete require.cache[workerData.seedScriptPath];
      delete require.cache[workerData.seedDataPath];
      delete require.cache[workerData.seedProfilesPath];
      delete require.cache[workerData.seedValidatePath];
      delete require.cache[workerData.seedEnrichPath];
      require(workerData.seedScriptPath);
      scheduleDone();
    } catch (err) {
      if (err instanceof ExitSignal) {
        finish({ kind: "exit", status: err.code });
      } else {
        finish({
          kind: "error",
          status: 1,
          error: { message: err?.message ?? String(err), stack: err?.stack ?? null },
        });
      }
    }
  `;
}

async function runSeedScript(
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string | undefined>;
    waitFor?: (result: CliResult) => boolean;
    quietMs?: number;
  } = {}
): Promise<CliResult> {
  const cwd = options.cwd ?? createTempWorkdir("seed-run-");
  const worker = new Worker(buildWorkerSource(), {
    eval: true,
    workerData: {
      args,
      cwd,
      env: baseEnv(options.env),
      seedScriptPath,
      seedDataPath,
      seedProfilesPath,
      seedValidatePath,
      seedEnrichPath,
      quietMs: options.quietMs ?? 100,
    },
  });

  return await new Promise<CliResult>((resolve, reject) => {
    const cleanup = () => {
      worker.removeAllListeners();
      void worker.terminate();
    };

    worker.once("message", (message: {
      kind: "done" | "exit" | "error";
      status: number;
      stdout: string;
      stderr: string;
      error?: { message: string; stack: string | null };
    }) => {
      const result: CliResult = {
        status: message.status,
        stdout: message.stdout ?? "",
        stderr: message.stderr ?? "",
      };

      if (message.kind === "error") {
        cleanup();
        reject(new Error(message.error?.message ?? "seed worker failed"));
        return;
      }

      if (options.waitFor && !options.waitFor(result)) {
        cleanup();
        reject(
          new Error(
            `seed worker completed before the expected condition was satisfied.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
          )
        );
        return;
      }

      cleanup();
      resolve(result);
    });

    worker.once("error", (error) => {
      cleanup();
      reject(error);
    });

    worker.once("exit", (code) => {
      if (code !== 0) {
        cleanup();
        reject(new Error(`seed worker exited with code ${code}`));
      }
    });
  });
}

async function withMockQ360Server(
  response: MockQ360Response,
  run: (baseUrl: string, getRequests: () => number) => Promise<void>
) {
  let requestCount = 0;
  const server = http.createServer((req, res) => {
    requestCount += 1;
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const auth = req.headers.authorization ?? "";

    if (!auth.startsWith("Basic ")) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "missing auth" }));
      return;
    }

    if (url.pathname === "/api/DataDict" && url.searchParams.get("_a") === "tableList") {
      res.statusCode = response.statusCode ?? 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          code: 200,
          success: true,
          payload: { result: response.tableList ?? [] },
        })
      );
      return;
    }

    if (url.pathname === "/api/DataDict" && url.searchParams.get("_a") === "list") {
      const tableName = String(url.searchParams.get("tablename") ?? "").toUpperCase();
      const rows = response.columnsByTable?.[tableName];

      res.statusCode = response.respondWithEmptyColumns ? 200 : response.statusCode ?? 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          code: 200,
          success: true,
          payload: { result: rows ?? [] },
        })
      );
      return;
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ code: 404, success: false, message: `Unexpected path: ${url.pathname}` }));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    throw new Error("Failed to start mock Q360 server");
  }

  try {
    await run(`http://127.0.0.1:${address.port}`, () => requestCount);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function openSqliteDatabase(cwd: string) {
  return new Database(path.join(cwd, "mock.db"));
}

describe.sequential("seed CLI", () => {
  it("seeds the default story database in SQLite mode with the expected demo tables", async () => {
    const cwd = createTempWorkdir("seed-default-");
    const dbPath = path.join(cwd, "mock.db");
    const result = await runSeedScript([], {
      cwd,
      env: {
        USE_MOCK_DATA: "TrUe",
        MOCK_DB_PATH: dbPath,
      },
      waitFor: (output) => output.stdout.includes("Done. Restart your dev server to see the new data."),
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Target: SQLite \(.*mock\.db\)/);
    expect(result.stdout).toContain("Seeded 8 customers");
    expect(result.stdout).toContain("Seeded 20 sites");
    expect(result.stdout).toContain("Seeded 50 dispatches");
    expect(result.stdout).toContain("Seeded 21 timebills");
    expect(result.stdout).toContain("Seeded 15 tasks");
    expect(result.stdout).toContain("Done. Restart your dev server to see the new data.");

    const db = openSqliteDatabase(cwd);
    try {
      expect(
        db.prepare("SELECT COUNT(*) AS count FROM customer").get() as { count: number }
      ).toMatchObject({ count: 8 });
      expect(
        db.prepare("SELECT COUNT(*) AS count FROM site").get() as { count: number }
      ).toMatchObject({ count: 20 });
      expect(
        db.prepare("SELECT COUNT(*) AS count FROM dispatch").get() as { count: number }
      ).toMatchObject({ count: 50 });
      expect(
        db.prepare("SELECT COUNT(*) AS count FROM timebill").get() as { count: number }
      ).toMatchObject({ count: 21 });
      expect(
        db.prepare("SELECT COUNT(*) AS count FROM tasks").get() as { count: number }
      ).toMatchObject({ count: 15 });

      const dispatchRow = db
        .prepare("SELECT callername, calleremail, callerphone, description FROM dispatch WHERE dispatchno = ?")
        .get("D-0001") as Record<string, unknown>;

      expect(dispatchRow.callername).toBe("Derek Nguyen");
      expect(dispatchRow.calleremail).toBe("d.nguyen@silvercreekdata.com");
      expect(dispatchRow.callerphone).toBe("(801) 555-4401");
      expect(dispatchRow.description).toContain("UPS battery bank failure");
    } finally {
      db.close();
    }
  });

  it("lists Q360 tables in list mode using the mocked REST API", async () => {
    await withMockQ360Server(
      {
        tableList: [
          { table_dbf: "DISPATCH" },
          { tablename: "CUSTOMER" },
          "SITE",
        ],
      },
      async (baseUrl, getRequests) => {
        const result = await runSeedScript(["list"], {
          env: {
            Q360_BASE_URL: baseUrl,
            Q360_API_USERNAME: "Q360API_UTAH",
            Q360_API_PASSWORD: "secret",
          },
          waitFor: (output) => output.stdout.includes("Available Q360 tables (3)"),
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("Fetching table list from Q360");
        expect(result.stdout).toContain("Available Q360 tables (3)");
        expect(result.stdout).toContain("DISPATCH");
        expect(result.stdout).toContain("CUSTOMER");
        expect(result.stdout).toContain("SITE");
        expect(getRequests()).toBe(1);
      }
    );
  });

  it("prints the profile-backed table catalog without requiring database or Q360 env", async () => {
    const result = await runSeedScript(["profiles"], {
      cwd: createTempWorkdir("seed-profiles-"),
      waitFor: (output) => output.stdout.includes("Supported meaningful profile tables"),
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Supported meaningful profile tables");
    expect(result.stdout).toContain("CUSTOMER");
    expect(result.stdout).toContain("TASKS");
    expect(result.stdout).toContain("MACHINE");
    expect(result.stdout).toContain("EMPSCHEDULE");
  });

  it("seeds a profile-backed table with an explicit count and normalized table name", async () => {
    const cwd = createTempWorkdir("seed-profile-table-");
    const dbPath = path.join(cwd, "mock.db");
    await withMockQ360Server(
      {
        columnsByTable: {
          MACHINE: [
            { field_name: "MACHINENO", sqltype: "VARCHAR", mandatoryflag: "Y" },
            { field_name: "CUSTOMERNO", sqltype: "VARCHAR", mandatoryflag: "Y" },
            { field_name: "SITENO", sqltype: "VARCHAR", mandatoryflag: "Y" },
            { field_name: "STATUS", sqltype: "VARCHAR", mandatoryflag: "N" },
            { field_name: "STATUSCODE", sqltype: "VARCHAR", mandatoryflag: "N" },
            { field_name: "DESCRIPTION", sqltype: "VARCHAR", mandatoryflag: "N" },
            { field_name: "MODEL", sqltype: "VARCHAR", mandatoryflag: "N" },
            { field_name: "SERIALNO", sqltype: "VARCHAR", mandatoryflag: "N" },
            { field_name: "INSTALLDATE", sqltype: "VARCHAR", mandatoryflag: "N" },
          ],
        },
      },
      async (baseUrl) => {
        const result = await runSeedScript(["machine", "3"], {
          cwd,
          env: {
            USE_MOCK_DATA: "true",
            MOCK_DB_PATH: dbPath,
            Q360_BASE_URL: baseUrl,
            Q360_API_USERNAME: "Q360API_UTAH",
            Q360_API_PASSWORD: "secret",
          },
          waitFor: (output) => output.stdout.includes('Seeded 3 rows into "MACHINE"'),
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("Normalized table name: machine -> MACHINE");
        expect(result.stdout).toContain('Fetching schema for "MACHINE" from Q360');
        expect(result.stdout).toContain('Using meaningful profile generator for "MACHINE"');
        expect(result.stdout).toContain('Seeded 3 rows into "MACHINE"');

        const db = openSqliteDatabase(cwd);
        try {
          const countRow = db.prepare('SELECT COUNT(*) AS count FROM "MACHINE"').get() as {
            count: number;
          };
          expect(countRow.count).toBe(3);

          const machineRow = db
            .prepare('SELECT MACHINENO, CUSTOMERNO, SITENO, DESCRIPTION FROM "MACHINE" ORDER BY MACHINENO ASC LIMIT 1')
            .get() as Record<string, unknown>;

          expect(machineRow.MACHINENO).toBe("MACH-0001");
          expect(machineRow.CUSTOMERNO).toMatch(/^CUST\d{3}$/);
          expect(machineRow.SITENO).toMatch(/^SITE\d{3}$/);
          expect(String(machineRow.DESCRIPTION)).toContain("at");
        } finally {
          db.close();
        }
      }
    );
  });

  it("falls back to synthetic rows when no profile exists and an invalid count is supplied", async () => {
    const cwd = createTempWorkdir("seed-fallback-table-");
    const dbPath = path.join(cwd, "mock.db");
    await withMockQ360Server(
      {
        columnsByTable: {
          CUSTOMEXTENSION: [
            { field_name: "ID", sqltype: "VARCHAR", mandatoryflag: "Y" },
            { field_name: "NAME", sqltype: "VARCHAR", mandatoryflag: "Y" },
            { field_name: "CREATEDDATE", sqltype: "DATETIME", mandatoryflag: "N" },
            { field_name: "AMOUNT", sqltype: "MONEY", mandatoryflag: "N" },
            { field_name: "ACTIVEFLAG", sqltype: "BIT", mandatoryflag: "N" },
            { field_name: "NOTES", sqltype: "VARCHAR", mandatoryflag: "N" },
          ],
        },
      },
      async (baseUrl) => {
        const result = await runSeedScript(["customextension", "-5"], {
          cwd,
          env: {
            USE_MOCK_DATA: "true",
            MOCK_DB_PATH: dbPath,
            Q360_BASE_URL: baseUrl,
            Q360_API_USERNAME: "Q360API_UTAH",
            Q360_API_PASSWORD: "secret",
          },
          waitFor: (output) => output.stdout.includes('Seeded 20 rows into "CUSTOMEXTENSION"'),
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("Normalized table name: customextension -> CUSTOMEXTENSION");
        expect(result.stdout).toContain('No profile for "CUSTOMEXTENSION", using schema-based synthetic fallback');
        expect(result.stdout).toContain('Seeded 20 rows into "CUSTOMEXTENSION"');

        const db = openSqliteDatabase(cwd);
        try {
          const countRow = db.prepare('SELECT COUNT(*) AS count FROM "CUSTOMEXTENSION"').get() as {
            count: number;
          };
          expect(countRow.count).toBe(20);

          const row = db
            .prepare('SELECT ID, NAME, CREATEDDATE, AMOUNT, ACTIVEFLAG, NOTES FROM "CUSTOMEXTENSION" LIMIT 1')
            .get() as Record<string, unknown>;

          expect(typeof row.ID).toBe("string");
          expect(typeof row.NAME).toBe("string");
          expect(row.CREATEDDATE == null || typeof row.CREATEDDATE === "string").toBe(true);
          expect(typeof row.AMOUNT === "number" || typeof row.AMOUNT === "string").toBe(true);
          expect(row.ACTIVEFLAG === 0 || row.ACTIVEFLAG === 1 || row.ACTIVEFLAG == null).toBe(true);
          expect(row.NOTES == null || typeof row.NOTES === "string").toBe(true);
        } finally {
          db.close();
        }
      }
    );
  });

  it("fails fast when a dynamic table has no columns", async () => {
    const cwd = createTempWorkdir("seed-invalid-table-");
    const dbPath = path.join(cwd, "mock.db");
    await withMockQ360Server(
      {
        respondWithEmptyColumns: true,
      },
      async (baseUrl, getRequests) => {
        const result = await runSeedScript(["bogus-table"], {
          cwd,
          env: {
            USE_MOCK_DATA: "true",
            MOCK_DB_PATH: dbPath,
            Q360_BASE_URL: baseUrl,
            Q360_API_USERNAME: "Q360API_UTAH",
            Q360_API_PASSWORD: "secret",
          },
        });

        expect(result.status).toBe(1);
        expect(result.stdout).toContain("Normalized table name: bogus-table -> BOGUS-TABLE");
        expect(result.stdout).toContain('Fetching schema for "BOGUS-TABLE" from Q360');
        expect(result.stderr || result.stdout).toContain(
          'No columns returned for table "BOGUS-TABLE". Check the table name and API access.'
        );
        expect(getRequests()).toBe(1);
      }
    );
  });

  it("requires DATABASE_URL when mock mode is disabled", async () => {
    const result = await runSeedScript([], {
      cwd: createTempWorkdir("seed-missing-db-"),
      env: {
        USE_MOCK_DATA: "FALSE",
      },
    });

    expect(result.status).toBe(1);
    expect(result.stderr || result.stdout).toContain(
      "USE_MOCK_DATA is false but DATABASE_URL is not set."
    );
  });

  it("requires Q360 credentials for list mode and does not call the network", async () => {
    await withMockQ360Server(
      {
        tableList: [{ table_dbf: "DISPATCH" }],
      },
      async (baseUrl, getRequests) => {
        const result = await runSeedScript(["list"], {
          cwd: createTempWorkdir("seed-missing-q360-"),
          env: {
            Q360_BASE_URL: baseUrl,
          },
        });

        expect(result.status).toBe(1);
        expect(result.stderr || result.stdout).toContain(
          "Missing Q360 API credentials (Q360_BASE_URL, Q360_API_USERNAME, Q360_API_PASSWORD)."
        );
        expect(getRequests()).toBe(0);
      }
    );
  });
});
