// @vitest-environment jsdom
/**
 * Black-box tests for Feature 3's integration with shared Team 2 AI tools.
 * These tests assert observable UI contracts and request payloads only.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const {
  mockGetEmployeeHomeData,
  mockGetEmployeeDispatchDetail,
  mockGetEmployeeDispatchSummaries,
} = vi.hoisted(() => ({
  mockGetEmployeeHomeData: vi.fn(),
  mockGetEmployeeDispatchDetail: vi.fn(),
  mockGetEmployeeDispatchSummaries: vi.fn(),
}));

vi.mock("@/lib/employeeHome", () => ({
  CURRENT_EMPLOYEE: "Alex Tech",
  getEmployeeHomeData: mockGetEmployeeHomeData,
  getEmployeeDispatchDetail: mockGetEmployeeDispatchDetail,
  getEmployeeDispatchSummaries: mockGetEmployeeDispatchSummaries,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("@/components/ai/DataSummary", () => ({
  default: (props: {
    entityType?: string;
    entityId?: string;
    intent?: string;
    audience?: string;
    tone?: string;
    context?: Record<string, unknown>;
  }) => (
    <div data-testid="data-summary">
      <span>DataSummary</span>
      <span>entityType:{props.entityType}</span>
      <span>entityId:{props.entityId}</span>
      <span>intent:{props.intent}</span>
      <span>audience:{props.audience}</span>
      <span>tone:{props.tone}</span>
      <span>dispatchCount:{String(props.context?.dispatchCount ?? "")}</span>
      <span>openTaskCount:{String(props.context?.openTaskCount ?? "")}</span>
    </div>
  ),
}));

vi.mock("@/components/ai/ActionRecommender", () => ({
  default: (props: {
    entityType?: string;
    entityId?: string;
    intent?: string;
    audience?: string;
    tone?: string;
    context?: Record<string, unknown>;
  }) => (
    <div data-testid="action-recommender">
      <span>ActionRecommender</span>
      <span>entityType:{props.entityType}</span>
      <span>entityId:{props.entityId}</span>
      <span>intent:{props.intent}</span>
      <span>audience:{props.audience}</span>
      <span>tone:{props.tone}</span>
      <span>workflowPage:{String(props.context?.workflowPage ?? false)}</span>
    </div>
  ),
}));

vi.mock("@/components/ai/SmartReply", () => ({
  default: (props: {
    entityType?: string;
    entityId?: string;
    audience?: string;
    tone?: string;
    context?: Record<string, unknown>;
  }) => (
    <div data-testid="smart-reply">
      <span>SmartReply</span>
      <span>entityType:{props.entityType}</span>
      <span>entityId:{props.entityId}</span>
      <span>audience:{props.audience}</span>
      <span>tone:{props.tone}</span>
    </div>
  ),
}));

vi.mock("@/components/ai/employee/EmployeeHeader", () => ({
  EmployeeHeader: (props: { title: string; description?: string }) => (
    <header>
      <h1>{props.title}</h1>
      {props.description ? <p>{props.description}</p> : null}
    </header>
  ),
}));

vi.mock("@/components/ai/employee/DailyBriefing", () => ({
  DailyBriefing: (props: { title: string; summary: string }) => (
    <section data-testid="daily-briefing">
      <h2>{props.title}</h2>
      <p>{props.summary}</p>
    </section>
  ),
}));

vi.mock("@/components/ai/employee/DispatchCard", () => ({
  DispatchCard: (props: { dispatchno: string }) => (
    <article data-testid="dispatch-card">{props.dispatchno}</article>
  ),
}));

vi.mock("@/components/ai/employee/TaskList", () => ({
  TaskList: (props: { tasks: Array<{ id: string }> }) => (
    <section data-testid="task-list">tasks:{props.tasks.length}</section>
  ),
}));

vi.mock("@/components/ai/employee/TimeEntry", () => ({
  TimeEntry: (props: { draft: { dispatchno: string } }) => (
    <section data-testid="time-entry">draft:{props.draft.dispatchno}</section>
  ),
}));

vi.mock("@/components/ai/employee/WorkflowGuide", () => ({
  WorkflowGuide: (props: { starterPrompt: string; examples: string[] }) => (
    <section data-testid="workflow-guide">
      <h2>WorkflowGuide</h2>
      <p>{props.starterPrompt}</p>
      <p>{props.examples.join(" | ")}</p>
    </section>
  ),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  mockGetEmployeeHomeData.mockReset();
  mockGetEmployeeDispatchDetail.mockReset();
  mockGetEmployeeDispatchSummaries.mockReset();
});

describe("Feature 3 AI integration black-box coverage", () => {
  it("dispatch detail page exposes Team 2 smart reply, recommender, and email assistant surfaces", async () => {
    mockGetEmployeeDispatchDetail.mockResolvedValue({
      dispatchno: "D-1001",
      callno: "C-9001",
      customerName: "Acme Corp",
      siteName: "Acme HQ",
      siteAddress: "123 Main St",
      problem: "No cooling in server room",
      solution: "Replaced compressor",
      priority: "1",
      status: "OPEN",
      openedOn: "2026-04-05",
      closedOn: "Still open",
      technician: "Alex Tech",
      callerName: "Pat Customer",
      callerEmail: "pat@example.com",
      callerPhone: "555-0100",
      machineContext: "Unit 7",
      workSummary: "Active service work",
      timeEntries: [{ label: "Labor", value: "1.0 hr" }],
    });

    const { default: DispatchDetailPage } = await import(
      "@/app/(employee)/my-dispatches/[dispatchNo]/page"
    );

    render(await DispatchDetailPage({ params: Promise.resolve({ dispatchNo: "D-1001" }) }));

    expect(screen.getByRole("heading", { name: /dispatch d-1001/i })).toBeInTheDocument();
    expect(screen.getByTestId("smart-reply")).toHaveTextContent("entityId:D-1001");
    expect(screen.getByTestId("smart-reply")).toHaveTextContent("entityType:dispatch");
    expect(screen.getByTestId("action-recommender")).toHaveTextContent("entityId:D-1001");
    expect(
      screen.getByRole("heading", { name: /draft a dispatch email from shared ai tools/i })
    ).toBeInTheDocument();
  });

  it("home page includes a shared summary panel wired with dispatch context", async () => {
    mockGetEmployeeHomeData.mockResolvedValue({
      currentUser: "Alex Tech",
      briefingTitle: "Here is your day",
      briefingSummary: "Summary text",
      briefingPoints: ["First", "Second"],
      dispatches: [{ dispatchno: "D-2001" }],
      tasks: [{ id: "task-1", completed: false }],
      quickTimeEntry: { dispatchno: "D-2001", category: "Labor", duration: "1.0", note: "Note" },
      recentTimeEntries: [],
    });

    const { default: EmployeeHomePage } = await import("@/app/(employee)/home/page");

    render(await EmployeeHomePage());

    expect(screen.getByTestId("daily-briefing")).toBeInTheDocument();
    expect(screen.getByTestId("data-summary")).toBeInTheDocument();
    expect(screen.getByTestId("data-summary")).toHaveTextContent("entityType:dispatch");
    expect(screen.getByTestId("data-summary")).toHaveTextContent("entityId:D-2001");
    expect(screen.getByTestId("data-summary")).toHaveTextContent("dispatchCount:1");
    expect(screen.getByTestId("data-summary")).toHaveTextContent("openTaskCount:1");
  });

  it("workflows page keeps the fallback guide and adds shared recommender assistance", async () => {
    mockGetEmployeeDispatchSummaries.mockResolvedValue([
      { dispatchno: "D-3001", customerName: "Acme", siteName: "Site", problem: "Issue", priority: "1", status: "OPEN", date: "2026-04-05" },
    ]);

    const { default: WorkflowsPage } = await import("@/app/(employee)/workflows/page");

    render(await WorkflowsPage());

    expect(screen.getByTestId("workflow-guide")).toBeInTheDocument();
    expect(screen.getByTestId("action-recommender")).toBeInTheDocument();
    expect(screen.getByTestId("action-recommender")).toHaveTextContent("entityType:dispatch");
    expect(screen.getByTestId("action-recommender")).toHaveTextContent("entityId:D-3001");
  });
});

describe("EmployeeEmailAssistant", () => {
  it("posts shared payload to /api/ai/draft-email?format=json and renders returned subject/body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          success: true,
          result: {
            subject: "Dispatch D-1001 complete",
            content: "Body text from AI",
            metadata: {
              model: "gemini-test",
              entityType: "dispatch",
              entityId: "D-1001",
            },
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { EmployeeEmailAssistant } = await import(
      "@/components/ai/employee/EmployeeEmailAssistant"
    );

    render(<EmployeeEmailAssistant dispatchNo="D-1001" />);

    await userEvent.click(screen.getByRole("button", { name: /generate draft/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai/draft-email?format=json",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "dispatch",
          entityId: "D-1001",
          intent: "service-closure",
          audience: "internal",
          tone: "friendly",
        }),
      })
    );

    await waitFor(() => {
      expect(screen.getByText("Dispatch D-1001 complete")).toBeInTheDocument();
      expect(screen.getByText("Body text from AI")).toBeInTheDocument();
    });
  });

  it("surfaces an error when the shared draft route fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      text: async () =>
        JSON.stringify({
          success: false,
          result: null,
          message: "draft route failed",
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { EmployeeEmailAssistant } = await import(
      "@/components/ai/employee/EmployeeEmailAssistant"
    );

    render(<EmployeeEmailAssistant dispatchNo="D-1001" />);

    await userEvent.click(screen.getByRole("button", { name: /generate draft/i }));

    await waitFor(() => {
      expect(screen.getByText(/draft route failed/i)).toBeInTheDocument();
    });
  });

  it("surfaces plain-text API errors when draft-email does not return JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => "entityId is required.",
    });
    vi.stubGlobal("fetch", fetchMock);

    const { EmployeeEmailAssistant } = await import(
      "@/components/ai/employee/EmployeeEmailAssistant"
    );

    render(<EmployeeEmailAssistant dispatchNo="D-1001" />);

    await userEvent.click(screen.getByRole("button", { name: /generate draft/i }));

    await waitFor(() => {
      expect(screen.getByText(/entityId is required\./i)).toBeInTheDocument();
    });
  });
});
