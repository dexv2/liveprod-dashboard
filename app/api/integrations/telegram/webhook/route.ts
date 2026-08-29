import { NextRequest, NextResponse } from "next/server";
import { processTelegramWebhook } from "@/services/telegram/telegramWebhookService";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const result = await processTelegramWebhook({
    secretHeader: request.headers.get("x-telegram-bot-api-secret-token"),
    parseJson: () => request.json()
  });
  return NextResponse.json(result.body, { status: result.status });
}
