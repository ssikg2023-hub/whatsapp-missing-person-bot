/***************************************************************
 * CONFIG.gs
 * -------------------------------------------------------------------
 * Centralized configuration for the WhatsApp Missing Person Bot.
 * This file is intentionally verbose so that every environment value
 * is easy to audit and rotate. All constants live in the ENV object
 * and are retrieved through the CONF helper to avoid direct global
 * references elsewhere in the codebase.
 ***************************************************************/

/**
 * Primary configuration object used throughout the project.
 * Keep the key names stable to preserve backward compatibility
 * with existing helper utilities (e.g., CONF, Utils, Flows).
 */
const ENV = {
  /**********************
   * GOOGLE SHEETS CONFIG
   **********************/
  /** Google Sheet that stores sessions, cases, and case updates. */
  SHEET_ID: 'REPLACE_WITH_GOOGLE_SHEET_ID',

  /**********************
   * GOOGLE DRIVE CONFIG
   **********************/
  /** Folder where all incoming WhatsApp media gets stored. */
  MEDIA_FOLDER_ID: 'REPLACE_WITH_DRIVE_FOLDER_ID',

  /**********************
   * SESSION / STATE SETTINGS
   **********************/
  /** Maximum allowed inactivity for a session before reset (minutes). */
  SESSION_TTL_MINUTES: 1440, // 24 hours
  /** Toggle verbose logging for easier debugging during QA. */
  ENABLE_DEBUG_LOGS: false,

  /**********************
   * WHATSAPP CLOUD API
   **********************/
  /** Meta verification token used by the webhook validation handshake. */
  VERIFY_TOKEN: 'REPLACE_WITH_WEBHOOK_VERIFY_TOKEN',
  /** Permanent bearer token for calling WhatsApp Cloud API. */
  WHATSAPP_TOKEN: 'REPLACE_WITH_WHATSAPP_TOKEN',
  /** Phone number ID configured in Meta Business Manager. */
  WHATSAPP_PHONE_NUMBER_ID: 'REPLACE_WITH_PHONE_NUMBER_ID',
  /** Convenience alias used by outbound message builders. */
  PHONE_ID: 'REPLACE_WITH_PHONE_NUMBER_ID',
  /** Base URL for WhatsApp Graph API requests (version pinned). */
  WHATSAPP_API_URL: 'https://graph.facebook.com/v20.0',

  /**********************
   * TIMEOUTS & RETRIES
   **********************/
  /** Default fetch timeout (ms) for Apps Script UrlFetchApp requests. */
  API_TIMEOUT_MS: 30000,
  /** Maximum attempts for transient WhatsApp or Drive errors. */
  MAX_API_RETRIES: 3,

  /**********************
   * FALLBACK / MISC CONFIG
   **********************/
  /** Language fallback whenever user preference cannot be resolved. */
  DEFAULT_LANGUAGE: 'English',
  /** Region fallback used when detection fails. */
  DEFAULT_REGION_GROUP: 'GLOBAL',
  /** Key used to namespace CacheService entries for sessions. */
  CACHE_PREFIX: 'WMPB_SESSION_',
  /** ISO timestamp format reference for logging. */
  ISO_TIMEZONE: 'Etc/UTC'
};

/***************************************************************
 * CONF — Universal config accessor
 * -------------------------------------------------------------------
 * Using this helper isolates callers from the ENV object directly,
 * enabling future enhancements (e.g., secrets manager, encryption)
 * without touching every file. Returns undefined when a key is
 * missing so callers can implement their own fallbacks.
 ***************************************************************/
function CONF(key) {
  return ENV[key];
}
