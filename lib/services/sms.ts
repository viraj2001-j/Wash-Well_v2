/**
 * SMS Service for SMSAPI.LK Integration (v3 API)
 * Official Website: https://smsapi.lk / https://dashboard.smsapi.lk
 */

export interface SendSMSOptions {
  to: string;
  message: string;
  senderId?: string;
}

export interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Format Sri Lankan Phone Numbers for SMSAPI.LK
 * Converts: "0771234567" -> "94771234567"
 * Converts: "+94771234567" -> "94771234567"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("94")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return "94" + digits.substring(1);
  }
  if (digits.length === 9) {
    return "94" + digits;
  }
  return digits;
}

/**
 * Send SMS via SMSAPI.LK API v3
 */
export async function sendSMS(options: SendSMSOptions): Promise<SendSMSResult> {
  const apiKey =
    process.env.SMS_API_KEY ||
    process.env.SMSAPI_KEY ||
    process.env.SMSAPI_TOKEN;

  const senderId =
    options.senderId ||
    process.env.SMS_SENDER_ID ||
    process.env.SMSAPI_SENDER_ID ||
    "SMSAPI Demo";

  const recipient = formatPhoneNumber(options.to);

  // Fallback simulation mode if API key is not configured
  if (!apiKey) {
    console.log("=================================================");
    console.log("[SMSAPI.LK DEV SIMULATION - NO API KEY]");
    console.log(`TO: ${recipient}`);
    console.log(`SENDER: ${senderId}`);
    console.log(`MESSAGE: ${options.message}`);
    console.log("=================================================");
    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}`,
    };
  }

  // Resolve API Endpoint for v3 (e.g. https://dashboard.smsapi.lk/api/v3/sms/send)
  let rawUrl = (process.env.SMS_API_URL || "https://dashboard.smsapi.lk/api/v3/").trim();
  if (!rawUrl.endsWith("/")) {
    rawUrl += "/";
  }

  let endpoint = rawUrl;
  if (!rawUrl.includes("sms/send") && !rawUrl.includes("send")) {
    endpoint = `${rawUrl}sms/send`;
  }

  console.log(`[SMSAPI.LK] Dispatching SMS to ${recipient} via ${endpoint}...`);

  try {
    const payload = {
      recipient: recipient,
      sender_id: senderId,
      message: options.message,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    console.log("[SMSAPI.LK Response]:", data);

    if (!response.ok) {
      console.error("SMSAPI.LK HTTP Error:", response.status, data);
      return {
        success: false,
        error:
          typeof data === "object"
            ? data?.message || data?.error || `SMSAPI HTTP ${response.status}`
            : responseText || `SMSAPI HTTP ${response.status}`,
      };
    }

    if (data && typeof data === "object" && (data.status === "error" || data.success === false)) {
      return {
        success: false,
        error: data.message || data.error || "SMSAPI.LK returned error status",
      };
    }

    return {
      success: true,
      messageId: data?.data?.id || data?.data?.message_id || `msg_${Date.now()}`,
    };
  } catch (err: any) {
    console.error("Failed to execute SMSAPI.LK HTTP call:", err);
    return {
      success: false,
      error: err.message || "Network error connecting to SMSAPI.LK",
    };
  }
}

/**
 * Send customer login OTP SMS
 */
export async function sendCustomerOTP(
  phone: string,
  otpCode: string,
  companyName: string = "Wash & Well"
): Promise<SendSMSResult> {
  const message = `Welcome to ${companyName}. Your login OTP is ${otpCode}. Use this OTP to access your customer portal.`;
  return sendSMS({ to: phone, message });
}
