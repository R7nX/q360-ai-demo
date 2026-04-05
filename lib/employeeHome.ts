/**
 * Data loaders and shapes for employee demo pages (home, dispatches, tasks, schedule, time).
 */
import {
  FALLBACK_CUSTOMERS,
  FALLBACK_DISPATCHES,
  FALLBACK_SITES,
  getCustomerByNo,
  getDispatchById,
  getDispatchList,
  getSiteByNo,
  getTimeBillsByDispatch,
} from "@/lib/q360Client";
import {
  getCustomerFromMockDb,
  getDispatchByIdFromMockDb,
  getDispatchesFromMockDb,
  getPreferredTechnicianFromMockDb,
  hasMockDbTable,
  getSiteFromMockDb,
  getTasksFromMockDb,
  getTimeBillsFromMockDb,
} from "@/lib/mockDb";
import type { Dispatch, TimeBill } from "@/types/q360";

const HAS_MOCK_DISPATCHES = hasMockDbTable("dispatch");
const HAS_MOCK_CUSTOMERS = hasMockDbTable("customer");
const HAS_MOCK_SITES = hasMockDbTable("site");
const HAS_MOCK_TIME_BILLS = hasMockDbTable("timebill");
const HAS_MOCK_TASKS = hasMockDbTable("TASKS") || hasMockDbTable("tasks");

export const CURRENT_EMPLOYEE =
  process.env.NEXT_PUBLIC_EMPLOYEE_NAME ??
  process.env.EMPLOYEE_NAME ??
  getPreferredTechnicianFromMockDb() ??
  "Field Technician";

export type EmployeeDispatchSummary = {
  dispatchno: string;
  customerName: string;
  siteName: string;
  problem: string;
  priority: string;
  status: string;
  date: string;
};

export type EmployeeDispatchDetail = {
  dispatchno: string;
  callno: string;
  customerName: string;
  siteName: string;
  siteAddress: string;
  problem: string;
  solution: string;
  priority: string;
  status: string;
  openedOn: string;
  closedOn: string;
  technician: string;
  callerName: string;
  callerEmail: string;
  callerPhone: string;
  machineContext: string;
  workSummary: string;
  timeEntries: Array<{
    label: string;
    value: string;
  }>;
};

export type EmployeeTask = {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  dueLabel: string;
};

export type QuickTimeEntryDraft = {
  dispatchno: string;
  category: string;
  duration: string;
  note: string;
};

export type RecentTimeEntry = {
  id: string;
  label: string;
  duration: string;
  when: string;
};

export type EmployeeHomeData = {
  currentUser: string;
  briefingTitle: string;
  briefingSummary: string;
  briefingPoints: string[];
  dispatches: EmployeeDispatchSummary[];
  tasks: EmployeeTask[];
  quickTimeEntry: QuickTimeEntryDraft;
  recentTimeEntries: RecentTimeEntry[];
};

export type EmployeeTasksPageData = {
  currentUser: string;
  tasks: EmployeeTask[];
  completedCount: number;
  openCount: number;
  highPriorityCount: number;
};

export type EmployeeTimePageData = {
  currentUser: string;
  draft: QuickTimeEntryDraft;
  recentEntries: RecentTimeEntry[];
  todayHours: string;
  weekHours: string;
};

export type ScheduleEntry = {
  id: string;
  day: string;
  dateLabel: string;
  start: string;
  end: string;
  title: string;
  location: string;
  status: "Confirmed" | "Travel" | "Hold";
  note: string;
};

export type EmployeeSchedulePageData = {
  currentUser: string;
  weekRange: string;
  focusLabel: string;
  entries: ScheduleEntry[];
  summary: {
    confirmedStops: number;
    travelBlocks: number;
    holds: number;
  };
};

