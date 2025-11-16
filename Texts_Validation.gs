/***************************************************************
 * Texts_Validation.gs — Additional Logic 3–8
 * -----------------------------------------------------------------
 * Holds every validation / reminder message mandated by the
 * “Full n Final Flow Updated.txt” spec. All text blocks are copied
 * verbatim (EN, UR, RUR, HI, BN, AR) for:
 *   1) Invalid menu option selections
 *   2) Invalid free-text responses
 *   3) Photo-required reminders
 *   4) Voice-note not accepted notices
 *   5) Unexpected keyword nudges
 *   6) Session timeout reminders
 ***************************************************************/

const Texts_Validation = (() => {
  /**
   * Central repository of validation text blocks.
   */
  const BLOCKS = {
    invalidOption: {
      EN: [
        "❌ Invalid option.",
        "Please select one of the valid numbers from the menu."
      ].join("\n"),
      UR: [
        "❌ غلط آپشن۔",
        "براہ کرم مینو میں سے درست نمبر منتخب کریں۔"
      ].join("\n"),
      RUR: [
        "❌ Ghalat option.",
        "Barah-e-karam menu me se sahi number select karein."
      ].join("\n"),
      HI: [
        "❌ गलत विकल्प।",
        "कृपया मेनू में दिए गए सही नंबरों में से एक चुनें।"
      ].join("\n"),
      BN: [
        "❌ ভুল অপশন।",
        "অনুগ্রহ করে মেনু থেকে সঠিক নম্বরটি নির্বাচন করুন।"
      ].join("\n"),
      AR: [
        "❌ خيار غير صحيح.",
        "يرجى اختيار رقم صحيح من القائمة."
      ].join("\n")
    },

    invalidText: {
      EN: [
        "⚠️ I couldn’t understand your message.",
        "Please answer the question clearly."
      ].join("\n"),
      UR: [
        "⚠️ معذرت، میں سمجھ نہیں سکا。",
        "براہ کرم سوال کا واضح جواب دیں۔"
      ].join("\n"),
      RUR: [
        "⚠️ Maazrat, main samajh nahi saka.",
        "Barah-e-karam sawal ka wazeh jawab dein."
      ].join("\n"),
      HI: [
        "⚠️ मुझे आपकी बात समझ नहीं आई。",
        "कृपया सवाल का सही जवाब दें।"
      ].join("\n"),
      BN: [
        "⚠️ দুঃখিত, আমি বুঝতে পারিনি।",
        "অনুগ্রহ করে প্রশ্নের সঠিক উত্তর দিন।"
      ].join("\n"),
      AR: [
        "⚠️ عذرًا، لم أفهم رسالتك.",
        "يرجى توضيح الإجابة على السؤال."
      ].join("\n")
    },

    photoRequired: {
      EN: [
        "📸 A photo was required.",
        "Please send the picture now."
      ].join("\n"),
      UR: [
        "📸 تصویر درکار تھی۔",
        "براہ کرم ابھی تصویر بھیجیں۔"
      ].join("\n"),
      RUR: [
        "📸 Tasveer zaroori thi.",
        "Meherbani karke ab tasveer bhej dein."
      ].join("\n"),
      HI: [
        "📸 यहाँ फोटो भेजनी थी।",
        "कृपया अभी फोटो भेजें।"
      ].join("\n"),
      BN: [
        "📸 এখানে একটি ছবি প্রয়োজন ছিল।",
        "অনুগ্রহ করে এখন ছবি পাঠান।"
      ].join("\n"),
      AR: [
        "📸 كان من المفترض إرسال صورة.",
        "يرجى إرسال الصورة الآن."
      ].join("\n")
    },

    voiceNotAllowed: {
      EN: [
        "🎤 I received a voice note, but this step needs a written answer.",
        "Please type your reply."
      ].join("\n"),
      UR: [
        "🎤 وائس نوٹ موصول ہوا، مگر اس سوال کا جواب لکھ کر دینا ضروری ہے۔",
        "براہ کرم اپنا جواب لکھیں۔"
      ].join("\n"),
      RUR: [
        "🎤 Voice note mila hai, lekin yahan likh kar jawaab dena zaroori hai.",
        "Barah-e-karam reply type karein."
      ].join("\n"),
      HI: [
        "🎤 वॉइस नोट मिला, लेकिन यहाँ लिखित जवाब ज़रूरी है।",
        "कृपया अपना उत्तर टाइप करें।"
      ].join("\n"),
      BN: [
        "🎤 ভয়েস নোট পাওয়া গেছে, কিন্ত এই ধাপে লিখিত উত্তর প্রয়োজন।",
        "অনুগ্রহ করে টাইপ করে উত্তর দিন।"
      ].join("\n"),
      AR: [
        "🎤 وصلنا مقطع صوتي، لكن هذه الخطوة تحتاج إلى إجابة مكتوبة.",
        "يرجى كتابة ردك."
      ].join("\n")
    },

    unexpectedKeyword: {
      EN: [
        "ℹ I will continue from the previous question.",
        "Please answer the question shown above."
      ].join("\n"),
      UR: [
        "ℹ میں پچھلے سوال سے گفتگو جاری رکھوں گا۔",
        "براہ کرم اوپر پوچھے گئے سوال کا جواب دیں۔"
      ].join("\n"),
      RUR: [
        "ℹ Main pichlay sawal se flow continue kar raha hoon.",
        "Barah-e-karam upar wale sawal ka jawab dein."
      ].join("\n"),
      HI: [
        "ℹ मैं पिछले प्रश्न से आगे बढ़ रहा हूँ।",
        "कृपया उसी का जवाब दीजिए।"
      ].join("\n"),
      BN: [
        "ℹ আমি আগের প্রশ্ন থেকে আবার শুরু করছি।",
        "অনুগ্রহ করে সেই প্রশ্নের উত্তর দিন।"
      ].join("\n"),
      AR: [
        "ℹ سأكمل من السؤال السابق.",
        "يرجى الإجابة على السؤال الموجود بالأعلى."
      ].join("\n")
    },

    sessionTimeout: {
      EN: [
        "⏳ Your session was inactive for a long time.",
        "I will repeat the last question."
      ].join("\n"),
      UR: [
        "⏳ آپ کافی دیر غیر فعال رہے تھے۔",
        "میں آخری سوال دوبارہ بھیج رہا ہوں۔"
      ].join("\n"),
      RUR: [
        "⏳ Aap kaafi dair inactive rahe.",
        "Main aakhri sawal repeat kar raha hoon."
      ].join("\n"),
      HI: [
        "⏳ आप काफी देर तक निष्क्रिय थे।",
        "मैं पिछला सवाल दोबारा भेज रहा हूँ।"
      ].join("\n"),
      BN: [
        "⏳ আপনি অনেকক্ষণ নিষ্ক্রিয় ছিলেন।",
        "আমি আগের প্রশ্নটি আবার পাঠাচ্ছি।"
      ].join("\n"),
      AR: [
        "⏳ لقد كنت غير نشط لفترة طويلة.",
        "سأعيد إرسال السؤال الأخير."
      ].join("\n")
    }
  };

  const DEFAULT_LANGUAGE = "EN";

  /**
   * Resolves the preferred language and falls back to English when the
   * session has not yet stored a preference. This keeps all validation
   * responses deterministic even if the flow is still in STEP 0/1.
   */
  const resolveLanguage = (session) => {
    const lang = (session && session.Preferred_Language) || DEFAULT_LANGUAGE;
    return BLOCKS.invalidOption[lang] ? lang : DEFAULT_LANGUAGE;
  };

  return {
    sendInvalidOption(session) {
      return BLOCKS.invalidOption[resolveLanguage(session)];
    },
    sendInvalidText(session) {
      return BLOCKS.invalidText[resolveLanguage(session)];
    },
    sendPhotoRequired(session) {
      return BLOCKS.photoRequired[resolveLanguage(session)];
    },
    sendVoiceNotAllowed(session) {
      return BLOCKS.voiceNotAllowed[resolveLanguage(session)];
    },
    sendUnexpectedKeywordReminder(session) {
      return BLOCKS.unexpectedKeyword[resolveLanguage(session)];
    },
    sendSessionExpiredReminder(session) {
      return BLOCKS.sessionTimeout[resolveLanguage(session)];
    }
  };
})();

/***************************************************************
 * REGISTER INTO GLOBAL TEXTS WRAPPER
 ***************************************************************/
if (typeof Texts === "undefined") {
  var Texts = {};
}

Texts.sendInvalidOption = (session) => Texts_Validation.sendInvalidOption(session);
Texts.sendInvalidText = (session) => Texts_Validation.sendInvalidText(session);
Texts.sendPhotoRequired = (session) => Texts_Validation.sendPhotoRequired(session);
Texts.sendVoiceNotAllowed = (session) => Texts_Validation.sendVoiceNotAllowed(session);
Texts.sendUnexpectedKeywordReminder = (session) => Texts_Validation.sendUnexpectedKeywordReminder(session);
Texts.sendSessionExpiredReminder = (session) => Texts_Validation.sendSessionExpiredReminder(session);
