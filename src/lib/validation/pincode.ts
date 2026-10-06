/**
 * Indian Postal PIN Code validation and state prefix mapping.
 * Ensures the 6-digit postal code corresponds to the user's selected state/UT.
 */

// Mapping of 2-digit PIN prefixes to valid state/UT names (normalized lowercase)
const PIN_PREFIX_STATE_MAP: Record<string, string[]> = {
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
  "39": ["gujarat", "dadra and nagar haveli and daman and diu", "daman and diu"],
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
  "60": ["tamil nadu", "puducherry"],
  "61": ["tamil nadu", "puducherry"],
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
  "74": ["west bengal", "andaman and nicobar islands", "andaman and nicobar"],
  "75": ["odisha", "orissa"],
  "76": ["odisha", "orissa"],
  "77": ["odisha", "orissa"],
  "78": ["assam"],
  "79": ["arunachal pradesh", "manipur", "meghalaya", "mizoram", "nagaland", "tripura"],
  "80": ["bihar"],
  "81": ["bihar", "jharkhand"],
  "82": ["bihar", "jharkhand"],
  "83": ["jharkhand"],
  "84": ["bihar"],
  "85": ["bihar"],
};

export interface PincodeValidationResult {
  isValid: boolean;
  error?: string;
  expectedStates?: string[];
}

/**
 * Validates a 6-digit Indian PIN code against the selected state name.
 */
export function validatePincodeState(pincode: string, state: string): PincodeValidationResult {
  const cleanPin = (pincode || "").trim().replace(/\D/g, "");
  if (cleanPin.length !== 6) {
    return {
      isValid: false,
      error: "Postal code must be exactly 6 digits.",
    };
  }

  if (cleanPin.startsWith("0")) {
    return {
      isValid: false,
      error: "Indian postal codes cannot begin with 0.",
    };
  }

  const prefix = cleanPin.substring(0, 2);
  const allowedStates = PIN_PREFIX_STATE_MAP[prefix];

  if (!allowedStates) {
    // Unknown prefix
    return {
      isValid: false,
      error: `Invalid PIN code prefix "${prefix}". Please verify your postal code.`,
    };
  }

  if (!state || !state.trim()) {
    return {
      isValid: true,
      expectedStates: allowedStates,
    };
  }

  const normalizedState = state.trim().toLowerCase();
  const matches = allowedStates.some(
    (s) => s === normalizedState || normalizedState.includes(s) || s.includes(normalizedState)
  );

  if (!matches) {
    const formattedExpected = allowedStates
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" / ");
    return {
      isValid: false,
      error: `PIN code ${cleanPin} belongs to ${formattedExpected}, but you selected ${state}. Please verify your postal code and state.`,
      expectedStates: allowedStates,
    };
  }

  return {
    isValid: true,
    expectedStates: allowedStates,
  };
}

function formatStateName(s: string): string {
  if (s === "nct of delhi") return "Delhi";
  if (s === "jammu & kashmir") return "Jammu & Kashmir";
  if (s === "andaman and nicobar islands") return "Andaman and Nicobar Islands";
  if (s === "dadra and nagar haveli and daman and diu") return "Dadra and Nagar Haveli and Daman and Diu";
  return s
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Returns expected state(s) for a given 6-digit PIN code or prefix with standard Title Case.
 */
export function getStatesForPincode(pincode: string): string[] {
  const cleanPin = (pincode || "").trim().replace(/\D/g, "");
  if (cleanPin.length < 2) return [];
  const prefix = cleanPin.substring(0, 2);
  const rawStates = PIN_PREFIX_STATE_MAP[prefix] || [];
  return rawStates.map(formatStateName);
}
