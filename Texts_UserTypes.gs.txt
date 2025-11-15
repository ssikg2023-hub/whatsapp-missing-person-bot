/************************************************************
 * Texts_UserTypes.gs — User Type Menu (Final Multilingual)
 ************************************************************/

const Texts_UserTypes = {

  sendMenu(session) {

    const lang = session.Preferred_Language || "EN";

    const map = {
      EN:
`Please tell us how we can help:

1️⃣ I am looking for a missing person.
2️⃣ I am the missing person.
3️⃣ I know a missing person and want to help.`,

      UR:
`براہ کرم بتائیں آپ کس صورت میں مدد چاہتے ہیں؟

1️⃣ میں کسی کھوئے ہوئے شخص کو ڈھونڈ رہا/رہی ہوں۔
2️⃣ میں خود کھو گیا/گئی ہوں اور اپنے گھر والوں سے رابطہ چاہتا/چاہتی ہوں۔
3️⃣ میں کسی گمشدہ شخص کو جانتا/جانتی ہوں اور اس کی مدد کرنا چاہتا/چاہتی ہوں۔`,

      RUR:
`Barah-e-karam batayein aap kis surat mein madad chahte hain?

1️⃣ Main kisi khoe hue shakhs ko dhoond raha/rahi hoon.
2️⃣ Main khud kho gaya/gayi hoon aur apne ghar walon se raabta karna chahta/chahti hoon.
3️⃣ Main kisi gumshuda shakhs ko jaanta/jaanti hoon aur uski madad karna chahta/chahti hoon.`,

      HI:
`कृपया बताएं कि आपको किस प्रकार की सहायता चाहिए:

1️⃣ मैं किसी गुमशुदा व्यक्ति को खोज रहा/रही हूँ।
2️⃣ मैं स्वयं गुम हो गया/गई हूँ और घरवालों से संपर्क करना चाहता/चाहती हूँ।
3️⃣ मैं किसी गुमशुदा व्यक्ति को जानता/जानती हूँ और उसकी मदद करना चाहता/चाहती हूँ।`
    };

    return map[lang] || map.EN;
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
