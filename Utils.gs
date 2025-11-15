/************************************************************
 * Utils.gs — ENTERPRISE CORE ENGINE (FINAL PRODUCTION VERSION)
 ************************************************************/


/************************************************************
 * MAIN SHEET GETTERS
 ************************************************************/
function getMainSheet() {
  return SpreadsheetApp.openById(CONF("SHEET_ID"));
}

function Sheet(name) {
  return getMainSheet().getSheetByName(name);
}

const DB = {
  Sessions: () => Sheet("User_Sessions"),
  Cases:    () => Sheet("Cases"),
  Updates:  () => Sheet("Case_Updates"),
};


/************************************************************
 * SAFE JSON HELPERS
 ************************************************************/
function toJsonString(obj) {
  try {
    return JSON.stringify(obj || {});
  } catch (e) {
    Logger.log("JSON Encode Error → " + e);
    return "{}";
  }
}

function parseJson(str) {
  try {
    if (!str) return {};
    return JSON.parse(str);
  } catch (e) {
    Logger.log("JSON Decode Error → " + e);
    return {};
  }
}


/************************************************************
 * REGION DETECTION (FINAL)
 ************************************************************/
function detectRegionByPhone(num) {
  num = (num + "").replace("+", "");

  if (num.startsWith("92"))  return "PK";
  if (num.startsWith("91"))  return "IN";
  if (num.startsWith("880")) return "BD";

  const ME = ["966", "971", "973", "974", "965", "968"];
  for (let c of ME) {
    if (num.startsWith(c)) return "ME";
  }

  return "OTHER";
}


/************************************************************
 * SESSION ENGINE (Temp JSON Safe, Fully Hardened)
 ************************************************************/
const Session = {

  get(number) {
    const sh = DB.Sessions();
    const last = sh.getLastRow();
    if (last < 2) return null;

    const rows = sh.getRange(2, 1, last - 1, 7).getValues();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0]) continue;

      if ((r[0] + "") === (number + "")) {
        return {
          _row: i + 2,
          WhatsApp_Number: r[0],
          Current_Step_Code: r[1],
          Flow_Type: r[2],
          Region_Group: r[3],
          Preferred_Language: r[4],
          Temp_Data: r[5],
          Temp: parseJson(r[5] || "{}"),
          Updated_At: r[6],
        };
      }
    }
    return null;
  },

  create(number) {
    const sh = DB.Sessions();
    const now = new Date();
    const emptyJson = "{}";

    sh.appendRow([
      number,
      "LANG_SELECT",
      "",
      "",
      "",
      emptyJson,
      now
    ]);

    const row = sh.getLastRow();

    return {
      _row: row,
      WhatsApp_Number: number,
      Current_Step_Code: "LANG_SELECT",
      Flow_Type: "",
      Region_Group: "",
      Preferred_Language: "",
      Temp_Data: emptyJson,
      Temp: {},
      Updated_At: now,
    };
  },

  save(s) {
    const sh = DB.Sessions();
    s.Updated_At = new Date();

    const json = toJsonString(s.Temp);

    sh.getRange(s._row, 1, 1, 7).setValues([[
      s.WhatsApp_Number,
      s.Current_Step_Code,
      s.Flow_Type,
      s.Region_Group,
      s.Preferred_Language,
      json,
      s.Updated_At
    ]]);

    s.Temp_Data = json;
  },

  delete(number) {
    const sh = DB.Sessions();
    const last = sh.getLastRow();
    if (last < 2) return;

    const numbers = sh.getRange(2, 1, last - 1, 1).getValues();

    for (let i = 0; i < numbers.length; i++) {
      if ((numbers[i][0] + "") === (number + "")) {
        sh.deleteRow(i + 2);
        return;
      }
    }
  }
};


/************************************************************
 * CASE ENGINE — CREATE / UPDATE / MEDIA / CLOSE
 ************************************************************/