export async function getEmployeeHomeData(): Promise<EmployeeHomeData> {
  const dispatches = await getEmployeeDispatchSummaries(CURRENT_EMPLOYEE);
  const tasks = getEmployeeTasks(CURRENT_EMPLOYEE);

  const openDispatches = dispatches.filter((dispatch) => dispatch.status !== "CLOSED");
  const highPriorityCount = dispatches.filter(
    (dispatch) => dispatch.priority === "1" || dispatch.priority.toUpperCase() === "HIGH"
  ).length;

  return {
    currentUser: CURRENT_EMPLOYEE,
    briefingTitle: "Here is your day",
    briefingSummary:
      openDispatches.length > 0
        ? `${CURRENT_EMPLOYEE}, you have ${openDispatches.length} active dispatch${openDispatches.length === 1 ? "" : "es"} and ${tasks.filter((task) => !task.completed).length} open task${tasks.filter((task) => !task.completed).length === 1 ? "" : "s"} in your queue.`
        : `${CURRENT_EMPLOYEE}, your dispatch queue is clear right now. Use today to close follow-ups and keep time entries current.`,
    briefingPoints: [
      openDispatches.length > 0
        ? `Focus first on ${openDispatches[0]?.customerName ?? "your next customer"}${openDispatches[0]?.siteName ? ` at ${openDispatches[0].siteName}` : ""}.`
        : "No urgent dispatches are active right now, so admin follow-ups are a good next step.",
      highPriorityCount > 0
        ? `${highPriorityCount} dispatch${highPriorityCount === 1 ? "" : "es"} ${highPriorityCount === 1 ? "is" : "are"} marked high priority.`
        : "No high-priority calls are currently flagged.",
      `${tasks.filter((task) => !task.completed).length} task${tasks.filter((task) => !task.completed).length === 1 ? "" : "s"} still need attention today.`,
    ],
    dispatches,
    tasks,
    quickTimeEntry: {
      dispatchno: dispatches[0]?.dispatchno ?? "",
      category: "Service Labor",
      duration: "1.0",
      note: dispatches[0]
        ? `Follow-up work completed for ${dispatches[0].customerName}.`
        : "Administrative follow-up completed.",
    },
    recentTimeEntries: [
      {
        id: "time-1",
        label: "Site diagnostics and repair notes",
        duration: "1.5 hr",
        when: "Today · 8:30 AM",
      },
      {
        id: "time-2",
        label: "Travel and customer handoff",
        duration: "0.5 hr",
        when: "Yesterday · 4:10 PM",
      },
    ],
  };
}

export async function getEmployeeDispatchSummaries(
  currentUser: string
): Promise<EmployeeDispatchSummary[]> {
  const dispatches = await getDispatchesForCurrentUser(currentUser);

  const summaries = await Promise.all(
    dispatches.slice(0, 3).map(async (dispatch) => {
      const customerName = await getCustomerName(dispatch);
      const siteName = await getSiteName(dispatch);

      return {
        dispatchno: dispatch.dispatchno,
        customerName,
        siteName,
        problem: dispatch.problem ?? dispatch.description ?? "No problem description",
        priority: dispatch.priority ?? "Normal",
        status: dispatch.statuscode,
        date: dispatch.date ?? "No date provided",
      };
    })
  );

  if (summaries.length > 0 || HAS_MOCK_DISPATCHES) {
    return summaries;
  }

  return FALLBACK_DISPATCHES.slice(0, 3).map((dispatch) => ({
    dispatchno: dispatch.dispatchno,
    customerName:
      FALLBACK_CUSTOMERS[dispatch.customerno]?.company ?? dispatch.customerno,
    siteName: FALLBACK_SITES[dispatch.siteno]?.sitename ?? dispatch.siteno,
    problem: dispatch.problem ?? dispatch.description ?? "No problem description",
    priority: dispatch.priority ?? "Normal",
    status: dispatch.statuscode,
    date: dispatch.date ?? "No date provided",
  }));
}

export async function getEmployeeTasksPageData(
  currentUser: string = CURRENT_EMPLOYEE
): Promise<EmployeeTasksPageData> {
  const tasks = getEmployeeTasks(currentUser);

  return {
    currentUser,
    tasks,
    completedCount: tasks.filter((task) => task.completed).length,
    openCount: tasks.filter((task) => !task.completed).length,
    highPriorityCount: tasks.filter((task) => task.priority === "High").length,
  };
}

