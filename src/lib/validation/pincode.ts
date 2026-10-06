/**
 * Indian Postal PIN Code validation and state prefix mapping.
 * Supports auto-fill lookup, shared-prefix region resolution (Goa, Lakshadweep,
 * Andaman & Nicobar, Ladakh, Chandigarh, Sikkim, North-East), and non-blocking
 * address confirmation warnings.
 */

// 3-digit specific region mappings for shared postal circles (allows both specific region and parent circle)
const PIN_3DIGIT_MAP: Record<string, string[]> = {
  "403": ["goa", "maharashtra"],
  "682": ["lakshadweep", "kerala"],
  "744": ["andaman and nicobar islands", "andaman and nicobar", "andaman & nicobar", "west bengal"],
  "194": ["ladakh", "jammu & kashmir", "jammu and kashmir"],
  "160": ["chandigarh", "punjab", "haryana"],
  "737": ["sikkim", "west bengal"],
};

// 2-digit circle mappings
const PIN_2DIGIT_MAP: Record<string, string[]> = {
  "11": ["delhi", "new delhi", "nct of delhi"],
  "12": ["haryana"],
  "13": ["haryana"],
  "14": ["punjab"],
  "15": ["punjab"],
  "16": ["chandigarh", "punjab", "haryana"],
  "17": ["himachal pradesh"],
  "18": ["jammu & kashmir", "jammu and kashmir", "ladakh"],
  "19": ["jammu & kashmir", "jammu and kashmir", "ladakh"],
  "20": ["uttar pradesh"],
  "21": ["uttar pradesh"],
  "22": ["uttar pradesh"],
  "23": ["uttar pradesh"],
  "24": ["uttar pradesh", "uttarakhand"],
  "25": ["uttar pradesh"],
  "26": ["uttarakhand", "uttar pradesh"],
  "27": ["uttar pradesh"],
  "28": ["uttar pradesh"],
  "30": ["rajasthan"],
  "31": ["rajasthan"],
  "32": ["rajasthan"],
  "33": ["rajasthan"],
  "34": ["rajasthan"],
  "36": ["gujarat"],
  "37": ["gujarat"],
  "38": ["gujarat"],
  "39": ["gujarat", "dadra and nagar haveli and daman and diu", "daman and diu", "dadra and nagar haveli"],
  "40": ["maharashtra", "goa"],
  "41": ["maharashtra"],
  "42": ["maharashtra"],
  "43": ["maharashtra"],
  "44": ["maharashtra"],
  "45": ["madhya pradesh"],
  "46": ["madhya pradesh"],
  "47": ["madhya pradesh"],
  "48": ["madhya pradesh"],
  "49": ["chhattisgarh"],
  "50": ["telangana", "andhra pradesh"],
  "51": ["andhra pradesh"],
  "52": ["andhra pradesh"],
  "53": ["andhra pradesh"],
  "56": ["karnataka"],
  "57": ["karnataka"],
  "58": ["karnataka"],
  "59": ["karnataka"],
  "60": ["tamil nadu", "puducherry", "pondicherry"],
  "61": ["tamil nadu", "puducherry", "pondicherry"],
  "62": ["tamil nadu"],
  "63": ["tamil nadu"],
  "64": ["tamil nadu"],
  "67": ["kerala", "lakshadweep"],
  "68": ["kerala", "lakshadweep"],
  "69": ["kerala"],
  "70": ["west bengal"],
  "71": ["west bengal"],
  "72": ["west bengal"],
  "73": ["west bengal", "sikkim"],
  "74": ["west bengal", "andaman and nicobar islands", "andaman and nicobar", "andaman & nicobar islands"],
  "75": ["odisha", "orissa"],
  "76": ["odisha", "orissa"],
  "77": ["odisha", "orissa"],
  "78": ["assam", "meghalaya"],
  "79": ["arunachal pradesh", "manipur", "meghalaya", "mizoram", "nagaland", "tripura", "assam"],
  "80": ["bihar"],
  "81": ["bihar", "jharkhand"],
  "82": ["bihar", "jharkhand"],
  "83": ["jharkhand"],
  "84": ["bihar"],
  "85": ["bihar"],
};

