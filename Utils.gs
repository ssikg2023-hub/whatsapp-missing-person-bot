/************************************************************
 * Utils.gs — Core engines for sessions, cases, updates, media
 * Aligned with master flow + sheet schema
 ************************************************************/

/************************************************************
 * SPREADSHEET + SHEET ACCESS
 ************************************************************/
function getMainSheet() {
  return SpreadsheetApp.openById(CONF("SHEET_ID"));
}

function getSheet_(name) {
  return getMainSheet().getSheetByName(name);
}

const SHEET_NAMES = {
  SESSIONS: "User_Sessions",
  CASES: "Cases",
  UPDATES: "Case_Updates"
};

const Sheets = {
  sessions: function() { return getSheet_(SHEET_NAMES.SESSIONS); },
  cases:    function() { return getSheet_(SHEET_NAMES.CASES); },
  updates:  function() { return getSheet_(SHEET_NAMES.UPDATES); }
};

// Legacy alias retained for existing references
const DB = {
  Sessions: Sheets.sessions,
  Cases:    Sheets.cases,
  Updates:  Sheets.updates
};

/************************************************************
 * CONSTANTS — COLUMN MAPS
 ************************************************************/
const SESSION_COLUMNS = {
  NUMBER: 1,
  STEP: 2,
  FLOW: 3,
  REGION: 4,
  LANGUAGE: 5,
  TEMP: 6,
  UPDATED_AT: 7,
  COUNT: 7
};

const CASE_COLUMNS = {
  ID: 1,
  CREATED_AT: 2,
  WHATSAPP: 3,
  REGION: 4,
  LANGUAGE: 5,
  FLOW: 6,
  Q1: 7, // Q1..Q16 occupy columns 7-22
  EXTRA: 23,
  MEDIA: 24,
  STATUS: 25,
  COUNT: 25
};

const CASE_UPDATE_COLUMNS = {
  UPDATE_ID: 1,
  CASE_ID: 2,
  CREATED_AT: 3,
  TYPE: 4,
  CONTENT: 5,
  MEDIA_URL: 6,
  RAW_JSON: 7,
  COUNT: 7
};

const CASE_TOTAL_QUESTIONS = 16;

const SESSION_TTL_MINUTES = Number(CONF("SESSION_TTL_MINUTES")) || (24 * 60);

/************************************************************
 * SAFE JSON HELPERS
 ************************************************************/
function safeJsonStringify(obj) {
  try {
    return JSON.stringify(obj || {});
  } catch (err) {
    Logger.log("JSON encode error → " + err);
    return "{}";
  }
}

function safeJsonParse(str) {
  try {
    if (!str) return {};
    return JSON.parse(str);
  } catch (err) {
    Logger.log("JSON parse error → " + err);
    return {};
  }
}

// Backwards compatibility helpers
function toJsonString(obj) { return safeJsonStringify(obj); }
function parseJson(str) { return safeJsonParse(str); }

/************************************************************
 * GENERAL HELPERS
 ************************************************************/
function normalizePhoneNumber(number) {
  if (!number) return "";
  const raw = ("" + number).trim();
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/[^0-9]/g, "");
  return hasPlus ? "+" + digits : digits;
}

function sanitizeInput(value) {
  if (value === null || value === undefined) return "";
  return ("" + value).trim();
}

function parseInteractiveReply(interactive) {
  if (!interactive) return "";
  if (interactive.type === "button_reply") {
    return interactive.button_reply?.id || interactive.button_reply?.title || "";
  }
  if (interactive.type === "list_reply") {
    return interactive.list_reply?.id || interactive.list_reply?.title || "";
  }
  return "";
}

function parseLocation(message) {
  const loc = message?.location;
  if (!loc) return null;
  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    name: loc.name || "",
    address: loc.address || ""
  };
}

function sanitizeNumber_(num) {
  return normalizePhoneNumber(num).replace(/[^0-9]/g, "");
}

function debugLog(msg) {
  if (!CONF("ENABLE_DEBUG_LOGS")) return;
  try {
    Logger.log(typeof msg === "string" ? msg : JSON.stringify(msg, null, 2));
  } catch (err) {
    Logger.log("debugLog error → " + err);
  }
}

