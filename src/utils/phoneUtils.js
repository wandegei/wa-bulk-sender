/**
 * Phone number normalization and validation utilities
 * Supports multiple country codes
 */

const COUNTRY_CODES = ['+254', '+256', '+255', '+233', '+234', '+27', '+1', '+44'];

/**
 * Normalize phone number by removing non-digits and adding country code
 * @param {string} phone - Phone number to normalize
 * @param {string} defaultCountryCode - Default country code to use if missing
 * @returns {string|null} - Normalized phone number or null if invalid
 */
export function normalizePhone(phone, defaultCountryCode = '+256') {
  if (!phone) return null;

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If it starts with +, keep it
  if (cleaned.startsWith('+')) {
    // Validate it's a known country code
    const hasValidCode = COUNTRY_CODES.some(code => cleaned.startsWith(code));
    if (!hasValidCode) return null;
  } else {
    // If it starts with 0, remove it (common in local formats)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // Add default country code
    cleaned = defaultCountryCode + cleaned;
  }

  // Extract just the digits after the +
  const digitsOnly = cleaned.replace(/\+/g, '');

  // Validate length (7-15 digits is standard international range)
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return null;
  }

  return cleaned;
}

/**
 * Validate if a phone number is in valid format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export function validatePhone(phone) {
  if (!phone) return false;

  // Check if it starts with + and a country code
  const startsWithValidCode = COUNTRY_CODES.some(code => phone.startsWith(code));
  if (!startsWithValidCode) return false;

  // Extract digits only
  const digitsOnly = phone.replace(/\+/g, '');

  // Check if it contains only digits after +
  if (!/^\d+$/.test(digitsOnly)) return false;

  // Check length
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

/**
 * Format phone number for display (e.g., +256 712 345 678)
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export function formatPhoneForDisplay(phone) {
  if (!phone) return '';

  // If not valid, return as is
  if (!validatePhone(phone)) return phone;

  // Extract country code and number
  const countryCode = getCountryCodeFromPhone(phone);
  const number = phone.replace(countryCode, '');

  // Format number in groups of 3-4 digits
  const formatted = number.match(/.{1,3}/g)?.join(' ') || number;

  return `${countryCode} ${formatted}`;
}

/**
 * Extract country code from phone number
 * @param {string} phone - Phone number
 * @returns {string} - Country code (e.g., '+256')
 */
export function getCountryCodeFromPhone(phone) {
  if (!phone) return '';

  for (const code of COUNTRY_CODES) {
    if (phone.startsWith(code)) {
      return code;
    }
  }

  return '';
}

/**
 * Extract phone numbers from multi-line text
 * @param {string} text - Text containing phone numbers (one per line)
 * @param {string} defaultCountryCode - Default country code
 * @returns {Array} - Array of normalized phone numbers
 */
export function extractPhonesFromText(text, defaultCountryCode = '+256') {
  if (!text) return [];

  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const phones = [];

  for (const line of lines) {
    const normalized = normalizePhone(line, defaultCountryCode);
    if (normalized) {
      phones.push(normalized);
    }
  }

  return phones;
}