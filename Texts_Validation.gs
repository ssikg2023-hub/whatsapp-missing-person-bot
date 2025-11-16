/***************************************************************
 * Texts_Validation.gs — INVALID / ERROR / RESTRICTION MESSAGES
 * EXACT text from Chat Flow & Messages file — NO CHANGES.
 ***************************************************************/

const Texts_Validation = {

  /***********************************************************
   * GENERIC PROMPT TO RESELECT FROM MENU (All menus reuse this)
   ***********************************************************/
  sendInvalidOption(session) {
    const lang = session.Preferred_Language;

    const map = {
      "EN": "Please choose an option:",
      "UR": "براہِ کرم ایک آپشن منتخب کریں:",
      "RUR": "Barah-e-karam ek option ka intikhab karein:",
      "HI": "कृपया एक विकल्प चुनें:",
      "BN": "অনুগ্রহ করে একটি অপশন নির্বাচন করুন:",
      "AR": "يرجى اختيار أحد الخيارات:"
    };

    return map[lang] || map["EN"];
  },


  /***********************************************************
   * INVALID CASE ID (Multiple-case scenario)
   ***********************************************************/
  sendInvalidCaseID(session) {
    const lang = session.Preferred_Language;

    const map = {
      "EN": [
        "The Case ID you entered was not found for this number.",
        "Please check and type the correct Case ID, or reply 0 to go back."
      ].join("\n"),

      "UR": [
        "آپ نے جو کیس نمبر بھیجا ہے وہ اس نمبر کے ساتھ نہیں ملا۔",
        "براہِ کرم دوبارہ درست کیس نمبر لکھیں، یا واپس جانے کے لیے 0 لکھ دیں۔"
      ].join("\n"),

      "RUR": [
        "Aap ne jo Case ID bheji hai woh is number ke sath match nahi hui.",
        "Meherbani karke sahi Case ID dobara type karein, ya wapas jane ke liye 0 likh dein."
      ].join("\n"),

      "HI": [
        "आपने जो Case ID भेजी है, वह इस नंबर के लिए नहीं मिली।",
        "कृपया सही Case ID दोबारा लिखें, या वापस जाने के लिए 0 लिख दें।"
      ].join("\n"),

      "BN": [
        "আপনি যে Case ID পাঠিয়েছেন, সেটি এই নম্বরের সাথে মিলে না।",
        "অনুগ্রহ করে সঠিক Case ID আবার লিখুন, অথবা ফিরে যেতে 0 লিখুন।"
      ].join("\n"),

      "AR": [
        "رقم القضية الذي أدخلته غير مرتبط بهذا الرقم.",
        "يرجى إعادة كتابة رقم القضية الصحيح، أو إرسال 0 للرجوع."
      ].join("\n")
    };

    return map[lang] || map["EN"];
  },


  /***********************************************************
   * ELIGIBILITY REJECTION (Police / Agency cases)
   ***********************************************************/
  sendEligibilityRejected(session) {
    const lang = session.Preferred_Language;

    const map = {
      "EN": [
        "We are sorry for your situation, but we are unable to take police or agency-related cases.",
        "Would you like to submit a new case?",
        "1️⃣ Yes",
        "2️⃣ No"
      ].join("\n"),

      "UR": [
        "ہم آپ کے دُکھ میں شریک ہیں، مگر ہم پولیس یا ادارے کے کیسز نہیں لیتے۔",
        "کیا آپ کوئی نیا کیس جمع کروانا چاہتے ہیں؟",
        "1️⃣ جی ہاں",
        "2️⃣ نہیں"
      ].join("\n"),

      "RUR": [
        "Hum aap ke dukh mein shareek hain, magar hum police ya idaray ke cases handle nahi karte.",
        "Kya aap koi naya case submit karna chahte hain?",
        "1️⃣ Haan",
        "2️⃣ Nahi"
      ].join("\n"),

      "HI": [
        "हमें आपके हालात का दुःख है, लेकिन हम पुलिस या एजेंसी से जुड़े मामलों को नहीं ले सकते।",
        "क्या आप नया केस जमा करना चाहते हैं?",
        "1️⃣ हाँ",
        "2️⃣ नहीं"
      ].join("\n"),

      "BN": [
        "আমরা আপনার পরিস্থিতির জন্য দুঃখিত, কিন্তু আমরা পুলিশ বা এজেন্সি-সংক্রান্ত মামলা গ্রহণ করি না।",
        "আপনি কি একটি নতুন কেস জমা দিতে চান?",
        "1️⃣ হ্যাঁ",
        "2️⃣ না"
      ].join("\n"),

      "AR": [
        "نحن متأسفون لوضعك، ولكن لا يمكننا التعامل مع القضايا المتعلقة بالشرطة أو الجهات الأمنية.",
        "هل ترغب في تقديم بلاغ جديد؟",
        "1️⃣ نعم",
        "2️⃣ لا"
      ].join("\n")
    };

    return map[lang] || map["EN"];
  },


  /***********************************************************
   * CLOSING MESSAGE after user selects “No”
   ***********************************************************/
  closingAfterRejection(session) {
    const lang = session.Preferred_Language;

    const map = {
      "EN": [
        "May Allah reunite every family with their loved ones. Ameen.",
        "Thank you for trusting us."
      ].join("\n"),

      "UR": [
        "اللہ ہر خاندان کو ان کے پیاروں سے ملائے۔ آمین۔",
        "ہم پر بھروسہ کرنے کا شکریہ۔"
      ].join("\n"),

      "RUR": [
        "Allah har khandaan ko unke pyaron se milaye. Ameen.",
        "Hum par bharosa karne ka shukriya."
      ].join("\n"),

      "HI": [
        "अल्लाह हर परिवार को उनके अपनों से मिला दे। आमीन।",
        "हम पर भरोसा करने के लिए शुक्रिया।"
      ].join("\n"),

      "BN": [
        "আল্লাহ প্রতিটি পরিবারকে তাদের প্রিয়জনদের সাথে মিলিয়ে দিন। আমীন।",
        "আমাদের উপর ভরসা করার জন্য ধন্যবাদ।"
      ].join("\n"),

      "AR": [
        "اللهم اجمع كل أسرة مع أحبّائها. آمين.",
        "شكراً لثقتكم بنا."
      ].join("\n")
    };

    return map[lang] || map["EN"];
  }

};

/***************************************************************
 * REGISTER INTO GLOBAL Texts WRAPPER
 ***************************************************************/
if (typeof Texts === "undefined") {
  var Texts = {};
}

Texts.sendInvalidOption       = (s) => Texts_Validation.sendInvalidOption(s);
Texts.sendInvalidCaseID       = (s) => Texts_Validation.sendInvalidCaseID(s);
Texts.sendEligibilityRejected = (s) => Texts_Validation.sendEligibilityRejected(s);
Texts.closingAfterRejection   = (s) => Texts_Validation.closingAfterRejection(s);
