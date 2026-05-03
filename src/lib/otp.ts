import { createHash, timingSafeEqual } from "crypto";
import { redisDelete, redisGetString, redisSetString } from "@/lib/redis";

type OtpPurpose = "verify-email" | "reset-password" | "login";

type VerifyResult =
  | { ok: true }
  | { ok: false; message: string };

const OTP_EXPIRY_SECONDS = 5 * 60;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCK_SECONDS = 10 * 60;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashOtp(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function otpBaseKey(purpose: OtpPurpose, email: string) {
  return `${purpose}:email:${normalizeEmail(email)}`;
}

function otpCodeKey(purpose: OtpPurpose, email: string) {
  return `otp:${otpBaseKey(purpose, email)}`;
}

function otpAttemptsKey(purpose: OtpPurpose, email: string) {
  return `otp:attempts:${otpBaseKey(purpose, email)}`;
}

function otpCooldownKey(purpose: OtpPurpose, email: string) {
  return `otp:cooldown:${otpBaseKey(purpose, email)}`;
}

function otpLockKey(purpose: OtpPurpose, email: string) {
  return `otp:lock:${otpBaseKey(purpose, email)}`;
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueOtp(purpose: OtpPurpose, email: string, otp: string) {
  await redisSetString(otpCodeKey(purpose, email), hashOtp(otp), OTP_EXPIRY_SECONDS);
  await redisSetString(otpCooldownKey(purpose, email), "1", OTP_RESEND_COOLDOWN_SECONDS);
  await redisDelete(otpAttemptsKey(purpose, email), otpLockKey(purpose, email));
}

export async function getOtpCooldownRemaining(purpose: OtpPurpose, email: string) {
  const cooldown = await redisGetString(otpCooldownKey(purpose, email));
  return cooldown ? OTP_RESEND_COOLDOWN_SECONDS : 0;
}

export async function verifyOtp(purpose: OtpPurpose, email: string, otp: string): Promise<VerifyResult> {
  const normalizedEmail = normalizeEmail(email);
  const lock = await redisGetString(otpLockKey(purpose, normalizedEmail));
  if (lock) {
    return { ok: false, message: "Too many failed attempts. Please wait before trying again." };
  }

  const stored = await redisGetString(otpCodeKey(purpose, normalizedEmail));
  if (!stored) {
    return { ok: false, message: "Invalid or expired OTP" };
  }

  const incoming = hashOtp(otp);
  const valid =
    stored.length === incoming.length &&
    timingSafeEqual(Buffer.from(stored), Buffer.from(incoming));

  if (!valid) {
    const attempts = await incrementOtpAttempts(purpose, normalizedEmail);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await redisSetString(otpLockKey(purpose, normalizedEmail), "1", OTP_LOCK_SECONDS);
      await redisDelete(otpCodeKey(purpose, normalizedEmail), otpAttemptsKey(purpose, normalizedEmail));
      return { ok: false, message: "Too many failed attempts. Please request a new OTP." };
    }

    return { ok: false, message: "Invalid or expired OTP" };
  }

  await clearOtpState(purpose, normalizedEmail);
  return { ok: true };
}

export async function clearOtpState(purpose: OtpPurpose, email: string) {
  const normalizedEmail = normalizeEmail(email);
  await redisDelete(
    otpCodeKey(purpose, normalizedEmail),
    otpAttemptsKey(purpose, normalizedEmail),
    otpCooldownKey(purpose, normalizedEmail),
    otpLockKey(purpose, normalizedEmail),
  );
}

async function incrementOtpAttempts(purpose: OtpPurpose, email: string) {
  const key = otpAttemptsKey(purpose, email);
  const current = Number((await redisGetString(key)) || "0") + 1;
  await redisSetString(key, String(current), OTP_EXPIRY_SECONDS);
  return current;
}

export const otpConfig = {
  expirySeconds: OTP_EXPIRY_SECONDS,
  resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  maxAttempts: OTP_MAX_ATTEMPTS,
  lockSeconds: OTP_LOCK_SECONDS,
};
