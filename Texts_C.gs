/***************************************************************
 * Texts_C.gs — Flow C (Helping Someone Who Is Missing)
 * ---------------------------------------------------
 * Every string in this catalog is copied verbatim from
 * “Full n Final Flow Updated.txt”. No paraphrasing, no edits,
 * and no additional punctuation. These helpers simply return
 * the requested multilingual prompt for Flow C (intro, source
 * question, rejection, Q1–Q15).
 ***************************************************************/
const Texts_C = (() => {
  /** Official language list for Flow C. */
  const SUPPORTED = ["EN", "UR", "RUR", "HI", "BN", "AR"];

  /** Resolves the session’s preferred language with an English fallback. */
  const resolveLang = (session) => {
    const pref = (session && session.Preferred_Language) || "EN";
    const upper = pref.toUpperCase();
    return SUPPORTED.includes(upper) ? upper : "EN";
  };

  /** Returns the string for the resolved language (default English). */
  const select = (block, lang) => block[lang] || block.EN;

  /***********************************************************
   * Verbatim text blocks from the source specification.
   ***********************************************************/
  const blocks = {
    intro: {
      EN: [
        "We’ll ask a few simple questions to help reconnect the missing person with their family, inshaAllah.",
        "You can type or send a voice message if you prefer."
      ].join("\n"),
      UR: [
        "ہم چند آسان سوالات کریں گے تاکہ اس شخص کو ان کے گھر والوں تک پہنچانے میں مدد ملے، ان شاء اللہ۔",
        "آپ چاہیں تو آواز کا پیغام بھی بھیج سکتے ہیں۔"
      ].join("\n"),
      RUR: [
        "Hum kuch asaan sawalat karenge taake unko unke ghar walon tak",
        "pohchane mein madad mile, InshaAllah.",
        "Agar likhna mushkil hai to awaaz ka paigham bhi bhej dein۔"
      ].join("\n"),
      HI: [
        "हम कुछ आसान सवाल पूछेंगे ताकि उस व्यक्ति को उनके घरवालों तक पहुँचाने में मदद मिल सके, इंशाअल्लाह।",
        "आप चाहें तो आवाज़ का संदेश भी भेज सकते हैं।"
      ].join("\n"),
      BN: [
        "আমরা কিছু সহজ প্রশ্ন করব যাতে তাকে তার পরিবারে পৌঁছে দিতে সাহায্য করা যায়, ইনশাআল্লাহ।",
        "আপনি চাইলে লিখে বা ভয়েস মেসেজ দিয়ে উত্তর দিতে পারেন।"
      ].join("\n"),
      AR: [
        "سنطرح بعض الأسئلة البسيطة لمساعدة الشخص المفقود على الوصول إلى أسرته، إن شاء الله.",
        "يمكنك الكتابة أو إرسال رسالة صوتية إذا أردت."
      ].join("\n")
    },

    source: {
      EN: [
        "Do you have direct access to the missing person, or did you just see a post / hear about them?",
        "1️⃣ Yes, I have access and can directly connect you.",
        "2️⃣ No, I don’t have access. I only saw a post / heard from someone.",
        "3️⃣ I belong to an organization where the missing person is present."
      ].join("\n"),
      UR: [
        "کیا آپ کے پاس اس گمشدہ شخص تک براہِ راست رسائی ہے یا آپ نے صرف کوئی پوسٹ دیکھی/سنی ہے؟",
        "1️⃣ ہاں، میرے پاس رسائی ہے اور میں براہِ راست ملا سکتا ہوں۔",
        "2️⃣ نہیں، میرے پاس رسائی نہیں۔ صرف پوسٹ دیکھی یا کسی سے سنا ہے۔",
        "3️⃣ میں ایسے ادارے سے تعلق رکھتا ہوں جہاں وہ شخص موجود ہے۔"
      ].join("\n"),
      RUR: [
        "Kya aap ke paas us gumshuda shakhs tak seedhi rasai hai ya sirf post dekhi / kisi se suna hai?",
        "1️⃣ Haan, meri access hai aur main un tak barah-e-raast milwa sakta hoon.",
        "2️⃣ Nahi, meri rasai nahi. Maine sirf post dekhi ya kisi se suna hai.",
        "3️⃣ Main aise idare se taluq rakhta hoon jahan woh shakhs mojood hai۔"
      ].join("\n"),
      HI: [
        "क्या आपके पास उस लापता व्यक्ति तक सीधी पहुँच है, या आपने सिर्फ कोई पोस्ट देखी/सुनी है?",
        "1️⃣ हाँ, मेरे पास पहुँच है और मैं सीधे मिलवा सकता/सकती हूँ।",
        "2️⃣ नहीं, मेरे पास पहुँच नहीं। मैंने सिर्फ पोस्ट देखी या किसी से सुना है।",
        "3️⃣ मैं ऐसे संगठन से जुड़ा/जुड़ी हूँ जहाँ वह व्यक्ति मौजूद है।"
      ].join("\n"),
      BN: [
        "আপনার কি নিখোঁজ ব্যক্তির কাছে সরাসরি পৌঁছানোর সুযোগ আছে, নাকি শুধু পোস্ট দেখেছেন / কারো কাছ থেকে শুনেছেন?",
        "1️⃣ হ্যাঁ, আমার সরাসরি যোগাযোগ আছে।",
        "2️⃣ না, আমার কাছে কোনো যোগাযোগ নেই। শুধু পোস্ট দেখেছি বা শুনেছি।",
        "3️⃣ আমি এমন প্রতিষ্ঠানের সাথে যুক্ত যেখানে নিখোঁজ ব্যক্তি আছেন।"
      ].join("\n"),
      AR: [
        "هل لديك وصول مباشر إلى الشخص المفقود، أم أنك فقط رأيت منشورًا/سمعت عنه؟",
        "1️⃣ نعم، لدي وصول ويمكنني توصيلكم مباشرة.",
        "2️⃣ لا، ليس لدي وصول. فقط رأيت منشورًا أو سمعت من أحد.",
        "3️⃣ أنتمي إلى مؤسسة يوجد فيها هذا الشخص المفقود."
      ].join("\n")
    },

    rejection: {
      EN: [
        "Since you don’t have direct access to the missing person, we are unable to move forward with this case.",
        "If you ever meet or directly interact with the person, please share the details with us."
      ].join("\n"),
      UR: [
        "چونکہ آپ کے پاس گمشدہ شخص تک براہِ راست رسائی نہیں ہے، اس لئے ہم اس کیس میں آگے نہیں بڑھ سکتے۔",
        "اگر کبھی آپ کی ان سے ملاقات یا براہِ راست بات چیت ہو تو براہِ کرم تفصیل سے آگاہ کیجیے گا۔"
      ].join("\n"),
      RUR: [
        "Chunke aap ke paas gumshuda shakhs tak direct rasai nahi hai,",
        "is liye hum is case me aage nahi badh sakte.",
        "Agar kabhi aap ki unse mulaqat ya direct baat ho, to barah-e-karam humein tafseel batayein۔"
      ].join("\n"),
      HI: [
        "क्योंकि आपके पास गुमशुदा व्यक्ति तक सीधी पहुँच नहीं है, इसलिए हम इस केस में आगे नहीं बढ़ सकते।",
        "अगर कभी आपकी उनसे मुलाकात या सीधी बातचीत हो, तो कृपया हमें जानकारी दें।"
      ].join("\n"),
      BN: [
        "যেহেতু আপনার গুম হওয়া ব্যক্তির সাথে সরাসরি যোগাযোগ নেই, তাই আমরা এই কেসে এগোতে পারছি না।",
        "যদি কখনও আপনার তার সাথে দেখা বা সরাসরি কথা হয়, দয়া করে আমাদের জানাবেন।"
      ].join("\n"),
      AR: [
        "بما أنك لا تملك وصولًا مباشرًا إلى الشخص المفقود، لا يمكننا المتابعة في هذه الحالة.",
        "إذا حدث يومًا أن التقيت به أو تواصلت معه مباشرة، فيرجى تزويدنا بالتفاصيل."
      ].join("\n")
    },

    q1: {
      EN: "Where did you meet the missing person?",
      UR: "آپ کو گمشدہ شخص کہاں سے ملا تھا؟",
      RUR: "Aap ko gumshuda shakhs kahan se mila tha?",
      HI: "आपको लापता व्यक्ति कहाँ मिला था?",
      BN: "আপনি নিখোঁজ ব্যক্তিকে কোথায় পেয়েছিলেন?",
      AR: "أين التقيت بالشخص المفقود؟"
    },

    q2: {
      EN: "When did you meet them?",
      UR: "آپ کو وہ کب ملے تھے؟",
      RUR: "Aap ko woh kab mile the?",
      HI: "आप उनसे कब मिले थे?",
      BN: "আপনি কবে তার সাথে দেখা করেছিলেন?",
      AR: "متى التقيت بهم؟"
    },

    q3: {
      EN: "What is their full name?",
      UR: "ان کا پورا نام کیا ہے؟",
      RUR: "Unka poora naam kya hai?",
      HI: "उनका पूरा नाम क्या है?",
      BN: "তার পুরো নাম কী?",
      AR: "ما هو اسمهم الكامل؟"
    },

    q4: {
      EN: "What is their approximate age?",
      UR: "ان کی عمر کتنی ہے؟ (تقریباً بھی بتا سکتے ہیں)",
      RUR: "Unki umar kitni hai? Taqreeban bhi chalegi.",
      HI: "उनकी उम्र कितनी है? (लगभग भी बता सकते हैं)",
      BN: "তাদের বয়স কত? (আনুমানিক হলেও চলবে)",
      AR: "كم عمرهم تقريبًا؟"
    },

    q5: (() => {
      const common = [
        "What is their gender?",
        "Options (All regions):",
        "1️⃣ Male   (Mard / पुरुष / পুরুষ / ذكر)",
        "2️⃣ Female (Aurat / महिला / নারী / أنثى)",
        "3️⃣ Other  (Doosri / अन्य / অন্যান্য / آخر)"
      ].join("\n");
      return {
        EN: common,
        UR: common,
        RUR: common,
        HI: common,
        BN: common,
        AR: common
      };
    })(),

    q6: {
      EN: "Which country do they belong to?",
      UR: "ان کا تعلق کس ملک سے ہے؟",
      RUR: "Unka taluq kis mulk se hai?",
      HI: "उनका ताल्लुक किस देश से है?",
      BN: "তাদের কোন দেশের সাথে সম্পর্কিত?",
      AR: "إلى أي بلد ينتمون؟"
    },

    q7: {
      EN: "Which city/area do they belong to (if remembered)?",
      UR: "ان کا تعلق کس شہر یا علاقے سے ہے؟ (اگر یاد ہو)",
      RUR: "Unka taluq kis shehar ya ilaqe se hai? (agar yaad ہو)",
      HI: "उनका ताल्लुक किस शहर/इलाके से है? (अगर याद हो)",
      BN: "তারা কোন শহর/এলাকা থেকে? (যদি মনে থাকে)",
      AR: "من أي مدينة/منطقة ينتمون (إذا كان يتذكر)؟"
    },

    q8: {
      EN: "Do they remember any landmark or nearby famous place?",
      UR: "کیا انہیں اپنے گھر کے علاقے یا قریبی مشہور جگہ یاد ہے؟",
      RUR: "Kya unko ghar ke ilaqe ya qareebi mashhoor jagah yaad hai?",
      HI: "क्या उन्हें अपने घर का इलाका या पास की कोई मशहूर जगह याद है?",
      BN: "তারা কি তাদের বাড়ির এলাকা বা কাছাকাছি কোনো বিখ্যাত জায়গা মনে রাখে?",
      AR: "هل يتذكرون أي معلم أو مكان مشهور بالقرب من منزلهم؟"
    },

    q9: {
      EN: "Do they remember how they got separated?",
      UR: "کیا انہیں یاد ہے کہ وہ گھر والوں سے کیسے جدا ہوئے؟",
      RUR: "Kya unko yaad hai ke woh ghar walon se kaise juda huay?",
      HI: "क्या उन्हें याद है कि वे घरवालों से कैसे अलग हुए?",
      BN: "তারা কি মনে করতে পারে কীভাবে তারা পরিবার থেকে আলাদা হয়েছে?",
      AR: "هل يتذكرون كيف انفصلوا عن عائلتهم؟"
    },

    q10: {
      EN: "Who raised them after separation?",
      UR: "جدائی کے بعد ان کی پرورش کس نے کی؟",
      RUR: "Judaai ke baad unki parwarish kis ne ki?",
      HI: "जुदाई के बाद उनकी परवरिश किसने की?",
      BN: "বিচ্ছেদের পর তাদের লালন-পালন কে করেছে?",
      AR: "من ربّاهم بعد الانفصال؟"
    },

    q11: {
      EN: "Which country are they currently in?",
      UR: "وہ اس وقت کس ملک میں ہیں؟",
      RUR: "Woh is waqt kis mulk mein hain?",
      HI: "वे इस समय किस देश में हैं?",
      BN: "তারা বর্তমানে কোন দেশে আছে?",
      AR: "في أي بلد هم الآن؟"
    },

    q12: {
      EN: "Which city/area are they currently in?",
      UR: "وہ اس وقت کس شہر یا علاقے میں ہیں؟",
      RUR: "Woh is waqt kis shehar ya ilaqe mein hain?",
      HI: "वे इस समय किस शहर/इलाके में हैं?",
      BN: "তারা বর্তমানে কোন শহর/এলাকায় আছে?",
      AR: "في أي مدينة/منطقة هم الآن؟"
    },

    q13: {
      EN: "Do they remember the name of any family member?",
      UR: "کیا انہیں کسی گھر والے یا رشتہ دار کا نام یاد ہے؟",
      RUR: "Kya unko kisi ghar walay ka naam yaad hai?",
      HI: "क्या उन्हें किसी घरवाले का नाम याद है?",
      BN: "তারা কি কোনো পরিবারের সদস্যের নাম মনে রাখে?",
      AR: "هل يتذكرون اسم أي فرد من العائلة؟"
    },

    q14: {
      EN: "Please share your contact number.",
      UR: "براہ کرم اپنا نمبر یا رابطے کا طریقہ بتائیے۔",
      RUR: "Mehrbani karke apna number batayein.",
      HI: "कृपया अपना नंबर बताइए।",
      BN: "অনুগ্রহ করে আপনার নম্বর দিন।",
      AR: "يرجى مشاركة رقم هاتفك."
    },

    q15: {
      EN: "If you have a photo (then & now), please share both.",
      UR: "اگر آپ کے پاس وہ تصویر ہے جب وہ ملے تھے اور آج کی تصویر بھی ہے تو دونوں بھیج دیں۔",
      RUR: "Agar aapke paas woh tasveer hai jab woh mile the aur aaj ki bhi hai to dono bhej dein۔",
      HI: "अगर आपके पास उनकी पहली मुलाक़ात की और अभी की तस्वीर है तो दोनों भेजें।",
      BN: "যদি আপনার কাছে প্রথম দেখা সময়ের এবং বর্তমানের ছবি থাকে তবে দুটোই পাঠান।",
      AR: "إذا كان لديك صورة أول مرة وصورة حالية، يرجى إرسال كلتاهما."
    }
  };

  /***********************************************************
   * Public helpers consumed by the Flow C router.
   ***********************************************************/
  return {
    sendIntro(session) {
      return select(blocks.intro, resolveLang(session));
    },

    sendQ0(session) {
      return select(blocks.source, resolveLang(session));
    },

    sendRejectNoAccess(session) {
      return select(blocks.rejection, resolveLang(session));
    },

    sendQ1(session) {
      return select(blocks.q1, resolveLang(session));
    },

    sendQ2(session) {
      return select(blocks.q2, resolveLang(session));
    },

    sendQ3(session) {
      return select(blocks.q3, resolveLang(session));
    },

    sendQ4(session) {
      return select(blocks.q4, resolveLang(session));
    },

    sendQ5(session) {
      return select(blocks.q5, resolveLang(session));
    },

    sendQ6(session) {
      return select(blocks.q6, resolveLang(session));
    },

    sendQ7(session) {
      return select(blocks.q7, resolveLang(session));
    },

    sendQ8(session) {
      return select(blocks.q8, resolveLang(session));
    },

    sendQ9(session) {
      return select(blocks.q9, resolveLang(session));
    },

    sendQ10(session) {
      return select(blocks.q10, resolveLang(session));
    },

    sendQ11(session) {
      return select(blocks.q11, resolveLang(session));
    },

    sendQ12(session) {
      return select(blocks.q12, resolveLang(session));
    },

    sendQ13(session) {
      return select(blocks.q13, resolveLang(session));
    },

    sendQ14(session) {
      return select(blocks.q14, resolveLang(session));
    },

    sendQ15(session) {
      return select(blocks.q15, resolveLang(session));
    }
  };
})();
