/**
 * Phone formatting utility for Indian mobile numbers.
 * Normalizes input by extracting the 10-digit mobile number and formats it on display as "+91 XXXXX XXXXX".
 * Prevents double "+91" prefix bugs.
 */

export function cleanIndianPhoneDigits(phone?: string | null): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  // If number starts with country code 91 and has 12 digits, strip country code
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  // If number has 11 digits starting with 0, strip leading 0
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return cleaned.slice(1);
  }
  // Return last 10 digits if longer
  if (cleaned.length > 10) {
    return cleaned.slice(-10);
  }
  return cleaned;
}

export function formatIndianPhone(phone?: string | null): string {
  const digits = cleanIndianPhoneDigits(phone);
  if (!digits) return "";
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  // Fallback if not 10 digits
  return phone ? (phone.startsWith("+91") ? phone : `+91 ${phone.replace(/^\+?91\s*/, "")}`) : "";
}
