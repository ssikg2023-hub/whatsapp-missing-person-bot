/**
 * Code.gs — Primary WhatsApp webhook entrypoint (aligned with Flows)
 */

/************************************************************
 * VERIFY WEBHOOK (GET)
 ************************************************************/
function doGet(e) {
  const mode = e?.parameter?.["hub.mode"];
  const token = e?.parameter?.["hub.verify_token"];
  const challenge = e?.parameter?.["hub.challenge"];

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
    const payload = parseJson(e?.postData?.contents);
    const messageObj = extractIncomingMessage_(payload);

    if (!messageObj) {
      return ok_();
    }

    const userNumber = sanitizeNumber_(messageObj.from);
    if (!userNumber) {
      return ok_();
    }

    const { session, isNew } = loadOrCreateSession_(userNumber);

    if (isNew) {
      sendWhatsAppMessage(userNumber, Texts.sendLanguageMenu(session));
      return ok_();
    }

    const incomingText = (messageObj.text || "").trim();

    if (incomingText && incomingText.toUpperCase() === "RESET") {
      resetSession_(userNumber);
      return ok_();
    }

    if (handleMultiCaseSelection_(session, incomingText, userNumber)) {
      return ok_();
    }

    if (handleExistingCaseMenu_(session, incomingText, userNumber)) {
      return ok_();
    }

    const reply = Flows.routeMessage(
      session,
      incomingText,
      messageObj.raw,
      messageObj.mediaUrl,
      messageObj.mediaMime
    );

    if (checkExistingCases_(session, userNumber)) {
      return ok_();
    }

    if (reply) {
      sendWhatsAppMessage(userNumber, reply);
    }

    return ok_();

  } catch (err) {
    Logger.log("Webhook Error → " + err);
    return ok_();
  }
}


/************************************************************
 * EXTRACT MESSAGE — Supports text, interactive, media, location
 ************************************************************/
function extractIncomingMessage_(data) {
  try {
    const entry = data?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return null;
    }

    let text = "";
    let mediaUrl = "";
    let mediaMime = "";

    const type = message.type;

    if (type === "text") {
      text = message.text?.body || "";
    } else if (type === "interactive") {
      const interactive = message.interactive || {};
      if (interactive.type === "button_reply") {
        text = interactive.button_reply?.id || interactive.button_reply?.title || "";
      } else if (interactive.type === "list_reply") {
        text = interactive.list_reply?.id || interactive.list_reply?.title || "";
      }
    } else if (type === "image") {
      mediaUrl = message.image?.id || "";
      mediaMime = message.image?.mime_type || "";
      text = message.image?.caption || "";
    } else if (type === "video") {
      mediaUrl = message.video?.id || "";
      mediaMime = message.video?.mime_type || "";
      text = message.video?.caption || "";
    } else if (type === "audio") {
      mediaUrl = message.audio?.id || "";
      mediaMime = message.audio?.mime_type || "";
    } else if (type === "document") {
      mediaUrl = message.document?.id || "";
      mediaMime = message.document?.mime_type || "";
      text = message.document?.caption || message.document?.filename || "";
    } else if (type === "sticker") {
      mediaUrl = message.sticker?.id || "";
      mediaMime = message.sticker?.mime_type || "";
    } else if (type === "location") {
      const loc = message.location;
      if (loc) {
        text = loc.latitude + "," + loc.longitude;
      }
    } else if (type === "button") {
      text = message.button?.payload || message.button?.text || "";
    }

    return {
      from: message.from || "",
      text: text || "",
      mediaUrl: mediaUrl,
      mediaMime: mediaMime,
      raw: message,
    };
  } catch (err) {
    Logger.log("extractIncomingMessage_ Error → " + err);
    return null;
  }
}


/************************************************************
 * SEND MESSAGE TO WHATSAPP — Graph API v20
 ************************************************************/
function sendWhatsAppMessage(number, text) {
  if (!text) {
    return;
  }

  const url = "https://graph.facebook.com/v20.0/" + CONF("WHATSAPP_PHONE_NUMBER_ID") + "/messages";

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
  if (!num) {
    return "";
  }
  return ("" + num).replace(/[^0-9]/g, "");
}

function ok_() {
  return ContentService.createTextOutput("OK");
}


/************************************************************
 * SESSION + EXISTING CASE HELPERS
 ************************************************************/