/************************************************************
 * REGION DETECTION
 ************************************************************/
function detectRegionByPhone(num) {
  const normalized = normalizePhoneNumber(num).replace("+", "");
  if (normalized.startsWith("92")) return "PK";
  if (normalized.startsWith("91")) return "IN";
  if (normalized.startsWith("880")) return "BD";

  const middleEastPrefixes = ["966", "971", "973", "974", "965", "968"];
  for (var i = 0; i < middleEastPrefixes.length; i++) {
    if (normalized.startsWith(middleEastPrefixes[i])) {
      return "ME";
    }
  }
  return "OTHER";
}

const Region = {
  detect: function(number) { return detectRegionByPhone(number); }
};

/************************************************************
 * SESSION ENGINE (load/save/reset + helpers)
 ************************************************************/
function loadSession(number) {
  const normalized = normalizePhoneNumber(number);
  if (!normalized) return null;

  const sh = Sheets.sessions();
  const last = sh.getLastRow();
  if (last < 2) return null;

  const values = sh.getRange(2, 1, last - 1, SESSION_COLUMNS.COUNT).getValues();
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[SESSION_COLUMNS.NUMBER - 1]) continue;

    var stored = normalizePhoneNumber(row[SESSION_COLUMNS.NUMBER - 1]);
    if (stored !== normalized) continue;

    var updatedAt = row[SESSION_COLUMNS.UPDATED_AT - 1];
    if (!(updatedAt instanceof Date)) {
      updatedAt = updatedAt ? new Date(updatedAt) : null;
    }

    if (isSessionExpired_(updatedAt)) {
      sh.deleteRow(i + 2);
      return null;
    }

    return ensureSessionDefaults_({
      _row: i + 2,
      WhatsApp_Number: normalized,
      Current_Step_Code: row[SESSION_COLUMNS.STEP - 1] || "",
      Flow_Type: row[SESSION_COLUMNS.FLOW - 1] || "",
      Region_Group: row[SESSION_COLUMNS.REGION - 1] || "",
      Preferred_Language: row[SESSION_COLUMNS.LANGUAGE - 1] || "",
      Temp_Data: row[SESSION_COLUMNS.TEMP - 1] || "{}",
      Temp: safeJsonParse(row[SESSION_COLUMNS.TEMP - 1] || "{}"),
      Updated_At: updatedAt || new Date()
    });
  }
  return null;
}

function saveSession(session) {
  if (!session) return;
  var record = ensureSessionDefaults_(session);
  var sh = Sheets.sessions();
  var json = safeJsonStringify(record.Temp);
  var now = new Date();

  if (!record._row) {
    sh.appendRow([
      record.WhatsApp_Number,
      record.Current_Step_Code,
      record.Flow_Type,
      record.Region_Group,
      record.Preferred_Language,
      json,
      now
    ]);
    record._row = sh.getLastRow();
  } else {
    sh.getRange(record._row, 1, 1, SESSION_COLUMNS.COUNT).setValues([
      [
        record.WhatsApp_Number,
        record.Current_Step_Code,
        record.Flow_Type,
        record.Region_Group,
        record.Preferred_Language,
        json,
        now
      ]
    ]);
  }

  record.Temp_Data = json;
  record.Updated_At = now;
}

function resetSession(number) {
  const normalized = normalizePhoneNumber(number);
  if (!normalized) return;
  const sh = Sheets.sessions();
  const last = sh.getLastRow();
  if (last < 2) return;

  const values = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    var stored = normalizePhoneNumber(values[i][0]);
    if (stored === normalized) {
      sh.deleteRow(i + 2);
      return;
    }
  }
}

function newSession(number, region) {
  var normalized = normalizePhoneNumber(number);
  if (!normalized) return null;

  var session = ensureSessionDefaults_({
    _row: null,
    WhatsApp_Number: normalized,
    Current_Step_Code: "LANG_SELECT",
    Flow_Type: "",
    Region_Group: region || detectRegionByPhone(normalized),
    Preferred_Language: "",
    Temp: {},
    Temp_Data: "{}",
    Updated_At: new Date()
  });

  saveSession(session);
  return session;
}

