/***************************************************************
 * Texts_Closing.gs — Closing Messages (All Flows)
 ***************************************************************/

const Texts_Closing = {

  sendClosing(session) {
    const lang = (session.Preferred_Language || "EN").toUpperCase();
    const step = session.Current_Step_Code || "";
    const flow = (session.Temp && session.Temp.flow) || session.Flow_Type || "";

    let context = (flow || "").toString().toUpperCase();
    if (step.indexOf("REJECTED") !== -1) {
      context = "REJECTION";
    }
    if (!context) {
      context = "GENERAL";
    }

    const base = {
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
    };

    const contexts = {
      A: base,
      B: base,
      C: base,
      REJECTION: base,
      GENERAL: base
    };

    const block = contexts[context] || contexts.GENERAL;
    return block[lang] || block.EN;
  }
};


/***************************************************************
 * Register with global Texts namespace
 ***************************************************************/
if (typeof Texts === "undefined") {
  var Texts = {};
}

Texts.Closing = Texts_Closing;
Texts.sendClosing = function(session) {
  return Texts_Closing.sendClosing(session);
};
