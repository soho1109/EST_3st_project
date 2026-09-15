import "server-only";

const ACCESS_DURATION_SECONDS = 12 * 60 * 60;
const COOKIE_PREFIX = "summary-access-";
const textEncoder = new TextEncoder();

function getSigningSecret() {
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!secret) {
    throw new Error("SUPABASE_SECRET_KEY 환경변수가 필요합니다.");
  }

  return secret;
}

async function createHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getSigningSecret()),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"],
  );
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(payload) {
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

export function getSummaryAccessCookieName(summaryId) {
  return `${COOKIE_PREFIX}${summaryId}`;
}

export async function createSummaryAccessToken(summaryId) {
  const expiresAt = Math.floor(Date.now() / 1000) + ACCESS_DURATION_SECONDS;
  const payload = encodePayload({
    summaryId,
    expiresAt,
  });
  const key = await createHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload));

  return `${payload}.${Buffer.from(signature).toString("base64url")}`;
}

export async function verifySummaryAccessToken(token, summaryId) {
  if (typeof token !== "string") {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  try {
    const key = await createHmacKey();
    const isValidSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      Buffer.from(signature, "base64url"),
      textEncoder.encode(payload),
    );

    if (!isValidSignature) {
      return false;
    }

    const data = decodePayload(payload);
    const currentTime = Math.floor(Date.now() / 1000);

    return (
      data.summaryId === summaryId &&
      Number.isInteger(data.expiresAt) &&
      data.expiresAt > currentTime
    );
  } catch {
    return false;
  }
}

export const summaryAccessCookieOptions = {
  httpOnly: true,
  maxAge: ACCESS_DURATION_SECONDS,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
