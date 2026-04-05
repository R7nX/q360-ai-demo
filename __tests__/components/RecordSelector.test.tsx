// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecordSelector from "@/app/feature2/components/RecordSelector";
import type { RecordSummary } from "@/types/feature2";

// ── Fixture records covering every status ─────────────────────────────────────

const RECORDS: RecordSummary[] = [
  { id: "D-001", customerName: "Acme",   status: "OPEN",        problem: "No power",       date: "2025-01-01", techAssigned: "Alice", siteName: "HQ" },
  { id: "D-002", customerName: "Beta",   status: "IN PROGRESS", problem: "Leak",           date: "2025-01-02", techAssigned: "Bob",   siteName: "Site B" },
  { id: "D-003", customerName: "Gamma",  status: "PENDING",     problem: "Noise",          date: "2025-01-03", techAssigned: "Carol", siteName: "Site C" },
  { id: "D-004", customerName: "Delta",  status: "ON HOLD",     problem: "Parts wait",     date: "2025-01-04", techAssigned: "Dan",   siteName: "Site D" },
  { id: "D-005", customerName: "Echo",   status: "CLOSED",      problem: "Fixed fan",      date: "2025-01-05", techAssigned: "Eve",   siteName: "Site E" },
  { id: "D-006", customerName: "Foxtrot",status: "SCHEDULED",   problem: "Routine check",  date: "2025-01-06", techAssigned: "Frank", siteName: "Site F" },
];

function mockFetch(records: RecordSummary[] = RECORDS) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ records }),
    })
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── Helper: get all option texts from the select ──────────────────────────────

function getOptions() {
  const select = screen.getByRole("combobox") as HTMLSelectElement;
  return Array.from(select.options)
    .map((o) => o.text)
    .filter((t) => !t.startsWith("Choose")); // exclude placeholder
}

// ── Status filter tests ───────────────────────────────────────────────────────

