import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json({
            ok: true,
            database: "connected",
        });
    } catch (error) {
        console.error("Database connection error:", error);

        return NextResponse.json(
            {
                ok: false,
                database: "disconnected",
            },
            { status: 500 }
        );
    }
}
