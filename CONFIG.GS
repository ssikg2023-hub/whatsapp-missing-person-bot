/***************************************************************
 * CONFIG.gs
 * -------------------------------------------------------------------
 * Centralized configuration for the WhatsApp Missing Person Bot.
 * Every constant is defined once so it can be audited, rotated, and
 * consumed consistently by Code.gs, Utils.gs, Flows.gs, and Sheets.
 * This file intentionally contains no executable logic beyond the
 * CONF accessor at the bottom.
 ***************************************************************/

/**
 * Primary configuration object used throughout the project.
 * Keep key names stable to preserve compatibility with helpers.
 */
const ENV = {
  /**********************
   * GOOGLE SHEETS CONFIG
   **********************/
  /** ID of the master Google Sheet holding sessions, cases, updates. */
  SHEET_ID: 'REPLACE_WITH_GOOGLE_SHEET_ID',

  /**********************
   * GOOGLE DRIVE CONFIG
   **********************/
  /** Folder where incoming WhatsApp media is stored for case records. */
  MEDIA_FOLDER_ID: 'REPLACE_WITH_DRIVE_FOLDER_ID',

  /**********************
   * SESSION / STATE SETTINGS
   **********************/
  /** Minutes of inactivity after which a conversation state resets. */
  SESSION_TTL_MINUTES: 1440, // 24 hours
  /** Enables verbose logging in Apps Script executions for QA only. */
  ENABLE_DEBUG_LOGS: false,

  /**********************
   * WHATSAPP CLOUD API
   **********************/
  /** Webhook verification token required by the Meta validation call. */
  VERIFY_TOKEN: 'REPLACE_WITH_WEBHOOK_VERIFY_TOKEN',
  /** Permanent bearer token for outbound WhatsApp API calls. */
  WHATSAPP_TOKEN: 'REPLACE_WITH_WHATSAPP_TOKEN',
  /** Phone number ID configured in Meta Business Manager. */
  WHATSAPP_PHONE_NUMBER_ID: 'REPLACE_WITH_PHONE_NUMBER_ID',
  /** Alias used throughout Code.gs when constructing outbound payloads. */
  PHONE_ID: 'REPLACE_WITH_PHONE_NUMBER_ID',
  /** Base URL (version pinned) for all WhatsApp Graph API requests. */
  WHATSAPP_API_URL: 'https://graph.facebook.com/v20.0',

  /**********************
   * TIMEOUTS & RETRIES
   **********************/
  /** Default UrlFetch timeout in milliseconds for every network call. */
  API_TIMEOUT_MS: 30000,
  /** Maximum retries for transient WhatsApp / Drive / Sheets failures. */
  MAX_API_RETRIES: 3,

  /**********************
   * FALLBACK / MISC CONFIG
   **********************/
  /** Region fallback per "Full n Final Flow Updated" when detection fails. */
  DEFAULT_REGION_GROUP: 'OTHER',
  /** Canonical timezone used when formatting ISO timestamps in logs. */
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
