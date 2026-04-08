import { describe, expect, it } from "vitest";

import {
  normalizeActivityRecord,
  normalizeBillingSnapshotRecord,
  normalizeCustomerRecord,
  normalizeDealRecord,
  normalizeDispatchRecord,
  normalizeInvoiceRecord,
  normalizeProfitabilitySnapshotRecord,
  normalizeProjectRecord,
  normalizeQuoteRecord,
  normalizeScheduleItemRecord,
  normalizeServiceContractRecord,
  normalizeTaskRecord,
  normalizeUserRecord,
} from "@/lib/domain/normalizers";

describe("domain normalizers", () => {
  it("maps a complete project record into the internal model", () => {
    const project = normalizeProjectRecord(
      {
        CUSTOMERNO: "C10025",
        CUSTOMER_COMPANY: "North Peak University",
        DUEDATE: "2026-03-28 00:00:00.000",
        HOURSBUDGET: "120",
        MODDATE: "2026-03-20 14:15:00.000",
        OWNERID: "JMILLER",
        PERCENTCOMPLETE: "72",
        PROJECTNO: "P-1001",
        PROJECTSTARTDATE: "2026-02-03 00:00:00.000",
        REVENUEBUDGET: "85000",
        SALESPERSON: "JMILLER",
        SITENO: "S-1001",
        STARTDATE: "2026-02-10 00:00:00.000",
        STATUSCODE: "ACTIVE",
        TITLE: "Campus AV Refresh",
      },
      {
        customerId: "CUSTOMERNO",
        customerName: "CUSTOMER_COMPANY",
        dueDate: "DUEDATE",
        endDate: "DUEDATE",
        hoursBudget: "HOURSBUDGET",
        id: "PROJECTNO",
        lastActivityAt: "MODDATE",
        ownerId: "OWNERID",
        percentComplete: "PERCENTCOMPLETE",
        projectStartDate: "PROJECTSTARTDATE",
        revenueBudget: "REVENUEBUDGET",
        salesRepId: "SALESPERSON",
        siteId: "SITENO",
        startDate: "STARTDATE",
        status: "STATUSCODE",
        title: "TITLE",
      },
      "PROJECTS",
    );

    expect(project).toEqual(
      expect.objectContaining({
        customerId: "C10025",
        customerName: "North Peak University",
        endDate: "2026-03-28 00:00:00.000",
        hoursBudget: 120,
        id: "P-1001",
        percentComplete: 72,
        projectStartDate: "2026-02-03 00:00:00.000",
        revenueBudget: 85000,
        siteId: "S-1001",
        sourceName: "PROJECTS",
        startDate: "2026-02-10 00:00:00.000",
        title: "Campus AV Refresh",
      }),
    );
  });

  it("maps a task with scheduling and progress fields without crashing", () => {
    const task = normalizeTaskRecord(
      {
        ASSIGNEE: "JMILLER",
        EFFORT: "6.5",
        ENDDATE: "2026-03-24 00:00:00.000",
        PRIORITY: "HIGH",
        PROJECTSCHEDULENO: "TS-1001",
        PROJECTPERCENTCOMPLETE: "72",
        PROJECTTITLE: "Campus AV Refresh",
        SCHEDDATE: "2026-03-21 00:00:00.000",
        STATUSCODE: "INPROGRESS",
        TASKPERCENTCOMPLETE: "48",
        TITLE: "Secure procurement approval",
        WBS: "1.2.3",
      },
      {
        dueDate: "ENDDATE",
        effort: "EFFORT",
        endDate: "ENDDATE",
        id: "PROJECTSCHEDULENO",
        ownerId: "ASSIGNEE",
        priority: "PRIORITY",
        projectPercentComplete: "PROJECTPERCENTCOMPLETE",
        projectTitle: "PROJECTTITLE",
        scheduleDate: "SCHEDDATE",
        status: "STATUSCODE",
        taskPercentComplete: "TASKPERCENTCOMPLETE",
        title: "TITLE",
        wbs: "WBS",
      },
      "LDView_Task",
    );

    expect(task).toEqual(
      expect.objectContaining({
        dueDate: "2026-03-24 00:00:00.000",
        effort: 6.5,
        endDate: "2026-03-24 00:00:00.000",
        id: "TS-1001",
        notesExcerpt: null,
        ownerId: "JMILLER",
        priority: "HIGH",
        projectPercentComplete: 72,
        projectTitle: "Campus AV Refresh",
        scheduleDate: "2026-03-21 00:00:00.000",
        sequence: "1.2.3",
        sourceName: "LDView_Task",
        status: "INPROGRESS",
        taskPercentComplete: 48,
        title: "Secure procurement approval",
        wbs: "1.2.3",
      }),
    );
  });

  it("maps a schedule item and keeps link metadata", () => {
    const item = normalizeScheduleItemRecord(
      {
        GLOBALSCHEDULENO: "GS-1001",
        LINKNO: "P-1001",
        LINKTYPE: "PROJECT",
        STARTDATE: "2026-03-24 09:00:00.000",
        TITLE: "Client coordination call",
      },
      {
        id: "GLOBALSCHEDULENO",
        linkNo: "LINKNO",
        linkType: "LINKTYPE",
        startAt: "STARTDATE",
        title: "TITLE",
      },
      "GLOBALSCHEDULE",
    );

    expect(item).toEqual(
      expect.objectContaining({
        id: "GS-1001",
        linkNo: "P-1001",
        linkType: "PROJECT",
      }),
    );
  });

  it("maps an activity summary", () => {
    const activity = normalizeActivityRecord(
      {
        COMMENT: "Client approved revised project plan.",
        DATE: "2026-03-21 10:30:00.000",
        PROJEVENTNO: "EV-1001",
        PROJECTNO: "P-1001",
        TYPE: "NOTE",
      },
      {
        id: "PROJEVENTNO",
        occurredAt: "DATE",
        projectId: "PROJECTNO",
        summary: "COMMENT",
        type: "TYPE",
      },
      "PROJECTEVENTS",
    );

    expect(activity).toEqual(
      expect.objectContaining({
        id: "EV-1001",
        projectId: "P-1001",
        summary: "Client approved revised project plan.",
      }),
    );
  });

  it("maps billing and profitability snapshots", () => {
    const billing = normalizeBillingSnapshotRecord(
      {
        AMOUNT: "1237.50",
        CATEGORY: "LABOR",
        CUSTOMERNO: "C10025",
        DATE: "2026-03-21 16:00:00.000",
        DESCRIPTION: "Rack integration and testing",
        PROJECTNO: "P-1001",
        RATE: "225",
        TIMEBILLNO: "TB-1001",
        TIMEBILLED: "5.5",
        USERID: "JMILLER",
      },
      {
        amount: "AMOUNT",
        billedAt: "DATE",
        category: "CATEGORY",
        customerId: "CUSTOMERNO",
        description: "DESCRIPTION",
        hoursBilled: "TIMEBILLED",
        id: "TIMEBILLNO",
        projectId: "PROJECTNO",
        rate: "RATE",
        userId: "USERID",
      },
      "TIMEBILL",
    );

    const profitability = normalizeProfitabilitySnapshotRecord(
      {
        GROSSMARGIN: "34.5",
        GROSSPROFIT: "12500",
        PROJECTNO: "P-1001",
        REVENUE: "36250",
      },
      {
        grossMargin: "GROSSMARGIN",
        grossProfit: "GROSSPROFIT",
        id: "PROJECTNO",
        projectId: "PROJECTNO",
        revenue: "REVENUE",
      },
      "LDView_ProjectProfit",
    );

    expect(billing).toEqual(
      expect.objectContaining({
        amount: 1237.5,
        hoursBilled: 5.5,
        rate: 225,
        userId: "JMILLER",
      }),
    );
    expect(profitability?.grossProfit).toBe(12500);
  });

  it("maps deal and quote placeholders for future commercial sources", () => {
    const deal = normalizeDealRecord(
      {
        AMOUNT: "125000",
        CUSTOMERNO: "C10025",
        CUSTOMER_COMPANY: "North Peak University",
        FORECASTAMOUNT: "110000",
        MODDATE: "2026-03-22 12:00:00.000",
        OPPORTUNITYNO: "OPP-101",
        OWNERID: "JMILLER",
        PROBABILITYPERCENT: "65",
        STAGE: "Proposal",
        STATUSCODE: "OPEN",
        TITLE: "Districtwide AV Rollout",
      },
      {
        amount: "AMOUNT",
        customerId: "CUSTOMERNO",
        customerName: "CUSTOMER_COMPANY",
        forecastAmount: "FORECASTAMOUNT",
        id: "OPPORTUNITYNO",
        ownerId: "OWNERID",
        probabilityPercent: "PROBABILITYPERCENT",
        stage: "STAGE",
        status: "STATUSCODE",
        title: "TITLE",
        updatedAt: "MODDATE",
      },
      "FUNNELOPPORITEM",
    );

    const quote = normalizeQuoteRecord(
      {
        AMOUNT: "18750",
        CONTRACTNO: "Q-1001",
        CUSTOMERNO: "C10025",
        CUSTOMER_COMPANY: "North Peak University",
        MODDATE: "2026-03-23 09:30:00.000",
        OWNERID: "JMILLER",
        STAGE: "Submitted",
        STATUSCODE: "DATAENTRY",
        TITLE: "Boardroom refresh proposal",
        VALIDUNTIL: "2026-04-10 00:00:00.000",
      },
      {
        amount: "AMOUNT",
        customerId: "CUSTOMERNO",
        customerName: "CUSTOMER_COMPANY",
        id: "CONTRACTNO",
        ownerId: "OWNERID",
        stage: "STAGE",
        status: "STATUSCODE",
        title: "TITLE",
        updatedAt: "MODDATE",
        validUntil: "VALIDUNTIL",
      },
      "QUOTE",
    );

    expect(deal).toEqual(
      expect.objectContaining({
        amount: 125000,
        customerName: "North Peak University",
        forecastAmount: 110000,
        id: "OPP-101",
        probabilityPercent: 65,
        stage: "Proposal",
      }),
    );
    expect(quote).toEqual(
      expect.objectContaining({
        amount: 18750,
        customerName: "North Peak University",
        id: "Q-1001",
        validUntil: "2026-04-10 00:00:00.000",
      }),
    );
  });

  it("maps customer and service contract records", () => {
    const customer = normalizeCustomerRecord(
      {
        ADDRESS1: "100 Campus Way",
        BALANCE: "15420.55",
        CITY: "Denver",
        COMPANY: "North Peak University",
        CUSTOMERNO: "C10025",
        PHONE: "303-555-0100",
        SALESREP: "JMILLER",
        STATE: "CO",
        STATUS: "ACTIVE",
        YTDSALES: "221000.00",
        ZIP: "80203",
      },
      {
        address1: "ADDRESS1",
        balance: "BALANCE",
        city: "CITY",
        company: "COMPANY",
        id: "CUSTOMERNO",
        phone: "PHONE",
        salesRepId: "SALESREP",
        state: "STATE",
        status: "STATUS",
        ytdSales: "YTDSALES",
        zip: "ZIP",
      },
      "CUSTOMER",
    );

    const contract = normalizeServiceContractRecord(
      {
        CONTRACTNO: "SC-1001",
        CUSTOMERNO: "C10025",
        ENDDATE: "2027-01-31 00:00:00.000",
        MONTHLYTOTAL: "4200",
        RENEWALDATE: "2026-12-01 00:00:00.000",
        STARTDATE: "2026-02-01 00:00:00.000",
        STATUSCODE: "ACTIVE",
        TITLE: "Campus support agreement",
        TOTAL: "50400",
      },
      {
        customerId: "CUSTOMERNO",
        endDate: "ENDDATE",
        id: "CONTRACTNO",
        monthlyTotal: "MONTHLYTOTAL",
        renewalDate: "RENEWALDATE",
        startDate: "STARTDATE",
        status: "STATUSCODE",
        title: "TITLE",
        total: "TOTAL",
      },
      "SERVICECONTRACT",
    );

    expect(customer).toEqual(
      expect.objectContaining({
        balance: 15420.55,
        company: "North Peak University",
        id: "C10025",
        salesRepId: "JMILLER",
        ytdSales: 221000,
      }),
    );
    expect(contract).toEqual(
      expect.objectContaining({
        id: "SC-1001",
        monthlyTotal: 4200,
        total: 50400,
      }),
    );
  });

  it("maps dispatch, invoice, and user records", () => {
    const dispatch = normalizeDispatchRecord(
      {
        BRANCH: "DEN",
        CALLTYPE: "SERVICE",
        CALLER: "Dana Webb",
        CALLEREMAIL: "dwebb@example.com",
        CALLOPENDATE: "2026-03-24 08:10:00.000",
        CSR: "CSR-01",
        CUSTOMERNO: "C10025",
        DISPATCHNO: "D-1001",
        MACHINENO: "M-1001",
        PRIORITY: "1",
        PROBLEM: "Audio system offline in lecture hall.",
        PROBLEMCODE: "AUDIO",
        PROJECTNO: "P-1001",
        SERVICECONTRACTNO: "SC-1001",
        SITENO: "S-1001",
        STATUSCODE: "OPEN",
        TECHASSIGNED: "TECH-01",
      },
      {
        branch: "BRANCH",
        callType: "CALLTYPE",
        caller: "CALLER",
        callerEmail: "CALLEREMAIL",
        customerId: "CUSTOMERNO",
        id: "DISPATCHNO",
        machineId: "MACHINENO",
        openedAt: "CALLOPENDATE",
        primaryTechnicianId: "TECHASSIGNED",
        priority: "PRIORITY",
        problem: "PROBLEM",
        problemCode: "PROBLEMCODE",
        projectId: "PROJECTNO",
        serviceContractId: "SERVICECONTRACTNO",
        siteId: "SITENO",
        status: "STATUSCODE",
        csrId: "CSR",
      },
      "DISPATCH",
    );

    const invoice = normalizeInvoiceRecord(
      {
        BALANCE: "6200",
        CUSTOMERNO: "C10025",
        DUEDATE: "2026-04-15 00:00:00.000",
        INVAMOUNT: "18000",
        INVOICEDATE: "2026-03-31 00:00:00.000",
        INVOICENO: "INV-9001",
        INVOICETYPE: "PROGRESS",
        STATUSCODE: "OPEN",
      },
      {
        amount: "INVAMOUNT",
        balance: "BALANCE",
        customerId: "CUSTOMERNO",
        dueDate: "DUEDATE",
        id: "INVOICENO",
        invoiceType: "INVOICETYPE",
        invoicedAt: "INVOICEDATE",
        status: "STATUSCODE",
      },
      "INVOICE",
    );

    const user = normalizeUserRecord(
      {
        ACTIVEFLAG: "Y",
        BRANCH: "DEN",
        DEPARTMENT: "Projects",
        EMAIL: "jmiller@example.com",
        FULLNAME: "Jordan Miller",
        TYPE: "EMPLOYEE",
        USERID: "JMILLER",
      },
      {
        activeFlag: "ACTIVEFLAG",
        branch: "BRANCH",
        department: "DEPARTMENT",
        email: "EMAIL",
        fullName: "FULLNAME",
        id: "USERID",
        type: "TYPE",
      },
      "USERID",
    );

    expect(dispatch).toEqual(
      expect.objectContaining({
        id: "D-1001",
        priority: 1,
        projectId: "P-1001",
        serviceContractId: "SC-1001",
      }),
    );
    expect(invoice).toEqual(
      expect.objectContaining({
        amount: 18000,
        balance: 6200,
        id: "INV-9001",
        invoiceType: "PROGRESS",
      }),
    );
    expect(user).toEqual(
      expect.objectContaining({
        activeFlag: "Y",
        fullName: "Jordan Miller",
        id: "JMILLER",
      }),
    );
  });
});
