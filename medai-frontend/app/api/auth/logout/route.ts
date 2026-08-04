import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "medai_token";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ message: "Logged out." }, { status: 200 });
}
