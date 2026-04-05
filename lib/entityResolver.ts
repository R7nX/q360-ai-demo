import {
  formatDispatchForPrompt,
  FALLBACK_DISPATCHES,
  FALLBACK_CUSTOMERS,
  FALLBACK_SITES,
} from "@/lib/q360Client";
import {
  getDispatchByIdFromMockDb,
  getCustomerFromMockDb,
  getSiteFromMockDb,
  getTimeBillsFromMockDb,
} from "@/lib/mockDb";
import type { AiEntityType } from "@/types/feature2";
import type { Customer, Dispatch, Site, TimeBill } from "@/types/q360";

export class UnsupportedEntityTypeError extends Error {
  constructor(entityType: string) {
    super(
      `entityType "${entityType}" is not yet supported. Only "dispatch" is supported.`
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
    dispatch: Dispatch;
    customer: Customer | null;
    site: Site | null;
    timeBills: TimeBill[];
  };
}

export async function resolveEntity(
  entityType: AiEntityType,
  entityId: string,
  options: ResolveEntityOptions = {}
): Promise<ResolvedEntity> {
  if (entityType !== "dispatch") {
    throw new UnsupportedEntityTypeError(entityType);
  }

  const includeTimeBills = options.includeTimeBills === true;

  let dispatch: Dispatch | null = null;
  let customer: Customer | null = null;
  let site: Site | null = null;
  let timeBills: TimeBill[] = [];

  dispatch = await getDispatchByIdFromMockDb(entityId);
  if (dispatch) {
    customer = await getCustomerFromMockDb(dispatch.customerno);
    site = await getSiteFromMockDb(dispatch.siteno);

    if (includeTimeBills) {
      timeBills = (await getTimeBillsFromMockDb(entityId)) ?? [];
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

  if (!dispatch) {
    throw new EntityNotFoundError(entityType, entityId);
  }

  const formatted = includeTimeBills
    ? formatDispatchForPrompt(dispatch, customer, site, timeBills)
    : formatDispatchForPrompt(dispatch, customer, site);

  return {
    entityType,
    entityId,
    formatted,
    raw: {
      dispatch,
      customer,
      site,
      timeBills,
    },
  };
}
