const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const baseUrl = process.env.APP_BASE_URL;

if (!token || !secret || !baseUrl) {
  console.error("TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, and APP_BASE_URL are required.");
  process.exitCode = 1;
} else {
  let webhookUrl;
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:") throw new Error("HTTPS is required");
    webhookUrl = new URL("/api/integrations/telegram/webhook", parsed).toString();
  } catch {
    console.error("APP_BASE_URL must be a valid HTTPS URL.");
    process.exitCode = 1;
  }

  if (webhookUrl) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: secret,
          allowed_updates: ["message", "callback_query"]
        }),
        signal: AbortSignal.timeout(10_000)
      });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error("Telegram rejected webhook configuration");
      console.log("Webhook configured successfully.");
    } catch {
      console.error("Webhook configuration failed. Check credentials, URL, and network access.");
      process.exitCode = 1;
    }
  }
}
