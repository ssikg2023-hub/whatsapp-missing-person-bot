/***************************************************************
 * Texts_Wrapper.gs — GLOBAL TEXTS REGISTRY & HELPERS
 * Source copy: “WhatsApp Chatbot Flow – Region wise.txt”
 ***************************************************************/

// Ensure the global Texts namespace exists
if (typeof Texts === "undefined") {
  var Texts = {};
}

/***************************************************************
 * REGISTER MODULES (each retains its own exported functions)
 ***************************************************************/
(function registerTextModules() {
  const modules = {
    FlowA: Texts_A,
    FlowB: Texts_B,
    FlowC: Texts_C,
    Eligibility: Texts_Eligibility,
    ExistingCases: Texts_ExistingCases,
    CaseEntryCheck: Texts_CaseEntryCheck,
    CaseUpdates: Texts_CaseUpdates,
    Validation: Texts_Validation,
    Closing: Texts_Closing,
    LangMenus: Texts_LangMenus,
    UserTypes: Texts_UserTypes
  };

  Object.keys(modules).forEach(function(key) {
    Texts[key] = modules[key];
  });

  Texts.Closing = Texts_Closing;
})();

/***************************************************************
 * OUTBOUND SEND WRAPPER
 ***************************************************************/
Texts.send = function(to, body) {
  if (!body) return;
  return sendWhatsAppMessage(to, body);
};

/***************************************************************
 * INVALID OPTION (delegates to Validation copy)
 ***************************************************************/
Texts.sendInvalidOption = function(session) {
  return Texts_Validation.sendInvalidOption(session);
};

Texts.sendInvalidCaseID = function(session) {
  return Texts_Validation.sendInvalidCaseID(session);
};

Texts.sendEligibilityRejected = function(session) {
  return Texts_Validation.sendEligibilityRejected(session);
};

Texts.closingAfterRejection = function(session) {
  return Texts_Validation.closingAfterRejection(session);
};

/***************************************************************
 * LANGUAGE MENU HELPERS (delegates to Texts_LangMenus)
 ***************************************************************/
Texts.getAvailableLanguages = function(region) {
  return Texts_LangMenus.getAvailableLanguages(region);
};

Texts.mapLanguageChoice = function(region, choice) {
  return Texts_LangMenus.mapLanguageChoice(region, choice);
};

Texts.sendLanguageMenu = function(session) {
  return Texts_LangMenus.getMenu(session.Region_Group);
};

/***************************************************************
 * USER TYPE MENU (delegates to Texts_UserTypes)
 ***************************************************************/
Texts.sendUserTypeMenu = function(session) {
  return Texts_UserTypes.sendMenu(session);
};

/***************************************************************
 * LANGUAGE FALLBACK UTILITY
 ***************************************************************/
Texts.resolveLanguage = function(session, allowedLanguages) {
  const preferred = session && session.Preferred_Language;
  const available = Array.isArray(allowedLanguages) ? allowedLanguages.slice() : [];

  if (!available.length) {
    return preferred || "EN";
  }

  if (preferred && available.indexOf(preferred) !== -1) {
    return preferred;
  }

  if (available.indexOf("EN") !== -1) {
    return "EN";
  }

  return available[0];
};
