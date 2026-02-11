import { NextRequest, NextResponse } from "next/server";
import { serverRegistry } from "@/lib/server-registry";
import "@/backgrounds/server-index";

const headers = {
  "Content-Type": "text/plain; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json(
        { error: "Missing required query parameters: id, type" },
        { status: 400 },
      );
    }

    const validTypes = ["ts", "js"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Use one of: ${validTypes.join(", ")}` },
        { status: 400 },
      );
    }

    const background = serverRegistry.get(id);
    if (!background) {
      return NextResponse.json(
        { error: `Background with id "${id}" not found` },
        { status: 404 },
      );
    }

    const rawCode = type === "ts" ? background.code.rawtsx : background.code.rawjsx;

    return new NextResponse(rawCode, { headers });
  } catch {
    return NextResponse.json(
      { error: "Failed to load background code" },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}