function isSessionExpired_(updatedAt) {
  if (!updatedAt) return false;
  var now = new Date();
  var diff = (now.getTime() - updatedAt.getTime()) / 60000; // minutes
  return diff > SESSION_TTL_MINUTES;
}

function ensureSessionDefaults_(session) {
  if (!session) return null;
  session.WhatsApp_Number = normalizePhoneNumber(session.WhatsApp_Number);
  session.Current_Step_Code = session.Current_Step_Code || "";
  session.Flow_Type = session.Flow_Type || "";
  session.Region_Group = session.Region_Group || "";
  session.Preferred_Language = session.Preferred_Language || "";
  session.Temp = session.Temp || {};
  if (typeof session.Temp !== "object") {
    session.Temp = safeJsonParse(session.Temp);
  }
  return session;
}

function getStepInfo(stepCode) {
  if (!stepCode) return null;
  var match = /^([ABC])_Q(\d+)$/.exec(stepCode);
  if (!match) return null;
  return {
    flow: match[1],
    question: Number(match[2])
  };
}

function buildStepCode(flowType, questionNumber) {
  if (!flowType || !questionNumber) return "";
  return flowType.toUpperCase() + "_Q" + questionNumber;
}

// Backwards compatibility for legacy Session object usage
const Session = {
  get: function(number) { return loadSession(number); },
  create: function(number) { return newSession(number, detectRegionByPhone(number)); },
  save: function(session) { return saveSession(session); },
  delete: function(number) { return resetSession(number); }
};

/************************************************************
 * CASE ENGINE — creation, answers, metadata, queries
 ************************************************************/
function generateCaseId_(region) {
  var prefix = region || "XX";
  var sh = Sheets.cases();
  var last = sh.getLastRow();
  var count = Math.max(0, last - 1) + 1;
  return prefix + "-" + Utilities.formatString("%05d", count);
}

function createNewCase(session) {
  var sh = Sheets.cases();
  var now = new Date();
  var region = session.Region_Group || detectRegionByPhone(session.WhatsApp_Number);
  var language = session.Preferred_Language || "";
  var flow = session.Flow_Type || session.Temp?.flow || "";
  var caseId = generateCaseId_(region || "XX");

  var row = [
    caseId,
    now,
    session.WhatsApp_Number,
    region,
    language,
    flow
  ];

  for (var i = 0; i < CASE_TOTAL_QUESTIONS; i++) {
    row.push("");
  }

  row.push("", "", "Open");

  sh.appendRow(row);
  return caseId;
}

function saveCaseMeta(caseId, meta) {
  if (!caseId || !meta) return;
  var sh = Sheets.cases();
  var last = sh.getLastRow();
  if (last < 2) return;

  var range = sh.getRange(2, 1, last - 1, CASE_COLUMNS.COUNT).getValues();
  for (var i = 0; i < range.length; i++) {
    if (range[i][CASE_COLUMNS.ID - 1] === caseId) {
      var rowIndex = i + 2;
      if (meta.region !== undefined) {
        sh.getRange(rowIndex, CASE_COLUMNS.REGION).setValue(meta.region);
      }
      if (meta.language !== undefined) {
        sh.getRange(rowIndex, CASE_COLUMNS.LANGUAGE).setValue(meta.language);
      }
      if (meta.flowType !== undefined) {
        sh.getRange(rowIndex, CASE_COLUMNS.FLOW).setValue(meta.flowType);
      }
      if (meta.userType !== undefined) {
        sh.getRange(rowIndex, CASE_COLUMNS.EXTRA).setValue(meta.userType);
      }
      return;
    }
  }
}

