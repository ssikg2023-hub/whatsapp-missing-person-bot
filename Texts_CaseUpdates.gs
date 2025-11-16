/***************************************************************
 * Texts_CaseUpdates.gs — Case update flow catalog
 * -------------------------------------------------------------
 * Every message below is copied verbatim from “Full n Final Flow
 * Updated.txt”. Helpers simply select the multilingual block
 * needed for each step of the update flow (case selection,
 * update menu, and each option prompt).
 ***************************************************************/

const Texts_CaseUpdates = (() => {
  /** Languages explicitly supported by this catalog. */
  const SUPPORTED = ["EN", "UR", "RUR", "HI", "BN", "AR"];

  /** Normalizes the preferred language stored on the session. */
  const resolveLang = (session) => {
    const pref = (session && session.Preferred_Language) || "EN";
    const upper = pref.toUpperCase();
    return SUPPORTED.includes(upper) ? upper : "EN";
  };

  /** Selects the correct language block with English fallback. */
  const select = (map, lang) => map[lang] || map.EN;

  /** Applies Case ID tokens for dynamic strings. */
  const applyTokens = (text, tokens = {}) => {
    return Object.keys(tokens).reduce((acc, key) => {
      const safeValue = tokens[key] || "";
      return acc.replace(new RegExp(`{{${key}}}`, "g"), safeValue);
    }, text);
  };

  /***********************************************************
   * Official text blocks, indexed by helper key.
   ***********************************************************/
  const blocks = {
    askCaseId: {
      EN: [
        "Please type the Case ID you want to update.",
        "For example: PK-00005",
        "To cancel, reply 0."
      ].join("\n"),
      UR: [
        "براہِ کرم وہ کیس نمبر لکھیں جسے آپ اپڈیٹ کرنا چاہتے ہیں۔",
        "مثال: PK-00005",
        "واپس جانے کے لیے 0 لکھیں۔"
      ].join("\n"),
      RUR: [
        "Barah-e-karam woh Case ID type karein jise update karna chahte hain.",
        "Misaal: PK-00005",
        "Wapas jane ke liye 0 likh dein۔"
      ].join("\n"),
      HI: [
        "कृपया वह Case ID लिखें जिसे आप अपडेट करना चाहते हैं।",
        "उदाहरण: PK-00005",
        "वापस जाने के लिए 0 लिखें।"
      ].join("\n"),
      BN: [
        "আপডেট করতে চান এমন Case ID লিখুন।",
        "উদাহরণ: PK-00005",
        "ফিরতে 0 লিখুন।"
      ].join("\n"),
      AR: [
        "يرجى كتابة رقم القضية التي تريد تحديثها.",
        "مثال: PK-00005",
        "للرجوع، أرسل 0."
      ].join("\n")
    },

    updateMenu: {
      EN: [
        "What would you like to update in your case?",
        "1️⃣ Add new information",
        "2️⃣ Upload photos/videos",
        "3️⃣ Mark this case as resolved (the missing person has been found)",
        "4️⃣ Go back"
      ].join("\n"),
      UR: [
        "آپ اپنے کیس میں کیا اپڈیٹ کرنا چاہتے ہیں؟",
        "1️⃣ نئی معلومات شامل کرنا",
        "2️⃣ تصاویر/ویڈیوز اپلوڈ کرنا",
        "3️⃣ کیس کو \"حل شدہ\" کے طور پر بند کرنا (گمشدہ شخص مل گیا ہے)",
        "4️⃣ واپس جانا"
      ].join("\n"),
      RUR: [
        "Aap apne case mein kya update karna chahte hain?",
        "1️⃣ Nai maloomat shamil karna",
        "2️⃣ Tasaveer/Video upload karna",
        "3️⃣ Case ko “hal shuda” mark karna (gumshuda shakhs mil gaya hai)",
        "4️⃣ Wapas jana"
      ].join("\n"),
      HI: [
        "आप अपने केस में क्या अपडेट करना चाहते हैं?",
        "1️⃣ नई जानकारी जोड़ना",
        "2️⃣ फ़ोटो/वीडियो अपलोड करना",
        "3️⃣ केस को \"हल हो गया\" मार्क करना (लापता व्यक्ति मिल गया है)",
        "4️⃣ वापस जाना"
      ].join("\n"),
      BN: [
        "আপনি আপনার কেসে কী আপডেট করতে চান?",
        "1️⃣ নতুন তথ্য যোগ করা",
        "2️⃣ ছবি/ভিডিও আপলোড করা",
        "3️⃣ কেসটি “সমাধান হয়েছে” হিসাবে চিহ্নিত করা (নিখোঁজ ব্যক্তি পাওয়া গেছে)",
        "4️⃣ ফিরে যাওয়া"
      ].join("\n"),
      AR: [
        "ماذا تريد أن تحدّث في قضيتك؟",
        "1️⃣ إضافة معلومات جديدة",
        "2️⃣ رفع صور/فيديو",
        "3️⃣ تعليم القضية بأنها \"تم حلّها\" (تم العثور على الشخص المفقود)",
        "4️⃣ الرجوع"
      ].join("\n")
    },

    optionNewInfo: {
      EN: [
        "Please type the new information you want to add to your case.",
        "We will attach it to your existing case file."
      ].join("\n"),
      UR: [
        "براہِ کرم وہ نئی معلومات لکھیں جو آپ اپنے کیس میں شامل کرنا چاہتے ہیں۔",
        "ہم اسے آپ کے موجودہ کیس کے ساتھ شامل کر دیں گے۔"
      ].join("\n"),
      RUR: [
        "Barah-e-karam woh nai maloomat likh dein jo aap case mein add karna chahte hain.",
        "Hum isay aap ke mojooda case ke sath attach kar denge."
      ].join("\n"),
      HI: [
        "कृपया वह नई जानकारी लिखें जिसे आप अपने केस में जोड़ना चाहते हैं।",
        "हम इसे आपके मौजूदा केस में जोड़ देंगे।"
      ].join("\n"),
      BN: [
        "আপনি যে নতুন তথ্যটি আপনার কেসে যোগ করতে চান, অনুগ্রহ করে তা লিখুন।",
        "আমরা এটি আপনার বিদ্যমান কেসে যুক্ত করে দেব।"
      ].join("\n"),
      AR: [
        "يرجى كتابة المعلومات الجديدة التي تريد إضافتها إلى قضيتك.",
        "سنقوم بإرفاقها بملف قضيتك الحالي."
      ].join("\n")
    },

    optionUploadMedia: {
      EN: [
        "Please upload the photo or video you want to attach to your case.",
        "You can send multiple files one by one."
      ].join("\n"),
      UR: [
        "براہِ کرم وہ تصویر یا ویڈیو بھیجیں جو آپ اپنے کیس کے ساتھ منسلک کرنا چاہتے ہیں۔",
        "آپ ایک سے زائد فائلز بھی الگ الگ بھیج سکتے ہیں۔"
      ].join("\n"),
      RUR: [
        "Meherbani karke tasveer ya video bhej dein jo aap case ke sath attach karna chahte hain.",
        "Aap chahein to ek se zyada file bhi alag alag bhej sakte hain۔"
      ].join("\n"),
      HI: [
        "कृपया वह फोटो या वीडियो भेजें जिसे आप अपने केस में जोड़ना चाहते हैं।",
        "आप चाहें तो कई फाइलें एक-एक करके भेज सकते हैं।"
      ].join("\n"),
      BN: [
        "আপনি যে ছবি বা ভিডিওটি কেসে যুক্ত করতে চান, অনুগ্রহ করে তা পাঠান।",
        "আপনি চাইলে একাধিক ফাইল আলাদা করে পাঠাতে পারেন।"
      ].join("\n"),
      AR: [
        "يرجى إرسال الصورة أو الفيديو الذي تريد إرفاقه بقضيتك.",
        "يمكنك إرسال عدة ملفات واحدة تلو الأخرى."
      ].join("\n")
    },

    optionMarkResolved: {
      EN: [
        "Alhamdulillah!",
        "We are very happy to hear that the missing person has been found.",
        "We will now mark your case as resolved."
      ].join("\n"),
      UR: [
        "الحمد للہ!",
        "یہ جان کر ہمیں بہت خوشی ہوئی کہ گمشدہ شخص مل گیا ہے۔",
        "ہم آپ کے کیس کو حل شدہ کے طور پر بند کر رہے ہیں۔"
      ].join("\n"),
      RUR: [
        "Alhamdulillah!",
        "Yeh jaan kar humein bohat khushi hui ke gumshuda shakhs mil gaya hai.",
        "Hum aap ka case hal shuda mark kar rahe hain۔"
      ].join("\n"),
      HI: [
        "अल्हम्दुलिल्लाह!",
        "यह जानकर हमें बहुत खुशी हुई कि लापता व्यक्ति मिल गया है।",
        "हम आपके केस को समाधान हो चुका मार्क कर रहे हैं।"
      ].join("\n"),
      BN: [
        "আলহামদুলिल्लাহ!",
        "নিখোঁজ ব্যক্তি পাওয়া গেছে, এটি শুনে আমরা খুব আনন্দিত।",
        "আমরা আপনার কেসটি সমাধান হয়েছে হিসেবে মার্ক করছি।"
      ].join("\n"),
      AR: [
        "الحمد لله!",
        "سعدنا جدًا لسماع أنه تم العثور على الشخص المفقود.",
        "سنقوم الآن بتعليم قضيتك بأنها تم حلّها."
      ].join("\n")
    },

    optionGoBack: {
      EN: "Okay, returning to the previous menu.",
      UR: "ٹھیک ہے، آپ کو پچھلے مینو پر واپس لے جایا جا رہا ہے۔",
      RUR: "Theek hai, aap ko pichlay menu par wapas le ja rahe hain۔",
      HI: "ठीक है, आपको पिछले मेनू पर वापस ले जाया जा रहा है।",
      BN: "ঠিক আছে, আপনাকে আগের মেনুতে ফিরিয়ে নেওয়া হচ্ছে।",
      AR: "حسنًا، سنعيدك إلى القائمة السابقة."
    },

    askNewInfo: {
      EN: [
        "Please type the new information you would like to add to your case (Case ID: {{CASE_ID}}).",
        "You can also send any new photos, documents, or voice notes that may help.",
        "Once you have shared everything, you can type DONE."
      ].join("\n"),
      UR: [
        "براہِ کرم وہ نئی معلومات لکھیں جو آپ اپنے کیس (کیس نمبر: {{CASE_ID}}) میں شامل کرنا چاہتے ہیں۔",
        "آپ چاہیں تو نئی تصاویر، دستاویزات، یا وائس نوٹس بھی بھیج سکتے ہیں جو مددگار ہوں۔",
        "جب آپ ساری معلومات بھیج چکیں تو آخر میں DONE لکھ کر بھیج دیں۔"
      ].join("\n"),
      RUR: [
        "Barah-e-karam woh nayi maloomat likhein jo aap apne case (Case ID: {{CASE_ID}}) mein add karna chahte hain.",
        "Aap chahen to nayi tasveerain, documents, ya voice notes bhi bhej sakte hain jo madadgar hon.",
        "Jab aap sab kuch share kar chuken, to aakhri mein DONE likh kar bhej dein."
      ].join("\n"),
      HI: [
        "कृपया वह नई जानकारी लिखें जो आप अपने केस (Case ID: {{CASE_ID}}) में जोड़ना चाहते हैं।",
        "आप चाहें तो नई फोटो, डॉक्यूमेंट या वॉइस नोट भी भेज सकते हैं जो मदद कर सके।",
        "जब आप सारी जानकारी भेज दें, तो आख़िर में DONE लिखकर भेजें।"
      ].join("\n"),
      BN: [
        "অনুগ্রহ করে সেই নতুন তথ্য লিখুন যা আপনি আপনার কেসে (Case ID: {{CASE_ID}}) যুক্ত করতে চান।",
        "আপনি চাইলে নতুন ছবি, ডকুমেন্ট বা ভয়েস নোটও পাঠাতে পারেন যা সহায়ক হতে পারে।",
        "সব তথ্য পাঠানোর পর শেষে DONE লিখে পাঠান।"
      ].join("\n"),
      AR: [
        "يرجى كتابة المعلومات الجديدة التي تودّ إضافتها إلى قضيتك (رقم القضية: {{CASE_ID}}).",
        "يمكنك أيضًا إرسال صور جديدة، مستندات، أو رسائل صوتية قد تكون مفيدة.",
        "بعد الانتهاء من مشاركة كل شيء، أرسل الكلمة DONE."
      ].join("\n")
    },

    confirmNewInfoAdded: {
      EN: [
        "JazakAllah khair, your new information has been added to your case.",
        "Our team will inshaAllah review these updates as well."
      ].join("\n"),
      UR: [
        "جزاک اللہ خیر، آپ کی نئی معلومات آپ کے کیس میں شامل کر دی گئی ہیں۔",
        "ہماری ٹیم ان اپڈیٹس کا بھی ان شاء اللہ جائزہ لے گی۔"
      ].join("\n"),
      RUR: [
        "JazakAllah khair, aap ki nayi maloomat aap ke case mein add kar di gayi hain.",
        "Hamari team in updates ka bhi InshaAllah jaiza legi."
      ].join("\n"),
      HI: [
        "जज़ाकअल्लाह ख़ैर, आपकी नई जानकारी आपके केस में जोड़ दी गई है।",
        "हमारी टीम इंशाअल्लाह इन अपडेट्स की भी समीक्षा करेगी।"
      ].join("\n"),
      BN: [
        "জাযাকআল্লাহ খাইর, আপনার নতুন তথ্য কেসের সাথে যোগ করা হয়েছে।",
        "আমাদের টিম ইনশাআল্লাহ এই আপডেটগুলোও পর্যালোচনা করবে।"
      ].join("\n"),
      AR: [
        "جزاك الله خيرًا، تمت إضافة المعلومات الجديدة إلى قضيتك.",
        "فريقنا سيقوم إن شاء الله بمراجعة هذه التحديثات أيضًا."
      ].join("\n")
    },

    caseClosed: {
      EN: [
        "Alhamdulillah!",
        "We are very happy to hear that the missing person has been found.",
        "We will now mark your case (Case ID: {{CASE_ID}}) as “Closed – Resolved by Family / Initiator” in our system.",
        "May Allah bless you and your family, and keep everyone safe. Ameen."
      ].join("\n"),
      UR: [
        "الحمد للہ!",
        "یہ سن کر ہمیں بہت خوشی ہوئی کہ گمشدہ شخص مل گیا ہے۔",
        "ہم اب آپ کے کیس (کیس نمبر: {{CASE_ID}}) کو اپنے سسٹم میں",
        "\"کلوزڈ — خاندان / درخواست دہندہ کی طرف سے حل شدہ\" کے طور پر مارک کر رہے ہیں۔",
        "اللہ آپ کو اور آپ کے گھر والوں کو اپنی حفظ و امان میں رکھے۔ آمین۔"
      ].join("\n"),
      RUR: [
        "Alhamdulillah!",
        "Yeh sunkar hamein bohot khushi hui ke gumshuda shakhs mil gaya hai.",
        "Hum ab aap ke case (Case ID: {{CASE_ID}}) ko apne system mein",
        "\"Closed — family / initiator ke zariye resolve ho chuka\" mark kar rahe hain.",
        "Allah aap ko aur aap ke ghar walon ko hamesha apni hifazat mein rakhe. Ameen."
      ].join("\n"),
      HI: [
        "अल्हम्दुलिल्लाह!",
        "यह सुनकर हमें बहुत खुशी हुई कि गुमशुदा व्यक्ति मिल चुका है।",
        "अब हम आपके केस (Case ID: {{CASE_ID}}) को अपने सिस्टम में",
        "\"Closed — परिवार / इनिशिएटर द्वारा हल हो चुका\" मार्क कर रहे हैं।",
        "अल्लाह आप और आपके परिवार को महफूज़ रखे। आमीन।"
      ].join("\n"),
      BN: [
        "আলহামদুলিল্লাহ!",
        "এটি শুনে আমরা অত্যন্ত আনন্দিত যে নিখোঁজ ব্যক্তি ফিরে এসেছে।",
        "আমরা এখন আপনার কেস (Case ID: {{CASE_ID}}) আমাদের সিস্টেমে",
        "\"Closed — পরিবার / উদ্যোগকারীর মাধ্যমে সমাধান হয়েছে\" হিসেবে মার্ক করব।",
        "আল্লাহ আপনাকে এবং আপনার পরিবারকে নিরাপদে রাখুন। আমীন।"
      ].join("\n"),
      AR: [
        "الحمد لله!",
        "سعدنا كثيرًا بسماع أن الشخص المفقود قد تم العثور عليه.",
        "سنقوم الآن بوضع علامـة على قضيتك (رقم القضية: {{CASE_ID}}) في نظامنا بأنها",
        "\"مغلقة — تم حلّها بواسطة الأسرة / مقدّم البلاغ\".",
        "نسأل الله أن يحفظك ويحفظ أسرتك، وأن يجمع بينكم دائمًا على خير. آمين."
      ].join("\n")
    }
  };

  /***********************************************************
   * Public helpers used by the routing engine.
   ***********************************************************/
  return {
    /** Step 1 — ask which Case ID should be updated. */
    askCaseId(session) {
      return select(blocks.askCaseId, resolveLang(session));
    },

    /** Step 2 — show the update menu with options 1–4. */
    sendUpdateMenu(session) {
      return select(blocks.updateMenu, resolveLang(session));
    },

    /** Option 1 — prompt the user for new information. */
    promptNewInformation(session) {
      return select(blocks.optionNewInfo, resolveLang(session));
    },

    /** Option 2 — instruct the user to upload media. */
    promptUploadMedia(session) {
      return select(blocks.optionUploadMedia, resolveLang(session));
    },

    /** Option 3 — acknowledge that the case is resolved. */
    acknowledgeCaseResolved(session) {
      return select(blocks.optionMarkResolved, resolveLang(session));
    },

    /** Option 4 — confirm that the user is being sent back. */
    confirmGoBack(session) {
      return select(blocks.optionGoBack, resolveLang(session));
    },

    /** Update flow — ask for detailed new information. */
    askNewInfo(session, caseId) {
      const lang = resolveLang(session);
      const template = select(blocks.askNewInfo, lang);
      return applyTokens(template, { CASE_ID: caseId || "" });
    },

    /** Update flow — confirmation after info/media is saved. */
    confirmNewInfoAdded(session) {
      return select(blocks.confirmNewInfoAdded, resolveLang(session));
    },

    /** Update flow — final closure confirmation. */
    sendCaseClosed(session, caseId) {
      const lang = resolveLang(session);
      const template = select(blocks.caseClosed, lang);
      return applyTokens(template, { CASE_ID: caseId || "" });
    }
  };
})();
