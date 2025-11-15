/***************************************************************
 * CONFIG.gs — Environment constants for WhatsApp Missing Person Bot
 * Populate with production credentials before deployment.
 ***************************************************************/

const ENV = {
  /**********************
   * GOOGLE SHEETS CONFIG
   **********************/
  SHEET_ID: "REPLACE_WITH_GOOGLE_SHEET_ID",

  /**********************
   * GOOGLE DRIVE CONFIG
   **********************/
  MEDIA_FOLDER_ID: "REPLACE_WITH_DRIVE_FOLDER_ID",

  /**********************
   * SESSION SETTINGS
   **********************/
  SESSION_TTL_MINUTES: 1440, // 24 hours
  ENABLE_DEBUG_LOGS: false,

  /**********************
   * WHATSAPP CLOUD API
   **********************/
  WHATSAPP_TOKEN: "REPLACE_WITH_WHATSAPP_TOKEN",
  WHATSAPP_PHONE_NUMBER_ID: "REPLACE_WITH_PHONE_NUMBER_ID",
  VERIFY_TOKEN: "REPLACE_WITH_WEBHOOK_VERIFY_TOKEN"
};

/***************************************************************
 * CONF — Universal config accessor
 ***************************************************************/
function CONF(key) {
  return ENV[key];
}
