/*******************************************************
 * CONFIG.gs — CENTRAL ENVIRONMENT CONFIG (FINAL)
 * Credentials + Constants only — NO FLOW LOGIC.
 *******************************************************/

const ENV = {

  /**********************
   * WHATSAPP API CONFIG
   **********************/
  WHATSAPP_TOKEN: "YOUR_WHATSAPP_TOKEN_HERE",
  WHATSAPP_PHONE_NUMBER_ID: "890108940845609",
  VERIFY_TOKEN: "YOUR_VERIFY_TOKEN_HERE",

  // Recommended fixed API version
  WHATSAPP_API_VERSION: "v20.0",
  WHATSAPP_API_BASE_URL: "https://graph.facebook.com/",


  /**********************
   * GOOGLE DRIVE CONFIG
   **********************/
  MEDIA_FOLDER_ID: "YOUR_MEDIA_FOLDER_ID_HERE",


  /**********************
   * GOOGLE SHEETS CONFIG
   **********************/
  SHEET_ID: "YOUR_MAIN_SHEET_ID_HERE",


  /**********************
   * SYSTEM SETTINGS
   **********************/
  MAX_MEDIA_SIZE_MB: 25,      
  ENABLE_DEBUG_LOGS: true     
};


/*******************************************************
 * CONF — UNIVERSAL CONFIG ACCESSOR
 *******************************************************/
function CONF(key) {
  return ENV[key];
}
