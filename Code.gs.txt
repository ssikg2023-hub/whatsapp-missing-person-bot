/************************************************************
 *  Code.gs — ENTERPRISE MAIN ROUTER (FINAL FIXED VERSION)
 ************************************************************/


/************************************************************
 * VERIFY WEBHOOK (GET)
 ************************************************************/
function doGet(e) {
  const mode = e.parameter["hub.mode"];
  const token = e.parameter["hub.verify_token"];
  const challenge = e.parameter["hub.challenge"];

  if (mode === "subscribe" && token === CONF("VERIFY_TOKEN")) {
    return ContentService.createTextOutput(challenge);
  }

  return ContentService.createTextOutput("INVALID TOKEN");
}



/************************************************************
 * WEBHOOK RECEIVER (POST)
 ************************************************************/
function doPost(e) {
  try {

    const data = JSON.parse(e.postData.contents || "{}");
    const messageObj = extractMessage_(data);
    if (!messageObj) return ok_();

    const userNumber = sanitizeNumber_(messageObj.from);
    if (!userNumber) return ok_();

    const incomingText = (messageObj.text || "").trim();



    /********************************************************
     * SESSION LOAD OR CREATE
     ********************************************************/
    let session = Session.get(userNumber);

    if (!session) {
      session = Session.create(userNumber);
      session.Region_Group = detectRegionByPhone(userNumber);
      Session.save(session);

      sendWhatsAppMessage(
        userNumber,
        Texts_LangMenus.getMenu(session.Region_Group)
      );

      return ok_();
    }



    /********************************************************
     * HARD RESET
     ********************************************************/
    if (incomingText.toUpperCase() === "RESET") {

      Session.delete(userNumber);
      session = Session.create(userNumber);

      session.Region_Group = detectRegionByPhone(userNumber);

      sendWhatsAppMessage(
        userNumber,
        Texts_LangMenus.getMenu(session.Region_Group)
      );
      return ok_();
    }



    /********************************************************
     * EXISTING CASE CHECK
     ********************************************************/
    if (session.Preferred_Language && !session.Temp.existingChecked) {

      const existing = Cases.getCasesByNumber(userNumber);   // ✅ FIXED
      session.Temp.existingChecked = true;

      if (existing.length === 1) {
        session.Current_Step_Code = "EXISTING_CASE_MENU";
        session.Temp.lastCaseID = existing[0].Case_ID;
        Session.save(session);

        sendWhatsAppMessage(
          userNumber,
          Texts_ExistingCases.sendExistingCaseMenu(session, session.Temp.lastCaseID)
        );

        return ok_();
      }

      if (existing.length > 1) {
        session.Current_Step_Code = "MULTI_CASE_SELECT";
        session.Temp.caseList = existing.map(c => c.Case_ID);
        Session.save(session);

        sendWhatsAppMessage(
          userNumber,
          Texts_ExistingCases.sendMultipleCasesMenu(
            session,
            session.Temp.caseList.join("\n")
          )
        );

        return ok_();
      }

      Session.save(session);
    }



    /********************************************************
     * MULTI CASE SELECT
     ********************************************************/
    if (session.Current_Step_Code === "MULTI_CASE_SELECT") {

      const chosen = incomingText.trim();

      if (!session.Temp.caseList.includes(chosen)) {
        sendWhatsAppMessage(
          userNumber,
          Texts_Validation.sendInvalidOption(session)
        );
        return ok_();
      }

      session.Temp.lastCaseID = chosen;
      session.Current_Step_Code = "EXISTING_CASE_MENU";
      Session.save(session);

      sendWhatsAppMessage(
        userNumber,
        Texts_ExistingCases.sendExistingCaseMenu(session, chosen)
      );

      return ok_();
    }



    /********************************************************
     * EXISTING CASE ROUTER
     ********************************************************/
    if (session.Current_Step_Code === "EXISTING_CASE_MENU") {

      const reply = ExistingCaseFlow.route(session, incomingText);

      if (reply === "__EC_BACK__") {
        session.Current_Step_Code = "USER_TYPE";
        Session.save(session);

        sendWhatsAppMessage(userNumber, Texts.sendUserTypeMenu(session)); // ✅ FIXED
        return ok_();
      }

      if (reply?.startsWith("__END_SESSION__")) {
        const message = reply.replace("__END_SESSION__:::", "").trim();
        Session.delete(userNumber);
        sendWhatsAppMessage(userNumber, message);
        return ok_();
      }

      if (reply) sendWhatsAppMessage(userNumber, reply);

      Session.save(session);
      return ok_();
    }



    /********************************************************
     * STEP 2 — LANGUAGE SELECTION
     ********************************************************/
    if (session.Current_Step_Code === "LANG_SELECT") {

      const lang = Texts.mapLanguageChoice(   // ✅ FIXED
        session.Region_Group,
        incomingText
      );

      if (!lang) {
        sendWhatsAppMessage(
          userNumber,
          Texts_Validation.sendInvalidOption(session)
        );
        return ok_();
      }

      session.Preferred_Language = lang;
      session.Current_Step_Code = "USER_TYPE";
      Session.save(session);

      sendWhatsAppMessage(userNumber, Texts.sendUserTypeMenu(session)); // ✅ FIXED
      return ok_();
    }



    /********************************************************
     * STILL NO LANGUAGE (Fail-safe)
     ********************************************************/
    if (!session.Preferred_Language) {

      session.Current_Step_Code = "LANG_SELECT";
      Session.save(session);

      sendWhatsAppMessage(
        userNumber,
        Texts_LangMenus.getMenu(session.Region_Group)
      );

      return ok_();
    }



    /********************************************************
     * MEDIA HANDLING
     ********************************************************/
    if (messageObj.mediaUrl) {

      MediaEngine.processIncomingMedia(session, messageObj);

      let reply = Flows.handleMediaAftermath
        ? Flows.handleMediaAftermath(session)
        : Flows.routeMessage(
            session,
            "",
            messageObj.raw,
            messageObj.mediaUrl,
            messageObj.mediaMime
          );

      if (reply) sendWhatsAppMessage(userNumber, reply);

      Session.save(session);
      return ok_();
    }



    /********************************************************
     * MAIN FLOW ROUTER
     ********************************************************/
    const reply = Flows.routeMessage(
      session,
      incomingText,
      messageObj.raw,
      messageObj.mediaUrl,
      messageObj.mediaMime
    );

    if (reply === "__END_SESSION__") {
      Session.delete(userNumber);
      return ok_();
    }

    if (reply) sendWhatsAppMessage(userNumber, reply);

    Session.save(session);
    return ok_();


  } catch (err) {
    Logger.log("Webhook Error: " + err);
    return ok_();
  }
}



