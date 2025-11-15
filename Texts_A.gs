/***************************************************************
 * Texts_A.gs — FLOW A (Q1–Q9)
 ***************************************************************/

const Texts_A = {

  /*********************** Q1 ************************/
  sendQ1(session) {
    const lang = session.Preferred_Language;
    const map = {
      EN: "Please tell us the full name of the missing person.",
      UR: "براہ کرم لاپتہ شخص کا پورا نام بتائیں۔",
      RUR: "Barah-e-karam laapata shaks ka poora naam batayein.",
      HI: "कृपया लापता व्यक्ति का पूरा नाम बताएं।",
      BN: "দয়া করে নিখোঁজ ব্যক্তির পুরো নাম লিখুন।",
      AR: "يرجى تزويدنا بالاسم الكامل للشخص المفقود."
    };
    return map[lang] || map.EN;
  },

  /*********************** Q2 ************************/
  sendQ2(session) {
    const lang = session.Preferred_Language;
    const map = {
      EN: "What is your relationship to the missing person?",
      UR: "آپ کا لاپتہ شخص سے کیا رشتہ ہے؟",
      RUR: "Aap ka rishta kya hai laapata shaks se?",
      HI: "लापता व्यक्ति से आपका क्या संबंध है?",
      BN: "নিখোঁজ ব্যক্তির সাথে আপনার সম্পর্ক কী?",
      AR: "ما علاقتك بالشخص المفقود؟"
    };
    return map[lang] || map.EN;
  },

  /*********************** Q3 ************************/
  sendQ3(session) {
    const lang = session.Preferred_Language;
    const map = {
      EN: "How old is the missing person?",
      UR: "لاپتہ شخص کی عمر کیا ہے؟",
      RUR: "Laapata shaks ki umar kya hai?",
      HI: "लापता व्यक्ति की उम्र क्या है?",
      BN: "নিখোঁজ ব্যক্তির বয়স কত?",
      AR: "كم عمر الشخص المفقود؟"
    };
    return map[lang] || map.EN;
  },

  sendInvalidAge(session) {
    const lang = session.Preferred_Language;
    const map = {
      EN: "Please enter a valid number for age.",
      UR: "براہ کرم عمر کے لیے درست عدد لکھیں۔",
      RUR: "Umar ke liye sahi number likhein.",
      HI: "कृपया उम्र के लिए सही नंबर लिखें।",
      BN: "অনুগ্রহ করে বয়সের জন্য একটি সঠিক সংখ্যা লিখুন।",
      AR: "يرجى إدخال رقم صالح للعمر."
    };
    return map[lang] || map.EN;
  },

  /*********************** Q4 ************************/
  sendQ4(session) {
    const lang = session.Preferred_Language;
    const map = {
      EN: "Where was the missing person last seen?",
      UR: "لاپتہ شخص کو آخری بار کہاں دیکھا گیا تھا؟",
      RUR: "Aakhri baar kahan dekha gaya tha?",
      HI: "लापता व्यक्ति आखिरी बार कहाँ देखा गया था?",
      BN: "নিখোঁজ ব্যক্তিকে সর্বশেষ কোথায় দেখা গিয়েছিল?",
      AR: "أين شوهد الشخص المفقود آخر مرة؟"
    };
    return map[lang] || map.EN;
  },

  /*********************** Q5 ************************/
  sendQ5(session) {
    const lang = session.Preferred_Language;
    const map = {
      EN: "When was the missing person last seen? (Date/Time)",
      UR: "لاپتہ شخص کو آخری بار کب دیکھا گیا تھا؟ (تاریخ/وقت)",
      RUR: "Kab aakhri baar dekha gaya tha? (Date/Time)",
      HI: "लापता व्यक्ति को आखिरी बार कब देखा गया था? (तारीख/समय)",
      BN: "নিখোঁজ ব্যক্তিকে শেষ কবে দেখা গিয়েছিল? (তারিখ/সময়)",
      AR: "متى شوهد الشخص المفقود آخر مرة؟ (تاريخ/وقت)"
    };
    return map[lang] || map.EN;
  },

  /*********************** Q6 ************************/
  sendQ6(session) {
    const lang = session.Preferred_Language;
    const map = {
      EN: "What was the person wearing last?",
      UR: "لاپتہ شخص نے آخری بار کیا پہنا ہوا تھا؟",
      RUR: "Laapata shaks ne aakhri baar kya pehna tha?",
      HI: "लापता व्यक्ति ने आखिरी बार क्या पहना था?",
      BN: "নিখোঁজ ব্যক্তি শেষবার কি পরেছিলেন?",
      AR: "ماذا كان يرتدي آخر مرة؟"
    };
    return map[lang] || map.EN;
  },

  /*********************** Q7 ************************/
  sendQ7(session) {
    const lang = session.Preferred_Language;
    const map = {
      EN: "Please describe the physical appearance of the missing person.",
      UR: "براہ کرم لاپتہ شخص کی جسمانی ساخت بیان کریں۔",
      RUR: "Laapata shaks ki jismani soorat bayan karein.",
      HI: "कृपया लापता व्यक्ति का शारीरिक विवरण बताएं।",
      BN: "নিখোঁজ ব্যক্তির শারীরিক বর্ণনা দিন।",
      AR: "يرجى وصف الشكل الجسدي للشخص المفقود."
    };
    return map[lang] || map.EN;
  },

  /*********************** Q8 ************************/
  sendQ8(session) {
    const lang = session.Preferred_Language;
    const map = {
      EN: "Does the missing person have any disability or medical condition?",
      UR: "کیا لاپتہ شخص کو کوئی معذوری یا بیماری ہے؟",
      RUR: "Kya unhein koi mazoori ya bemari hai?",
      HI: "क्या लापता व्यक्ति को कोई विकलांगता या बीमारी है?",
      BN: "নিখোঁজ ব্যক্তির কি কোনো শারীরিক প্রতিবন্ধকতা বা অসুস্থতা আছে?",
      AR: "هل لدى الشخص المفقود أي إعاقة أو حالة طبية؟"
    };
    return map[lang] || map.EN;
  },

  /*********************** Q9 ************************/
  sendQ9(session) {
    const lang = session.Preferred_Language;
    const map = {
      EN: "Please tell us the last phone number they used or had access to.",
      UR: "براہ کرم وہ آخری فون نمبر بتائیں جس تک ان کی رسائی تھی۔",
      RUR: "Aakhri phone number batayein jis tak unki rasai thi.",
      HI: "कृपया वह आखिरी फोन नंबर बताएं जो वह उपयोग कर रहे थे।",
      BN: "শেষ যে ফোন নম্বর তারা ব্যবহার করতেন সেটি লিখুন।",
      AR: "يرجى تزويدنا بآخر رقم هاتف استخدمه أو كان لديه وصول إليه."
    };
    return map[lang] || map.EN;
  }

};
