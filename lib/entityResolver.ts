/**
 * Resolves shared AI tool entity context from live Q360 when available, with
 * mock DB and bundled demo fallbacks retained for local development.
 */
import {
  formatDispatchForPrompt,
  getCustomerByNo,
  getDispatchById,
  getProjectByNo,
  getServiceContractByNo,
  getSiteByNo,
  getTimeBillById,
  getTimeBillsByDispatch,
  FALLBACK_CUSTOMERS,
  FALLBACK_DISPATCHES,
  FALLBACK_SITES,
} from "@/lib/q360Client";
import {
  getCustomerFromMockDb,
  getDispatchByIdFromMockDb,
  getSiteFromMockDb,
  getTimeBillsFromMockDb,
} from "@/lib/mockDb";
import type { AiEntityType } from "@/types/feature2";
import type {
  Customer,
  Dispatch,
  Project,
  ServiceContract,
  Site,
  TimeBill,
} from "@/types/q360";

const SUPPORTED_ENTITY_TYPES: AiEntityType[] = [
  "dispatch",
  "project",
  "customer",
  "servicecontract",
  "timebill",
];

export class UnsupportedEntityTypeError extends Error {
  constructor(entityType: string) {
    super(
      `entityType "${entityType}" is not supported. Supported: ${SUPPORTED_ENTITY_TYPES.join(", ")}.`
    );
    this.name = "UnsupportedEntityTypeError";
  }
}

export class EntityNotFoundError extends Error {
  constructor(entityType: AiEntityType, entityId: string) {
    super(`${entityType} record ${entityId} not found.`);
    this.name = "EntityNotFoundError";
  }
}

export interface ResolveEntityOptions {
  includeTimeBills?: boolean;
}

export interface ResolvedEntity {
  entityType: AiEntityType;
  entityId: string;
  formatted: string;
  raw: {
    primary:
      | Dispatch
      | Project
      | Customer
      | ServiceContract
      | TimeBill;
    dispatch: Dispatch | null;
    project: Project | null;
    customer: Customer | null;
    site: Site | null;
    serviceContract: ServiceContract | null;
    timeBill: TimeBill | null;
    timeBills: TimeBill[];
  };
}

function safe(
  value: string | number | null | undefined,
  fallback = "[Not provided]"
): string {
  if (value == null || value === "") return fallback;
  return String(value);
}

function joinLines(lines: string[]): string {
  return lines.filter(Boolean).join("\n");
}

function formatCustomerForPrompt(customer: Customer): string {
  return joinLines([
    `Customer: ${safe(customer.company)} (${safe(customer.customerno)})`,
    `Status: ${safe(customer.status)}`,
    `Type: ${safe(customer.type)}`,
    `Phone: ${safe(customer.phone)}`,
    `Address: ${safe(customer.address1)}`,
    `City/State/ZIP: ${safe(customer.city)}, ${safe(customer.state)} ${safe(customer.zip)}`,
    `Sales Rep: ${safe(customer.salesrep)}`,
    `Balance: ${safe(customer.balance)}`,
    `YTD Sales: ${safe(customer.ytdsales)}`,
  ]);
}

function formatProjectForPrompt(
  project: Project,
  customer: Customer | null,
  site: Site | null
): string {
  return joinLines([
    `Project: ${safe(project.title)} (${safe(project.projectno)})`,
    `Customer: ${safe(customer?.company)} (${safe(project.customerno)})`,
    `Site: ${safe(site?.sitename)} (${safe(project.siteno)})`,
    `Status: ${safe(project.statuscode)}`,
    `Project Leader: ${safe(project.projectleader)}`,
    `Start Date: ${safe(project.startdate)}`,
    `End Date: ${safe(project.enddate)}`,
    `Percent Complete: ${safe(project.percentcomplete)}`,
    `Hours Budget: ${safe(project.hoursbudget)}`,
    `Revenue Budget: ${safe(project.revenuebudget)}`,
    `Branch: ${safe(project.branch)}`,
  ]);
}

