/**
 * Kenyan phone number utilities
 * Valid inputs: 07xxxxxxxx | 01xxxxxxxx | +2547xxxxxxxx | +2541xxxxxxxx
 */

const KENYAN_PHONE_RE = /^(\+254|0)(7|1)[0-9]{8}$/;

export function validateKenyanPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-().]/g, "");
  return KENYAN_PHONE_RE.test(cleaned);
}

/**
 * Normalise to Daraja format: 2547xxxxxxxx
 * Returns null if invalid.
 */
export function formatToMpesa(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (!KENYAN_PHONE_RE.test(cleaned)) return null;

  if (cleaned.startsWith("+254")) return cleaned.slice(1);
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);

  return null;
}

/**
 * Display format: 0712 345 678
 */
export function formatPhoneDisplay(phone: string): string {
  const mpesa = formatToMpesa(phone);
  if (!mpesa) return phone;
  const local = "0" + mpesa.slice(3);
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}