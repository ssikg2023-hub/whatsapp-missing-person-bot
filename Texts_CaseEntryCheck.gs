/************************************************************
 * Texts_CaseEntryCheck.gs — Case Detection (Block 8)
 * Clean, GAS-safe, Unicode-stable version
 ************************************************************/

const Texts_CaseEntryCheck = {

  /************************************************************
   * WHEN SINGLE CASE FOUND — Show Existing Case Menu
   ************************************************************/
  sendExistingCaseDetected(session, lastCaseID) {

    const lang = session.Preferred_Language;
    
    const map = {

      EN:
`Our system shows that you have already submitted a case from this number.
Your last case ID is: ${lastCaseID}

Please choose an option:
1️⃣ Review your submitted case details
2️⃣ Check the status of your case
3️⃣ Submit a new case
4️⃣ I want to update my submitted case`,

      UR:
`ہمارے سسٹم کے مطابق آپ اس نمبر سے پہلے ہی ایک کیس جمع کر چکے ہیں۔
آپ کا آخری کیس نمبر ہے: ${lastCaseID}

براہِ کرم ایک آپشن منتخب کریں:
1️⃣ میں اپنے جمع شدہ کیس کی تفصیل دیکھنا چاہتا/چاہتی ہوں۔
2️⃣ میں اپنے کیس کی موجودہ صورتحال جاننا چاہتا/چاہتی ہوں۔
3️⃣ میں نیا کیس جمع کروانا چاہتا/چاہتی ہوں۔
4️⃣ میں اپنے جمع شدہ کیس میں اپڈیٹ دینا چاہتا/چاہتی ہوں۔`,

      RUR:
`Hamare nizaam ke mutabiq aap is number se pehle hi ek case submit kar chuke hain.
Aap ka aakhri case number hai: ${lastCaseID}

Barah-e-karam ek option ka intikhab karein:
1️⃣ Submit kiya hua case ki tafseel dekhna chahta/chahti hoon.
2️⃣ Apne case ki maujooda status maloom karna chahta/chahti hoon.
3️⃣ Naya case submit karna chahta/chahti hoon.
4️⃣ Main apne submit kiye gaye case mein update dena chahta/chahti hoon.`,

      HI:
`हमारे सिस्टम के अनुसार आपने इस नंबर से पहले ही एक केस दर्ज किया है।
आपका आखिरी केस नंबर है: ${lastCaseID}

कृपया एक विकल्प चुनें:
1️⃣ मैं अपने सबमिट किए गए केस की डिटेल देखना चाहता/चाहती हूँ।
2️⃣ मैं अपने केस की मौजूदा स्थिति जानना चाहता/चाहती हूँ।
3️⃣ मैं एक नया केस दर्ज करना चाहता/चाहती हूँ।
4️⃣ मैं अपने सबमिट किए गए केस में अपडेट देना चाहता/चाहती हूँ।`,

      BN:
`আমাদের সিস্টেম অনুযায়ী, আপনি এই নম্বর থেকে আগে একটি কেস জমা দিয়েছেন।
আপনার শেষ কেস নম্বর হলো: ${lastCaseID}

অনুগ্রহ করে একটি অপশন নির্বাচন করুন:
1️⃣ আমি জমা দেওয়া কেসের বিস্তারিত দেখতে চাই।
2️⃣ আমি আমার কেসের বর্তমান স্ট্যাটাস জানতে চাই।
3️⃣ আমি একটি নতুন কেস জমা দিতে চাই।
4️⃣ আমি আমার জমা দেওয়া কেসে আপডেট দিতে চাই।`,

      AR:
`يُظهر نظامنا أنك قد قدّمت بلاغًا من هذا الرقم من قبل.
رقم قضيتك الأخيرة هو: ${lastCaseID}

يرجى اختيار أحد الخيارات:
1️⃣ أريد مراجعة تفاصيل القضية المقدّمة.
2️⃣ أريد معرفة حالة قضيتي الحالية.
3️⃣ أريد تقديم قضية جديدة.
4️⃣ أريد إضافة تحديث على قضيتي.`

    };

    return map[lang] || map.EN;
  },

  /************************************************************
   * MULTIPLE CASES — Show case list
   ************************************************************/
  sendMultipleCaseList(session, listString) {

    const lang = session.Preferred_Language;

    const map = {

      EN:
`Our system shows that you have multiple cases submitted from this number.

Your case IDs are:
${listString}

Please type the Case ID you want to review or check status for.
If you want to cancel, reply with: 0`,

      UR:
`ہمارے سسٹم کے مطابق آپ اس نمبر سے متعدد کیسز جمع کر چکے ہیں۔

آپ کے کیس نمبرز یہ ہیں:
${listString}

براہِ کرم جس کیس کی تفصیل یا اسٹیٹس دیکھنا چاہتے ہیں، وہ Case ID لکھیں۔
اگر واپس جانا چاہتے ہیں تو 0 لکھ دیں۔`,

      RUR:
`Hamare nizaam ke mutabiq aap is number se kayi cases submit kar chuke hain.

Aap ke case numbers yeh hain:
${listString}

Barah-e-karam jis case ka review ya status dekhna chahte hain, woh Case ID likhein.
Wapas janay ke liye 0 likh dein.`,

      HI:
`हमारे सिस्टम के अनुसार आपने इस नंबर से कई केस दर्ज किए हैं।

आपके केस नंबर ये हैं:
${listString}

कृपया वह Case ID लिखें जिसका विवरण या स्टेटस आप देखना चाहते हैं।
वापस जाने के लिए 0 लिख दें।`,

      BN:
`আমাদের সিস্টেম অনুযায়ী আপনি এই নম্বর থেকে একাধিক কেস জমা দিয়েছেন।

আপনার কেস নম্বরগুলো হলো:
${listString}

যে কেসের বিস্তারিত বা স্ট্যাটাস দেখতে চান, অনুগ্রহ করে সেই Case ID লিখুন।
ফিরে যেতে চাইলে 0 লিখুন।`,

      AR:
`يُظهر نظامنا أنك قد قدّمت عدة قضايا من هذا الرقم.

أرقام القضايا الخاصة بك هي:
${listString}

اكتب رقم القضية التي تريد مراجعتها أو معرفة حالتها.
للرجوع، أرسل: 0.`

    };

    return map[lang] || map.EN;
  }

};
