import * as XLSX from 'xlsx';

/**
 * Parse CSV text into array of objects
 * Handles quoted values, commas and newlines inside quotes
 * Returns data with ORIGINAL headers (not normalized)
 * @param {string} csvText - CSV text to parse
 * @returns {Object} - {data: [], headers: []}
 */
export function parseCSV(csvText) {
  if (!csvText) return { data: [], headers: [] };

  try {
    const lines = [];
    let currentLine = '';
    let insideQuotes = false;

    // Split by characters and handle quotes properly
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentLine += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === '\n' && !insideQuotes) {
        // End of line
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
      } else {
        currentLine += char;
      }
    }

    // Add last line if exists
    if (currentLine.trim()) {
      lines.push(currentLine);
    }

    if (lines.length === 0) {
      return { data: [], headers: [] };
    }

    // Parse each line into fields
    const rows = lines.map(line => parseCSVLine(line));

    // First row is headers (Keep original casing/spacing)
    const headers = rows[0].map(h => h.trim());

    // Remaining rows are data
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        // Keep original header as key
        obj[header] = row[index] || '';
      });
      return obj;
    });

    return { data, headers };
  } catch (error) {
    console.error('CSV parsing error:', error);
    return { data: [], headers: [], error: error.message };
  }
}

/**
 * Parse a single CSV line into array of fields
 * @param {string} line - CSV line
 * @returns {Array} - Array of field values
 */
function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }

  fields.push(currentField.trim());
  return fields;
}

/**
 * Parse Excel file (.xlsx, .xls) into array of objects
 * Returns data with ORIGINAL headers
 * @param {File} file - Excel file
 * @returns {Promise<Object>} - {data: [], headers: []}
 */
export async function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON (first row as headers)
        // defval: '' ensures empty cells are empty strings, not undefined
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          resolve({ data: [], headers: [] });
          return;
        }

        // Extract headers from the first row keys
        const headers = Object.keys(jsonData[0]);

        resolve({ data: jsonData, headers });
      } catch (error) {
        console.error('Excel parsing error:', error);
        reject({ data: [], headers: [], error: error.message });
      }
    };

    reader.onerror = () => {
      reject({ data: [], headers: [], error: 'Failed to read file' });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Detect common header names and suggest field mappings
 * Compares normalized versions but returns ORIGINAL headers from file
 * @param {Array} headers - Array of header names from file
 * @returns {Object} - Mapping of detected fields {phone: 'Original Header', ...}
 */
export function detectHeaders(headers) {
  const mapping = {};

  const phonePatterns = ['phone', 'number', 'mobile', 'contact', 'tel', 'telephone', 'cell', 'whatsapp'];
  const namePatterns = ['name', 'full_name', 'fullname', 'customer', 'client'];
  const firstNamePatterns = ['first_name', 'firstname', 'fname', 'given_name', 'first'];
  const lastNamePatterns = ['last_name', 'lastname', 'lname', 'surname', 'family_name', 'last'];
  const emailPatterns = ['email', 'e-mail', 'mail', 'email_address'];
  const locationPatterns = ['location', 'address', 'city', 'town', 'region', 'area', 'country'];

  headers.forEach(header => {
    // Normalize strictly for comparison
    const lower = String(header).toLowerCase().replace(/[^a-z0-9]/g, '');

    // Helper to check patterns
    const matches = (patterns) => patterns.some(p => lower.includes(p.replace(/[^a-z0-9]/g, '')));

    if (!mapping.phone && matches(phonePatterns)) {
      mapping.phone = header;
    }
    if (!mapping.name && matches(namePatterns) && !matches(['first', 'last', 'sur'])) {
      mapping.name = header;
    }
    if (!mapping.first_name && matches(firstNamePatterns)) {
      mapping.first_name = header;
    }
    if (!mapping.last_name && matches(lastNamePatterns)) {
      mapping.last_name = header;
    }
    if (!mapping.email && matches(emailPatterns)) {
      mapping.email = header;
    }
    if (!mapping.location && matches(locationPatterns)) {
      mapping.location = header;
    }
  });

  return mapping;
}

/**
 * Normalize headers to lowercase and remove extra spaces
 * Useful for internal standardization, not for UI display
 * @param {Array} headers - Array of header names
 * @returns {Array} - Normalized headers
 */
export function normalizeHeaders(headers) {
  return headers.map(header => 
    String(header).toLowerCase().trim().replace(/\s+/g, '_')
  );
}