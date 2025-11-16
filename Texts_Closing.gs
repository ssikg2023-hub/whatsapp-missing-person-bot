/***************************************************************
 * Texts_Closing.gs — Official Closing Messages
 * -------------------------------------------------------------------
 * Contains ONLY the dua/closing texts specified inside
 * “Full n Final Flow Updated.txt”. All strings are copied
 * verbatim and surfaced via helpers for:
 *   1) Standard closing message (successful case submission).
 *   2) Final closing message after the user declines to resubmit
 *      following a rejection (police/agency jurisdiction or
 *      no-access scenario).
 ***************************************************************/

const Texts_Closing = (() => {
  /** Supported language codes defined in the master spec. */
  const SUPPORTED = ["EN", "UR", "RUR", "HI", "BN", "AR"];

  /** Simple helper to resolve the preferred language safely. */
  const resolveLang = (session) => {
    const pref = (session && session.Preferred_Language) || "EN";
    const upper = pref.toUpperCase();
    return SUPPORTED.includes(upper) ? upper : "EN";
  };

  /** Returns the message for a given block + language with EN fallback. */
  const select = (block, lang) => block[lang] || block.EN;

  /***********************************************************
   * Exact text blocks (verbatim from the source of truth)
   ***********************************************************/
  const blocks = {
    /** Standard closing message used after successful submissions. */
    general: {
      EN: [
        "May Allah reunite every family with their loved ones. Ameen.",
        "Thank you for trusting us."
      ].join("\n"),
      UR: [
        "اللہ ہر خاندان کو ان کے پیاروں سے ملائے۔ آمین۔",
        "ہم پر بھروسہ کرنے کا شکریہ۔"
      ].join("\n"),
      RUR: [
        "Allah har khandaan ko unke pyaron se milaye. Ameen.",
        "Hum par bharosa karne ka shukriya."
      ].join("\n"),
      HI: [
        "अल्लाह हर परिवार को उनके अपनों से मिला दे। आमीन।",
        "हम पर भरोसा करने के लिए शुक्रिया।"
      ].join("\n"),
      BN: [
        "আল্লাহ প্রতিটি পরিবারকে তাদের প্রিয়জনদের সাথে মিলিয়ে দিন। আমীন।",
        "আমাদের উপর ভরসা করার জন্য ধন্যবাদ।"
      ].join("\n"),
      AR: [
        "اللهم اجمع كل أسرة مع أحبّائها. آمين.",
        "شكراً لثقتكم بنا."
      ].join("\n")
    },

    /** Final closing message when the user selects “No” after a rejection. */
    rejectionFinal: {
      EN: [
        "Thank you for understanding that we are unable to take cases that fall under police or agency jurisdiction.",
        "May Allah reunite every family with their loved ones. Ameen.",
        "We truly appreciate your cooperation and trust."
      ].join("\n"),
      UR: [
        "آپ کا شکریہ کہ آپ نے یہ سمجھا کہ پولیس یا ایجنسی کے دائرہ اختیار میں آنے والے کیسز ہم نہیں لے سکتے۔",
        "اللہ ہر خاندان کو ان کے پیاروں سے ملا دے۔ آمین۔",
        "ہم آپ کے تعاون اور اعتماد کے بےحد شکر گزار ہیں۔"
      ].join("\n"),
      RUR: [
        "Shukriya ke aap ne samjha ke police ya agency ke domain mein aane wale cases hum handle nahi kar sakte۔",
        "Allah har khandaan ko unke pyaron se mila de. Ameen۔",
        "Aap ke ta'awun aur aitmaad ka bohat shukriya۔"
      ].join("\n"),
      HI: [
        "धन्यवाद कि आपने समझा कि पुलिस या एजेंसी से जुड़े मामलों को हम नहीं ले सकते।",
        "अल्लाह हर परिवार को उनके अपनों से मिला दे। आमीन।",
        "आपके सहयोग और भरोसे के लिए हम दिल से आभारी हैं।"
      ].join("\n"),
      BN: [
        "ধন্যবাদ, আপনি বুঝেছেন যে পুলিশ বা এজেন্সির আওতাধীন কেস আমরা গ্রহণ করতে পারি না।",
        "আল্লাহ प्रतিটি পরিবারকে তাদের প্রিয়জনদের সাথে পুনরায় মিলিয়ে দিন। আমীন।",
        "আপনার সহযোগিতা ও বিশ্বাসের জন্য আমরা আন্তরিকভাবে কৃতজ্ঞ।"
      ].join("\n"),
      AR: [
        "شكرًا لتفهمكم أننا لا نستطيع التعامل مع القضايا التابعة لاختصاص الشرطة أو الجهات الأمنية۔",
        "اللهم اجمع كل أسرة بأحبّائها قريبًا. آمين۔",
        "نحن نُقدّر تعاونكم وثقتكم بنا."
      ].join("\n")
    }
  };

  return {
    /**
     * Returns the standard closing dua (successful submission).
     */
    sendClosing(session) {
      return select(blocks.general, resolveLang(session));
    },

    /**
     * Returns the longer closing message used after a rejection when
     * the user chooses not to start a new case.
     */
    sendRejectionClosing(session) {
      return select(blocks.rejectionFinal, resolveLang(session));
    }
  };
})();

/***************************************************************
 * Register with the global Texts namespace for convenience
 ***************************************************************/
if (typeof Texts === "undefined") {
  var Texts = {};
}

Texts.Closing = Texts_Closing;
Texts.sendClosing = function(session) {
  return Texts_Closing.sendClosing(session);
};
Texts.sendRejectionClosing = function(session) {
  return Texts_Closing.sendRejectionClosing(session);
};
