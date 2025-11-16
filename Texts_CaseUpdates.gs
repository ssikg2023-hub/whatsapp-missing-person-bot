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
    }
  };
})();
