/********************************************************************
 * Texts_ExistingCases.gs — EXISTING CASES / MULTIPLE CASES / UPDATES
 * CLEAN, STABLE, GAS-SAFE VERSION
 ********************************************************************/

const Texts_ExistingCases = {

  /************************************************************
   * MAIN MENU — When 1 case exists
   ************************************************************/
  sendExistingCaseMenu(session, caseID) {
    const lang = session.Preferred_Language;

    const map = {

      EN:
`Our system shows that you have already submitted a case from this number.
Your last case ID is: ${caseID}
Please choose an option:
1️⃣ Review your submitted case details
2️⃣ Check the status of your case
3️⃣ Submit a new case
4️⃣ I want to update my submitted case`,

      UR:
`ہمارے سسٹم کے مطابق آپ اس نمبر سے پہلے ہی ایک کیس جمع کر چکے ہیں۔
آپ کا آخری کیس نمبر ہے: ${caseID}
براہِ کرم ایک آپشن منتخب کریں:
1️⃣ میں اپنے جمع شدہ کیس کی تفصیل دیکھنا چاہتا/چاہتی ہوں۔
2️⃣ میں اپنے کیس کی موجودہ صورتحال جاننا چاہتا/چاہتی ہوں۔
3️⃣ میں نیا کیس جمع کروانا چاہتا/چاہتی ہوں۔
4️⃣ میں اپنے جمع شدہ کیس میں اپڈیٹ دینا چاہتا/چاہتی ہوں۔`,

      RUR:
`Hamare nizaam ke mutabiq aap is number se pehle hi ek case submit kar chuke hain.
Aap ka aakhri case number hai: ${caseID}
Barah-e-karam ek option ka intikhab karein:
1️⃣ Submit kiya hua case ki tafseel dekhna chahta/chahti hoon.
2️⃣ Apne case ki maujooda status maloom karna chahta/chahti hoon.
3️⃣ Naya case submit karna chahta/chahti hoon.
4️⃣ Main apne submit kiye gaye case mein update dena chahta/chahti hoon.`,

      HI:
`हमारे सिस्टम के अनुसार आपने इस नंबर से पहले ही एक केस दर्ज किया है।
आपका आखिरी केस नंबर है: ${caseID}
कृपया एक विकल्प चुनें:
1️⃣ मैं अपने सबमिट किए गए केस की डिटेल देखना चाहता/चाहती हूँ।
2️⃣ मैं अपने केस की मौजूदा स्थिति जानना चाहता/चाहती हूँ।
3️⃣ मैं एक नया केस दर्ज करना चाहता/चाहती हूँ।
4️⃣ मैं अपने सबमिट किए गए केस में अपडेट देना चाहता/चाहती हूँ।`,

      BN:
`আমাদের সিস্টেম অনুযায়ী, আপনি এই নম্বর থেকে আগে একটি কেস জমা দিয়েছেন।
আপনার শেষ কেস নম্বর হলো: ${caseID}
অনুগ্রহ করে একটি অপশন নির্বাচন করুন:
1️⃣ আমি জমা দেওয়া কেসের বিস্তারিত দেখতে চাই।
2️⃣ আমি আমার কেসের বর্তমান স্ট্যাটাস জানতে চাই।
3️⃣ আমি একটি নতুন কেস জমা দিতে চাই।
4️⃣ আমি আমার জমা দেওয়া কেসে নতুন আপডেট দিতে চাই।`,

      AR:
`يُظهر نظامنا أنك قد قدّمت بلاغًا من هذا الرقم من قبل.
رقم قضيتك الأخيرة هو: ${caseID}
يرجى اختيار أحد الخيارات:
1️⃣ أريد مراجعة تفاصيل القضية التي قدّمتها.
2️⃣ أريد معرفة حالة قضيتي الحالية.
3️⃣ أريد تقديم قضية جديدة.
4️⃣ أريد إضافة تحديث على قضيتك المقدَّمة.`
    };

    return map[lang] || map.EN;
  },

  /************************************************************
   * MULTIPLE CASES — Ask which Case ID
   ************************************************************/
  sendMultipleCasesMenu(session, caseList) {
    const lang = session.Preferred_Language;

    const map = {

      EN:
`Our system shows that you have multiple cases submitted from this number.
Your case IDs include:
${caseList}
Please type the Case ID you want to review or check the status of.
Example: PK-00005
If you want to cancel, reply with 0.`,

      UR:
`ہمارے سسٹم کے مطابق آپ اس نمبر سے متعدد کیسز جمع کر چکے ہیں۔
آپ کے کیس نمبرز یہ ہیں:
${caseList}
براہِ کرم جس کیس کا اسٹیٹس یا تفصیل دیکھنی ہے، وہ Case ID لکھیں۔
مثال: PK-00005
اگر واپس جانا چاہتے ہیں تو 0 لکھ دیں۔`,

      RUR:
`Hamare nizaam ke mutabiq aap is number se kayee cases submit kar chuke hain.
Aap ke case numbers yeh hain:
${caseList}
Barah-e-karam jis case ka review ya status dekhna chahte hain, woh Case ID likhein.
Misaal: PK-00005
Wapas jane ke liye 0 likh dein.`,

      HI:
`हमारे सिस्टम के अनुसार आपने इस नंबर से एक से ज़्यादा केस दर्ज किए हैं।
आपके केस नंबर ये हैं:
${caseList}
कृपया वह Case ID लिखें जिसका विवरण या स्टेटस देखना चाहते हैं।
उदाहरण: PK-00005
वापस जाने के लिए 0 लिखें।`,

      BN:
`আমাদের সিস্টেম অনুযায়ী আপনি এই নম্বর থেকে একাধিক কেস জমা দিয়েছেন।
আপনার কেস নম্বরগুলো হলো:
${caseList}
যে Case ID-এর বিস্তারিত বা স্ট্যাটাস দেখতে চান, সেটি লিখুন।
উদাহরণ: PK-00005
ফিরে যেতে 0 লিখুন।`,

      AR:
`يُظهر نظامنا أنك قد قدّمت عدة قضايا من هذا الرقم.
أرقام القضايا الخاصة بك هي:
${caseList}
يرجى كتابة رقم القضية التي تريد مراجعتها أو معرفة حالتها.
مثال: PK-00005
للرجوع، أرسل 0.`
    };

    return map[lang] || map.EN;
  },

  /************************************************************
   * CASE DETAILS
   ************************************************************/
  sendCaseDetails(session, caseID, detailsText) {
    const lang = session.Preferred_Language;

    const map = {

      EN:
`Here are the main details of your submitted case (Case ID: ${caseID}):
${detailsText}
If anything is incorrect or missing, please type and send the correction here.`,

      UR:
`یہ آپ کے جمع شدہ کیس (کیس نمبر: ${caseID}) کی اہم تفصیلات ہیں:
${detailsText}
اگر کوئی بات غلط ہو یا مزید معلومات بھیجنی ہوں تو براہِ کرم یہی پر لکھ کر بھیج دیں۔`,

      RUR:
`Yeh aap ke submit kiye gaye case (Case ID: ${caseID}) ki aham tafseelaat hain:
${detailsText}
Agar koi baat ghalat ho ya kuch aur add karna ho to barah-e-karam yahin likh kar bhej dein.`,

      HI:
`यह आपके सबमिट किए गए केस (Case ID: ${caseID}) की मुख्य जानकारी है:
${detailsText}
अगर कुछ गलत हो या आप और जानकारी जोड़ना चाहते हों तो यहीं लिखकर भेजें।`,

      BN:
`এগুলো আপনার জমা দেওয়া কেস (Case ID: ${caseID}) এর প্রধান তথ্য:
${detailsText}
কিছু ভুল থাকলে বা নতুন তথ্য যুক্ত করতে চাইলে এখানেই লিখে পাঠান।`,

      AR:
`هذه هي التفاصيل الأساسية للقضية التي قدّمتها (رقم القضية: ${caseID}):
${detailsText}
إذا كانت هناك معلومات ناقصة أو غير صحيحة، يرجى كتابتها هنا.`

    };

    return map[lang] || map.EN;
  },

  /************************************************************
   * CASE STATUS
   ************************************************************/
  sendCaseStatus(session, caseID, status) {
    const lang = session.Preferred_Language;

    const map = {

      EN:
`The current status of your case (Case ID: ${caseID}) is:
${status}
Our team is reviewing your case. We will contact you when there is an update inshaAllah.`,

      UR:
`آپ کے کیس (کیس نمبر: ${caseID}) کی موجودہ صورتحال یہ ہے:
${status}
ہماری ٹیم آپ کے کیس کا جائزہ لے رہی ہے اور کسی اپڈیٹ کی صورت میں ان شاء اللہ رابطہ کرے گی۔`,

      RUR:
`Aap ke case (Case ID: ${caseID}) ki maujooda haalat yeh hai:
${status}
Hamari team case ka jaiza le rahi hai, aur InshaAllah update par aapse rabta karegi.`,

      HI:
`आपके केस (Case ID: ${caseID}) की वर्तमान स्थिति:
${status}
हमारी टीम केस की समीक्षा कर रही है। इंशाअल्लाह किसी भी अपडेट पर हम संपर्क करेंगे।`,

      BN:
`আপনার কেস (Case ID: ${caseID}) এর বর্তমান অবস্থা:
${status}
আমাদের টিম কেসটি পরীক্ষা করছে। নতুন আপডেট হলে ইনশাআল্লাহ জানানো হবে।`,

      AR:
`حالة قضيتك الحالية (رقم القضية: ${caseID}) هي:
${status}
فريقنا يراجع القضية، وسنتواصل معك عند وجود أي تحديث إن شاء الله.`
    };

    return map[lang] || map.EN;
  },

  /************************************************************
   * NEW CASE START CONFIRMATION
   ************************************************************/
  sendNewCaseStart(session) {
    const lang = session.Preferred_Language;

    const map = {
      EN:
"Okay, we will create a new case for you from this number.\nWe will now start the questions again inshaAllah.",

      UR:
"ٹھیک ہے، ہم اسی نمبر سے آپ کے لیے نیا کیس بنا رہے ہیں۔\nاب ہم دوبارہ سوالات شروع کریں گے، ان شاء اللہ۔",

      RUR:
"Theek hai, hum isi number se aap ke liye naya case bana rahe hain.\nAb hum sawalat dobara shuru karenge, InshaAllah.",

      HI:
"ठीक है, हम इसी नंबर से आपके लिए नया केस बना रहे हैं।\nअब हम दोबारा सवाल शुरू करेंगे, इंशाअल्लाह।",

      BN:
"ঠিক আছে, আমরা এই নম্বর থেকে আপনার জন্য নতুন কেস তৈরি করছি।\nএখন আমরা আবার প্রশ্ন শুরু করব, ইনশাআল্লাহ।",

      AR:
"حسنًا، سنقوم بإنشاء قضية جديدة لك بهذا الرقم.\nوسنبدأ الآن الأسئلة مرة أخرى، إن شاء الله."
    };

    return map[lang] || map.EN;
  },

  /************************************************************
   * UPDATE EXISTING CASE MENU
   ************************************************************/
  sendUpdateCaseMenu(session, caseID) {
    const lang = session.Preferred_Language;

    const map = {

      EN:
`Would you like to share an update about your submitted case (Case ID: ${caseID})?
Please choose an option:
1️⃣ I have new information about the case.
2️⃣ The case is closed – the missing person has been found.`,

      UR:
`کیا آپ اپنے جمع شدہ کیس (کیس نمبر: ${caseID}) کے بارے میں اپڈیٹ دینا چاہتے ہیں؟
براہ کرم ایک آپشن منتخب کریں:
1️⃣ میرے پاس کیس کے بارے میں نئی معلومات ہے۔
2️⃣ کیس کلوز ہو چکا ہے — گمشدہ شخص مل گیا ہے۔`,

      RUR:
`Kya aap apne case (Case ID: ${caseID}) ke bare mein update dena chahte hain?
Barah-e-karam ek option choose karein:
1️⃣ Mere paas case ke bare mein nayi maloomat hai.
2️⃣ Case close ho chuka hai — gumshuda shakhs mil gaya hai.`,

      HI:
`क्या आप अपने केस (Case ID: ${caseID}) के बारे में अपडेट देना चाहते हैं?
कृपया एक विकल्प चुनें:
1️⃣ मेरे पास मामले के बारे में नई जानकारी है।
2️⃣ मामला बंद हो चुका है — गुमशुदा व्यक्ति मिल गया है।`,

      BN:
`আপনি কি আপনার কেস (Case ID: ${caseID}) সম্পর্কে আপডেট দিতে চান?
অনুগ্রহ করে একটি অপশন নির্বাচন করুন:
1️⃣ আমার কাছে মামলার নতুন তথ্য আছে।
2️⃣ মামলা বন্ধ হয়েছে — নিখোঁজ ব্যক্তি পাওয়া গেছে।`,

      AR:
`هل ترغب في مشاركة تحديث حول قضيتك (رقم القضية: ${caseID})؟
يرجى اختيار أحد الخيارات:
1️⃣ لدي معلومات جديدة عن القضية.
2️⃣ تم إغلاق القضية — تم العثور على الشخص المفقود.`
    };

    return map[lang] || map.EN;
  },

  /************************************************************
   * NEW INFO PROMPT
   ************************************************************/
  sendUpdateNewInfoPrompt(session, caseID) {
    const lang = session.Preferred_Language;

    const map = {

      EN:
`Please type the new information you want to add to your case (Case ID: ${caseID}).
You may also send photos, documents, or voice notes.
When finished, type DONE.`,

      UR:
`براہ کرم وہ نئی معلومات لکھیں جو آپ اپنے کیس (کیس نمبر: ${caseID}) میں شامل کرنا چاہتے ہیں۔
آپ نئی تصاویر، دستاویزات یا وائس نوٹس بھی بھیج سکتے ہیں۔
مکمل ہونے پر DONE لکھ کر بھیج دیں۔`,

      RUR:
`Barah-e-karam woh nayi maloomat likhein jo aap apne case (Case ID: ${caseID}) mein add karna chahte hain.
Aap tasveerain, documents, ya voice notes bhi bhej sakte hain.
Mukammal honey par DONE type karein.`,

      HI:
`कृपया वह नई जानकारी लिखें जो आप अपने केस (Case ID: ${caseID}) में जोड़ना चाहते हैं।
आप फ़ोटो, डॉक्यूमेंट या वॉइस नोट भी भेज सकते हैं।
पूरा होने पर DONE लिखें।`,

      BN:
`অনুগ্রহ করে সেই নতুন তথ্য লিখুন যা আপনি আপনার কেসে (Case ID: ${caseID}) যুক্ত করতে চান।
আপনি ছবি, ডকুমেন্ট বা ভয়েস নোটও পাঠাতে পারেন।
শেষ হলে DONE লিখুন।`,

      AR:
`يرجى كتابة المعلومات الجديدة التي تودّ إضافتها إلى قضيتك (رقم القضية: ${caseID}).
يمكنك إرسال صور أو مستندات أو رسائل صوتية أيضًا.
عند الانتهاء، أرسل كلمة DONE.`
    };

    return map[lang] || map.EN;
  },

  /************************************************************
   * UPDATE CONFIRMATION
   ************************************************************/
  sendUpdateConfirmation(session) {
    const lang = session.Preferred_Language;

    const map = {

      EN:
"JazakAllah khair — your new information has been added to your case.\nOur team will review it inshaAllah.",

      UR:
"جزاک اللہ خیر — آپ کی نئی معلومات کیس میں شامل کر دی گئی ہیں۔\nہماری ٹیم ان شاء اللہ اس کا جائزہ لے گی۔",

      RUR:
"JazakAllah khair — nayi maloomat case mein add kar di gayi hain.\nHamari team InshaAllah review karegi.",

      HI:
"जज़ाकअल्लाह ख़ैर — आपकी नई जानकारी केस में जोड़ दी गई है।\nहमारी टीम इंशाअल्लाह इसकी समीक्षा करेगी।",

      BN:
"জাযাকআল্লাহ খাইর — আপনার নতুন তথ্য কেসে যুক্ত করা হয়েছে।\nআমাদের টিম ইনশাআল্লাহ এটি পর্যালোচনা করবে।",

      AR:
"جزاك الله خيرًا — تمت إضافة المعلومات الجديدة إلى قضيتك.\nسيراجعها فريقنا إن شاء الله."
    };

    return map[lang] || map.EN;
  },

  /************************************************************
   * CASE CLOSED MESSAGE
   ************************************************************/
  sendCaseClosed(session, caseID) {
    const lang = session.Preferred_Language;

    const map = {

      EN:
`Alhamdulillah!
We are very happy to hear that the missing person has been found.
Your case (Case ID: ${caseID}) has been marked as:
"Closed — Resolved by Family / Initiator"
May Allah bless and protect you. Ameen.`,

      UR:
`الحمد للہ!
یہ سن کر ہمیں بہت خوشی ہوئی کہ گمشدہ شخص مل گیا ہے۔
آپ کا کیس (کیس نمبر: ${caseID}) اس حیثیت سے مارک کر دیا گیا ہے:
"کلوزڈ — خاندان / درخواست دہندہ کے ذریعے حل شدہ"
اللہ آپ کو اپنی حفظ و امان میں رکھے۔ آمین۔`,

      RUR:
`Alhamdulillah!
Yeh sunkar hamein bohot khushi hui ke gumshuda shakhs mil gaya hai.
Aap ka case (Case ID: ${caseID}) mark ho gaya hai:
"Closed — family / initiator ke zariye resolve"
Allah aap ki hifazat kare. Ameen.`,

      HI:
`अल्हम्दुलिल्लाह!
यह सुनकर हमें बहुत खुशी हुई कि गुमशुदा व्यक्ति मिल चुका है।
आपका केस (Case ID: ${caseID}) इस स्टेटस से मार्क किया गया है:
"Closed — परिवार / इनिशिएटर द्वारा हल"
अल्लाह आपको सुरक्षित रखे। आमीन।`,

      BN:
`আলহামদুলিল্লাহ!
এটি শুনে আমরা আনন্দিত যে নিখোঁজ ব্যক্তি ফিরে এসেছে।
আপনার কেস (Case ID: ${caseID}) এখন চিহ্নিত হয়েছে:
"Closed — পরিবার / উদ্যোগকারীর মাধ্যমে সমাধান"
আল্লাহ আপনাকে নিরাপদে রাখুন। আমীন।`,

      AR:
`الحمد لله!
سعدنا كثيرًا بسماع أن الشخص المفقود قد تم العثور عليه.
تم وضع علامة على قضيتك (رقم القضية: ${caseID}) بأنها:
"مغلقة — تم حلّها بواسطة الأسرة / مقدّم البلاغ"
نسأل الله أن يحفظك. آمين.`
    };

    return map[lang] || map.EN;
  }

};