function appendAnswerToCase(caseId, questionNumber, answer) {
  if (!caseId || !questionNumber) return;
  if (questionNumber < 1 || questionNumber > CASE_TOTAL_QUESTIONS) return;

  var sh = Sheets.cases();
  var last = sh.getLastRow();
  if (last < 2) return;

  var col = CASE_COLUMNS.Q1 + (questionNumber - 1);
  var values = sh.getRange(2, 1, last - 1, CASE_COLUMNS.COUNT).getValues();
  var cleaned = sanitizeInput(answer);

  for (var i = 0; i < values.length; i++) {
    if (values[i][CASE_COLUMNS.ID - 1] === caseId) {
      sh.getRange(i + 2, col).setValue(cleaned);
      return;
    }
  }
}

function saveExtra(caseId, extraText) {
  if (!caseId) return;
  var sh = Sheets.cases();
  var last = sh.getLastRow();
  if (last < 2) return;

  var values = sh.getRange(2, 1, last - 1, CASE_COLUMNS.COUNT).getValues();
  var cleaned = sanitizeInput(extraText);

  for (var i = 0; i < values.length; i++) {
    if (values[i][CASE_COLUMNS.ID - 1] === caseId) {
      var prev = sanitizeInput(values[i][CASE_COLUMNS.EXTRA - 1]);
      var combined = prev ? prev + "\n" + cleaned : cleaned;
      sh.getRange(i + 2, CASE_COLUMNS.EXTRA).setValue(combined);
      return;
    }
  }
}

function appendCaseMedia(caseId, mediaUrl) {
  if (!caseId || !mediaUrl) return;
  var sh = Sheets.cases();
  var last = sh.getLastRow();
  if (last < 2) return;

  var values = sh.getRange(2, 1, last - 1, CASE_COLUMNS.COUNT).getValues();
  var cleaned = sanitizeInput(mediaUrl);

  for (var i = 0; i < values.length; i++) {
    if (values[i][CASE_COLUMNS.ID - 1] === caseId) {
      var prev = sanitizeInput(values[i][CASE_COLUMNS.MEDIA - 1]);
      var combined = prev ? prev + "\n" + cleaned : cleaned;
      sh.getRange(i + 2, CASE_COLUMNS.MEDIA).setValue(combined);
      return;
    }
  }
}

function closeCase(caseId, status) {
  if (!caseId) return;
  var sh = Sheets.cases();
  var last = sh.getLastRow();
  if (last < 2) return;

  var values = sh.getRange(2, 1, last - 1, CASE_COLUMNS.COUNT).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][CASE_COLUMNS.ID - 1] === caseId) {
      sh.getRange(i + 2, CASE_COLUMNS.STATUS).setValue(status || "Closed");
      return;
    }
  }
}

function getExistingCasesByNumber(number) {
  var normalized = normalizePhoneNumber(number);
  if (!normalized) return [];
  var sh = Sheets.cases();
  var last = sh.getLastRow();
  if (last < 2) return [];

  var values = sh.getRange(2, 1, last - 1, CASE_COLUMNS.COUNT).getValues();
  var list = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (normalizePhoneNumber(row[CASE_COLUMNS.WHATSAPP - 1]) === normalized) {
      list.push({
        Case_ID: row[CASE_COLUMNS.ID - 1],
        Created_At: row[CASE_COLUMNS.CREATED_AT - 1],
        WhatsApp_Number: row[CASE_COLUMNS.WHATSAPP - 1],
        Region: row[CASE_COLUMNS.REGION - 1],
        Language: row[CASE_COLUMNS.LANGUAGE - 1],
        Flow_Type: row[CASE_COLUMNS.FLOW - 1],
        Q: row.slice(CASE_COLUMNS.Q1 - 1, CASE_COLUMNS.Q1 - 1 + CASE_TOTAL_QUESTIONS),
        Extra_Notes: row[CASE_COLUMNS.EXTRA - 1],
        Media_Links: row[CASE_COLUMNS.MEDIA - 1],
        Case_Status: row[CASE_COLUMNS.STATUS - 1]
      });
    }
  }
  return list;
}

