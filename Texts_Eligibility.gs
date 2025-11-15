/***************************************************************
 * Texts_Eligibility.gs — FLOW A Eligibility (YES/NO) — CLEAN & SAFE
 ***************************************************************/

const Texts_Eligibility = {

  /***********************************************************
   * SEND ELIGIBILITY QUESTION
   ***********************************************************/
  sendEligibilityQuestion(session) {
    const lang = session.Preferred_Language;
    const region = session.Region_Group;

    const map = {

      /* ====================== 🇵🇰 PAKISTAN ====================== */
      PK: {
        EN:
`Before we begin, please clarify one thing:
Has your loved one been arrested by the police or any agency?

1️⃣ Yes / Haan
2️⃣ No / Nahi`,

        UR:
`شروع کرنے سے پہلے، ایک بات بتا دیں:
کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟

1️⃣ جی ہاں
2️⃣ نہیں`,

        RUR:
`Shuru karne se pehle, ek baat bata dein:
Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?

1️⃣ Haan
2️⃣ Nahi`
      },

      /* ====================== 🇮🇳 INDIA ====================== */
      IN: {
        EN:
`Before we begin, please clarify one thing:
Has your loved one been arrested by the police or any agency?

1️⃣ Yes / Haan / हाँ
2️⃣ No / Nahi / नहीं`,

        HI:
`शुरू करने से पहले, कृपया एक बात बताइए:
क्या आपके प्रियजन को पुलिस या किसी एजेंसी ने गिरफ्तार किया है?

1️⃣ हाँ
2️⃣ नहीं`,

        UR:
`شروع کرنے سے پہلے، ایک بات بتا دیں:
کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟

1️⃣ جی ہاں
2️⃣ نہیں`,

        RUR:
`Shuru karne se pehle, ek baat bata dein:
Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?

1️⃣ Haan
2️⃣ Nahi`
      },

      /* ====================== 🇧🇩 BANGLADESH ====================== */
      BD: {
        EN:
`Before we begin, please clarify one thing:
Has your loved one been arrested by the police or any agency?

1️⃣ Yes / Haan / হ্যাঁ
2️⃣ No / Nahi / না`,

        BN:
`শুরু করার আগে, দয়া করে একটি কথা বলুন:
আপনার প্রিয়জনকে কি পুলিশ বা কোনো এজেন্সি গ্রেফতার করেছে?

1️⃣ হ্যাঁ
2️⃣ না`,

        UR:
`شروع کرنے سے پہلے، ایک بات بتا دیں:
کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟

1️⃣ جی ہاں
2️⃣ نہیں`,

        RUR:
`Shuru karne se pehle, ek baat bata dein:
Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?

1️⃣ Haan
2️⃣ Nahi`
      },

      /* ====================== 🌍 MIDDLE EAST ====================== */
      ME: {
        EN:
`Before we begin, please clarify one thing:
Has your loved one been arrested by the police or any agency?

1️⃣ Yes / Haan / نعم
2️⃣ No / Nahi / لا`,

        AR:
`قبل أن نبدأ، يرجى توضيح أمر واحد:
هل تم اعتقال قريبك من قبل الشرطة أو أي جهة؟

1️⃣ نعم
2️⃣ لا`,

        UR:
`شروع کرنے سے پہلے، ایک بات بتا دیں:
کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟

1️⃣ جی ہاں
2️⃣ نہیں`,

        RUR:
`Shuru karne se pehle, ek baat bata dein:
Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?

1️⃣ Haan
2️⃣ Nahi`
      },

      /* ====================== 🌐 OTHER ====================== */
      OTHER: {
        EN:
`Before we begin, please clarify one thing:
Has your loved one been arrested by the police or any agency?

1️⃣ Yes / Haan
2️⃣ No / Nahi`,

        UR:
`شروع کرنے سے پہلے، ایک بات بتا دیں:
کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟

1️⃣ جی ہاں
2️⃣ نہیں`,

        RUR:
`Shuru karne se pehle, ek baat bata dein:
Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?

1️⃣ Haan
2️⃣ Nahi`
      }
    };

    return (map[region] && map[region][lang]) ? map[region][lang] : map.OTHER.EN;
  },

  /***********************************************************
   * ELIGIBILITY REJECTION MESSAGE
   ***********************************************************/
  sendEligibilityRejection(session) {
    const lang = session.Preferred_Language;

    const map = {
      EN: `We’re truly sorry for your situation. Unfortunately, we are not able to take such cases.`,
      UR: `ہم آپ کے دکھ میں شریک ہیں لیکن ہم پولیس یا ایجنسی کے کیسز نہیں لیتے۔`,
      RUR: `Hum aap ke dukh mein shareek hain, lekin hum police ya agency ke cases handle nahi karte.`,
      HI: `हमें आपकी स्थिति के लिए बहुत खेद है। दुर्भाग्यवश, हम ऐसे मामलों को नहीं ले सकते।`,
      BN: `আমরা আপনার পরিস্থিতির জন্য আন্তরিকভাবে দুঃখিত। দুর্ভাগ্যবশত, আমরা এ ধরনের কেস নিতে পারি না।`,
      AR: `نحن آسفون جدًا لوضعك. للأسف، لا يمكننا التعامل مع مثل هذه الحالات.`
    };

    return map[lang] || map.EN;
  },

  /***********************************************************
   * AFTER REJECTION → Ask “Restart or End?”
   ***********************************************************/
  sendEligibilityAfterRejectAsk(session) {
    const lang = session.Preferred_Language;

    const map = {
      EN:
`Would you like to submit a new case?
1️⃣ Yes
2️⃣ No`,

      UR:
`کیا آپ کوئی نیا کیس جمع کروانا چاہتے ہیں؟
1️⃣ جی ہاں
2️⃣ نہیں`,

      RUR:
`Kya aap koi naya case submit karna chahte hain?
1️⃣ Haan
2️⃣ Nahi`,

      HI:
`क्या आप नया केस जमा करना चाहते हैं?
1️⃣ हाँ
2️⃣ नहीं`,

      BN:
`আপনি কি একটি নতুন কেস জমা দিতে চান?
1️⃣ হ্যাঁ
2️⃣ না`,

      AR:
`هل ترغب في تقديم بلاغ جديد؟
1️⃣ نعم
2️⃣ لا`
    };

    return map[lang] || map.EN;
  }

};
