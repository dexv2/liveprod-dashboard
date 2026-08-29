const token = process.env.TELEGRAM_BOT_TOKEN;

function sanitize(value) {
  if (typeof value !== "string") return undefined;
  return value.replaceAll(token || "", "[REDACTED]").replace(/https?:\/\/\S+/gi, "[URL_REDACTED]").slice(0, 300);
}

async function call(method) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(10_000)
  });
  const payload = await response.json();
  if (!response.ok || payload?.ok !== true || payload.result === undefined) {
    throw new Error(sanitize(payload?.description) || `${method} failed`);
  }
  return payload.result;
}

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is required.");
  process.exitCode = 1;
} else {
  try {
    const [bot, webhook] = await Promise.all([call("getMe"), call("getWebhookInfo")]);
    console.log("Bot:", {
      id: String(bot.id),
      username: bot.username,
      name: [bot.first_name, bot.last_name].filter(Boolean).join(" ") || undefined
    });
    console.log("Webhook:", {
      url: webhook.url || "not configured",
      pendingUpdateCount: webhook.pending_update_count || 0,
      lastErrorDate: webhook.last_error_date
        ? new Date(webhook.last_error_date * 1000).toISOString()
        : undefined,
      lastErrorMessage: sanitize(webhook.last_error_message)
    });
  } catch (error) {
    console.error("Telegram health check failed:", sanitize(error instanceof Error ? error.message : undefined));
    process.exitCode = 1;
  }
}
