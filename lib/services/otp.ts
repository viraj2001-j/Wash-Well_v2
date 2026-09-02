import { sendCustomerOTP, formatPhoneNumber } from "./sms";

interface OTPRecord {
  companyId: string;
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  customerId?: string;
}

// Global In-Memory Cache for active OTPs (persists across hot reloads in dev)
const globalForOTP = globalThis as unknown as {
  otpCache: Map<string, OTPRecord>;
};

if (!globalForOTP.otpCache) {
  globalForOTP.otpCache = new Map<string, OTPRecord>();
}

const otpStore = globalForOTP.otpCache;

/**
 * Generate and dispatch a 6-digit SMS OTP to customer's phone via SMSAPI.LK
 */
export async function generateAndSendOTP(
  companyId: string,
  companyName: string,
  phone: string,
  customerId?: string
): Promise<{ success: boolean; error?: string; simulatedCode?: string; cooldownRemaining?: number }> {
  const cleanPhone = formatPhoneNumber(phone);
  const cacheKey = `${companyId}:${cleanPhone}`;

  const existing = otpStore.get(cacheKey);
  const now = Date.now();

  // 60-Second Cooldown Check
  if (existing && now - existing.lastSentAt < 60000) {
    const cooldownRemaining = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      error: `Please wait ${cooldownRemaining} seconds before requesting a new OTP.`,
      cooldownRemaining,
    };
  }

  // Generate 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 5 * 60 * 1000; // 5-minute expiry

  // Store in Memory Store
  otpStore.set(cacheKey, {
    companyId,
    phone: cleanPhone,
    code,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
    customerId,
  });

  // Send SMS via SMSAPI.LK
  const smsResult = await sendCustomerOTP(phone, code, companyName);

  if (!smsResult.success) {
    return {
      success: false,
      error: smsResult.error || "Failed to send OTP SMS to customer phone.",
    };
  }

  return {
    success: true,
    simulatedCode: smsResult.simulated ? code : undefined,
  };
}

/**
 * Verify 6-digit SMS OTP for customer phone
 */
export async function verifyOTP(
  companyId: string,
  phone: string,
  inputCode: string
): Promise<{ success: boolean; error?: string; customerId?: string }> {
  const cleanPhone = formatPhoneNumber(phone);
  const cacheKey = `${companyId}:${cleanPhone}`;

  const record = otpStore.get(cacheKey);
  const now = Date.now();

  if (!record) {
    return {
      success: false,
      error: "No active OTP found for this phone number. Please request a new OTP.",
    };
  }

  // Expiry Check (5 minutes)
  if (now > record.expiresAt) {
    otpStore.delete(cacheKey);
    return {
      success: false,
      error: "OTP has expired. Please request a new OTP code.",
    };
  }

  // Max Attempts Check (5 attempts)
  if (record.attempts >= 5) {
    otpStore.delete(cacheKey);
    return {
      success: false,
      error: "Maximum verification attempts exceeded. Please request a new OTP.",
    };
  }

  record.attempts += 1;

  // Code Verification Match
  if (record.code.trim() !== inputCode.trim()) {
    return {
      success: false,
      error: `Invalid OTP code. You have ${5 - record.attempts} attempt(s) remaining.`,
    };
  }

  // Verification Successful -> Consume OTP
  const customerId = record.customerId;
  otpStore.delete(cacheKey);

  return {
    success: true,
    customerId,
  };
}

