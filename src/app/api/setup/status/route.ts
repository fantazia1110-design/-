import { NextResponse } from "next/server";
import { GRAPH_VERSION } from "@/lib/facebook";
import { getFacebookAppId, getFacebookAppSecret } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Reports whether the Facebook app credentials are present — and if so,
 * verifies them against Facebook itself (client_credentials flow).
 */
export async function GET() {
  const appId = getFacebookAppId();
  const secret = getFacebookAppSecret();

  const appIdSet = appId.length > 0;
  const secretSet = secret.length > 0;
  let keysValid: boolean | null = null;
  let error: string | null = null;

  if (appIdSet && secretSet) {
    try {
      const params = new URLSearchParams({
        client_id: appId,
        client_secret: secret,
        grant_type: "client_credentials",
      });
      const res = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?${params.toString()}`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as {
        access_token?: string;
        error?: { message?: string };
      };
      if (res.ok && data.access_token) {
        keysValid = true;
      } else {
        keysValid = false;
        error = data.error?.message ?? "المفاتيح غير صالحة";
      }
    } catch {
      keysValid = null;
      error = "تعذر الوصول لفيسبوك للتحقق — تحقق من الاتصال بالإنترنت";
    }
  }

  return NextResponse.json({ appIdSet, secretSet, keysValid, error });
}