describe("RecordSelector — status filters", () => {
  it("shows all records when no automationType is set", async () => {
    mockFetch();
    render(<RecordSelector selectedId={null} onSelect={() => {}} automationType={null} />);
    await waitFor(() => expect(getOptions()).toHaveLength(RECORDS.length));
  });

  describe("project-status", () => {
    it("shows only open-state dispatches", async () => {
      mockFetch();
      render(<RecordSelector selectedId={null} onSelect={() => {}} automationType="project-status" />);
      await waitFor(() => {
        const opts = getOptions();
        expect(opts.some((o) => o.includes("OPEN"))).toBe(true);
        expect(opts.some((o) => o.includes("IN PROGRESS"))).toBe(true);
        expect(opts.some((o) => o.includes("PENDING"))).toBe(true);
        expect(opts.some((o) => o.includes("ON HOLD"))).toBe(true);
      });
    });

    it("excludes CLOSED dispatches", async () => {
      mockFetch();
      render(<RecordSelector selectedId={null} onSelect={() => {}} automationType="project-status" />);
      await waitFor(() => {
        expect(getOptions().some((o) => o.includes("D-005"))).toBe(false);
      });
    });

    it("excludes SCHEDULED dispatches", async () => {
      mockFetch();
      render(<RecordSelector selectedId={null} onSelect={() => {}} automationType="project-status" />);
      await waitFor(() => {
        expect(getOptions().some((o) => o.includes("D-006"))).toBe(false);
      });
    });
  });

  describe("service-closure", () => {
    it("shows only CLOSED dispatches", async () => {
      mockFetch();
      render(<RecordSelector selectedId={null} onSelect={() => {}} automationType="service-closure" />);
      await waitFor(() => {
        const opts = getOptions();
        expect(opts).toHaveLength(1);
        expect(opts[0]).toContain("D-005");
      });
    });

    it("excludes all open-state dispatches", async () => {
      mockFetch();
      render(<RecordSelector selectedId={null} onSelect={() => {}} automationType="service-closure" />);
      await waitFor(() => {
        const opts = getOptions();
        expect(opts.some((o) => o.includes("OPEN"))).toBe(false);
        expect(opts.some((o) => o.includes("IN PROGRESS"))).toBe(false);
        expect(opts.some((o) => o.includes("PENDING"))).toBe(false);
      });
    });
  });

  describe("overdue-alert", () => {
    it("shows only open-state dispatches", async () => {
      mockFetch();
      render(<RecordSelector selectedId={null} onSelect={() => {}} automationType="overdue-alert" />);
      await waitFor(() => {
        const opts = getOptions();
        expect(opts.some((o) => o.includes("OPEN"))).toBe(true);
        expect(opts.some((o) => o.includes("IN PROGRESS"))).toBe(true);
        expect(opts.some((o) => o.includes("PENDING"))).toBe(true);
        expect(opts.some((o) => o.includes("ON HOLD"))).toBe(true);
      });
    });

    it("excludes CLOSED dispatches", async () => {
      mockFetch();
      render(<RecordSelector selectedId={null} onSelect={() => {}} automationType="overdue-alert" />);
      await waitFor(() => {
        expect(getOptions().some((o) => o.includes("D-005"))).toBe(false);
      });
    });

    it("has same set of records as project-status", async () => {
      mockFetch();
      const { unmount } = render(
        <RecordSelector selectedId={null} onSelect={() => {}} automationType="project-status" />
      );
      const projectStatusOpts = await waitFor(() => {
        const opts = getOptions();
        expect(opts.length).toBeGreaterThan(0);
        return opts;
      });
      unmount();

      mockFetch();
      render(<RecordSelector selectedId={null} onSelect={() => {}} automationType="overdue-alert" />);
      const overdueOpts = await waitFor(() => {
        const opts = getOptions();
        expect(opts.length).toBeGreaterThan(0);
        return opts;
      });

      expect(overdueOpts).toEqual(projectStatusOpts);
    });
  });

  describe("new-call-ack", () => {
    it("shows only OPEN and PENDING dispatches", async () => {
      mockFetch();
      render(<RecordSelector selectedId={null} onSelect={() => {}} automationType="new-call-ack" />);
      await waitFor(() => {
        const opts = getOptions();
        expect(opts.some((o) => o.includes("D-001"))).toBe(true); // OPEN
        expect(opts.some((o) => o.includes("D-003"))).toBe(true); // PENDING
      });
    });

    it("excludes IN PROGRESS, ON HOLD, CLOSED, SCHEDULED", async () => {
      mockFetch();
      render(<RecordSelector selectedId={null} onSelect={() => {}} automationType="new-call-ack" />);
      await waitFor(() => {
        const opts = getOptions();
        expect(opts.some((o) => o.includes("D-002"))).toBe(false); // IN PROGRESS
        expect(opts.some((o) => o.includes("D-004"))).toBe(false); // ON HOLD
        expect(opts.some((o) => o.includes("D-005"))).toBe(false); // CLOSED
        expect(opts.some((o) => o.includes("D-006"))).toBe(false); // SCHEDULED
      });
    });
  });
});

// ── Selection behaviour ───────────────────────────────────────────────────────

describe("RecordSelector — selection", () => {
  it("calls onSelect with the correct record when an option is chosen", async () => {
    mockFetch();
    const onSelect = vi.fn();
    render(<RecordSelector selectedId={null} onSelect={onSelect} automationType={null} />);
    await waitFor(() => expect(getOptions().length).toBeGreaterThan(0));

    await userEvent.selectOptions(screen.getByRole("combobox"), "D-001");
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "D-001", customerName: "Acme" })
    );
  });

  it("shows the detail card for the selected record", async () => {
    mockFetch();
    render(<RecordSelector selectedId="D-001" onSelect={() => {}} automationType={null} />);
    await waitFor(() => {
      expect(screen.getByText("Acme")).toBeInTheDocument();
      expect(screen.getByText("No power")).toBeInTheDocument();
    });
  });

  it("hides detail card when selectedId is not in the visible records", async () => {
    // D-005 is CLOSED — not visible under project-status filter
    mockFetch();
    render(<RecordSelector selectedId="D-005" onSelect={() => {}} automationType="project-status" />);
    await waitFor(() => expect(getOptions().length).toBeGreaterThan(0));
    expect(screen.queryByText("Echo")).not.toBeInTheDocument();
  });
});

// ── Error + loading states ────────────────────────────────────────────────────

describe("RecordSelector — loading and error states", () => {
  it("shows loading skeleton while fetching", () => {
    // Fetch never resolves during this check
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<RecordSelector selectedId={null} onSelect={() => {}} automationType={null} />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("shows error message when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) })
    );
    render(<RecordSelector selectedId={null} onSelect={() => {}} automationType={null} />);
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch records/i)).toBeInTheDocument();
    });
  });
});
