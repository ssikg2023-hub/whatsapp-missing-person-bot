/***************************************************************
 * Texts_Wrapper.gs — Global registry + helper shims
 * Source of truth: "Full n Final Flow Updated.txt"
 * -------------------------------------------------------------
 * This file does not create any new copy. It simply exposes each
 * language-specific catalog (Flow A/B/C, eligibility, etc.) under
 * the shared `Texts` namespace so the routing layer can pull the
 * exact verbatim strings defined in the specification.
 ***************************************************************/

/**
 * Ensure the global `Texts` namespace exists before wiring up the
 * downstream catalog modules generated elsewhere in the project.
 */
if (typeof Texts === 'undefined') {
  var Texts = {};
}

(function bootstrapTextRegistry() {
  /*************************************************************
   * MODULE REGISTRY
   * -----------------------------------------------------------
   * Each entry references another file that already contains the
   * verbatim multilingual copy for that portion of the flow.
   *************************************************************/
  var modules = {
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

  /*************************************************************
   * CORE SEND WRAPPER
   * -----------------------------------------------------------
   * Keeps outbound WhatsApp delivery logic centralized so every
   * flow just calls `Texts.send(...)` after picking the copy.
   *************************************************************/
  Texts.send = function(to, body) {
    if (!body) {
      return;
    }
    return sendWhatsAppMessage(to, body);
  };

  /*************************************************************
   * VALIDATION SHIMS
   * -----------------------------------------------------------
   * These helper functions only forward calls to the Validation
   * catalog, ensuring all enforcement copy stays in one file.
   *************************************************************/
  Texts.sendInvalidOption = function(session) {
    return Texts.Validation.sendInvalidOption(session);
  };

  Texts.sendInvalidCaseID = function(session) {
    return Texts.Validation.sendInvalidCaseID(session);
  };

  Texts.sendEligibilityRejected = function(session) {
    return Texts.Eligibility.sendEligibilityAfterRejectAsk(session);
  };

  Texts.closingAfterRejection = function(session) {
    return Texts.Closing.sendRejectionClosing(session);
  };

  /*************************************************************
   * LANGUAGE MENU HELPERS
   * -----------------------------------------------------------
   * Delegates to `Texts_LangMenus` so every region receives its
   * official options exactly as defined in the master document.
   *************************************************************/
  Texts.getAvailableLanguages = function(region) {
    return Texts.LangMenus.getAvailableLanguages(region);
  };

  Texts.mapLanguageChoice = function(region, choice) {
    return Texts.LangMenus.mapLanguageChoice(region, choice);
  };

  Texts.sendLanguageMenu = function(session) {
    return Texts.LangMenus.getMenu(session && session.Region_Group);
  };

  /*************************************************************
   * USER-TYPE MENU HELPER
   *************************************************************/
  Texts.sendUserTypeMenu = function(session) {
    return Texts.UserTypes.sendMenu(session);
  };

  /*************************************************************
   * LANGUAGE FALLBACK UTILITY
   * -----------------------------------------------------------
   * Used by legacy callers that need a deterministic language
   * choice from an allowed list (e.g., flow-specific catalogs).
   *************************************************************/
  Texts.resolveLanguage = function(session, allowedLanguages) {
    var preferred = session && session.Preferred_Language;
    var available = Array.isArray(allowedLanguages)
      ? allowedLanguages.slice()
      : [];

    if (!available.length) {
      return preferred || 'EN';
    }

    if (preferred && available.indexOf(preferred) !== -1) {
      return preferred;
    }

    if (available.indexOf('EN') !== -1) {
      return 'EN';
    }

    return available[0];
  };
})();