function loadOrCreateSession_(number) {
  let session = Session.get(number);

  if (session) {
    session.WhatsApp_Number = session.WhatsApp_Number || number;
    session.Temp = session.Temp || {};

    if (!session.Region_Group) {
      session.Region_Group = detectRegionByPhone(number);
      Session.save(session);
    }

    return { session: session, isNew: false };
  }

  session = Session.create(number);
  session.Region_Group = detectRegionByPhone(number);
  Session.save(session);

  session.WhatsApp_Number = number;
  session.Temp = session.Temp || {};

  return { session: session, isNew: true };
}

function resetSession_(number) {
  Session.delete(number);

  const fresh = Session.create(number);
  fresh.Region_Group = detectRegionByPhone(number);
  Session.save(fresh);

  sendWhatsAppMessage(number, Texts.sendLanguageMenu(fresh));
}

function handleMultiCaseSelection_(session, incomingText, userNumber) {
  session.Temp = session.Temp || {};

  if (!session.Temp.awaitingCaseSelection) {
    return false;
  }

  const choice = (incomingText || "").trim();
  const upperChoice = choice.toUpperCase();
  const caseList = session.Temp.caseList || [];
  const normalized = caseList.map(function(id) {
    return (id || "").toUpperCase();
  });

  if (upperChoice === "0" || upperChoice === "BACK") {
    session.Temp.awaitingCaseSelection = false;
    session.Temp.caseList = undefined;
    session.Temp.lastCaseID = undefined;
    session.Current_Step_Code = "USER_TYPE";
    Session.save(session);

    sendWhatsAppMessage(userNumber, Texts.sendUserTypeMenu(session));
    return true;
  }

  const listString = (caseList || []).join("\n");

  if (!choice) {
    sendWhatsAppMessage(
      userNumber,
      Texts_Validation.sendInvalidCaseID(session)
        + "\n\n"
        + Texts_ExistingCases.sendMultipleCasesMenu(session, listString)
    );
    return true;
  }

  const idx = normalized.indexOf(upperChoice);
  if (idx === -1) {
    sendWhatsAppMessage(
      userNumber,
      Texts_Validation.sendInvalidCaseID(session)
        + "\n\n"
        + Texts_ExistingCases.sendMultipleCasesMenu(session, listString)
    );
    return true;
  }

  const selectedCaseID = caseList[idx];

  session.Temp.awaitingCaseSelection = false;
  session.Temp.caseList = undefined;
  session.Temp.lastCaseID = selectedCaseID;
  session.Temp.caseID = selectedCaseID;
  session.Current_Step_Code = "EXISTING_CASE_MENU";
  Session.save(session);

  sendWhatsAppMessage(
    userNumber,
    Texts_ExistingCases.sendExistingCaseMenu(session, selectedCaseID)
  );

  return true;
}

function handleExistingCaseMenu_(session, incomingText, userNumber) {
  if (session.Current_Step_Code !== "EXISTING_CASE_MENU") {
    return false;
  }

  const menuReply = ExistingCaseFlow.route(session, incomingText);

  if (menuReply === "__EC_BACK__") {
    session.Current_Step_Code = "USER_TYPE";
    Session.save(session);

    sendWhatsAppMessage(userNumber, Texts.sendUserTypeMenu(session));
    return true;
  }

  if (menuReply) {
    sendWhatsAppMessage(userNumber, menuReply);
  }

  return true;
}

function checkExistingCases_(session, userNumber) {
  session.Temp = session.Temp || {};

  if (!session.Preferred_Language) return false;
  if (session.Temp.existingChecked) return false;
  if (session.Current_Step_Code !== "USER_TYPE") return false;

  const existingCases = Cases.getCasesByNumber(userNumber);
  session.Temp.existingChecked = true;

  if (!existingCases.length) {
    Session.save(session);
    return false;
  }

  if (existingCases.length === 1) {
    const caseID = existingCases[0].Case_ID;

    session.Temp.lastCaseID = caseID;
    session.Temp.caseID = caseID;
    session.Current_Step_Code = "EXISTING_CASE_MENU";
    Session.save(session);

    sendWhatsAppMessage(
      userNumber,
      Texts_ExistingCases.sendExistingCaseMenu(session, caseID)
    );
    return true;
  }

  const caseIDs = existingCases.map(function(item) { return item.Case_ID; });

  session.Temp.caseList = caseIDs;
  session.Temp.awaitingCaseSelection = true;
  session.Temp.lastCaseID = undefined;
  session.Current_Step_Code = "EXISTING_CASE_MENU";
  Session.save(session);

  sendWhatsAppMessage(
    userNumber,
    Texts_ExistingCases.sendMultipleCasesMenu(session, caseIDs.join("\n"))
  );

  return true;
}
