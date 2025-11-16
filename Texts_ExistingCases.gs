/***************************************************************
 * Texts_ExistingCases.gs — Existing Case Menus & Messages
 * Exact copy of master flow wording (multi-language)
 ***************************************************************/

const Texts_ExistingCases = {

  /***********************************************************
   * MAIN MENU — Existing case detected
   ***********************************************************/
  sendExistingCaseMenu(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const map = {
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
        "Hamare nizaam ke mutabiq aap is number se pehle hi ek case submit kar chuke hain.",
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
        "1️⃣ मैं अपने सबमिट किए गए केस की डिटेल देखना चाहता/चाहती हूँ।",
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
        "4️⃣ আমি আমার জমা দেওয়া কেসে নতুন আপডেট دینا चाहता/চাই।"
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

    const template = map[lang] || map.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },

  /***********************************************************
   * MULTIPLE CASES — Ask which Case ID
   ***********************************************************/
  sendMultipleCasesMenu(session, caseList) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "Our system shows that you have multiple cases submitted from this number.",
        "Your case IDs include, for example:",
        "{{CASE_LIST}}",
        "(e.g. PK-00001, PK-00005, PK-00009)",
        "Please type the Case ID you want to review or check the status of.",
        "For example: PK-00005",
        "If you want to cancel, you can reply with 0."
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
        "कृपया वह Case ID लिखें जिसका विवरण या स्टेटस आप देखना चाहते हैं।",
        "उदाहरण: PK-00005",
        "अगर आप वापस जाना चाहते हैं, तो 0 लिख दें।"
      ].join("\n"),

      BN: [
        "আমাদের সিস্টেম অনুযায়ী, আপনি এই নম্বর থেকে একাধিক কেস জমা দিয়েছেন।",
        "আপনার কেস নম্বরগুলো, উদাহরণ হিসেবে, এমন হতে পারে:",
        "{{CASE_LIST}}",
        "(যেমন: PK-00001, PK-00005, PK-00009)",
        "যে কেসটির বিস্তারিত বা স্ট্যাটাস দেখতে চান, অনুগ্রহ করে সেই Case ID লিখুন।",
        "উদাহরণ: PK-00005",
        "যদি ফিরতে চান, তবে 0 লিখে পাঠান।"
      ].join("\n"),

      AR: [
        "يُظهر نظامنا أنك قد قدّمت عدة قضايا من هذا الرقم.",
        "أرقام القضايا الخاصة بك، على سبيل المثال، هي:",
        "{{CASE_LIST}}",
        "(مثال: PK-00001, PK-00005, PK-00009)",
        "يرجى كتابة رقم القضية (Case ID) التي تريد مراجعة تفاصيلها أو معرفة حالتها.",
        "على سبيل المثال: PK-00005",
        "إذا أردت الرجوع، فيُمكنك إرسال 0."
      ].join("\n")
    };

    const template = map[lang] || map.EN;
    return template.replace(/{{CASE_LIST}}/g, caseList || "");
  },

  /***********************************************************
   * CASE DETAILS — Option 1
   ***********************************************************/
  sendCaseDetails(session, caseID, detailsText) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: {
        intro: "Here are the main details of your submitted case (Case ID: {{CASE_ID}}).",
        outro: "If anything is incorrect or you want to add more information, please type and send the correction here."
      },
      UR: {
        intro: "یہ آپ کے جمع شدہ کیس (کیس نمبر: {{CASE_ID}}) کی اہم تفصیلات ہیں۔",
        outro: "اگر کوئی بات غلط ہو یا آپ مزید معلومات شامل کرنا چاہیں تو براہِ کرم یہی پر لکھ کر بھیج دیں۔"
      },
      RUR: {
        intro: "Yeh aap ke submit kiye gaye case (Case ID: {{CASE_ID}}) ki aham tafseelaat hain.",
        outro: "Agar koi baat ghalat ho ya aap kuch mazeed maloomat add karna chahte hain to barah-e-karam yahin likh kar bhej dein."
      },
      HI: {
        intro: "यह आपके सबमिट किए गए केस (Case ID: {{CASE_ID}}) की मुख्य जानकारी है।",
        outro: "अगर कुछ गलत हो या आप और जानकारी जोड़ना चाहें, तो कृपया यहीं पर लिखकर भेज दें।"
      },
      BN: {
        intro: "এগুলো আপনার জমা দেওয়া কেসের (Case ID: {{CASE_ID}}) প্রধান তথ্য।",
        outro: "কিছু ভুল থাকলে বা নতুন তথ্য যোগ করতে চাইলে, অনুগ্রহ করে এখানেই লিখে পাঠান।"
      },
      AR: {
        intro: "هذه هي التفاصيل الأساسية للقضية التي قدّمتها (رقم القضية: {{CASE_ID}}).",
        outro: "إذا كانت هناك أي معلومات غير صحيحة أو أردت إضافة شيء جديد، فيرجى كتابته هنا وإرساله."
      }
    };

    const template = map[lang] || map.EN;
    const intro = template.intro.replace(/{{CASE_ID}}/g, caseID || "");
    const outro = template.outro;
    return [intro, detailsText || "", outro].filter(Boolean).join("\n");
  },

  /***********************************************************
   * CASE STATUS — Option 2
   ***********************************************************/
  sendCaseStatus(session, caseID, status) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: {
        line1: "The current status of your case (Case ID: {{CASE_ID}}) is: {{STATUS}}.",
        line2: "Our team is reviewing your case, and inshaAllah we will contact you if there is any update."
      },
      UR: {
        line1: "آپ کے کیس (کیس نمبر: {{CASE_ID}}) کی موجودہ صورتحال یہ ہے: {{STATUS}}",
        line2: "ہماری ٹیم آپ کے کیس کا جائزہ لے رہی ہے اور ان شاء اللہ کسی بھی اپڈیٹ کی صورت میں آپ سے رابطہ کرے گی۔"
      },
      RUR: {
        line1: "Aap ke case (Case ID: {{CASE_ID}}) ki maujooda status yeh hai: {{STATUS}}",
        line2: "Hamari team aap ke case ka jaiza le rahi hai, aur InshaAllah jab bhi koi nayi update hogi hum aap se rabta karein ge."
      },
      HI: {
        line1: "आपके केस (Case ID: {{CASE_ID}}) की मौजूदा स्थिति है: {{STATUS}}",
        line2: "हमारी टीम आपका केस देख रही है, और इंशाअल्लाह किसी भी नए अपडेट पर हम आपसे संपर्क करेंगे।"
      },
      BN: {
        line1: "আপনার কেসের (Case ID: {{CASE_ID}}) বর্তমান স্ট্যাটাস: {{STATUS}}",
        line2: "আমাদের টিম আপনার কেস পর্যালোচনা করছে, ইনশাআল্লাহ কোনো নতুন আপডেট হলে আমরা আপনার সাথে যোগাযোগ করব।"
      },
      AR: {
        line1: "حالة قضيتك الحالية (رقم القضية: {{CASE_ID}}) هي: {{STATUS}}",
        line2: "فريقنا يقوم بمراجعة قضيتك، وإن شاء الله سنقوم بالتواصل معك عند وجود أي تحديث جديد."
      }
    };

    const template = map[lang] || map.EN;
    const line1 = template.line1
      .replace(/{{CASE_ID}}/g, caseID || "")
      .replace(/{{STATUS}}/g, status || "");
    const line2 = template.line2;
    return [line1, line2].join("\n");
  },

  /***********************************************************
   * NEW CASE — Option 3 confirmation
   ***********************************************************/
  sendNewCaseStart(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "Okay, we will create a new case for you from this number.",
        "We will now start the questions again to collect your details inshaAllah."
      ].join("\n"),

      UR: [
        "ٹھیک ہے، ہم اسی نمبر سے آپ کے لیے ایک نیا کیس بنا رہے ہیں۔",
        "اب ہم آپ سے دوبارہ چند سوالات کریں گے تاکہ نئی تفصیل حاصل کی جا سکے، ان شاء اللہ۔"
      ].join("\n"),

      RUR: [
        "Theek hai, hum isi number se aap ke liye naya case bana rahe hain.",
        "Ab hum dobara aap se kuch sawalat karein ge taa-ke nayi tafseel hasil ki ja sake, InshaAllah."
      ].join("\n"),

      HI: [
        "ठीक है, हम इसी नंबर से आपके लिए एक नया केस बना रहे हैं।",
        "अब हम दोबारा कुछ सवाल पूछेंगे ताकि आपकी नई जानकारी ली जा सके, इंशाअल्लाह।"
      ].join("\n"),

      BN: [
        "ঠিক আছে, আমরা এই নম্বর থেকে আপনার জন্য একটি নতুন কেস তৈরি করছি।",
        "এখন আমরা আবার কয়েকটি প্রশ্ন করব, যাতে আপনার নতুন তথ্য সংগ্রহ করা যায়, ইনশাআল্লাহ।"
      ].join("\n"),

      AR: [
        "حسنًا، سنقوم بإنشاء قضية جديدة لك بهذا الرقم.",
        "سنسألك الآن بعض الأسئلة مرة أخرى لجمع بياناتك الجديدة، إن شاء الله."
      ].join("\n")
    };

    const template = map[lang] || map.EN;
    return template;
  },

  /***********************************************************
   * UPDATE CASE MENU — Option 4
   ***********************************************************/
  sendUpdateCaseMenu(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const map = {
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
        "هل تودّ مشاركة تحديث بخصوص قضيتك المقدَّمة (رقم القضية: {{CASE_ID}})?",
        "يرجى اختيار أحد الخيارات:",
        "1️⃣ لدي معلومات جديدة عن القضية.",
        "2️⃣ تم إغلاق القضية — تم العثور على الشخص المفقود."
      ].join("\n")
    };

    const template = map[lang] || map.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },

  /***********************************************************
   * UPDATE CASE — New information prompt
   ***********************************************************/
  sendUpdateNewInfoPrompt(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const map = {
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

    const template = map[lang] || map.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },

  /***********************************************************
   * UPDATE CASE — Confirmation after DONE
   ***********************************************************/
  sendUpdateConfirmation(session) {
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
   * CASE CLOSED — Option 2 confirmation
   ***********************************************************/
  sendCaseClosed(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const map = {
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
        "अल्लाह आप और आपके परिवार को महफ़ूज़ रखे। आमीन।"
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

    const template = map[lang] || map.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },

  /***********************************************************
   * INVALID CASE ID — Error handling
   ***********************************************************/
  sendInvalidCaseSelection(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "The Case ID you entered was not found for this number.",
        "Please check and type the correct Case ID, or reply 0 to go back."
      ].join("\n"),

      UR: [
        "آپ نے جو کیس نمبر بھیجا ہے وہ اس نمبر کے ساتھ نہیں ملا۔",
        "براہِ کرم دوبارہ درست کیس نمبر لکھیں، یا واپس جانے کے لیے 0 لکھ دیں۔"
      ].join("\n"),

      RUR: [
        "Aap ne jo Case ID bheji hai woh is number ke sath match nahi hui.",
        "Meherbani karke sahi Case ID dobara type karein, ya wapas jane ke liye 0 likh dein."
      ].join("\n"),

      HI: [
        "आपने जो Case ID भेजी है, वह इस नंबर के लिए नहीं मिली।",
        "कृपया सही Case ID दोबारा लिखें, या वापस जाने के लिए 0 लिख दें।"
      ].join("\n"),

      BN: [
        "আপনি যে Case ID পাঠিয়েছেন, সেটি এই নম্বরের সাথে মিলে না।",
        "অনুগ্রহ করে সঠিক Case ID আবার লিখুন, অথবা ফিরে যেতে 0 লিখুন।"
      ].join("\n"),

      AR: [
        "رقم القضية الذي أدخلته غير مرتبط بهذا الرقم.",
        "يرجى إعادة كتابة رقم القضية الصحيح، أو إرسال 0 للرجوع."
      ].join("\n")
    };

    return map[lang] || map.EN;
  }

};

/***************************************************************
 * EXPORT HELPERS
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

Texts.sendCaseStatus = function(session, caseID, status) {
  return Texts_ExistingCases.sendCaseStatus(session, caseID, status);
};

Texts.sendNewCaseStart = function(session) {
  return Texts_ExistingCases.sendNewCaseStart(session);
};

Texts.sendUpdateCaseMenu = function(session, caseID) {
  return Texts_ExistingCases.sendUpdateCaseMenu(session, caseID);
};

Texts.sendUpdateNewInfoPrompt = function(session, caseID) {
  return Texts_ExistingCases.sendUpdateNewInfoPrompt(session, caseID);
};

Texts.sendUpdateConfirmation = function(session) {
  return Texts_ExistingCases.sendUpdateConfirmation(session);
};

Texts.sendCaseClosed = function(session, caseID) {
  return Texts_ExistingCases.sendCaseClosed(session, caseID);
};

Texts.sendInvalidCaseSelection = function(session) {
  return Texts_ExistingCases.sendInvalidCaseSelection(session);
};
