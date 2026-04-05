import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Customer, Dispatch, Site, TimeBill } from "@/types/q360";

const {
  mockFormatDispatchForPrompt,
  mockGetDispatchByIdFromMockDb,
  mockGetCustomerFromMockDb,
  mockGetSiteFromMockDb,
  mockGetTimeBillsFromMockDb,
  fallbackDispatch,
  fallbackCustomer,
  fallbackSite,
  dbDispatch,
  dbCustomer,
  dbSite,
} = vi.hoisted(() => {
  const fallbackDispatch: Dispatch = {
    dispatchno: "FB-001",
    callno: "CALL-FB-001",
    customerno: "CUST-FB-001",
    siteno: "SITE-FB-001",
    statuscode: "OPEN",
    problem: "Fallback issue",
    solution: null,
    priority: "2",
    techassigned: null,
    date: "2026-04-01",
    closedate: null,
    estfixtime: "2026-04-04",
    callername: null,
    calleremail: null,
    callerphone: null,
    description: null,
  };

  const fallbackCustomer: Customer = {
    customerno: "CUST-FB-001",
    company: "Fallback Co",
    type: "Commercial",
    status: "Active",
  };

  const fallbackSite: Site = {
    siteno: "SITE-FB-001",
    sitename: "Fallback Site",
    address: "1 Fallback St",
    city: "Denver",
    state: "CO",
    zip: "80202",
    phone: "555-0001",
  };

  const dbDispatch: Dispatch = {
    dispatchno: "DB-001",
    callno: "CALL-DB-001",
    customerno: "CUST-DB-001",
    siteno: "SITE-DB-001",
    statuscode: "OPEN",
    problem: "DB issue",
    solution: "DB fix",
    priority: "1",
    techassigned: "Alex",
    date: "2026-04-02",
    closedate: null,
    estfixtime: "2026-04-03",
    callername: "Pat",
    calleremail: "pat@example.com",
    callerphone: "555-1000",
    description: "DB dispatch",
  };

  const dbCustomer: Customer = {
    customerno: "CUST-DB-001",
    company: "DB Customer",
    type: "Commercial",
    status: "Active",
  };

  const dbSite: Site = {
    siteno: "SITE-DB-001",
    sitename: "DB Site",
    address: "100 Main",
    city: "SLC",
    state: "UT",
    zip: "84101",
    phone: "555-2222",
  };

  return {
    mockFormatDispatchForPrompt: vi.fn(),
    mockGetDispatchByIdFromMockDb: vi.fn(),
    mockGetCustomerFromMockDb: vi.fn(),
    mockGetSiteFromMockDb: vi.fn(),
    mockGetTimeBillsFromMockDb: vi.fn(),
    fallbackDispatch,
    fallbackCustomer,
    fallbackSite,
    dbDispatch,
    dbCustomer,
    dbSite,
  };
});

vi.mock("@/lib/q360Client", () => ({
  formatDispatchForPrompt: mockFormatDispatchForPrompt,
  FALLBACK_DISPATCHES: [fallbackDispatch],
  FALLBACK_CUSTOMERS: { [fallbackCustomer.customerno]: fallbackCustomer },
  FALLBACK_SITES: { [fallbackSite.siteno]: fallbackSite },
}));

vi.mock("@/lib/mockDb", () => ({
  getDispatchByIdFromMockDb: mockGetDispatchByIdFromMockDb,
  getCustomerFromMockDb: mockGetCustomerFromMockDb,
  getSiteFromMockDb: mockGetSiteFromMockDb,
  getTimeBillsFromMockDb: mockGetTimeBillsFromMockDb,
}));

import {
  EntityNotFoundError,
  resolveEntity,
  UnsupportedEntityTypeError,
} from "@/lib/entityResolver";

beforeEach(() => {
  vi.resetAllMocks();
  mockGetDispatchByIdFromMockDb.mockResolvedValue(dbDispatch);
  mockGetCustomerFromMockDb.mockResolvedValue(dbCustomer);
  mockGetSiteFromMockDb.mockResolvedValue(dbSite);
  mockGetTimeBillsFromMockDb.mockResolvedValue([]);
  mockFormatDispatchForPrompt.mockReturnValue("FORMATTED");
});

describe("entityResolver.resolveEntity", () => {
  it("throws UnsupportedEntityTypeError for non-dispatch types", async () => {
    await expect(resolveEntity("project", "P-1")).rejects.toBeInstanceOf(
      UnsupportedEntityTypeError
    );
  });

  it("resolves from mock DB without time bills by default", async () => {
    const result = await resolveEntity("dispatch", "DB-001");

    expect(result.formatted).toBe("FORMATTED");
    expect(result.raw.dispatch).toBe(dbDispatch);
    expect(mockGetTimeBillsFromMockDb).not.toHaveBeenCalled();
    expect(mockFormatDispatchForPrompt).toHaveBeenCalledWith(
      dbDispatch,
      dbCustomer,
      dbSite
    );
  });

  it("includes time bills when includeTimeBills is true", async () => {
    const timeBills: TimeBill[] = [
      {
        tbstarttime: "2026-04-02T10:00:00Z",
        tbendtime: "2026-04-02T11:00:00Z",
        traveltime: "15",
        techassigned: "Alex",
      },
    ];
    mockGetTimeBillsFromMockDb.mockResolvedValue(timeBills);

    await resolveEntity("dispatch", "DB-001", { includeTimeBills: true });

    expect(mockGetTimeBillsFromMockDb).toHaveBeenCalledWith("DB-001");
    expect(mockFormatDispatchForPrompt).toHaveBeenCalledWith(
      dbDispatch,
      dbCustomer,
      dbSite,
      timeBills
    );
  });

  it("falls back to hardcoded data when DB lookup misses", async () => {
    mockGetDispatchByIdFromMockDb.mockResolvedValue(null);

    const result = await resolveEntity("dispatch", "FB-001");
    expect(result.raw.dispatch).toEqual(fallbackDispatch);
    expect(mockFormatDispatchForPrompt).toHaveBeenCalledWith(
      fallbackDispatch,
      fallbackCustomer,
      fallbackSite
    );
  });

  it("throws EntityNotFoundError when no DB or fallback match exists", async () => {
    mockGetDispatchByIdFromMockDb.mockResolvedValue(null);

    await expect(resolveEntity("dispatch", "MISSING-1")).rejects.toBeInstanceOf(
      EntityNotFoundError
    );
  });
});
