/**
 * GET /api/q360/tasks — tasks for the employee demo; backed by the local mock DB (optional `user` filter).
 */
import { NextRequest, NextResponse } from "next/server";
import { getTasksFromMockDb } from "@/lib/mockDb";

export async function GET(req: NextRequest) {
  try {
    const user = req.nextUrl.searchParams.get("user") ?? undefined;
    const data = await getTasksFromMockDb(user);

    return NextResponse.json({
      success: true,
      result: data ?? []
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