export async function getEmployeeTimePageData(
  currentUser: string = CURRENT_EMPLOYEE
): Promise<EmployeeTimePageData> {
  const dispatches = await getEmployeeDispatchSummaries(currentUser);

  return {
    currentUser,
    draft: {
      dispatchno: dispatches[0]?.dispatchno ?? "",
      category: "Service Labor",
      duration: "1.0",
      note: dispatches[0]
        ? `On-site work completed for ${dispatches[0].customerName}.`
        : "Administrative work completed.",
    },
    recentEntries: [
      {
        id: "time-page-1",
        label: "On-site diagnostics and troubleshooting",
        duration: "2.0 hr",
        when: "Today · 9:15 AM",
      },
      {
        id: "time-page-2",
        label: "Customer follow-up and internal notes",
        duration: "0.75 hr",
        when: "Today · 1:10 PM",
      },
      {
        id: "time-page-3",
        label: "Travel and close-out documentation",
        duration: "1.25 hr",
        when: "Yesterday · 4:40 PM",
      },
    ],
    todayHours: "2.75",
    weekHours: "18.50",
  };
}

export async function getEmployeeSchedulePageData(
  currentUser: string = CURRENT_EMPLOYEE
): Promise<EmployeeSchedulePageData> {
  const entries = getMockScheduleEntries();

  return {
    currentUser,
    weekRange: "April 4 - April 10",
    focusLabel: "Week view",
    entries,
    summary: {
      confirmedStops: entries.filter((entry) => entry.status === "Confirmed")
        .length,
      travelBlocks: entries.filter((entry) => entry.status === "Travel").length,
      holds: entries.filter((entry) => entry.status === "Hold").length,
    },
  };
}

export async function getEmployeeDispatchDetail(
  dispatchno: string,
  currentUser: string = CURRENT_EMPLOYEE
): Promise<EmployeeDispatchDetail | null> {
  const dispatch = await getDispatchForDetail(dispatchno, currentUser);

  if (!dispatch) {
    return null;
  }

  const [customerName, site, timeBills] = await Promise.all([
    getCustomerName(dispatch),
    getSiteDetail(dispatch),
    getTimeEntryDetails(dispatch.dispatchno),
  ]);

  return {
    dispatchno: dispatch.dispatchno,
    callno: dispatch.callno || "Not provided",
    customerName,
    siteName: site?.sitename ?? "Unknown Site",
    siteAddress: formatSiteAddress(site),
    problem: dispatch.problem ?? dispatch.description ?? "No problem description",
    solution: dispatch.solution ?? "No solution has been logged yet.",
    priority: dispatch.priority ?? "Normal",
    status: dispatch.statuscode,
    openedOn: dispatch.date ?? "No date provided",
    closedOn: dispatch.closedate ?? "Still open",
    technician: dispatch.techassigned ?? currentUser,
    callerName: dispatch.callername ?? "Not provided",
    callerEmail: dispatch.calleremail ?? "Not provided",
    callerPhone: dispatch.callerphone ?? "Not provided",
    machineContext:
      dispatch.description ??
      "Machine or equipment context is not available yet in the current data source.",
    workSummary: buildWorkSummary(dispatch, customerName, site?.sitename),
    timeEntries:
      timeBills.length > 0
        ? timeBills.map((entry) => ({
            label: entry.techassigned ?? "Technician",
            value: `${entry.tbstarttime ?? "Unknown start"} → ${entry.tbendtime ?? "Unknown end"}${entry.traveltime ? ` · Travel ${entry.traveltime}` : ""}`,
          }))
        : [
            {
              label: "No time logged yet",
              value: "This dispatch does not have time-bill entries in the current data source.",
            },
          ],
  };
}

async function getDispatchesForCurrentUser(currentUser: string): Promise<Dispatch[]> {
  if (HAS_MOCK_DISPATCHES) {
    const mockDispatches = getDispatchesFromMockDb() ?? [];
    return filterDispatchesForCurrentUser(mockDispatches, currentUser);
  }

  try {
    const liveDispatches = await getDispatchList();
    return filterDispatchesForCurrentUser(liveDispatches, currentUser);
  } catch {
    return filterDispatchesForCurrentUser(FALLBACK_DISPATCHES, currentUser);
  }
}

