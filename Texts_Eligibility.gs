/***************************************************************
 * Texts_Eligibility.gs — Flow A Eligibility Screening Messages
 * -------------------------------------------------------------------
 * Every string here is copied verbatim from “Full n Final Flow
 * Updated.txt”. No paraphrasing, no edits, no shortening.
 * Helpers simply select the proper multilingual block for
 * (1) the police/agency eligibility question, (2) the immediate
 * rejection response, and (3) the follow-up restart prompt.
 ***************************************************************/

const Texts_Eligibility = (() => {
  /**
   * Canonical list of supported languages across eligibility texts.
   */
  const SUPPORTED_LANGS = ["EN", "UR", "RUR", "HI", "BN", "AR"];

  /**
   * Maps each region group to its language-specific question block.
   */
  const QUESTION_BLOCKS = {
    PK: {
      EN: [
        "English:",
        "Before we begin, please clarify one thing:",
        "Has your loved one been arrested by the police or any agency?",
        "",
        "Options:",
        "1️⃣ Yes / Haan — جی ہاں",
        "2️⃣ No / Nahi — نہیں"
      ].join("\n"),
      UR: [
        "Urdu:",
        "شروع کرنے سے پہلے، ایک بات بتا دیں:",
        "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
        "",
        "Options:",
        "1️⃣ جی ہاں",
        "2️⃣ نہیں"
      ].join("\n"),
      RUR: [
        "Roman Urdu:",
        "Shuru karne se pehle, ek baat bata dein:",
        "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
        "",
        "Options:",
        "1️⃣ Haan",
        "2️⃣ Nahi"
      ].join("\n")
    },

    IN: {
      EN: [
        "English:",
        "Before we begin, please clarify one thing:",
        "Has your loved one been arrested by the police or any agency?",
        "",
        "Options:",
        "1️⃣ Yes / Haan / हाँ — جی ہاں",
        "2️⃣ No / Nahi / नहीं — نہیں"
      ].join("\n"),
      HI: [
        "Hindi:",
        "शुरू करने से पहले, कृपया एक बात बताइए:",
        "क्या आपके प्रियजन को पुलिस या किसी एजेंसी ने गिरफ्तार किया है?",
        "",
        "Options:",
        "1️⃣ हाँ",
        "2️⃣ नहीं"
      ].join("\n"),
      UR: [
        "Urdu:",
        "شروع کرنے سے پہلے، ایک بات بتا دیں:",
        "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
        "",
        "Options:",
        "1️⃣ جی ہاں",
        "2️⃣ نہیں"
      ].join("\n"),
      RUR: [
        "Roman Urdu:",
        "Shuru karne se pehle, ek baat bata dein:",
        "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
        "",
        "Options:",
        "1️⃣ Haan",
        "2️⃣ Nahi"
      ].join("\n")
    },

    BD: {
      EN: [
        "English:",
        "Before we begin, please clarify one thing:",
        "Has your loved one been arrested by the police or any agency?",
        "",
        "Options:",
        "1️⃣ Yes / Haan / হ্যাঁ — جی ہاں",
        "2️⃣ No / Nahi / না — نہیں"
      ].join("\n"),
      BN: [
        "Bangla (বাংলা):",
        "শুরু করার আগে, দয়া করে একটি কথা বলুন:",
        "আপনার প্রিয়জনকে কি পুলিশ বা কোনো এজেন্সি গ্রেফতার করেছে?",
        "",
        "Options:",
        "1️⃣ হ্যাঁ",
        "2️⃣ না"
      ].join("\n"),
      UR: [
        "Urdu:",
        "شروع کرنے سے پہلے، ایک بات بتا دیں:",
        "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
        "",
        "Options:",
        "1️⃣ جی ہاں",
        "2️⃣ نہیں"
      ].join("\n"),
      RUR: [
        "Roman Urdu:",
        "Shuru karne se pehle, ek baat bata dein:",
        "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
        "",
        "Options:",
        "1️⃣ Haan",
        "2️⃣ Nahi"
      ].join("\n")
    },

    ME: {
      EN: [
        "English:",
        "Before we begin, please clarify one thing:",
        "Has your loved one been arrested by the police or any agency?",
        "",
        "Options:",
        "1️⃣ Yes / Haan / نعم — جی ہاں",
        "2️⃣ No / Nahi / لا — نہیں"
      ].join("\n"),
      AR: [
        "Arabic (العربية):",
        "قبل أن نبدأ، يرجى توضيح أمر واحد:",
        "هل تم اعتقال قريبك من قبل الشرطة أو أي جهة؟",
        "",
        "Options:",
        "1️⃣ نعم",
        "2️⃣ لا"
      ].join("\n"),
      UR: [
        "Urdu:",
        "شروع کرنے سے پہلے، ایک بات بتا دیں:",
        "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
        "",
        "Options:",
        "1️⃣ جی ہاں",
        "2️⃣ نہیں"
      ].join("\n"),
      RUR: [
        "Roman Urdu:",
        "Shuru karne se pehle, ek baat bata dein:",
        "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
        "",
        "Options:",
        "1️⃣ Haan",
        "2️⃣ Nahi"
      ].join("\n")
    },

    OTHER: {
      EN: [
        "English:",
        "Before we begin, please clarify one thing:",
        "Has your loved one been arrested by the police or any agency?",
        "",
        "Options:",
        "1️⃣ Yes / Haan — جی ہاں",
        "2️⃣ No / Nahi — نہیں"
      ].join("\n"),
      UR: [
        "Urdu:",
        "شروع کرنے سے پہلے، ایک بات بتا دیں:",
        "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
        "",
        "Options:",
        "1️⃣ جی ہاں",
        "2️⃣ نہیں"
      ].join("\n"),
      RUR: [
        "Roman Urdu:",
        "Shuru karne se pehle, ek baat bata dein:",
        "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
        "",
        "Options:",
        "1️⃣ Haan",
        "2️⃣ Nahi"
      ].join("\n")
    }
  };

  /**
   * Rejection responses and follow-up prompts (global, no region split).
   */
  const REJECTION_COPY = {
    EN: "We’re truly sorry for your situation. Unfortunately, we are not able to take such cases.",
    UR: "ہم آپ کے دکھ میں شریک ہیں لیکن ہم پولیس یا ایجنسی کے کیسز نہیں لیتے۔",
    RUR: "Hum aap ke dukh mein shareek hain, lekin hum police ya agency ke cases handle nahi karte.",
    HI: "हमें आपकी स्थिति के लिए बहुत खेद है। दुर्भाग्यवश, हम ऐसे मामलों को नहीं ले सकते।",
    BN: "আমরা আপনার পরিস্থিতির জন্য আন্তরিকভাবে দুঃখিত। দুর্ভাগ্যবশত, আমরা এ ধরনের কেস নিতে পারি না।",
    AR: "نحن آسفون جدًا لوضعك. للأسف، لا يمكننا التعامل مع مثل هذه الحالات."
  };

  const AFTER_REJECT_COPY = {
    EN: [
      "We are sorry for your situation, but we are unable to take police or agency-related cases.",
      "Would you like to submit a new case?",
      "1️⃣ Yes",
      "2️⃣ No"
    ].join("\n"),
    UR: [
      "ہم آپ کے دُکھ میں شریک ہیں، مگر ہم پولیس یا ادارے کے کیسز نہیں لیتے۔",
      "کیا آپ کوئی نیا کیس جمع کروانا چاہتے ہیں؟",
      "1️⃣ جی ہاں",
      "2️⃣ نہیں"
    ].join("\n"),
    RUR: [
      "Hum aap ke dukh mein shareek hain, magar hum police ya idaray ke cases handle nahi karte.",
      "Kya aap koi naya case submit karna chahte hain?",
      "1️⃣ Haan",
      "2️⃣ Nahi"
    ].join("\n"),
    HI: [
      "हमें आपके हालात का दुःख है, लेकिन हम पुलिस या एजेंसी से जुड़े मामलों को नहीं ले सकते।",
      "क्या आप नया केस जमा करना चाहते हैं?",
      "1️⃣ हाँ",
      "2️⃣ नहीं"
    ].join("\n"),
    BN: [
      "আমরা আপনার পরিস্থিতির জন্য দুঃখিত, কিন্তু আমরা পুলিশ বা এজেন্সি-সংক্রান্ত মামলা গ্রহণ করি না।",
      "আপনি কি একটি নতুন কেস জমা দিতে চান?",
      "1️⃣ হ্যাঁ",
      "2️⃣ না"
    ].join("\n"),
    AR: [
      "نحن متأسفون لوضعك، ولكن لا يمكننا التعامل مع القضايا المتعلقة بالشرطة أو الجهات الأمنية.",
      "هل ترغب في تقديم بلاغ جديد؟",
      "1️⃣ نعم",
      "2️⃣ لا"
    ].join("\n")
  };

  /**
   * Normalizes the stored language code while defaulting to English.
   */
  const resolveLang = (session) => {
    const pref = (session && session.Preferred_Language) || "EN";
    const upper = pref.toUpperCase();
    return SUPPORTED_LANGS.includes(upper) ? upper : "EN";
  };

  /**
   * Returns the canonical region key for the current session.
   */
  const resolveRegion = (session) => {
    const region = (session && session.Region_Group) || "OTHER";
    return QUESTION_BLOCKS[region] ? region : "OTHER";
  };

  /***********************************************************
   * Public helpers exposed to the flows layer.
   ***********************************************************/
  return {
    /** Returns the multi-lingual eligibility question block. */
    sendEligibilityQuestion(session) {
      const lang = resolveLang(session);
      const region = resolveRegion(session);
      const regionBlock = QUESTION_BLOCKS[region];
      return regionBlock[lang] || regionBlock.EN;
    },

    /** Returns the immediate rejection message (police/agency). */
    sendEligibilityRejection(session) {
      const lang = resolveLang(session);
      return REJECTION_COPY[lang] || REJECTION_COPY.EN;
    },

    /** Returns the follow-up prompt asking to start a new case. */
    sendEligibilityAfterRejectAsk(session) {
      const lang = resolveLang(session);
      return AFTER_REJECT_COPY[lang] || AFTER_REJECT_COPY.EN;
    }
  };
})();

