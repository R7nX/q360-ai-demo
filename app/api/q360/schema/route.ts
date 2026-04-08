import { getTableSchema } from "@/lib/q360/adapter";
import { toRouteErrorResponse } from "@/lib/q360/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("tablename");

    if (!tableName) {
      return Response.json(
        {
          error: "Missing required query parameter: tablename",
        },
        { status: 400 },
      );
    }

    const schema = await getTableSchema(tableName);

    return Response.json({
      fieldCount: schema.fields.length,
      fields: schema.fields,
      primaryKey: schema.primaryKey,
      tableName: schema.tableName,
    });
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
