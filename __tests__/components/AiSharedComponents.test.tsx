// @vitest-environment jsdom
/**
 * Component tests for the shared AI widgets exported for Team 1 and Team 3.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DataSummary, { DataSummary as NamedDataSummary } from "@/components/ai/DataSummary";
import EmailDrafter, { EmailDrafter as NamedEmailDrafter } from "@/components/ai/EmailDrafter";
import ActionRecommender, {
  ActionRecommender as NamedActionRecommender,
} from "@/components/ai/ActionRecommender";
import StatusReport, { StatusReport as NamedStatusReport } from "@/components/ai/StatusReport";
import SmartReply, { SmartReply as NamedSmartReply } from "@/components/ai/SmartReply";

beforeEach(() => {
  vi.restoreAllMocks();

  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn(),
    },
  });
});

describe("named exports", () => {
  it("exposes named component exports for the shared handoff surface", () => {
    expect(NamedDataSummary).toBe(DataSummary);
    expect(NamedEmailDrafter).toBe(EmailDrafter);
    expect(NamedActionRecommender).toBe(ActionRecommender);
    expect(NamedStatusReport).toBe(StatusReport);
    expect(NamedSmartReply).toBe(SmartReply);
  });
});

describe("EmailDrafter", () => {
  it("posts to the shared draft-email route and renders subject/body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            subject: "Project update",
            content: "Draft body",
            metadata: {},
          },
        }),
      })
    );

    render(<EmailDrafter entityId="P-1" entityType="project" tone="formal" />);
    await userEvent.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText("Project update")).toBeInTheDocument();
      expect(screen.getByText("Draft body")).toBeInTheDocument();
    });
  });
});

describe("DataSummary", () => {
  it("renders summary content from API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: { content: "Summary text", metadata: {} },
        }),
      })
    );

    render(<DataSummary entityId="D-1" />);
    await userEvent.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText("Summary text")).toBeInTheDocument();
    });
  });
});

describe("ActionRecommender", () => {
  it("renders actions returned by API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            content: "Recommendation summary",
            actions: [
              {
                action: "Call customer",
                priority: "HIGH",
                assignTo: "Dispatch",
                reasoning: "SLA risk",
              },
            ],
            metadata: {},
          },
        }),
      })
    );

    render(<ActionRecommender entityId="D-2" />);
    await userEvent.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText(/1\. Call customer/)).toBeInTheDocument();
      expect(screen.getByText(/Priority:/)).toBeInTheDocument();
      expect(screen.getByText(/SLA risk/)).toBeInTheDocument();
    });
  });
});

describe("StatusReport", () => {
  it("shows error from failed API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          result: null,
          message: "status route failed",
        }),
      })
    );

    render(<StatusReport entityId="D-3" />);
    await userEvent.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText(/status route failed/i)).toBeInTheDocument();
    });
  });
});

describe("SmartReply", () => {
  it("requires inbound message, generates reply, and supports copy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: { content: "Suggested reply", metadata: {} },
        }),
      })
    );

    render(<SmartReply entityId="D-4" />);

    const generateButton = screen.getByRole("button", { name: /generate/i });
    expect(generateButton).toBeDisabled();

    await userEvent.type(
      screen.getByPlaceholderText(/paste the inbound/i),
      "Customer asked for ETA"
    );
    expect(generateButton).toBeEnabled();

    await userEvent.click(generateButton);
    await waitFor(() => {
      expect(screen.getByText("Suggested reply")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /copy reply/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Suggested reply");
  });
});
