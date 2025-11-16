/************************************************************
 * Texts_UserTypes.gs — User Type Menu (Region specific blocks)
 ************************************************************/

const Texts_UserTypes = {

  sendMenu(session) {

    const region = session.Region_Group || "OTHER";

    const map = {
      PK: [
        "Please tell us who you are so we can help better.",
        "براہ کرم بتائیں آپ کس صورت میں مدد چاہتے ہیں؟",
        "Barah-e-karam batayein aap kis surat mein madad chahte hain?",
        "1️⃣ I’m searching for a missing loved one.",
        "   میں کسی کھوئے ہوئے شخص کو ڈھونڈ رہا/رہی ہوں۔",
        "   Main kisi khoe hue shakhs ko dhoond raha/rahi hoon.",
        "2️⃣ I’m lost and looking for my family.",
        "      میں خود کھو گیا/گئی ہوں اور اپنے گھر والوں سے رابطہ کرنا چاہتا/چاہتی ہوں۔",
        "      Main khud kho gaya/kho gayi hoon aur apne ghar walon se raabta karna chahta/chahti hoon.",
        "3️⃣ I know someone who is missing and I want to help.",
        "         میں کسی گمشدہ شخص کو جانتا/جانتی ہوں اور اس کی مدد کرنا چاہتا/چاہتی ہوں۔",
        "         Main kisi gumshuda shakhs ko jaanta/jaanti hoon aur uski madad karna chahta/chahti hoon."
      ].join("\n"),

      IN: [
        "Please tell us who you are so we can help better.",
        "कृपया हमें बताइए कि आप कौन हैं ताकि हम बेहतर मदद कर सकें।",
        "1️⃣ I’m searching for a missing loved one.",
        "   मैं किसी खोए हुए व्यक्ति को ढूंढ रहा/रही हूँ।",
        "2️⃣ I’m lost and looking for my family.",
        "      मैं खुद खो गया/गई हूँ और अपने परिवार से संपर्क करना चाहता/चाहती हूँ।",
        "3️⃣ I know someone who is missing and I want to help.",
        "         मैं किसी गुमशुदा व्यक्ति को जानता/जानती हूँ और उसकी मदद करना चाहता/चाहती हूँ।"
      ].join("\n"),

      BD: [
        "Please tell us who you are so we can help better.",
        "অনুগ্রহ করে আমাদের বলুন আপনি কে, যাতে আমরা আরও ভালোভাবে সাহায্য করতে পারি।",
        "1️⃣ I’m searching for a missing loved one.",
        "   আমি একজন নিখোঁজ প্রিয়জনকে খুঁজছি।",
        "2️⃣ I’m lost and looking for my family.",
        "      আমি নিজেই হারিয়ে গেছি এবং আমার পরিবারের সাথে যোগাযোগ করতে চাই।",
        "3️⃣ I know someone who is missing and I want to help.",
        "         আমি একজন নিখোঁজ ব্যক্তিকে চিনি এবং আমি সাহায্য করতে চাই।"
      ].join("\n"),

      ME: [
        "Please tell us who you are so we can help better.",
        "من فضلك أخبرنا من أنت حتى نتمكن من مساعدتك بشكل أفضل.",
        "1️⃣ I’m searching for a missing loved one.",
        "   أنا أبحث عن شخص مفقود من أحبائي.",
        "2️⃣ I’m lost and looking for my family.",
        "      أنا ضائع وأبحث عن عائلتي.",
        "3️⃣ I know someone who is missing and I want to help.",
        "         أنا أعرف شخصًا مفقودًا وأريد أن أساعده."
      ].join("\n"),

      OTHER: [
        "Please tell us who you are so we can help better.",
        "1️⃣ I’m searching for a missing loved one.",
        "2️⃣ I’m lost and looking for my family.",
        "3️⃣ I know someone who is missing and I want to help."
      ].join("\n")
    };

    return map[region] || map.OTHER;
  }
};


/************************************************************
 * REGISTER INTO GLOBAL TEXTS WRAPPER
 ************************************************************/

// Ensure global Texts object exists
if (typeof Texts === "undefined") {
  var Texts = {};
}

// Safely extend the Texts object
Texts.sendUserTypeMenu = function(session) {
  return Texts_UserTypes.sendMenu(session);
};
