import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const { user, error } = await getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/auth/me error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch user" },
      { status: 500 }
    );
  }
}