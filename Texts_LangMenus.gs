/***************************************************************
 * Texts_LangMenus.gs — Language Menus (Region Based)
 ***************************************************************/

const Texts_LangMenus = {

  getMenu(region) {
    switch (region) {

      case "PK":
        return [
          "Welcome! Please choose your preferred language:",
          ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
          "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
          "1️⃣ English",
          "2️⃣ اردو",
          "3️⃣ Roman Urdu"
        ].join("\n");

      case "IN":
        return [
          "Welcome! Please choose your preferred language:",
          ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
          "स्वागत है! कृपया अपनी भाषा चुनें",
          "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
          "1️⃣ English",
          "2️⃣ हिन्दी",
          "3️⃣ اردو",
          "4️⃣ Roman Urdu"
        ].join("\n");

      case "BD":
        return [
          "Welcome! Please choose your preferred language:",
          ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
          "স্বাগতম! দয়া করে আপনার ভাষা নির্বাচন করুন",
          "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
          "1️⃣ English",
          "2️⃣ বাংলা",
          "3️⃣ اردو",
          "4️⃣ Roman Urdu"
        ].join("\n");

      case "ME":
        return [
          "Welcome! Please choose your preferred language:",
          ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
          "مرحبًا! يرجى اختيار لغتك المفضلة",
          "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
          "1️⃣ English",
          "2️⃣ العربية",
          "3️⃣ اردو",
          "4️⃣ Roman Urdu"
        ].join("\n");

      default:
        return [
          "Welcome! Please choose your preferred language:",
          ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
          "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
          "1️⃣ English",
          "2️⃣ اردو",
          "3️⃣ Roman Urdu"
        ].join("\n");
    }
  },


  /***********************************************************
   * AVAILABLE LANGUAGES PER REGION (REQUIRED)
   ***********************************************************/
  getAvailableLanguages(region) {

    switch (region) {
      case "PK": return ["EN", "UR", "RUR"];
      case "IN": return ["EN", "HI", "UR", "RUR"];
      case "BD": return ["EN", "BN", "UR", "RUR"];
      case "ME": return ["EN", "AR", "UR", "RUR"];
      default:   return ["EN", "UR", "RUR"];
    }
  },


  /***********************************************************
   * MAP USER INPUT TO LANGUAGE CODE (REQUIRED)
   ***********************************************************/
  mapLanguageChoice(region, choice) {

    const langs = this.getAvailableLanguages(region);

    const index = Number(choice) - 1;

    if (index < 0 || index >= langs.length) return null;

    return langs[index];
  }

};
