import { formatPhoneForDisplay } from './phoneUtils';

/**
 * Extract all unique placeholders from template text
 * Supports {placeholder} and {{placeholder}} formats
 * @param {string} template - The message template
 * @returns {Array} - Array of unique placeholder names
 */
export function extractPlaceholders(template) {
  if (!template) return [];
  
  // Match {key} or {{key}}
  const regex = /{{?([\w\s]+)}}?/g;
  const matches = [...template.matchAll(regex)];
  
  // Extract key names and remove duplicates
  const keys = matches.map(match => match[1].trim());
  return [...new Set(keys)];
}

/**
 * Validate that all placeholders in template exist in contacts
 * @param {string} template - The message template
 * @param {Array} availableFields - Array of available field names
 * @returns {Object} - { valid: boolean, missingFields: [] }
 */
export function validatePlaceholders(template, availableFields) {
  const placeholders = extractPlaceholders(template);
  const missingFields = placeholders.filter(p => !availableFields.includes(p));
  
  return {
    valid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Get all available fields from a contact list
 * @param {Array} contacts - List of contacts
 * @returns {Array} - Array of field keys
 */
export function getAvailableFields(contacts) {
  if (!contacts || contacts.length === 0) return [];
  return Object.keys(contacts[0]);
}

/**
 * Render a single message by replacing placeholders
 * @param {string} template - Message template
 * @param {Object} contact - Contact object
 * @returns {string} - Personalized message
 */
export function renderMessage(template, contact) {
  if (!template || !contact) return '';

  return template.replace(/{{?([\w\s]+)}}?/g, (match, key) => {
    const trimmedKey = key.trim();
    // Use the contact value or keep the placeholder if missing (to show error visually)
    return contact[trimmedKey] !== undefined ? contact[trimmedKey] : match;
  });
}

/**
 * Generate previews for a list of contacts
 * @param {string} template - Message template
 * @param {Array} contacts - List of contacts
 * @param {number} count - Number of previews to generate
 * @returns {Array} - Array of preview objects
 */
export function generatePreview(template, contacts, count = 5) {
  if (!template || !contacts) return [];

  return contacts.slice(0, count).map(contact => ({
    phone: contact.phone,
    contact: contact,
    message: renderMessage(template, contact)
  }));
}

/**
 * Count characters in template (approximation)
 * @param {string} template - Message template
 * @returns {number} - Character count
 */
export function countTemplateCharacters(template) {
  return template ? template.length : 0;
}