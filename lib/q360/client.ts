import { z } from "zod";

import type { Q360Envelope, Q360ErrorItem } from "@/types/q360";

const q360ErrorItemSchema = z.object({
  seq: z.string().optional(),
  __error: z.string().optional(),
  errorno: z.string().optional(),
  errormessage: z.string().optional(),
  procname: z.string().optional(),
  referencecode: z.string().optional(),
  componentid: z.string().nullable().optional(),
  linktype: z.string().nullable().optional(),
  linkno: z.string().nullable().optional(),
});

const q360ErrorPayloadSchema = z.object({
  _error: z.array(q360ErrorItemSchema).optional(),
});

const q360EnvelopeSchema = z.object({
  code: z.number().int().optional(),
  success: z.boolean(),
  message: z.string().catch(""),
  payload: z.unknown(),
});

const q360EnvSchema = z.object({
  Q360_BASE_URL: z.string().url(),
  Q360_API_USER: z.string().min(1),
  Q360_API_PASSWORD: z.string().min(1),
});

export class Q360ApiError extends Error {
  readonly httpStatus: number;
  readonly path: string;
  readonly q360Code?: number;
  readonly q360Errors: Q360ErrorItem[];

  constructor(options: {
    message: string;
    httpStatus: number;
    path: string;
    q360Code?: number;
    q360Errors?: Q360ErrorItem[];
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = "Q360ApiError";
    this.httpStatus = options.httpStatus;
    this.path = options.path;
    this.q360Code = options.q360Code;
    this.q360Errors = options.q360Errors ?? [];
  }
}

export function isMockMode(): boolean {
  return process.env.Q360_MOCK_MODE === "true";
}

export function getQ360Config() {
  return q360EnvSchema.parse({
    Q360_BASE_URL: process.env.Q360_BASE_URL,
    Q360_API_USER: process.env.Q360_API_USER ?? process.env.Q360_API_USERNAME,
    Q360_API_PASSWORD: process.env.Q360_API_PASSWORD,
  });
}

export function buildBasicAuthHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}

export function getQ360DocumentationUrl(): string {
  if (isMockMode()) {
    return "https://mock.q360.local/APIDocumentation";
  }

  const { Q360_BASE_URL } = getQ360Config();
  return `${Q360_BASE_URL.replace(/\/$/, "")}/APIDocumentation`;
}

export function extractQ360Errors(payload: unknown): Q360ErrorItem[] {
  const parsedErrors = q360ErrorPayloadSchema.safeParse(payload);
  if (!parsedErrors.success || !parsedErrors.data._error) {
    return [];
  }

  return parsedErrors.data._error;
}

export function logQ360Errors(path: string, q360Errors: Q360ErrorItem[]): void {
  for (const q360Error of q360Errors) {
    console.error("[q360]", {
      errormessage: q360Error.errormessage ?? null,
      path,
      procname: q360Error.procname ?? null,
      referencecode: q360Error.referencecode ?? null,
    });
  }
}

export async function fetchQ360Json<TPayload>(
  path: string,
  payloadSchema: z.ZodType<TPayload>,
  init?: RequestInit,
): Promise<Q360Envelope<TPayload>> {
  const { Q360_API_PASSWORD, Q360_API_USER, Q360_BASE_URL } = getQ360Config();
  const requestUrl = `${Q360_BASE_URL.replace(/\/$/, "")}${path}`;

  const response = await fetch(requestUrl, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: buildBasicAuthHeader(Q360_API_USER, Q360_API_PASSWORD),
      ...(init?.headers ?? {}),
    },
  });

  let parsedJson: unknown;
  try {
    parsedJson = await response.json();
  } catch (error) {
    throw new Q360ApiError({
      message: "Q360 returned a non-JSON response.",
      httpStatus: response.status,
      path,
      cause: error,
    });
  }

  const parsedEnvelope = q360EnvelopeSchema.safeParse(parsedJson);
  if (!parsedEnvelope.success) {
    throw new Q360ApiError({
      message: "Q360 returned an invalid response envelope.",
      httpStatus: response.status,
      path,
      cause: parsedEnvelope.error,
    });
  }

  const { code, message, payload, success } = parsedEnvelope.data;
  const q360Errors = extractQ360Errors(payload);

  if (!response.ok || !success) {
    if (q360Errors.length > 0) {
      logQ360Errors(path, q360Errors);
    }

    throw new Q360ApiError({
      message: message || "Q360 request failed.",
      httpStatus: response.status,
      path,
      q360Code: code,
      q360Errors,
    });
  }

  const parsedPayload = payloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    throw new Q360ApiError({
      message: "Q360 response payload failed validation.",
      httpStatus: response.status,
      path,
      q360Code: code,
      q360Errors,
      cause: parsedPayload.error,
    });
  }

  return {
    code,
    message,
    payload: parsedPayload.data,
    success,
  };
}

export function toRouteErrorResponse(error: unknown): Response {
  if (error instanceof Q360ApiError) {
    return Response.json(
      {
        details: error.q360Errors,
        error: error.message,
        path: error.path,
      },
      { status: error.httpStatus || 500 },
    );
  }

  return Response.json(
    {
      error: "Unexpected server error.",
    },
    { status: 500 },
  );
}
