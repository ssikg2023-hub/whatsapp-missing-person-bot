/***************************************************************
 * Texts_CaseUpdates.gs — Case Update Flow (Master Copy)
 ***************************************************************/

const Texts_CaseUpdates = {

  /***********************************************************
   * MAIN UPDATE MENU (Existing Case → Option 4)
   ***********************************************************/
  sendUpdateMenu(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
      EN: [
        "Would you like to share an update about your submitted case (Case ID: {{CASE_ID}})?",
        "Please choose an option:",
        "1️⃣ I have new information about the case.",
        "2️⃣ The case is closed – the missing person has been found."
      ].join("\n"),

      UR: [
        "کیا آپ اپنے جمع شدہ کیس (کیس نمبر: {{CASE_ID}}) کے بارے میں کوئی اپڈیٹ شیئر کرنا چاہتے ہیں؟",
        "براہِ کرم ایک آپشن منتخب کریں:",
        "1️⃣ میرے پاس کیس کے بارے میں نئی معلومات ہے۔",
        "2️⃣ کیس کلوز ہو چکا ہے — گمشدہ شخص مل گیا ہے۔"
      ].join("\n"),

      RUR: [
        "Kya aap apne submit kiye gaye case (Case ID: {{CASE_ID}}) ke bare mein koi update share karna chahte hain?",
        "Barah-e-karam ek option ka intikhab karein:",
        "1️⃣ Mere paas case ke bare mein nayi maloomat hai.",
        "2️⃣ Case close ho chuka hai — gumshuda shakhs mil gaya hai."
      ].join("\n"),

      HI: [
        "क्या आप अपने सबमिट किए गए केस (Case ID: {{CASE_ID}}) के बारे में कोई अपडेट देना चाहते हैं?",
        "कृपया एक विकल्प चुनें:",
        "1️⃣ मेरे पास केस के बारे में नई जानकारी है।",
        "2️⃣ केस क्लोज हो चुका है — गुमशुदा व्यक्ति मिल गया है।"
      ].join("\n"),

      BN: [
        "আপনি কি আপনার জমা দেওয়া কেস (Case ID: {{CASE_ID}}) সম্পর্কে কোনো আপডেট দিতে চান?",
        "অনুগ্রহ করে একটি অপশন নির্বাচন করুন:",
        "1️⃣ আমার কাছে কেস সম্পর্কে নতুন তথ্য আছে।",
        "2️⃣ কেস ক্লোজ হয়ে গেছে — নিখোঁজ ব্যক্তি মিলেছে।"
      ].join("\n"),

      AR: [
        "هل تودّ مشاركة تحديث بخصوص قضيتك المقدَّمة (رقم القضية: {{CASE_ID}})؟",
        "يرجى اختيار أحد الخيارات:",
        "1️⃣ لدي معلومات جديدة عن القضية.",
        "2️⃣ تم إغلاق القضية — تم العثور على الشخص المفقود."
      ].join("\n")
    };

    const template = templates[lang] || templates.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },


  /***********************************************************
   * USER CHOSE 1️⃣ — NEW INFORMATION
   ***********************************************************/
  askNewInfo(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
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
    };

    const template = templates[lang] || templates.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },

  confirmNewInfoAdded(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
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
    };

    return map[lang] || map.EN;
  },


  /***********************************************************
   * USER CHOSE 2️⃣ — CASE CLOSED (PERSON FOUND)
   ***********************************************************/
  sendCaseClosed(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
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
        "“کلوزڈ — خاندان / درخواست دہندہ کی طرف سے حل شدہ” کے طور پر مارک کر رہے ہیں۔",
        "اللہ آپ کو اور آپ کے گھر والوں کو اپنی حفظ و امان میں رکھے۔ آمین۔"
      ].join("\n"),

      RUR: [
        "Alhamdulillah!",
        "Yeh sunkar hamein bohot khushi hui ke gumshuda shakhs mil gaya hai.",
        "Hum ab aap ke case (Case ID: {{CASE_ID}}) ko apne system mein",
        "“Closed — family / initiator ke zariye resolve ho chuka” mark kar rahe hain.",
        "Allah aap ko aur aap ke ghar walon ko hamesha apni hifazat mein rakhe. Ameen."
      ].join("\n"),

      HI: [
        "अल्हम्दुलिल्लाह!",
        "यह सुनकर हमें बहुत खुशी हुई कि गुमशुदा व्यक्ति मिल चुका है।",
        "अब हम आपके केस (Case ID: {{CASE_ID}}) को अपने सिस्टम में",
        "“Closed — परिवार / इनिशिएटर द्वारा हल हो चुका” मार्क कर रहे हैं।",
        "अल्लाह आप और आपके परिवार को महफूज़ रखे। आमीन।"
      ].join("\n"),

      BN: [
        "আলহামদুলিল্লাহ!",
        "এটি শুনে আমরা অত্যন্ত আনন্দিত যে নিখোঁজ ব্যক্তি ফিরে এসেছে।",
        "আমরা এখন আপনার কেস (Case ID: {{CASE_ID}}) আমাদের সিস্টেমে",
        "“Closed — পরিবার / উদ্যোগকারীর মাধ্যমে সমাধান হয়েছে” হিসেবে মার্ক করব।",
        "আল্লাহ আপনাকে এবং আপনার পরিবারকে নিরাপদে রাখুন। আমীন।"
      ].join("\n"),

      AR: [
        "الحمد لله!",
        "سعدنا كثيرًا بسماع أن الشخص المفقود قد تم العثور عليه.",
        "سنقوم الآن بوضع علامـة على قضيتك (رقم القضية: {{CASE_ID}}) في نظامنا بأنها",
        "“مغلقة — تم حلّها بواسطة الأسرة / مقدّم البلاغ”.",
        "نسأل الله أن يحفظك ويحفظ أسرتك، وأن يجمع بينكم دائمًا على خير. آمين."
      ].join("\n")
    };

    const template = templates[lang] || templates.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  }

};
