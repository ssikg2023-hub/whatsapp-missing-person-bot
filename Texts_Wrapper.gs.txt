/***************************************************************
 * Texts_Wrapper.gs — MAIN WRAPPER + LANGUAGE ENGINE
 ***************************************************************/

// Create Texts object if not already created
if (typeof Texts === "undefined") {
  var Texts = {};
}


/***********************************************************
 * MAIN SEND WRAPPER
 ***********************************************************/
Texts.send = function (to, body) {
  return sendWhatsAppMessage(to, body);
};


/***********************************************************
 * INVALID OPTION (fallback only — actual version in Texts_Validation)
 ***********************************************************/
Texts.sendInvalidOption = function(session) {

  const lang = session?.Preferred_Language || "EN";

  const map = {
    "EN": "❌ Invalid option. Please choose a valid number from the menu.",
    "UR": "❌ غلط آپشن۔ براہ کرم درست نمبر منتخب کریں۔",
    "RUR": "❌ Ghalat option. Barah-e-karam sahi number choose karein.",
    "HI": "❌ गलत विकल्प। कृपया मेनू से सही नंबर चुनें।",
    "BN": "❌ ভুল অপশন। অনুগ্রহ করে মেনু থেকে সঠিক নম্বর নির্বাচন করুন।",
    "AR": "❌ خيار غير صالح. يرجى اختيار رقم صحيح من القائمة."
  };

  return map[lang] || map["EN"];
};


/***********************************************************
 * REGION → AVAILABLE LANGUAGES
 ***********************************************************/
Texts.getAvailableLanguages = function(region) {
  switch (region) {

    case "PK": return ["EN", "UR", "RUR"];
    case "IN": return ["EN", "HI", "UR", "RUR"];
    case "BD": return ["EN", "BN", "UR", "RUR"];
    case "ME": return ["EN", "AR", "UR", "RUR"];

    default:   return ["EN", "UR", "RUR"];
  }
};


/***********************************************************
 * MAP USER CHOICE (1/2/3/4) → LANGUAGE CODE
 ***********************************************************/
Texts.mapLanguageChoice = function(region, choice) {

  const langs = Texts.getAvailableLanguages(region);

  const index = Number(choice) - 1;

  if (index < 0 || index >= langs.length) return null;

  return langs[index];
};


/***********************************************************
 * SEND LANGUAGE MENU  (delegates to Texts_LangMenus)
 ***********************************************************/
Texts.sendLanguageMenu = function(session) {
  return Texts_LangMenus.getMenu(session.Region_Group);
};


/***********************************************************
 * SEND USER TYPE MENU  (delegates to Texts_UserTypes)
 ***********************************************************/
Texts.sendUserTypeMenu = function(session) {
  return Texts_UserTypes.sendMenu(session);
};