function filterDispatchesForCurrentUser(
  dispatches: Dispatch[],
  currentUser: string
): Dispatch[] {
  const filtered = dispatches.filter(
    (dispatch) =>
      dispatch.techassigned?.toLowerCase() === currentUser.toLowerCase()
  );

  return filtered.length > 0 ? filtered : dispatches.slice(0, 3);
}

async function getDispatchForDetail(
  dispatchno: string,
  currentUser: string
): Promise<Dispatch | null> {
  if (HAS_MOCK_DISPATCHES) {
    const dispatch = getDispatchByIdFromMockDb(dispatchno);

    if (!dispatch) {
      return null;
    }

    if (
      dispatch.techassigned?.toLowerCase() === currentUser.toLowerCase() ||
      !dispatch.techassigned
    ) {
      return dispatch;
    }

    return dispatch;
  }

  try {
    return await getDispatchById(dispatchno);
  } catch {
    return (
      FALLBACK_DISPATCHES.find((item) => item.dispatchno === dispatchno) ?? null
    );
  }
}

async function getCustomerName(dispatch: Dispatch): Promise<string> {
  if (HAS_MOCK_CUSTOMERS) {
    return (
      getCustomerFromMockDb(dispatch.customerno)?.company ??
      FALLBACK_CUSTOMERS[dispatch.customerno]?.company ??
      dispatch.customerno
    );
  }

  try {
    return (
      (await getCustomerByNo(dispatch.customerno))?.company ??
      FALLBACK_CUSTOMERS[dispatch.customerno]?.company ??
      dispatch.customerno
    );
  } catch {
    return (
      FALLBACK_CUSTOMERS[dispatch.customerno]?.company ?? dispatch.customerno
    );
  }
}

async function getSiteName(dispatch: Dispatch): Promise<string> {
  if (HAS_MOCK_SITES) {
    return (
      getSiteFromMockDb(dispatch.siteno)?.sitename ??
      FALLBACK_SITES[dispatch.siteno]?.sitename ??
      "Unknown Site"
    );
  }

  try {
    return (
      (await getSiteByNo(dispatch.siteno))?.sitename ??
      FALLBACK_SITES[dispatch.siteno]?.sitename ??
      "Unknown Site"
    );
  } catch {
    return FALLBACK_SITES[dispatch.siteno]?.sitename ?? "Unknown Site";
  }
}

async function getSiteDetail(dispatch: Dispatch) {
  if (HAS_MOCK_SITES) {
    return (
      getSiteFromMockDb(dispatch.siteno) ??
      FALLBACK_SITES[dispatch.siteno] ??
      null
    );
  }

  try {
    return (
      (await getSiteByNo(dispatch.siteno)) ??
      FALLBACK_SITES[dispatch.siteno] ??
      null
    );
  } catch {
    return FALLBACK_SITES[dispatch.siteno] ?? null;
  }
}

async function getTimeEntryDetails(dispatchno: string): Promise<TimeBill[]> {
  if (HAS_MOCK_TIME_BILLS) {
    return getTimeBillsFromMockDb(dispatchno) ?? [];
  }

  try {
    return await getTimeBillsByDispatch(dispatchno);
  } catch {
    return [];
  }
}

function formatSiteAddress(
  site:
    | {
        address: string | null;
        city: string | null;
        state: string | null;
        zip: string | null;
      }
    | null
) {
  if (!site) {
    return "No site address available";
  }

  const parts = [site.address, site.city, site.state, site.zip].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "No site address available";
}

function buildWorkSummary(
  dispatch: Dispatch,
  customerName: string,
  siteName?: string | null
) {
  return `${customerName}${siteName ? ` at ${siteName}` : ""} is currently ${dispatch.statuscode.toLowerCase()}. ${
    dispatch.problem ?? "The issue summary has not been provided yet."
  } ${
    dispatch.solution
      ? `Current solution notes: ${dispatch.solution}`
      : "No solution notes are logged yet, so the technician view should treat this as active work."
  }`;
}

