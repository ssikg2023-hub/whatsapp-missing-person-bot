/***************************************************************
 * Texts_LangMenus.gs — Region-Based Language Menus
 * -------------------------------------------------------------------
 * Every menu string in this file is copied verbatim from
 * “Full n Final Flow Updated.txt”. No paraphrasing, no edits.
 * Helpers below simply choose the correct region grouping and
 * expose utilities for downstream flows to interpret selections.
 ***************************************************************/

const Texts_LangMenus = (() => {
  /**
   * Canonical mapping so any Gulf country code collapses to the
   * "ME" (Middle East) menu defined in the source-of-truth file.
   */
  const resolveRegion = (region) => {
    const upper = (region || "OTHER").toUpperCase();
    if (["AE", "SA", "QA", "OM", "BH", "KW", "ME"].includes(upper)) {
      return "ME";
    }
    if (["PK", "IN", "BD"].includes(upper)) {
      return upper;
    }
    return "OTHER";
  };

  /***********************************************************
   * Verbatim menu blocks (exact wording + emoji ordering)
   ***********************************************************/
  const menus = {
    PK: [
      "Welcome! Please choose your preferred language:",
      ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
      "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
      "1️⃣ English",
      "2️⃣ اردو",
      "3️⃣ Roman Urdu"
    ].join("\n"),

    IN: [
      "Welcome! Please choose your preferred language:",
      ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
      "स्वागत है! कृपया अपनी भाषा चुनें",
      "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
      "1️⃣ English",
      "2️⃣ हिन्दी",
      "3️⃣ اردو",
      "4️⃣ Roman Urdu"
    ].join("\n"),

    BD: [
      "Welcome! Please choose your preferred language:",
      ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
      "স্বাগতম! দয়া করে আপনার ভাষা নির্বাচন করুন",
      "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
      "1️⃣ English",
      "2️⃣ বাংলা",
      "3️⃣ اردو",
      "4️⃣ Roman Urdu"
    ].join("\n"),

    ME: [
      "Welcome! Please choose your preferred language:",
      ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
      "مرحبًا! يرجى اختيار لغتك المفضلة",
      "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
      "1️⃣ English",
      "2️⃣ العربية",
      "3️⃣ اردو",
      "4️⃣ Roman Urdu"
    ].join("\n"),

    OTHER: [
      "Welcome! Please choose your preferred language:",
      ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
      "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
      "1️⃣ English",
      "2️⃣ اردو",
      "3️⃣ Roman Urdu"
    ].join("\n")
  };

  /***********************************************************
   * Official language availability lists (per region)
   ***********************************************************/
  const languageCodes = {
    PK: ["EN", "UR", "RUR"],
    IN: ["EN", "HI", "UR", "RUR"],
    BD: ["EN", "BN", "UR", "RUR"],
    ME: ["EN", "AR", "UR", "RUR"],
    OTHER: ["EN", "UR", "RUR"]
  };

  /***********************************************************
   * PUBLIC API — used by the flow/router engines
   ***********************************************************/
  return {
    /**
     * Returns the exact menu string specified for the user’s
     * detected region group (defaults to OTHER when unknown).
     */
    getMenu(region) {
      const key = resolveRegion(region);
      return menus[key];
    },

    /**
     * Provides the supported language codes in display order so
     * downstream validation mirrors the presented menu.
     */
    getAvailableLanguages(region) {
      const key = resolveRegion(region);
      return languageCodes[key];
    },

    /**
     * Maps a numeric user choice to its canonical language code.
     * Returns null for invalid/out-of-range selections so flows
     * can re-prompt exactly as defined in the master spec.
     */
    mapLanguageChoice(region, choice) {
      const key = resolveRegion(region);
      const options = languageCodes[key];
      const index = Number(choice) - 1;
      if (!Number.isFinite(index) || index < 0 || index >= options.length) {
        return null;
      }
      return options[index];
    }
  };
})();
