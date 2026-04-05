// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Feature2Page from "@/app/feature2/page";
import type { RecordSummary } from "@/types/feature2";

// ── Mock next/link so it renders as a plain <a> ───────────────────────────────

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// ── Fixture data ──────────────────────────────────────────────────────────────

const RECORDS: RecordSummary[] = [
  { id: "D-CLOSED", customerName: "Closure Co", status: "CLOSED",      problem: "Fixed it",  date: "2025-01-01", techAssigned: "Alice", siteName: "HQ" },
  { id: "D-OPEN",   customerName: "Open Corp",   status: "OPEN",        problem: "Broken",    date: "2025-01-02", techAssigned: "Bob",   siteName: "Site B" },
  { id: "D-INPROG", customerName: "Inprog Inc",  status: "IN PROGRESS", problem: "Working",   date: "2025-01-03", techAssigned: "Carol", siteName: "Site C" },
  { id: "D-PEND",   customerName: "Pending Ltd",  status: "PENDING",     problem: "Waiting",   date: "2025-01-04", techAssigned: "Dan",   siteName: "Site D" },
];

function mockFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ records: RECORDS }),
    })
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSelect() {
  return screen.getByRole("combobox") as HTMLSelectElement;
}

function clickAutomation(name: RegExp | string) {
  return userEvent.click(screen.getByRole("button", { name }));
}

// ── Deselect on automation type switch ────────────────────────────────────────

describe("Feature2Page — record clears when automation type changes", () => {
  it("clears selected record when switching from service-closure to new-call-ack", async () => {
    mockFetch();
    render(<Feature2Page />);

    // Select service-closure
    await clickAutomation(/service closure/i);
    await waitFor(() => expect(getSelect()).toBeInTheDocument());

    // Pick a CLOSED record
    await userEvent.selectOptions(getSelect(), "D-CLOSED");
    expect(screen.getByText("Closure Co")).toBeInTheDocument();

    // Switch to new-call-ack → record should be cleared
    await clickAutomation(/new call ack/i);
    await waitFor(() => {
      expect(screen.queryByText("Closure Co")).not.toBeInTheDocument();
      expect(getSelect().value).toBe("");
    });
  });

  it("clears selected record when switching from new-call-ack to service-closure", async () => {
    mockFetch();
    render(<Feature2Page />);

    await clickAutomation(/new call ack/i);
    await waitFor(() => expect(getSelect()).toBeInTheDocument());

    await userEvent.selectOptions(getSelect(), "D-OPEN");
    expect(screen.getByText("Open Corp")).toBeInTheDocument();

    await clickAutomation(/service closure/i);
    await waitFor(() => {
      expect(screen.queryByText("Open Corp")).not.toBeInTheDocument();
      expect(getSelect().value).toBe("");
    });
  });

  it("clears selected record when switching from project-status to service-closure", async () => {
    mockFetch();
    render(<Feature2Page />);

    await clickAutomation(/project status/i);
    await waitFor(() => expect(getSelect()).toBeInTheDocument());

    await userEvent.selectOptions(getSelect(), "D-OPEN");
    expect(screen.getByText("Open Corp")).toBeInTheDocument();

    await clickAutomation(/service closure/i);
    await waitFor(() => {
      expect(screen.queryByText("Open Corp")).not.toBeInTheDocument();
      expect(getSelect().value).toBe("");
    });
  });

  it("clears selected record when switching from overdue-alert to new-call-ack", async () => {
    mockFetch();
    render(<Feature2Page />);

    await clickAutomation(/overdue alert/i);
    await waitFor(() => expect(getSelect()).toBeInTheDocument());

    await userEvent.selectOptions(getSelect(), "D-INPROG");
    expect(screen.getByText("Inprog Inc")).toBeInTheDocument();

    await clickAutomation(/new call ack/i);
    await waitFor(() => {
      expect(screen.queryByText("Inprog Inc")).not.toBeInTheDocument();
      expect(getSelect().value).toBe("");
    });
  });

  it("disables Generate button after switching automation type", async () => {
    mockFetch();
    render(<Feature2Page />);

    await clickAutomation(/service closure/i);
    await waitFor(() => expect(getSelect()).toBeInTheDocument());
    await userEvent.selectOptions(getSelect(), "D-CLOSED");

    // Switch type — button should be disabled again
    await clickAutomation(/project status/i);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /generate email/i })).toBeDisabled();
    });
  });
});

// ── Filter correctness from page level ───────────────────────────────────────

describe("Feature2Page — dropdown filters correct records per automation type", () => {
  it("service-closure only shows CLOSED records in dropdown", async () => {
    mockFetch();
    render(<Feature2Page />);

    await clickAutomation(/service closure/i);
    await waitFor(() => expect(getSelect()).toBeInTheDocument());

    const options = Array.from(getSelect().options).map((o) => o.text);
    const dataOptions = options.filter((t) => !t.startsWith("Choose"));
    expect(dataOptions).toHaveLength(1);
    expect(dataOptions[0]).toContain("D-CLOSED");
  });

  it("project-status excludes CLOSED records from dropdown", async () => {
    mockFetch();
    render(<Feature2Page />);

    await clickAutomation(/project status/i);
    await waitFor(() => expect(getSelect()).toBeInTheDocument());

    const options = Array.from(getSelect().options).map((o) => o.text);
    expect(options.some((o) => o.includes("D-CLOSED"))).toBe(false);
    expect(options.some((o) => o.includes("D-OPEN"))).toBe(true);
  });

  it("overdue-alert excludes CLOSED records from dropdown", async () => {
    mockFetch();
    render(<Feature2Page />);

    await clickAutomation(/overdue alert/i);
    await waitFor(() => expect(getSelect()).toBeInTheDocument());

    const options = Array.from(getSelect().options).map((o) => o.text);
    expect(options.some((o) => o.includes("D-CLOSED"))).toBe(false);
    expect(options.some((o) => o.includes("D-INPROG"))).toBe(true);
  });

  it("new-call-ack excludes IN PROGRESS records from dropdown", async () => {
    mockFetch();
    render(<Feature2Page />);

    await clickAutomation(/new call ack/i);
    await waitFor(() => expect(getSelect()).toBeInTheDocument());

    const options = Array.from(getSelect().options).map((o) => o.text);
    expect(options.some((o) => o.includes("D-INPROG"))).toBe(false);
    expect(options.some((o) => o.includes("D-OPEN"))).toBe(true);
    expect(options.some((o) => o.includes("D-PEND"))).toBe(true);
  });
});