function formatServiceContractForPrompt(
  contract: ServiceContract,
  customer: Customer | null,
  site: Site | null
): string {
  return joinLines([
    `Service Contract: ${safe(contract.title)} (${safe(contract.contractno)})`,
    `Customer: ${safe(customer?.company)} (${safe(contract.customerno)})`,
    `Site: ${safe(site?.sitename)} (${safe(contract.siteno)})`,
    `Status: ${safe(contract.statuscode)}`,
    `Start Date: ${safe(contract.startdate)}`,
    `End Date: ${safe(contract.enddate)}`,
    `Renewal Date: ${safe(contract.renewaldate)}`,
    `Monthly Total: ${safe(contract.monthlytotal)}`,
    `Contract Total: ${safe(contract.total)}`,
  ]);
}

function formatTimeBillForPrompt(input: {
  timeBill: TimeBill;
  dispatch: Dispatch | null;
  project: Project | null;
  customer: Customer | null;
  site: Site | null;
}): string {
  return joinLines([
    `Time Bill: ${safe(input.timeBill.timebillno)}`,
    `User: ${safe(input.timeBill.userid ?? input.timeBill.techassigned)}`,
    `Dispatch: ${safe(input.dispatch?.dispatchno ?? input.timeBill.dispatchno)}`,
    `Project: ${safe(input.project?.title)} (${safe(input.project?.projectno ?? input.timeBill.projectno)})`,
    `Customer: ${safe(input.customer?.company)} (${safe(input.timeBill.customerno ?? input.dispatch?.customerno)})`,
    `Site: ${safe(input.site?.sitename)}`,
    `Category: ${safe(input.timeBill.category)}`,
    `Start: ${safe(input.timeBill.date ?? input.timeBill.tbstarttime)}`,
    `End: ${safe(input.timeBill.endtime ?? input.timeBill.tbendtime)}`,
    `Time Billed: ${safe(input.timeBill.timebilled)}`,
    `Rate: ${safe(input.timeBill.rate)}`,
    `Travel Time: ${safe(input.timeBill.traveltime)}`,
  ]);
}

async function tryOrNull<T>(work: () => Promise<T | null>): Promise<T | null> {
  try {
    return await work();
  } catch {
    return null;
  }
}

async function resolveDispatchEntity(
  entityId: string,
  options: ResolveEntityOptions
): Promise<ResolvedEntity | null> {
  const includeTimeBills = options.includeTimeBills === true;

  let dispatch = await getDispatchByIdFromMockDb(entityId);
  let customer: Customer | null = null;
  let site: Site | null = null;
  let timeBills: TimeBill[] = [];

  if (dispatch) {
    customer = await getCustomerFromMockDb(dispatch.customerno);
    site = await getSiteFromMockDb(dispatch.siteno);

    if (includeTimeBills) {
      timeBills = (await getTimeBillsFromMockDb(entityId)) ?? [];
    }
  }

  if (!dispatch) {
    dispatch = await tryOrNull(() => getDispatchById(entityId));
    if (dispatch) {
      const dispatchCustomerNo = dispatch.customerno;
      const dispatchSiteNo = dispatch.siteno;

      customer = dispatchCustomerNo
        ? await tryOrNull(() => getCustomerByNo(dispatchCustomerNo))
        : null;
      site = dispatchSiteNo ? await tryOrNull(() => getSiteByNo(dispatchSiteNo)) : null;

      if (includeTimeBills) {
        timeBills = (await tryOrNull(() => getTimeBillsByDispatch(entityId))) ?? [];
      }
    }
  }

  if (!dispatch) {
    dispatch =
      FALLBACK_DISPATCHES.find((item) => item.dispatchno === entityId) ?? null;
    if (dispatch) {
      customer = FALLBACK_CUSTOMERS[dispatch.customerno] ?? null;
      site = FALLBACK_SITES[dispatch.siteno] ?? null;
    }
  }

  if (!dispatch) return null;

  return {
    entityType: "dispatch",
    entityId,
    formatted: includeTimeBills
      ? formatDispatchForPrompt(dispatch, customer, site, timeBills)
      : formatDispatchForPrompt(dispatch, customer, site),
    raw: {
      primary: dispatch,
      dispatch,
      project: null,
      customer,
      site,
      serviceContract: null,
      timeBill: null,
      timeBills,
    },
  };
}

