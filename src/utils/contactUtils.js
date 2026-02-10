import { normalizePhone, validatePhone } from './phoneUtils';

/**
 * Merge phone list with CSV/Excel data using header mapping
 * @param {Array} phones - Array of phone numbers (strings)
 * @param {Array} csvData - Array of data objects from CSV/Excel
 * @param {Object} headerMapping - Mapping of CSV headers to field types
 * @returns {Array} - Array of merged contact objects
 */
export function mergeContactData(phones, csvData, headerMapping = {}) {
  const contacts = [];

  // Case 1: Simple text paste (phones only)
  if (phones && phones.length > 0 && (!csvData || csvData.length === 0)) {
    phones.forEach(phone => {
      const normalized = normalizePhone(phone);
      if (normalized) {
        contacts.push({ 
          phone: normalized,
          name: '',
          first_name: '',
          last_name: '',
          email: '',
          location: ''
        });
      }
    });
    return contacts;
  }

  // Case 2: CSV/Excel data with mapping
  if (csvData && csvData.length > 0) {
    csvData.forEach(row => {
      const contact = {};
      let hasValidPhone = false;

      // Map standard fields based on user selection
      // headerMapping format: { phone: "Original Header", name: "Original Header 2" }
      Object.keys(headerMapping).forEach(targetField => {
        const originalHeader = headerMapping[targetField];
        if (originalHeader && row[originalHeader] !== undefined) {
          contact[targetField] = row[originalHeader];
        }
      });

      // Also include any other fields from the row that weren't explicitly mapped
      // This allows using them as custom variables like {CustomColumn}
      Object.keys(row).forEach(key => {
        // If this key isn't one of our mapped values, add it as is (stripping spaces for template safety)
        const isMapped = Object.values(headerMapping).includes(key);
        if (!isMapped) {
          const safeKey = key.replace(/\s+/g, '_').toLowerCase();
          contact[safeKey] = row[key];
        }
      });

      // Validate and normalize phone
      if (contact.phone) {
        const normalized = normalizePhone(String(contact.phone));
        if (normalized && validatePhone(normalized)) {
          contact.phone = normalized;
          hasValidPhone = true;
        }
      }

      if (hasValidPhone) {
        contacts.push(contact);
      }
    });
  }

  return contacts;
}

/**
 * Remove duplicate contacts based on phone number
 * Keeps first occurrence
 * @param {Array} contacts - Array of contact objects
 * @returns {Array} - Deduplicated contacts
 */
export function deduplicateContacts(contacts) {
  if (!contacts || contacts.length === 0) return [];

  const seen = new Set();
  const deduplicated = [];

  contacts.forEach(contact => {
    if (contact.phone && !seen.has(contact.phone)) {
      seen.add(contact.phone);
      deduplicated.push(contact);
    }
  });

  return deduplicated;
}

/**
 * Validate all contacts have required fields
 * @param {Array} contacts - Array of contact objects
 * @returns {Object} - {valid: [], invalid: []}
 */
export function validateContacts(contacts) {
  if (!contacts || contacts.length === 0) {
    return { valid: [], invalid: [] };
  }

  const valid = [];
  const invalid = [];

  contacts.forEach(contact => {
    if (contact.phone && validatePhone(contact.phone)) {
      valid.push(contact);
    } else {
      invalid.push({
        ...contact,
        error: 'Invalid or missing phone number'
      });
    }
  });

  return { valid, invalid };
}

/**
 * Format contacts for sending
 * Ensures all contacts have required fields with fallbacks
 * @param {Array} contacts - Array of contact objects
 * @returns {Array} - Formatted contacts
 */
export function formatContactsForSending(contacts) {
  if (!contacts || contacts.length === 0) return [];

  return contacts.map(contact => {
    const formatted = { ...contact }; // Keep all original properties

    // Ensure standard fields exist
    formatted.name = contact.name || contact.first_name || '';
    formatted.first_name = contact.first_name || (contact.name ? contact.name.split(' ')[0] : '');
    formatted.last_name = contact.last_name || (contact.name ? contact.name.split(' ').slice(1).join(' ') : '');
    formatted.email = contact.email || '';
    formatted.location = contact.location || '';
    
    // Provide a fallback for commonly used name placeholders
    if (!formatted.first_name && !formatted.name) {
      formatted.first_name = 'there';
    }

    return formatted;
  });
}

/**
 * Save contacts to localStorage
 * @param {Array} contacts - Array of contacts to save
 * @param {string} name - Name for this contact list
 */
export function saveContactsToStorage(contacts, name = 'Default') {
  try {
    const saved = JSON.parse(localStorage.getItem('bulkWhatsApp_contacts') || '[]');
    saved.push({
      name,
      contacts,
      timestamp: new Date().toISOString(),
      count: contacts.length
    });
    localStorage.setItem('bulkWhatsApp_contacts', JSON.stringify(saved));
    return true;
  } catch (error) {
    console.error('Failed to save contacts:', error);
    return false;
  }
}

/**
 * Load saved contact lists from localStorage
 * @returns {Array} - Array of saved contact lists
 */
export function loadContactsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('bulkWhatsApp_contacts') || '[]');
  } catch (error) {
    console.error('Failed to load contacts:', error);
    return [];
  }
}

/**
 * Delete a saved contact list
 * @param {number} index - Index of contact list to delete
 */
export function deleteContactList(index) {
  try {
    const saved = JSON.parse(localStorage.getItem('bulkWhatsApp_contacts') || '[]');
    saved.splice(index, 1);
    localStorage.setItem('bulkWhatsApp_contacts', JSON.stringify(saved));
    return true;
  } catch (error) {
    console.error('Failed to delete contact list:', error);
    return false;
  }
}