function generateCaseID(region) {
  const sh = DB.Cases();
  const last = sh.getLastRow();
  const count = Math.max(0, last - 1);
  return region + "-" + Utilities.formatString("%05d", count + 1);
}

function createCase(session) {
  const sh = DB.Cases();
  const now = new Date();
  const caseID = generateCaseID(session.Region_Group);

  const Qs = Array(16).fill("");

  sh.appendRow([
    caseID,
    now,
    session.WhatsApp_Number,
    session.Region_Group,
    session.Preferred_Language,
    session.Flow_Type || session.Temp.flow || "",
    ...Qs,
    "",
    "",
    "Open",
  ]);

  return caseID;
}

function saveAnswer(caseID, qNum, answer) {
  if (qNum < 1 || qNum > 16) return false;

  answer = (answer + "").trim();

  const sh = DB.Cases();
  const last = sh.getLastRow();
  const data = sh.getRange(2, 1, last - 1, 25).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === caseID) {
      const col = 6 + qNum;
      sh.getRange(i + 2, col).setValue(answer);
      return true;
    }
  }
  return false;
}

function saveExtra(caseID, text) {
  const sh = DB.Cases();
  const last = sh.getLastRow();
  const data = sh.getRange(2, 1, last - 1, 25).getValues();

  text = (text + "").trim();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === caseID) {
      const prev = (data[i][22] || "").trim();
      const final = prev ? prev + "\n" + text : text;
      sh.getRange(i + 2, 23).setValue(final);
      return true;
    }
  }
  return false;
}

function appendCaseMedia(caseID, url) {
  const sh = DB.Cases();
  const last = sh.getLastRow();
  const data = sh.getRange(2, 1, last - 1, 25).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === caseID) {
      const prev = (data[i][23] || "").trim();
      const final = prev ? prev + "\n" + url : url;
      sh.getRange(i + 2, 24).setValue(final);
      return true;
    }
  }
  return false;
}

function closeCase(caseID, status) {
  const sh = DB.Cases();
  const last = sh.getLastRow();
  const data = sh.getRange(2, 1, last - 1, 25).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === caseID) {
      sh.getRange(i + 2, 25).setValue(status);
      return true;
    }
  }
  return false;
}


/************************************************************
 * CASE QUERY ENGINE
 ************************************************************/
const Cases = {   // ✅ FIXED NAME

  getCasesByNumber(number) {
    const sh = DB.Cases();
    const last = sh.getLastRow();
    if (last < 2) return [];

    const data = sh.getRange(2, 1, last - 1, 25).getValues();
    const out = [];

    for (let r = 0; r < data.length; r++) {
      if ((data[r][2] + "") === (number + "")) {

        out.push({
          Case_ID: data[r][0],
          Created_At: data[r][1],
          WhatsApp_Number: data[r][2],
          Region: data[r][3],
          Language: data[r][4],
          Flow_Type: data[r][5],
          Q: data[r].slice(6, 22),
          Extra_Notes: data[r][22],
          Media_Links: data[r][23],
          Case_Status: data[r][24],
        });
      }
    }
    return out;
  },

  validateCaseID(number, caseID) {
    return this.getCasesByNumber(number)
      .some(c => c.Case_ID === caseID);
  },

  getCaseStatus(caseID) {
    const sh = DB.Cases();
    const last = sh.getLastRow();
    const data = sh.getRange(2, 1, last - 1, 25).getValues();

    for (let r = 0; r < data.length; r++) {
      if (data[r][0] === caseID) {
        return data[r][24];
      }
    }
    return "";
  }
};


/************************************************************
 * CASE UPDATES LOG
 ************************************************************/
function saveCaseUpdate(caseID, type, content, mediaUrl, rawJson) {
  const sh = DB.Updates();
  const updateID = "UP-" + new Date().getTime();

  sh.appendRow([
    updateID,
    caseID,
    new Date(),
    type,
    content,
    mediaUrl || "",
    rawJson || ""
  ]);

  return updateID;
}


/************************************************************
 * MEDIA ENGINE
 ************************************************************/
