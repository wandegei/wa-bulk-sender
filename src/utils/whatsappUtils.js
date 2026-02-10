/**
 * WhatsApp Web automation utilities
 * Contains logic for semi-automated sending due to browser security restrictions.
 */

/**
 * Open WhatsApp Web with pre-filled message
 * @param {string} phoneNumber - Phone number (with country code)
 * @param {string} message - Message to send
 * @returns {Window|null} - Opened window reference
 */
export function openWhatsAppWeb(phoneNumber, message) {
  if (!phoneNumber) return null;

  // Remove + from phone number for wa.me URL
  const cleanPhone = phoneNumber.replace(/\+/g, '');

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);

  // Construct wa.me URL
  const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  // Open in new window
  const windowFeatures = 'width=800,height=600,menubar=no,toolbar=no,location=no';
  const newWindow = window.open(url, `whatsapp_${cleanPhone}`, windowFeatures);

  return newWindow;
}

/**
 * Attempt to detect if WhatsApp Web is ready
 * Note: Strictly limited by Cross-Origin Resource Sharing (CORS) policies.
 * We cannot read the DOM of the opened WhatsApp window.
 * @param {Window} windowRef - Reference to WhatsApp window
 * @returns {boolean} - True if window is open
 */
export function detectWhatsAppWebReady(windowRef) {
  if (!windowRef || windowRef.closed) return false;
  return true;
}

/**
 * Attempt to inject auto-send script
 * Note: This function serves as a placeholder to document security limitations.
 * Modern browsers prevent injecting scripts into cross-origin windows (like web.whatsapp.com).
 * @returns {Promise<boolean>} - Always resolves false
 */
export async function injectAutoSendScript(windowRef) {
  // We cannot inject scripts into cross-origin windows due to browser security (SOP).
  // Automation must rely on the user manually clicking 'Send' or using a browser extension.
  // This app uses the "Semi-Automated" approach.
  console.log('Auto-send script injection not supported in standard web environment');
  return false;
}

/**
 * Wait for message input to be ready
 * @param {Window} windowRef - Reference to WhatsApp window
 * @returns {Promise<boolean>}
 */
export async function waitForMessageReady(windowRef) {
  // Simulated wait since we can't check DOM
  // Assuming 2-3 seconds for WhatsApp to load message into input
  await delay(3000);
  return !!(windowRef && !windowRef.closed);
}

/**
 * Trigger auto-send button click
 * @param {Window} windowRef - Reference to WhatsApp window
 * @returns {Promise<boolean>} - False (requires manual user action)
 */
export async function triggerAutoSend(windowRef) {
  // Cannot click buttons in cross-origin window
  return false;
}

/**
 * Handle auto-send fallback
 * Implements the semi-automated mode logic
 * @returns {boolean} - True (fallback mode active)
 */
export function handleAutoSendFallback() {
  return true;
}

/**
 * Get random delay between messages (in milliseconds)
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {number} - Random delay
 */
export function getRandomDelay(min = 5000, max = 15000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get cooldown delay after sending batch of messages
 * @param {number} messageCount - Current message count
 * @param {number} cooldownInterval - Messages before cooldown (default 20)
 * @returns {number} - Cooldown delay in ms (0 if no cooldown needed)
 */
export function getCooldownDelay(messageCount, cooldownInterval = 20) {
  if (messageCount > 0 && messageCount % cooldownInterval === 0) {
    // Return random cooldown between 30-60 seconds
    return getRandomDelay(30000, 60000);
  }
  return 0;
}

/**
 * Estimate sending time based on contact count
 * @param {number} contactCount - Number of contacts
 * @returns {object} - Estimated time in various formats
 */
export function estimateSendingTime(contactCount) {
  // Average 10 seconds per message (5-15 second random delay)
  // Plus cooldown every 20 messages (30-60 seconds)
  const avgDelayPerMessage = 10000;
  const cooldownCount = Math.floor(contactCount / 20);
  const avgCooldown = 45000;

  const totalMs = (contactCount * avgDelayPerMessage) + (cooldownCount * avgCooldown);
  const totalSeconds = Math.round(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    ms: totalMs,
    seconds: totalSeconds,
    formatted: `${minutes}m ${seconds}s`
  };
}

/**
 * Utility delay function
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after delay
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}