function getCaseById(caseId) {
  if (!caseId) return null;
  var sh = Sheets.cases();
  var last = sh.getLastRow();
  if (last < 2) return null;

  var values = sh.getRange(2, 1, last - 1, CASE_COLUMNS.COUNT).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][CASE_COLUMNS.ID - 1] === caseId) {
      var row = values[i];
      return {
        Case_ID: row[CASE_COLUMNS.ID - 1],
        Created_At: row[CASE_COLUMNS.CREATED_AT - 1],
        WhatsApp_Number: row[CASE_COLUMNS.WHATSAPP - 1],
        Region: row[CASE_COLUMNS.REGION - 1],
        Language: row[CASE_COLUMNS.LANGUAGE - 1],
        Flow_Type: row[CASE_COLUMNS.FLOW - 1],
        Q: row.slice(CASE_COLUMNS.Q1 - 1, CASE_COLUMNS.Q1 - 1 + CASE_TOTAL_QUESTIONS),
        Extra_Notes: row[CASE_COLUMNS.EXTRA - 1],
        Media_Links: row[CASE_COLUMNS.MEDIA - 1],
        Case_Status: row[CASE_COLUMNS.STATUS - 1]
      };
    }
  }
  return null;
}

function writeCaseToSheet(record) {
  if (!record) return;
  var sh = Sheets.cases();
  var row = [];
  row[CASE_COLUMNS.ID - 1] = record.Case_ID;
  row[CASE_COLUMNS.CREATED_AT - 1] = record.Created_At || new Date();
  row[CASE_COLUMNS.WHATSAPP - 1] = record.WhatsApp_Number;
  row[CASE_COLUMNS.REGION - 1] = record.Region;
  row[CASE_COLUMNS.LANGUAGE - 1] = record.Language;
  row[CASE_COLUMNS.FLOW - 1] = record.Flow_Type;

  for (var i = 0; i < CASE_TOTAL_QUESTIONS; i++) {
    row[CASE_COLUMNS.Q1 - 1 + i] = record.Q?.[i] || "";
  }

  row[CASE_COLUMNS.EXTRA - 1] = record.Extra_Notes || "";
  row[CASE_COLUMNS.MEDIA - 1] = record.Media_Links || "";
  row[CASE_COLUMNS.STATUS - 1] = record.Case_Status || "Open";

  sh.appendRow(row);
}

// Legacy wrappers used inside flows
function createCase(session) { return createNewCase(session); }
function saveAnswer(caseId, questionNumber, answer) { return appendAnswerToCase(caseId, questionNumber, answer); }

const Cases = {
  getCasesByNumber: function(number) { return getExistingCasesByNumber(number); },
  validateCaseID: function(number, caseId) {
    return getExistingCasesByNumber(number).some(function(item) {
      return item.Case_ID === caseId;
    });
  },
  getCaseStatus: function(caseId) {
    var record = getCaseById(caseId);
    return record ? (record.Case_Status || "") : "";
  }
};

/************************************************************
 * CASE UPDATE ENGINE
 ************************************************************/
function createCaseUpdate(caseId, type, content, mediaUrl, rawJson) {
  if (!caseId) return "";
  var sh = Sheets.updates();
  var updateId = "UP-" + Date.now();
  sh.appendRow([
    updateId,
    caseId,
    new Date(),
    type || "INFO",
    content || "",
    mediaUrl || "",
    rawJson || ""
  ]);
  return updateId;
}

function appendCaseUpdateText(caseId, text, rawJson) {
  return createCaseUpdate(caseId, "UPDATE_TEXT", sanitizeInput(text), "", rawJson || "");
}

function appendCaseUpdateMedia(caseId, mediaUrl, rawJson) {
  return createCaseUpdate(caseId, "MEDIA", "", mediaUrl || "", rawJson || "");
}

function closeCaseWithUpdate(caseId, closingMessage) {
  closeCase(caseId, closingMessage || "Closed");
  return createCaseUpdate(caseId, "STATUS_CHANGE", closingMessage || "Closed", "", "");
}

function saveCaseUpdate(caseId, type, content, mediaUrl, rawJson) {
  return createCaseUpdate(caseId, type, content, mediaUrl, rawJson);
}

/************************************************************
 * MEDIA ENGINE
 ************************************************************/