function getEmployeeTasks(currentUser: string): EmployeeTask[] {
  if (!HAS_MOCK_TASKS) {
    return getMockTasks();
  }

  const rows =
    getTasksFromMockDb(currentUser) ??
    getTasksFromMockDb() ??
    [];

  if (rows.length === 0) {
    return getMockTasks();
  }

  return rows.slice(0, 6).map((row) => {
    const title =
      typeof row.TITLE === "string"
        ? row.TITLE
        : typeof row.title === "string"
          ? row.title
          : "Untitled task";

    const priorityValue =
      typeof row.PRIORITY === "number"
        ? row.PRIORITY
        : typeof row.priority === "number"
          ? row.priority
          : Number(row.PRIORITY ?? row.priority ?? 3);

    const completedRaw = row.COMPLETEDDATE ?? row.completeddate;
    const endDateRaw = row.ENDDATE ?? row.enddate;

    return {
      id: String(row.TASKID ?? row.taskid ?? title),
      title,
      priority:
        priorityValue <= 1
          ? "High"
          : priorityValue <= 3
            ? "Medium"
            : "Low",
      completed:
        completedRaw != null &&
        String(completedRaw).trim().length > 0,
      dueLabel:
        endDateRaw != null && String(endDateRaw).trim().length > 0
          ? `Due ${String(endDateRaw)}`
          : "No due date",
    };
  });
}

function getMockTasks(): EmployeeTask[] {
  return [
    {
      id: "task-1",
      title: "Confirm parts availability for afternoon dispatch",
      priority: "High",
      completed: false,
      dueLabel: "Due today",
    },
    {
      id: "task-2",
      title: "Upload service notes from yesterday's completed visit",
      priority: "Medium",
      completed: false,
      dueLabel: "Before 3 PM",
    },
    {
      id: "task-3",
      title: "Call customer back with updated arrival window",
      priority: "Medium",
      completed: false,
      dueLabel: "This morning",
    },
    {
      id: "task-4",
      title: "Review safety checklist for rooftop maintenance call",
      priority: "Low",
      completed: true,
      dueLabel: "Completed",
    },
  ];
}

function getMockScheduleEntries(): ScheduleEntry[] {
  return [
    {
      id: "sched-1",
      day: "Mon",
      dateLabel: "Apr 4",
      start: "8:00 AM",
      end: "10:00 AM",
      title: "Preventive maintenance visit",
      location: "Acme Corporation",
      status: "Confirmed",
      note: "Bring rooftop access badge and inspection checklist.",
    },
    {
      id: "sched-2",
      day: "Mon",
      dateLabel: "Apr 4",
      start: "10:30 AM",
      end: "11:15 AM",
      title: "Travel block",
      location: "Between customer sites",
      status: "Travel",
      note: "Drive time reserved between morning and midday calls.",
    },
    {
      id: "sched-3",
      day: "Tue",
      dateLabel: "Apr 5",
      start: "9:00 AM",
      end: "12:00 PM",
      title: "Elevator inspection",
      location: "Meridian Properties",
      status: "Confirmed",
      note: "Customer requested verbal handoff before noon.",
    },
    {
      id: "sched-4",
      day: "Wed",
      dateLabel: "Apr 6",
      start: "1:00 PM",
      end: "2:00 PM",
      title: "Open hold for urgent dispatch",
      location: "Dispatch reserve window",
      status: "Hold",
      note: "Keep this block free for same-day priority work.",
    },
    {
      id: "sched-5",
      day: "Thu",
      dateLabel: "Apr 7",
      start: "8:30 AM",
      end: "11:30 AM",
      title: "Fire alarm follow-up",
      location: "Downtown Plaza",
      status: "Confirmed",
      note: "Review prior fault notes before arriving on site.",
    },
    {
      id: "sched-6",
      day: "Fri",
      dateLabel: "Apr 8",
      start: "3:00 PM",
      end: "4:00 PM",
      title: "Internal close-out and paperwork",
      location: "Remote admin block",
      status: "Confirmed",
      note: "Use this window to finish documentation and time entry.",
    },
  ];
}
