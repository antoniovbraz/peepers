import { NextResponse } from "next/server";
import { cache } from "@/lib/cache";

export async function GET() {
  try {
    const knownUserId = "669073070";
    const tokenData = await cache.getUser(`access_token:${knownUserId}`);
    
    if (!tokenData?.access_token) {
      return NextResponse.json({
        success: false,
        error: "No access token found",
        userId: knownUserId,
        next_step: "Go to /api/ml/auth to authenticate"
      }, { status: 401 });
    }

    const testResponse = await fetch(`https://api.mercadolibre.com/users/me`, {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Accept": "application/json"
      }
    });

    const testResult = await testResponse.json();

    return NextResponse.json({
      success: testResponse.ok,
      status: testResponse.status,
      userId: knownUserId,
      tokenExists: true,
      apiTest: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
