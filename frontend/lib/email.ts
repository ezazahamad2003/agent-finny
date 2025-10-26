/**
 * Gmail Automation Helper
 * Sends emails, parses intents, and handles follow-ups
 */

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

/**
 * Send an email (fake for demo, real Gmail API in production)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, body, from = "finny@finny.ai" } = options;

  // TODO: Replace with real Gmail API call
  // const response = await fetch(`${process.env.GMAIL_API_URL}/send`, {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${process.env.GMAIL_TOKEN}` },
  //   body: JSON.stringify({ to, subject, body, from })
  // });

  // For demo: Log the email
  console.log("📧 Email sent:", { to, subject, body: body.substring(0, 50) + "..." });

  return true;
}

/**
 * Parse email intent to determine task type
 */
export function parseEmailIntent(emailBody: string): {
  intent: "meeting" | "summary" | "analysis" | "unknown";
  confidence: number;
} {
  const body = emailBody.toLowerCase();
  
  if (body.includes("meet") || body.includes("call") || body.includes("discuss")) {
    return { intent: "meeting", confidence: 0.9 };
  }
  if (body.includes("summary") || body.includes("report")) {
    return { intent: "summary", confidence: 0.85 };
  }
  if (body.includes("analyze") || body.includes("review")) {
    return { intent: "analysis", confidence: 0.8 };
  }
  
  return { intent: "unknown", confidence: 0.5 };
}

/**
 * Check if Gmail API is configured
 */
export function isGmailConfigured(): boolean {
  return !!process.env.GMAIL_TOKEN && !!process.env.GMAIL_API_URL;
}