/************************************************************
 * EXTRACT MESSAGE — META WEBHOOK
 ************************************************************/
function extractMessage_(data) {
  try {
    const entry = data?.entry?.[0];
    const changes = entry?.changes?.[0];
    const msg = changes?.value?.messages?.[0];
    if (!msg) return null;

    let text = "";
    let mediaUrl = "";
    let mediaMime = "";

    if (msg.text?.body) text = msg.text.body;

    if (msg.image)      { mediaUrl = msg.image.id;    mediaMime = msg.image.mime_type; }
    else if (msg.document){ mediaUrl = msg.document.id; mediaMime = msg.document.mime_type; }
    else if (msg.audio) { mediaUrl = msg.audio.id;    mediaMime = msg.audio.mime_type; }
    else if (msg.video) { mediaUrl = msg.video.id;    mediaMime = msg.video.mime_type; }

    return {
      from: msg.from || "",
      text,
      mediaUrl,
      mediaMime,
      raw: msg
    };

  } catch (e) {
    Logger.log("extractMessage_ Error: " + e);
    return null;
  }
}



/************************************************************
 * SEND MESSAGE TO WHATSAPP — META v20
 ************************************************************/
function sendWhatsAppMessage(number, text) {

  const url =
    "https://graph.facebook.com/v20.0/" +
    CONF("WHATSAPP_PHONE_NUMBER_ID") +
    "/messages";

  const payload = {
    messaging_product: "whatsapp",
    to: number,
    type: "text",
    text: { body: text }
  };

  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + CONF("WHATSAPP_TOKEN")
    },
    payload: JSON.stringify(payload)
  });
}



/************************************************************
 * HELPERS
 ************************************************************/
function sanitizeNumber_(num) {
  if (!num) return "";
  return num.replace(/[^0-9]/g, "");
}

function ok_() {
  return ContentService.createTextOutput("OK");
}
