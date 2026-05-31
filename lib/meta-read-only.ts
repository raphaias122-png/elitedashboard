import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const apiVersion = process.env.META_GRAPH_API_VERSION || "v23.0";
const allowedScopes = new Set(["ads_read", "read_insights"]);
const forbiddenScopes = new Set(["ads_management", "business_management"]);

function encryptionKey() {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!raw) throw new Error("Configure INTEGRATION_ENCRYPTION_KEY.");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("INTEGRATION_ENCRYPTION_KEY deve conter 32 bytes em base64.");
  return key;
}
export function encryptAccessToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(".");
}
export function decryptAccessToken(payload: string) {
  const [iv, tag, encrypted] = payload.split(".");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]).toString("utf8");
}
export function maskAccessToken(token: string) { return token ? `••••••••••••${token.slice(-4)}` : ""; }
async function graphGet(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`https://graph.facebook.com/${apiVersion}/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("access_token", token);
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const body = await response.json();
  if (!response.ok) {
    const code = body?.error?.code;
    if (code === 190) throw new Error("Access Token expirado ou inválido.");
    if (code === 10 || code === 200) throw new Error("Permissão insuficiente. Use somente ads_read e read_insights.");
    throw new Error(body?.error?.message || "Falha ao consultar Meta Graph API.");
  }
  return body;
}
export async function validateReadOnlyToken(token: string) {
  const debug = await graphGet("me/permissions", token);
  const grantedPermissions =
    debug.data
      ?.filter((x: { status?: unknown }) => x.status === "granted")
      .map((x: { permission?: unknown }) => x.permission)
      .filter((permission: unknown): permission is string => typeof permission === "string") || [];
  const granted = new Set<string>(grantedPermissions);
  const forbidden = [...forbiddenScopes].filter(scope => granted.has(scope));
  if (forbidden.length) throw new Error(`Remova permissões proibidas: ${forbidden.join(", ")}.`);
  const missing = [...allowedScopes].filter(scope => !granted.has(scope));
  if (missing.length) throw new Error(`Permissões insuficientes: adicione ${missing.join(", ")}.`);
  return { granted: [...granted].filter(scope => allowedScopes.has(scope)) };
}
export async function fetchMetaInsights(token: string, adAccountId: string, since: string, until: string) {
  await validateReadOnlyToken(token);
  const account = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  return graphGet(`${account}/insights`, token, {
    level: "ad", time_increment: "1", time_range: JSON.stringify({ since, until }),
    fields: "date_start,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,impressions,clicks,ctr,cpc,cpm,spend,reach,frequency,actions",
    limit: "500",
  });
}