export interface PincodeValidationResult {
  isValid: boolean;
  isWarning?: boolean;
  error?: string;
  expectedStates?: string[];
}

function normalizeState(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
}

function formatStateName(s: string): string {
  const norm = s.toLowerCase();
  if (norm === "nct of delhi" || norm === "new delhi") return "Delhi";
  if (norm === "jammu & kashmir" || norm === "jammu and kashmir") return "Jammu & Kashmir";
  if (norm.includes("andaman")) return "Andaman and Nicobar Islands";
  if (norm.includes("daman") || norm.includes("dadra")) return "Dadra and Nagar Haveli and Daman and Diu";
  if (norm === "orissa") return "Odisha";
  if (norm === "pondicherry") return "Puducherry";
  return s
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Returns allowed state names for a given 6-digit PIN code.
 * Checks specific 3-digit prefix first, falling back to 2-digit circle.
 */
function getAllowedStatesForPincode(cleanPin: string): string[] {
  if (cleanPin.length >= 3) {
    const prefix3 = cleanPin.substring(0, 3);
    if (PIN_3DIGIT_MAP[prefix3]) {
      return PIN_3DIGIT_MAP[prefix3];
    }
  }

  const prefix2 = cleanPin.substring(0, 2);
  return PIN_2DIGIT_MAP[prefix2] || [];
}

/**
 * Validates a 6-digit Indian PIN code against the selected state name.
 * Handles shared-prefix regions (Goa, Lakshadweep, Andaman, Ladakh, Chandigarh, Sikkim, North-East).
 */
export function validatePincodeState(pincode: string, state: string): PincodeValidationResult {
  const cleanPin = (pincode || "").trim().replace(/\D/g, "");
  if (cleanPin.length !== 6) {
    return {
      isValid: false,
      isWarning: false,
      error: "Postal code must be exactly 6 digits.",
    };
  }

  if (cleanPin.startsWith("0")) {
    return {
      isValid: false,
      isWarning: false,
      error: "Indian postal codes cannot begin with 0.",
    };
  }

  const allowedStates = getAllowedStatesForPincode(cleanPin);

  if (allowedStates.length === 0) {
    const prefix = cleanPin.substring(0, 2);
    return {
      isValid: false,
      isWarning: false,
      error: `Invalid PIN code prefix "${prefix}". Please verify your postal code.`,
    };
  }

  if (!state || !state.trim()) {
    return {
      isValid: true,
      expectedStates: Array.from(new Set(allowedStates.map(formatStateName))),
    };
  }

  const normUser = normalizeState(state);
  const matches = allowedStates.some((s) => {
    const normAllowed = normalizeState(s);
    return (
      normAllowed === normUser ||
      normAllowed.includes(normUser) ||
      normUser.includes(normAllowed)
    );
  });

  if (!matches) {
    const formattedExpected = Array.from(new Set(allowedStates.map(formatStateName))).join(" / ");
    return {
      isValid: false,
      isWarning: true,
      error: `PIN code ${cleanPin} belongs to ${formattedExpected}, but you selected ${state}. Please verify your postal code and state.`,
      expectedStates: Array.from(new Set(allowedStates.map(formatStateName))),
    };
  }

  return {
    isValid: true,
    expectedStates: Array.from(new Set(allowedStates.map(formatStateName))),
  };
}

/**
 * Returns formatted expected state(s) for a given 6-digit PIN code.
 */
export function getStatesForPincode(pincode: string): string[] {
  const cleanPin = (pincode || "").trim().replace(/\D/g, "");
  if (cleanPin.length < 2) return [];
  const allowed = getAllowedStatesForPincode(cleanPin);
  return Array.from(new Set(allowed.map(formatStateName)));
}
