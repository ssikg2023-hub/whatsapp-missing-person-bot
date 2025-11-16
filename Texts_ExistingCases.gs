/***************************************************************
 * Texts_ExistingCases.gs — Existing case menus & helpers
 * -------------------------------------------------------------------
 * Every message in this catalog is copied verbatim from
 * “Full n Final Flow Updated.txt”. Each helper simply selects the
 * multilingual block that belongs to the existing-case experience:
 *   • Single-case menu
 *   • Multiple-case selection instructions
 *   • Case details + status responses
 *   • Restarting a brand-new case
 *   • Invalid Case ID warning
 ***************************************************************/

const Texts_ExistingCases = (() => {
  /** Canonical language codes supported by the master flow. */
  const SUPPORTED_LANGS = ["EN", "UR", "RUR", "HI", "BN", "AR"];

  /** Normalizes the preferred language stored in the user session. */
  const resolveLang = (session) => {
    const pref = (session && session.Preferred_Language) || "EN";
    const upper = pref.toUpperCase();
    return SUPPORTED_LANGS.includes(upper) ? upper : "EN";
  };

  /** Fallback helper that always returns an English block when missing. */
  const selectBlock = (map, lang) => map[lang] || map.EN;

  /** Applies {{TOKEN}} replacements inside a multi-line string. */
  const applyTokens = (text, tokens = {}) => {
    return Object.keys(tokens).reduce((acc, key) => {
      const safeValue = tokens[key] || "";
      const pattern = new RegExp(`{{${key}}}`, "g");
      return acc.replace(pattern, safeValue);
    }, text);
  };

  /***********************************************************
   * Exact multi-language blocks lifted from the flow spec.
   ***********************************************************/

  const EXISTING_CASE_MENU = {
    EN: [
      "Our system shows that you have already submitted a case from this number.",
      "Your last case ID is: {{CASE_ID}}",
      "Please choose an option:",
      "1️⃣ Review your submitted case details",
      "2️⃣ Check the status of your case",
      "3️⃣ Submit a new case",
      "4️⃣ I want to update my submitted case"
    ].join("\n"),
    UR: [
      "ہمارے سسٹم کے مطابق آپ اس نمبر سے پہلے ہی ایک کیس جمع کر چکے ہیں۔",
      "آپ کا آخری کیس نمبر ہے: {{CASE_ID}}",
      "براہِ کرم ایک آپشن منتخب کریں:",
      "1️⃣ میں اپنے جمع شدہ کیس کی تفصیل دیکھنا چاہتا/چاہتی ہوں۔",
      "2️⃣ میں اپنے کیس کی موجودہ صورتحال جاننا چاہتا/چاہتی ہوں۔",
      "3️⃣ میں نیا کیس جمع کروانا چاہتا/چاہتی ہوں۔",
      "4️⃣ میں اپنے جمع شدہ کیس میں اپڈیٹ دینا چاہتا/چاہتی ہوں۔"
    ].join("\n"),
    RUR: [
      "Hamare nizaam ke mutabiq aap is number se pehle hi",
      "ek case submit kar chuke hain.",
      "Aap ka aakhri case number hai: {{CASE_ID}}",
      "Barah-e-karam ek option ka intikhab karein:",
      "1️⃣ Submit kiya hua case ki tafseel dekhna chahta/chahti hoon.",
      "2️⃣ Apne case ki maujooda status maloom karna chahta/chahti hoon.",
      "3️⃣ Naya case submit karna chahta/chahti hoon.",
      "4️⃣ Main apne submit kiye gaye case mein update dena chahta/chahti hoon."
    ].join("\n"),
    HI: [
      "हमारे सिस्टम के अनुसार आपने इस नंबर से पहले ही एक केस दर्ज किया है।",
      "आपका आखिरी केस नंबर है: {{CASE_ID}}",
      "कृपया एक विकल्प चुनें:",
      "1️⃣ मैं अपने सबमिट किए गए केस की डিটेल देखना चाहता/चाहती हूँ।",
      "2️⃣ मैं अपने केस की मौजूदा स्थिति जानना चाहता/चाहती हूँ।",
      "3️⃣ मैं एक नया केस दर्ज करना चाहता/चाहती हूँ।",
      "4️⃣ मैं अपने सबमिट किए गए केस में अपडेट देना चाहता/चाहती हूँ।"
    ].join("\n"),
    BN: [
      "আমাদের সিস্টেম অনুযায়ী, আপনি এই নম্বর থেকে আগে একটি কেস জমা দিয়েছেন।",
      "আপনার শেষ কেস নম্বর হলো: {{CASE_ID}}",
      "অনুগ্রহ করে একটি অপশন নির্বাচন করুন:",
      "1️⃣ আমি জমা দেওয়া কেসের বিস্তারিত দেখতে চাই।",
      "2️⃣ আমি আমার কেসের বর্তমান স্ট্যাটাস জানতে চাই।",
      "3️⃣ আমি একটি নতুন কেস জমা দিতে চাই।",
      "4️⃣ আমি আমার জমা দেওয়া কেসে নতুন আপডেট দিতে চাই।"
    ].join("\n"),
    AR: [
      "يُظهر نظامنا أنك قد قدّمت بلاغًا من هذا الرقم من قبل.",
      "رقم قضيتك الأخيرة هو: {{CASE_ID}}",
      "يرجى اختيار أحد الخيارات:",
      "1️⃣ أريد مراجعة تفاصيل القضية التي قدّمتها.",
      "2️⃣ أريد معرفة حالة قضيتي الحالية.",
      "3️⃣ أريد تقديم قضية جديدة.",
      "4️⃣ أريد إضافة تحديث على قضيتي المقدَّمة."
    ].join("\n")
  };

  const MULTIPLE_CASES_MENU = {
    EN: [
      "Our system shows that you have multiple cases submitted from this number.",
      "Your case IDs include, for example:",
      "{{CASE_LIST}}",
      "(e.g. PK-00001, PK-00005, PK-00009)",
      "Please type the Case ID you want to review or check the status of.",
      "Example: PK-00005",
      "If you want to cancel, reply with 0."
    ].join("\n"),
    UR: [
      "ہمارے سسٹم کے مطابق آپ اس نمبر سے متعدد کیسز جمع کر چکے ہیں۔",
      "آپ کے کیس نمبرز، مثال کے طور پر، یہ ہیں:",
      "{{CASE_LIST}}",
      "(مثال: PK-00001, PK-00005, PK-00009)",
      "براہِ کرم وہ کیس نمبر لکھیں جس کی تفصیل یا اسٹیٹس دیکھنا چاہتے ہیں۔",
      "مثال کے طور پر: PK-00005",
      "اگر آپ واپس جانا چاہتے ہیں تو 0 لکھ دیں۔"
    ].join("\n"),
    RUR: [
      "Hamare nizaam ke mutabiq aap is number se kayee cases submit kar chuke hain.",
      "Aap ke case numbers, misaal ke taur par, yeh hain:",
      "{{CASE_LIST}}",
      "(misaal: PK-00001, PK-00005, PK-00009)",
      "Barah-e-karam woh Case ID type karein jiska review ya status dekhna chahte hain.",
      "Misaal: PK-00005",
      "Agar aap wapas jana chahte hain to 0 likh dein."
    ].join("\n"),
    HI: [
      "हमारे सिस्टम के अनुसार, आपने इस नंबर से एक से ज़्यादा केस दर्ज किए हैं।",
      "आपके केस नंबर, उदाहरण के तौर पर, ये हैं:",
      "{{CASE_LIST}}",
      "(जैसे: PK-00001, PK-00005, PK-00009)",
      "कृपया वह Case ID लिखें जिसका विवरण या स्टेटस देखना चाहते हैं।",
      "उदाहरण: PK-00005",
      "अगर आप वापस जाना चाहते हैं, तो 0 लिख दें।"
    ].join("\n"),
    BN: [
      "আমাদের সিস্টেম অনুযায়ী, আপনি এই নম্বর থেকে একাধিক কেস জমা দিয়েছেন।",
      "আপনার কেস নম্বরগুলো, উদাহরণ হিসেবে, এমন হতে পারে:",
      "{{CASE_LIST}}",
      "(যেমন: PK-00001, PK-00005, PK-00009)",
      "যে কেসটির বিস্তারিত বা স্ট্যাটাস দেখতে চান,",
      "অনুগ্রহ করে সেই Case ID লিখুন।",
      "উদাহরণ: PK-00005",
      "যদি ফিরতে চান, তবে 0 লিখে পাঠান।"
    ].join("\n"),
    AR: [
      "يُظهر نظامنا أنك قد قدّمت عدة قضايا من هذا الرقم.",
      "أرقام القضايا الخاصة بك، على سبيل المثال، هي:",
      "{{CASE_LIST}}",
      "(مثال: PK-00001, PK-00005, PK-00009)",
      "يرجى كتابة رقم القضية التي تريد مراجعة تفاصيلها أو معرفة حالتها.",
      "على سبيل المثال: PK-00005",
      "إذا أردت الرجوع، فيُمكنك إرسال 0."
    ].join("\n")
  };

  const CASE_DETAILS = {
    EN: {
      intro: "Here are the main details of your submitted case (Case ID: {{CASE_ID}}).",
      outro: [
        "If anything is incorrect or you want to add more information,",
        "please type and send the correction here."
      ].join("\n")
    },
    UR: {
      intro: "یہ آپ کے جمع شدہ کیس (کیس نمبر: {{CASE_ID}}) کی اہم تفصیلات ہیں۔",
      outro: [
        "اگر کوئی بات غلط ہو یا آپ مزید معلومات شامل کرنا چاہیں",
        "تو براہِ کرم یہی پر لکھ کر بھیج دیں۔"
      ].join("\n")
    },
    RUR: {
      intro: "Yeh aap ke submit kiye gaye case (Case ID: {{CASE_ID}}) ki aham tafseelaat hain.",
      outro: [
        "Agar koi baat ghalat ho ya aap kuch mazeed maloomat add karna chahte hain",
        "to barah-e-karam yahin likh kar bhej dein."
      ].join("\n")
    },
    HI: {
      intro: "यह आपके सबमिट किए गए केस (Case ID: {{CASE_ID}}) की मुख्य जानकारी है।",
      outro: [
        "अगर कुछ गलत हो या आप और जानकारी जोड़ना चाहें,",
        "तो कृपया यहीं पर लिखकर भेज दें।"
      ].join("\n")
    },
    BN: {
      intro: "এগুলো আপনার জমা দেওয়া কেসের (Case ID: {{CASE_ID}}) প্রধান তথ্য।",
      outro: [
        "কিছু ভুল থাকলে বা নতুন তথ্য যোগ করতে চাইলে,",
        "অনুগ্রহ করে এখানেই লিখে পাঠান।"
      ].join("\n")
    },
    AR: {
      intro: "هذه هي التفاصيل الأساسية للقضية التي قدّمتها (رقم القضية: {{CASE_ID}}).",
      outro: [
        "إذا كانت هناك أي معلومات غير صحيحة أو أردت إضافة شيء جديد،",
        "فيرجى كتابته هنا وإرساله."
      ].join("\n")
    }
  };

  const CASE_STATUS = {
    EN: [
      "The current status of your case (Case ID: {{CASE_ID}}) is: {{STATUS}}.",
      "Our team is reviewing your case, and inshaAllah we will contact you",
      "if there is any update."
    ].join("\n"),
    UR: [
      "آپ کے کیس (کیس نمبر: {{CASE_ID}}) کی موجودہ صورتحال یہ ہے: {{STATUS}}",
      "ہماری ٹیم آپ کے کیس کا جائزہ لے رہی ہے",
      "اور ان شاء اللہ کسی بھی اپڈیٹ کی صورت میں آپ سے رابطہ کرے گی۔"
    ].join("\n"),
    RUR: [
      "Aap ke case (Case ID: {{CASE_ID}}) ki maujooda status yeh hai: {{STATUS}}",
      "Hamari team aap ke case ka jaiza le rahi hai",
      "aur InshaAllah jab bhi koi nayi update hogi hum aap se rabta karein ge."
    ].join("\n"),
    HI: [
      "आपके केस (Case ID: {{CASE_ID}}) की मौजूदा स्थिति है: {{STATUS}}",
      "हमारी टीम आपका केस देख रही है,",
      "और इंशाअल्लाह किसी भी नए अपडेट पर हम आपसे संपर्क करेंगे।"
    ].join("\n"),
    BN: [
      "আপনার কেসের (Case ID: {{CASE_ID}}) বর্তমান স্ট্যাটাস: {{STATUS}}",
      "আমাদের টিম আপনার কেস পর্যালোচনা করছে,",
      "ইনশাআল্লাহ কোনো নতুন আপডেট হলে আমরা আপনার সাথে যোগাযোগ করব।"
    ].join("\n"),
    AR: [
      "حالة قضيتك الحالية (رقم القضية: {{CASE_ID}}) هي: {{STATUS}}",
      "فريقنا يقوم بمراجعة قضيتك",
      "وإن شاء الله سنقوم بالتواصل معك عند وجود أي تحديث جديد."
    ].join("\n")
  };

  const NEW_CASE_START = {
    EN: [
      "Okay, we will create a new case for you from this number.",
      "We will now start the questions again to collect your details inshaAllah."
    ].join("\n"),
    UR: [
      "ٹھیک ہے، ہم اسی نمبر سے آپ کے لیے ایک نیا کیس بنا رہے ہیں۔",
      "اب ہم آپ سے دوبارہ چند سوالات کریں گے",
      "تاکہ نئی تفصیل حاصل کی جا سکے، ان شاء اللہ۔"
    ].join("\n"),
    RUR: [
      "Theek hai, hum isi number se aap ke liye naya case bana rahe hain.",
      "Ab hum dobara aap se kuch sawalat karein ge taa-ke nayi tafseel hasil ki ja sake,",
      "InshaAllah."
    ].join("\n"),
    HI: [
      "ठीक है, हम इसी नंबर से आपके लिए एक नया केस बना रहे हैं।",
      "अब हम दोबारा कुछ सवाल पूछेंगे ताकि आपकी नई जानकारी ली जा सके,",
      "इंशाअल्लाह।"
    ].join("\n"),
    BN: [
      "ঠিক আছে, আমরা এই নম্বর থেকে আপনার জন্য একটি নতুন কেস তৈরি করছি।",
      "এখন আমরা আবার কয়েকটি প্রশ্ন করব,",
      "যাতে আপনার নতুন তথ্য সংগ্রহ করা যায়, ইনশাআল্লাহ।"
    ].join("\n"),
    AR: [
      "حسنًا، سنقوم بإنشاء قضية جديدة لك بهذا الرقم.",
      "سنسألك الآن بعض الأسئلة مرة أخرى لجمع بياناتك الجديدة، إن شاء الله."
    ].join("\n")
  };

  const INVALID_CASE_ID = {
    EN: [
      "The Case ID you entered was not found for this number.",
      "Please check and type the correct Case ID,",
      "or reply 0 to go back."
    ].join("\n"),
    UR: [
      "آپ نے جو کیس نمبر بھیجا ہے وہ اس نمبر کے ساتھ نہیں ملا۔",
      "براہِ کرم دوبارہ درست کیس نمبر لکھیں، یا واپس جانے کے لیے 0 لکھ دیں۔"
    ].join("\n"),
    RUR: [
      "Aap ne jo Case ID bheji hai woh is number ke sath match nahi hui.",
      "Meherbani karke sahi Case ID dobara type karein,",
      "ya wapas jane ke liye 0 likh dein۔"
    ].join("\n"),
    HI: [
      "आपने जो Case ID भेजी है, वह इस नंबर के लिए नहीं मिली।",
      "कृपया सही Case ID दोबारा लिखें,",
      "या वापस जाने के लिए 0 लिख दें।"
    ].join("\n"),
    BN: [
      "আপনি যে Case ID পাঠিয়েছেন, সেটি এই নম্বরের সাথে মিলে না।",
      "অনুগ্রহ করে সঠিক Case ID আবার লিখুন,",
      "অথবা ফিরে যেতে 0 লিখুন।"
    ].join("\n"),
    AR: [
      "رقم القضية الذي أدخلته غير مرتبط بهذا الرقم.",
      "يرجى إعادة كتابة رقم القضية الصحيح،",
      "أو إرسال 0 للرجوع."
    ].join("\n")
  };

  /***********************************************************
   * Public API — used directly by the router.
   ***********************************************************/
  return {
    /** Existing case menu when exactly one prior case is detected. */
    sendExistingCaseMenu(session, caseID) {
      const lang = resolveLang(session);
      const template = selectBlock(EXISTING_CASE_MENU, lang);
      return applyTokens(template, { CASE_ID: caseID || "" });
    },

    /** Multi-case scenario — ask which Case ID should be used. */
    sendMultipleCasesMenu(session, caseList) {
      const lang = resolveLang(session);
      const template = selectBlock(MULTIPLE_CASES_MENU, lang);
      return applyTokens(template, { CASE_LIST: caseList || "" });
    },

    /** Option 1 — show the case details recap plus editable slot. */
    sendCaseDetails(session, caseID, detailsText) {
      const lang = resolveLang(session);
      const block = CASE_DETAILS[lang] || CASE_DETAILS.EN;
      const intro = applyTokens(block.intro, { CASE_ID: caseID || "" });
      const outro = block.outro;
      return [intro, detailsText || "", outro].filter(Boolean).join("\n");
    },

    /** Option 2 — share the saved case status line. */
    sendCaseStatus(session, caseID, statusLabel) {
      const lang = resolveLang(session);
      const template = selectBlock(CASE_STATUS, lang);
      return applyTokens(template, { CASE_ID: caseID || "", STATUS: statusLabel || "" });
    },

    /** Option 3 — confirm that a fresh case will be created. */
    sendNewCaseStart(session) {
      const lang = resolveLang(session);
      return selectBlock(NEW_CASE_START, lang);
    },

    /** Error handling — inform the user when a Case ID is invalid. */
    sendInvalidCaseSelection(session) {
      return selectBlock(INVALID_CASE_ID, resolveLang(session));
    }
  };
})();

/***************************************************************
 * EXPORT HELPERS — mirror the legacy Texts namespace.
 ***************************************************************/
if (typeof Texts === "undefined") {
  var Texts = {};
}

Texts.sendExistingCaseMenu = function(session, caseID) {
  return Texts_ExistingCases.sendExistingCaseMenu(session, caseID);
};

Texts.sendMultipleCasesMenu = function(session, caseList) {
  return Texts_ExistingCases.sendMultipleCasesMenu(session, caseList);
};

Texts.sendCaseDetails = function(session, caseID, detailsText) {
  return Texts_ExistingCases.sendCaseDetails(session, caseID, detailsText);
};

Texts.sendCaseStatus = function(session, caseID, statusLabel) {
  return Texts_ExistingCases.sendCaseStatus(session, caseID, statusLabel);
};

Texts.sendNewCaseStart = function(session) {
  return Texts_ExistingCases.sendNewCaseStart(session);
};

Texts.sendInvalidCaseSelection = function(session) {
  return Texts_ExistingCases.sendInvalidCaseSelection(session);
};