const MediaEngine = {
  downloadWhatsAppMedia: function(mediaId, mimeType) {
    try {
      if (!mediaId) return null;
      var token = CONF("WHATSAPP_TOKEN");
      var metaResponse = UrlFetchApp.fetch(
        "https://graph.facebook.com/v20.0/" + mediaId,
        { headers: { Authorization: "Bearer " + token } }
      );
      var meta = safeJsonParse(metaResponse.getContentText());
      if (!meta.url) return null;
      var fileResponse = UrlFetchApp.fetch(meta.url, {
        headers: { Authorization: "Bearer " + token }
      });
      var blob = fileResponse.getBlob();
      if (mimeType) {
        blob.setContentType(mimeType);
      }
      return blob;
    } catch (err) {
      Logger.log("downloadWhatsAppMedia error → " + err);
      return null;
    }
  },

  mimeToExtension: function(mimeType) {
    if (!mimeType) return "bin";
    var lower = mimeType.toLowerCase();
    if (lower.indexOf("jpeg") > -1 || lower.indexOf("jpg") > -1) return "jpg";
    if (lower.indexOf("png") > -1) return "png";
    if (lower.indexOf("gif") > -1) return "gif";
    if (lower.indexOf("mp4") > -1) return "mp4";
    if (lower.indexOf("mov") > -1) return "mov";
    if (lower.indexOf("pdf") > -1) return "pdf";
    if (lower.indexOf("mp3") > -1) return "mp3";
    if (lower.indexOf("ogg") > -1) return "ogg";
    if (lower.indexOf("wav") > -1) return "wav";
    if (lower.indexOf("aac") > -1) return "aac";
    return "bin";
  },

  uploadToDrive: function(blob, extension, caseId) {
    try {
      if (!blob) return "";
      var folder = DriveApp.getFolderById(CONF("MEDIA_FOLDER_ID"));
      var filename = (caseId || "case") + "_" + Date.now() + "." + (extension || "bin");
      var file = folder.createFile(blob.setName(filename));
      return file.getUrl();
    } catch (err) {
      Logger.log("uploadToDrive error → " + err);
      return "";
    }
  },

  saveMediaToCase: function(caseId, mediaIdOrUrl, mimeType, rawJson) {
    if (!caseId || !mediaIdOrUrl) return false;
    var url = mediaIdOrUrl;
    var isRemoteId = mediaIdOrUrl.indexOf("http") !== 0;
    if (isRemoteId) {
      var blob = this.downloadWhatsAppMedia(mediaIdOrUrl, mimeType);
      if (!blob) return false;
      var ext = this.mimeToExtension(mimeType);
      url = this.uploadToDrive(blob, ext, caseId);
    }
    if (!url) return false;
    appendCaseMedia(caseId, url);
    appendCaseUpdateMedia(caseId, url, rawJson || "");
    return true;
  }
};

function downloadWhatsAppMedia(mediaId, mimeType) {
  return MediaEngine.downloadWhatsAppMedia(mediaId, mimeType);
}

function uploadToDrive(blob, extension, caseId) {
  return MediaEngine.uploadToDrive(blob, extension, caseId);
}

function saveMediaToCase(caseId, mediaIdOrUrl, mimeType, rawJson) {
  return MediaEngine.saveMediaToCase(caseId, mediaIdOrUrl, mimeType, rawJson);
}

/************************************************************
 * LEGACY HELPERS FOR COMPATIBILITY
 ************************************************************/
function extractMediaUrl(msg) {
  if (!msg) return null;
  if (msg.image?.id) return msg.image.id;
  if (msg.document?.id) return msg.document.id;
  if (msg.audio?.id) return msg.audio.id;
  if (msg.video?.id) return msg.video.id;
  return null;
}

function normalizeNumber(num) {
  return normalizePhoneNumber(num);
}

function safeSet(sh, row, col, value) {
  try {
    sh.getRange(row, col).setValue(value);
  } catch (err) {
    Logger.log("safeSet error → " + err);
  }
}

function safeAppend(sh, arr) {
  try {
    sh.appendRow(arr);
  } catch (err) {
    Logger.log("safeAppend error → " + err);
  }
}