const MediaEngine = {

  processIncomingMedia(session, msg) {
    try {
      if (!msg.mediaUrl) return;

      const temp = session.Temp || {};
      const caseID = temp.caseID;
      if (!caseID) return;

      const blob = this.downloadMedia(msg.mediaUrl, msg.mediaMime);
      if (!blob) return;

      const ext = this.mimeToExtension(msg.mediaMime);
      const url = this.saveToDrive(blob, ext, caseID);

      appendCaseMedia(caseID, url);

      saveCaseUpdate(
        caseID,
        "MEDIA",
        "User submitted media file",
        url,
        JSON.stringify(msg.raw || {})
      );

    } catch (err) {
      Logger.log("MediaEngine ERROR → " + err);
    }
  },

  downloadMedia(mediaId, mime) {
    try {
      const token = CONF("WHATSAPP_TOKEN");

      const step1 = UrlFetchApp.fetch(
        "https://graph.facebook.com/v20.0/" + mediaId,
        { headers: { Authorization: "Bearer " + token } }
      );

      const url = JSON.parse(step1.getContentText()).url;
      if (!url) return null;

      const step2 = UrlFetchApp.fetch(url);
      const blob = step2.getBlob();
      blob.setContentType(mime);

      return blob;

    } catch (e) {
      Logger.log("downloadMedia ERROR → " + e);
      return null;
    }
  },

  mimeToExtension(mime) {
    if (!mime) return "bin";
    mime = mime.toLowerCase();

    if (mime.includes("jpeg")) return "jpg";
    if (mime.includes("jpg"))  return "jpg";
    if (mime.includes("png"))  return "png";
    if (mime.includes("pdf"))  return "pdf";
    if (mime.includes("mp4"))  return "mp4";
    if (mime.includes("mp3"))  return "mp3";
    if (mime.includes("ogg"))  return "ogg";
    if (mime.includes("wav"))  return "wav";

    return "bin";
  },

  saveToDrive(blob, ext, caseID) {
    try {
      const folder = DriveApp.getFolderById(CONF("MEDIA_FOLDER_ID"));
      const filename = caseID + "_" + Date.now() + "." + ext;

      const file = folder.createFile(blob.setName(filename));
      return file.getUrl();

    } catch (e) {
      Logger.log("MediaEngine.saveToDrive ERROR → " + e);
      return "";
    }
  }
};


/************************************************************
 * HELPERS
 ************************************************************/
function debugLog(msg) {
  if (CONF("ENABLE_DEBUG_LOGS")) {
    try {
      Logger.log(typeof msg === "string" ? msg : JSON.stringify(msg, null, 2));
    } catch (e) {
      Logger.log("debugLog Error → " + e);
    }
  }
}

function normalizeNumber(num) {
  return (num + "").replace(/[^0-9+]/g, "");
}

function sanitizeNumber_(num) {
  if (!num) return "";
  return num.replace(/[^0-9]/g, "");
}


/************************************************************
 * REGION COMPAT WRAPPER
 ************************************************************/
const Region = {
  detect(number) {
    return detectRegionByPhone(number);
  }
};


/************************************************************
 * MEDIA URL EXTRACTOR (Legacy)
 ************************************************************/
function extractMediaUrl(msg) {
  if (!msg) return null;
  if (msg.image?.id)    return msg.image.id;
  if (msg.document?.id) return msg.document.id;
  if (msg.audio?.id)    return msg.audio.id;
  if (msg.video?.id)    return msg.video.id;
  return null;
}


/************************************************************
 * FINAL SAFE WRAPPERS
 ************************************************************/
function safeSet(sh, row, col, value) {
  try {
    sh.getRange(row, col).setValue(value);
  } catch (e) {
    Logger.log("safeSet Error → " + e);
  }
}

function safeAppend(sh, arr) {
  try {
    sh.appendRow(arr);
  } catch (e) {
    Logger.log("safeAppend Error → " + e);
  }
}
