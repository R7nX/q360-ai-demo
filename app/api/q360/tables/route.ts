import { getTableList } from "@/lib/q360/adapter";
import { toRouteErrorResponse } from "@/lib/q360/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type")?.toUpperCase();
    const tables = await getTableList();
    const filteredTables = typeFilter
      ? tables.filter((table) => table.table_type === typeFilter)
      : tables;

    return Response.json({
      count: filteredTables.length,
      tables: filteredTables,
      type: typeFilter ?? null,
    });
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
