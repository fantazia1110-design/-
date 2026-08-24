import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { isFacebookConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          pictureUrl: user.pictureUrl,
          isDemo: user.isDemo,
          tokenExpiresAt: user.tokenExpiresAt,
        }
      : null,
    facebookConfigured: isFacebookConfigured(),
  });
}