export async function resolveEntity(
  entityType: AiEntityType,
  entityId: string,
  options: ResolveEntityOptions = {}
): Promise<ResolvedEntity> {
  if (!SUPPORTED_ENTITY_TYPES.includes(entityType)) {
    throw new UnsupportedEntityTypeError(entityType);
  }

  switch (entityType) {
    case "dispatch": {
      const resolved = await resolveDispatchEntity(entityId, options);
      if (!resolved) throw new EntityNotFoundError(entityType, entityId);
      return resolved;
    }

    case "customer": {
      const customer =
        (await tryOrNull(() => getCustomerByNo(entityId))) ??
        FALLBACK_CUSTOMERS[entityId] ??
        null;

      if (!customer) throw new EntityNotFoundError(entityType, entityId);

      return {
        entityType,
        entityId,
        formatted: formatCustomerForPrompt(customer),
        raw: {
          primary: customer,
          dispatch: null,
          project: null,
          customer,
          site: null,
          serviceContract: null,
          timeBill: null,
          timeBills: [],
        },
      };
    }

    case "project": {
      const project = await tryOrNull(() => getProjectByNo(entityId));
      if (!project) throw new EntityNotFoundError(entityType, entityId);

      const projectCustomerNo = project.customerno;
      const projectSiteNo = project.siteno;

      const customer = projectCustomerNo
        ? await tryOrNull(() => getCustomerByNo(projectCustomerNo))
        : null;
      const site = projectSiteNo
        ? await tryOrNull(() => getSiteByNo(projectSiteNo))
        : null;

      return {
        entityType,
        entityId,
        formatted: formatProjectForPrompt(project, customer, site),
        raw: {
          primary: project,
          dispatch: null,
          project,
          customer,
          site,
          serviceContract: null,
          timeBill: null,
          timeBills: [],
        },
      };
    }

    case "servicecontract": {
      const serviceContract = await tryOrNull(() => getServiceContractByNo(entityId));
      if (!serviceContract) throw new EntityNotFoundError(entityType, entityId);

      const serviceContractCustomerNo = serviceContract.customerno;
      const serviceContractSiteNo = serviceContract.siteno;

      const customer = serviceContractCustomerNo
        ? await tryOrNull(() => getCustomerByNo(serviceContractCustomerNo))
        : null;
      const site = serviceContractSiteNo
        ? await tryOrNull(() => getSiteByNo(serviceContractSiteNo))
        : null;

      return {
        entityType,
        entityId,
        formatted: formatServiceContractForPrompt(
          serviceContract,
          customer,
          site
        ),
        raw: {
          primary: serviceContract,
          dispatch: null,
          project: null,
          customer,
          site,
          serviceContract,
          timeBill: null,
          timeBills: [],
        },
      };
    }

    case "timebill": {
      const timeBill = await tryOrNull(() => getTimeBillById(entityId));
      if (!timeBill) throw new EntityNotFoundError(entityType, entityId);

      const timeBillDispatchNo = timeBill.dispatchno;
      const timeBillProjectNo = timeBill.projectno;

      const dispatch = timeBillDispatchNo
        ? await tryOrNull(() => getDispatchById(timeBillDispatchNo))
        : null;
      const project = timeBillProjectNo
        ? await tryOrNull(() => getProjectByNo(timeBillProjectNo))
        : null;
      const customerNo =
        timeBill.customerno ?? dispatch?.customerno ?? project?.customerno ?? null;
      const customer = customerNo
        ? await tryOrNull(() => getCustomerByNo(customerNo))
        : null;
      const siteNo = dispatch?.siteno ?? project?.siteno ?? null;
      const site = siteNo ? await tryOrNull(() => getSiteByNo(siteNo)) : null;

      return {
        entityType,
        entityId,
        formatted: formatTimeBillForPrompt({
          timeBill,
          dispatch,
          project,
          customer,
          site,
        }),
        raw: {
          primary: timeBill,
          dispatch,
          project,
          customer,
          site,
          serviceContract: null,
          timeBill,
          timeBills: [],
        },
      };
    }
  }
}
