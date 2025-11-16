/*******************************************************
 * CONFIG.gs — CENTRAL ENVIRONMENT CONFIG (FINAL)
 * Credentials + Constants only — NO FLOW LOGIC.
 *******************************************************/

const ENV = {

  /**********************
   * WHATSAPP API CONFIG
   **********************/
  WHATSAPP_TOKEN: "YOUR_WHATSAPP_TOKEN_HERE",
  WHATSAPP_PHONE_NUMBER_ID: "890108940845609",
  VERIFY_TOKEN: "YOUR_VERIFY_TOKEN_HERE",

  // Recommended fixed API version
  WHATSAPP_API_VERSION: "v20.0",
  WHATSAPP_API_BASE_URL: "https://graph.facebook.com/",


  /**********************
   * GOOGLE DRIVE CONFIG
   **********************/
  MEDIA_FOLDER_ID: "YOUR_MEDIA_FOLDER_ID_HERE",


  /**********************
   * GOOGLE SHEETS CONFIG
   **********************/
  SHEET_ID: "YOUR_MAIN_SHEET_ID_HERE",


  /**********************
   * SYSTEM SETTINGS
   **********************/
  MAX_MEDIA_SIZE_MB: 25,      
  ENABLE_DEBUG_LOGS: true     
};


/*******************************************************
 * CONF — UNIVERSAL CONFIG ACCESSOR
 *******************************************************/
function CONF(key) {
  return ENV[key];
}
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
/***************************************************************
 * Texts_Wrapper.gs — GLOBAL TEXTS REGISTRY & HELPERS
 * Source copy: “WhatsApp Chatbot Flow – Region wise.txt”
 ***************************************************************/

// Ensure the global Texts namespace exists
if (typeof Texts === "undefined") {
  var Texts = {};
}

/***************************************************************
 * REGISTER MODULES (each retains its own exported functions)
 ***************************************************************/
(function registerTextModules() {
  const modules = {
    FlowA: Texts_A,
    FlowB: Texts_B,
    FlowC: Texts_C,
    Eligibility: Texts_Eligibility,
    ExistingCases: Texts_ExistingCases,
    CaseEntryCheck: Texts_CaseEntryCheck,
    CaseUpdates: Texts_CaseUpdates,
    Validation: Texts_Validation,
    Closing: Texts_Closing,
    LangMenus: Texts_LangMenus,
    UserTypes: Texts_UserTypes
  };

  Object.keys(modules).forEach(function(key) {
    Texts[key] = modules[key];
  });

  Texts.Closing = Texts_Closing;
})();

/***************************************************************
 * OUTBOUND SEND WRAPPER
 ***************************************************************/
Texts.send = function(to, body) {
  if (!body) return;
  return sendWhatsAppMessage(to, body);
};

/***************************************************************
 * INVALID OPTION (delegates to Validation copy)
 ***************************************************************/
Texts.sendInvalidOption = function(session) {
  return Texts_Validation.sendInvalidOption(session);
};

Texts.sendInvalidCaseID = function(session) {
  return Texts_Validation.sendInvalidCaseID(session);
};

Texts.sendEligibilityRejected = function(session) {
  return Texts_Validation.sendEligibilityRejected(session);
};

Texts.closingAfterRejection = function(session) {
  return Texts_Validation.closingAfterRejection(session);
};

/***************************************************************
 * LANGUAGE MENU HELPERS (delegates to Texts_LangMenus)
 ***************************************************************/
Texts.getAvailableLanguages = function(region) {
  return Texts_LangMenus.getAvailableLanguages(region);
};

Texts.mapLanguageChoice = function(region, choice) {
  return Texts_LangMenus.mapLanguageChoice(region, choice);
};

Texts.sendLanguageMenu = function(session) {
  return Texts_LangMenus.getMenu(session.Region_Group);
};

/***************************************************************
 * USER TYPE MENU (delegates to Texts_UserTypes)
 ***************************************************************/
Texts.sendUserTypeMenu = function(session) {
  return Texts_UserTypes.sendMenu(session);
};

/***************************************************************
 * LANGUAGE FALLBACK UTILITY
 ***************************************************************/
Texts.resolveLanguage = function(session, allowedLanguages) {
  const preferred = session && session.Preferred_Language;
  const available = Array.isArray(allowedLanguages) ? allowedLanguages.slice() : [];

  if (!available.length) {
    return preferred || "EN";
  }

  if (preferred && available.indexOf(preferred) !== -1) {
    return preferred;
  }

  if (available.indexOf("EN") !== -1) {
    return "EN";
  }

  return available[0];
};
/***************************************************************
 * Texts_LangMenus.gs — Language Menus (Region Based)
 ***************************************************************/

const Texts_LangMenus = {

  getMenu(region) {
    switch (region) {

      case "PK":
        return [
          "Welcome! Please choose your preferred language:",
          ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
          "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
          "1️⃣ English",
          "2️⃣ اردو",
          "3️⃣ Roman Urdu"
        ].join("\n");

      case "IN":
        return [
          "Welcome! Please choose your preferred language:",
          ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
          "स्वागत है! कृपया अपनी भाषा चुनें",
          "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
          "1️⃣ English",
          "2️⃣ हिन्दी",
          "3️⃣ اردو",
          "4️⃣ Roman Urdu"
        ].join("\n");

      case "BD":
        return [
          "Welcome! Please choose your preferred language:",
          ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
          "স্বাগতম! দয়া করে আপনার ভাষা নির্বাচন করুন",
          "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
          "1️⃣ English",
          "2️⃣ বাংলা",
          "3️⃣ اردو",
          "4️⃣ Roman Urdu"
        ].join("\n");

      case "ME":
        return [
          "Welcome! Please choose your preferred language:",
          ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
          "مرحبًا! يرجى اختيار لغتك المفضلة",
          "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
          "1️⃣ English",
          "2️⃣ العربية",
          "3️⃣ اردو",
          "4️⃣ Roman Urdu"
        ].join("\n");

      default:
        return [
          "Welcome! Please choose your preferred language:",
          ":خوش آمدید! براہ کرم اپنی زبان کا انتخاب کریں",
          "Khush aamdeed! Barah-e-karam apni zuban ka intikhab karein:",
          "1️⃣ English",
          "2️⃣ اردو",
          "3️⃣ Roman Urdu"
        ].join("\n");
    }
  },


  /***********************************************************
   * AVAILABLE LANGUAGES PER REGION (REQUIRED)
   ***********************************************************/
  getAvailableLanguages(region) {

    switch (region) {
      case "PK": return ["EN", "UR", "RUR"];
      case "IN": return ["EN", "HI", "UR", "RUR"];
      case "BD": return ["EN", "BN", "UR", "RUR"];
      case "ME": return ["EN", "AR", "UR", "RUR"];
      default:   return ["EN", "UR", "RUR"];
    }
  },


  /***********************************************************
   * MAP USER INPUT TO LANGUAGE CODE (REQUIRED)
   ***********************************************************/
  mapLanguageChoice(region, choice) {

    const langs = this.getAvailableLanguages(region);

    const index = Number(choice) - 1;

    if (index < 0 || index >= langs.length) return null;

    return langs[index];
  }

};
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
/***************************************************************
 * Texts_Validation.gs — INVALID / ERROR / RESTRICTION MESSAGES
 * EXACT text from Chat Flow & Messages file — NO CHANGES.
 ***************************************************************/

const Texts_Validation = {

  /***********************************************************
   * GENERIC PROMPT TO RESELECT FROM MENU (All menus reuse this)
   ***********************************************************/
  sendInvalidOption(session) {
    const lang = session.Preferred_Language;

    const map = {
      "EN": "Please choose an option:",
      "UR": "براہِ کرم ایک آپشن منتخب کریں:",
      "RUR": "Barah-e-karam ek option ka intikhab karein:",
      "HI": "कृपया एक विकल्प चुनें:",
      "BN": "অনুগ্রহ করে একটি অপশন নির্বাচন করুন:",
      "AR": "يرجى اختيار أحد الخيارات:"
    };

    return map[lang] || map["EN"];
  },


  /***********************************************************
   * INVALID CASE ID (Multiple-case scenario)
   ***********************************************************/
  sendInvalidCaseID(session) {
    const lang = session.Preferred_Language;

    const map = {
      "EN": [
        "The Case ID you entered was not found for this number.",
        "Please check and type the correct Case ID, or reply 0 to go back."
      ].join("\n"),

      "UR": [
        "آپ نے جو کیس نمبر بھیجا ہے وہ اس نمبر کے ساتھ نہیں ملا۔",
        "براہِ کرم دوبارہ درست کیس نمبر لکھیں، یا واپس جانے کے لیے 0 لکھ دیں۔"
      ].join("\n"),

      "RUR": [
        "Aap ne jo Case ID bheji hai woh is number ke sath match nahi hui.",
        "Meherbani karke sahi Case ID dobara type karein, ya wapas jane ke liye 0 likh dein."
      ].join("\n"),

      "HI": [
        "आपने जो Case ID भेजी है, वह इस नंबर के लिए नहीं मिली।",
        "कृपया सही Case ID दोबारा लिखें, या वापस जाने के लिए 0 लिख दें।"
      ].join("\n"),

      "BN": [
        "আপনি যে Case ID পাঠিয়েছেন, সেটি এই নম্বরের সাথে মিলে না।",
        "অনুগ্রহ করে সঠিক Case ID আবার লিখুন, অথবা ফিরে যেতে 0 লিখুন।"
      ].join("\n"),

      "AR": [
        "رقم القضية الذي أدخلته غير مرتبط بهذا الرقم.",
        "يرجى إعادة كتابة رقم القضية الصحيح، أو إرسال 0 للرجوع."
      ].join("\n")
    };

    return map[lang] || map["EN"];
  },


  /***********************************************************
   * ELIGIBILITY REJECTION (Police / Agency cases)
   ***********************************************************/
  sendEligibilityRejected(session) {
    const lang = session.Preferred_Language;

    const map = {
      "EN": [
        "We are sorry for your situation, but we are unable to take police or agency-related cases.",
        "Would you like to submit a new case?",
        "1️⃣ Yes",
        "2️⃣ No"
      ].join("\n"),

      "UR": [
        "ہم آپ کے دُکھ میں شریک ہیں، مگر ہم پولیس یا ادارے کے کیسز نہیں لیتے۔",
        "کیا آپ کوئی نیا کیس جمع کروانا چاہتے ہیں؟",
        "1️⃣ جی ہاں",
        "2️⃣ نہیں"
      ].join("\n"),

      "RUR": [
        "Hum aap ke dukh mein shareek hain, magar hum police ya idaray ke cases handle nahi karte.",
        "Kya aap koi naya case submit karna chahte hain?",
        "1️⃣ Haan",
        "2️⃣ Nahi"
      ].join("\n"),

      "HI": [
        "हमें आपके हालात का दुःख है, लेकिन हम पुलिस या एजेंसी से जुड़े मामलों को नहीं ले सकते।",
        "क्या आप नया केस जमा करना चाहते हैं?",
        "1️⃣ हाँ",
        "2️⃣ नहीं"
      ].join("\n"),

      "BN": [
        "আমরা আপনার পরিস্থিতির জন্য দুঃখিত, কিন্তু আমরা পুলিশ বা এজেন্সি-সংক্রান্ত মামলা গ্রহণ করি না।",
        "আপনি কি একটি নতুন কেস জমা দিতে চান?",
        "1️⃣ হ্যাঁ",
        "2️⃣ না"
      ].join("\n"),

      "AR": [
        "نحن متأسفون لوضعك، ولكن لا يمكننا التعامل مع القضايا المتعلقة بالشرطة أو الجهات الأمنية.",
        "هل ترغب في تقديم بلاغ جديد؟",
        "1️⃣ نعم",
        "2️⃣ لا"
      ].join("\n")
    };

    return map[lang] || map["EN"];
  },


  /***********************************************************
   * CLOSING MESSAGE after user selects “No”
   ***********************************************************/
  closingAfterRejection(session) {
    const lang = session.Preferred_Language;

    const map = {
      "EN": [
        "May Allah reunite every family with their loved ones. Ameen.",
        "Thank you for trusting us."
      ].join("\n"),

      "UR": [
        "اللہ ہر خاندان کو ان کے پیاروں سے ملائے۔ آمین۔",
        "ہم پر بھروسہ کرنے کا شکریہ۔"
      ].join("\n"),

      "RUR": [
        "Allah har khandaan ko unke pyaron se milaye. Ameen.",
        "Hum par bharosa karne ka shukriya."
      ].join("\n"),

      "HI": [
        "अल्लाह हर परिवार को उनके अपनों से मिला दे। आमीन।",
        "हम पर भरोसा करने के लिए शुक्रिया।"
      ].join("\n"),

      "BN": [
        "আল্লাহ প্রতিটি পরিবারকে তাদের প্রিয়জনদের সাথে মিলিয়ে দিন। আমীন।",
        "আমাদের উপর ভরসা করার জন্য ধন্যবাদ।"
      ].join("\n"),

      "AR": [
        "اللهم اجمع كل أسرة مع أحبّائها. آمين.",
        "شكراً لثقتكم بنا."
      ].join("\n")
    };

    return map[lang] || map["EN"];
  }

};

/***************************************************************
 * REGISTER INTO GLOBAL Texts WRAPPER
 ***************************************************************/
if (typeof Texts === "undefined") {
  var Texts = {};
}

Texts.sendInvalidOption       = (s) => Texts_Validation.sendInvalidOption(s);
Texts.sendInvalidCaseID       = (s) => Texts_Validation.sendInvalidCaseID(s);
Texts.sendEligibilityRejected = (s) => Texts_Validation.sendEligibilityRejected(s);
Texts.closingAfterRejection   = (s) => Texts_Validation.closingAfterRejection(s);
/***************************************************************
 * Texts_Eligibility.gs — Flow A Eligibility Prompts
 ***************************************************************/

const Texts_Eligibility = {

  /***********************************************************
   * SEND ELIGIBILITY QUESTION (REGION + LANGUAGE)
   ***********************************************************/
  sendEligibilityQuestion(session) {
    const lang = session.Preferred_Language || "EN";
    const region = session.Region_Group || "OTHER";

    const map = {
      PK: {
        EN: [
          "English:",
          " Before we begin, please clarify one thing:",
          "Has your loved one been arrested by the police or any agency?",
          "",
          "Options:",
          " 1️⃣ Yes / Haan — جی ہاں",
          "2️⃣ No / Nahi — نہیں"
        ].join("\n"),
        UR: [
          "Urdu:",
          " شروع کرنے سے پہلے، ایک بات بتا دیں:",
          "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
          "",
          "Options:",
          " 1️⃣ جی ہاں",
          "2️⃣ نہیں"
        ].join("\n"),
        RUR: [
          "Roman Urdu:",
          " Shuru karne se pehle, ek baat bata dein:",
          "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
          "",
          "Options:",
          " 1️⃣ Haan",
          "2️⃣ Nahi"
        ].join("\n")
      },

      IN: {
        EN: [
          "English:",
          " Before we begin, please clarify one thing:",
          "Has your loved one been arrested by the police or any agency?",
          "",
          "Options:",
          " 1️⃣ Yes / Haan / हाँ — جی ہاں",
          "2️⃣ No / Nahi / नहीं — نہیں"
        ].join("\n"),
        HI: [
          "Hindi:",
          " शुरू करने से पहले، कृपया एक बात बताइए:",
          "क्या आपके प्रियजन को पुलिस या किसी एजेंसी ने गिरफ्तार किया है?",
          "",
          "Options:",
          " 1️⃣ हाँ",
          "2️⃣ नहीं"
        ].join("\n"),
        UR: [
          "Urdu:",
          " شروع کرنے سے پہلے، ایک بات بتا دیں:",
          "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
          "",
          "Options:",
          " 1️⃣ جی ہاں",
          "2️⃣ نہیں"
        ].join("\n"),
        RUR: [
          "Roman Urdu:",
          " Shuru karne se pehle, ek baat bata dein:",
          "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
          "",
          "Options:",
          " 1️⃣ Haan",
          "2️⃣ Nahi"
        ].join("\n")
      },

      BD: {
        EN: [
          "English:",
          " Before we begin, please clarify one thing:",
          "Has your loved one been arrested by the police or any agency?",
          "",
          "Options:",
          " 1️⃣ Yes / Haan / হ্যাঁ — جی ہاں",
          "2️⃣ No / Nahi / না — نہیں"
        ].join("\n"),
        BN: [
          "Bangla (বাংলা):",
          " শুরু করার আগে, দয়া করে একটি কথা বলুন:",
          "আপনার প্রিয়জনকে কি পুলিশ বা কোনো এজেন্সি গ্রেফতার করেছে?",
          "",
          "Options:",
          " 1️⃣ হ্যাঁ",
          "2️⃣ না"
        ].join("\n"),
        UR: [
          "Urdu:",
          " شروع کرنے سے پہلے، ایک بات بتا دیں:",
          "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
          "",
          "Options:",
          " 1️⃣ جی ہاں",
          "2️⃣ نہیں"
        ].join("\n"),
        RUR: [
          "Roman Urdu:",
          " Shuru karne se pehle, ek baat bata dein:",
          "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
          "",
          "Options:",
          " 1️⃣ Haan",
          "2️⃣ Nahi"
        ].join("\n")
      },

      ME: {
        EN: [
          "English:",
          " Before we begin, please clarify one thing:",
          "Has your loved one been arrested by the police or any agency?",
          "",
          "Options:",
          " 1️⃣ Yes / Haan / نعم — جی ہاں",
          "2️⃣ No / Nahi / لا — نہیں"
        ].join("\n"),
        AR: [
          "Arabic (العربية):",
          " قبل أن نبدأ، يرجى توضيح أمر واحد:",
          "هل تم اعتقال قريبك من قبل الشرطة أو أي جهة؟",
          "",
          "Options:",
          " 1️⃣ نعم",
          "2️⃣ لا"
        ].join("\n"),
        UR: [
          "Urdu:",
          " شروع کرنے سے پہلے، ایک بات بتا دیں:",
          "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
          "",
          "Options:",
          " 1️⃣ جی ہاں",
          "2️⃣ نہیں"
        ].join("\n"),
        RUR: [
          "Roman Urdu:",
          " Shuru karne se pehle, ek baat bata dein:",
          "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
          "",
          "Options:",
          " 1️⃣ Haan",
          "2️⃣ Nahi"
        ].join("\n")
      },

      OTHER: {
        EN: [
          "English:",
          " Before we begin, please clarify one thing:",
          "Has your loved one been arrested by the police or any agency?",
          "",
          "Options:",
          " 1️⃣ Yes / Haan — جی ہاں",
          "2️⃣ No / Nahi — نہیں"
        ].join("\n"),
        UR: [
          "Urdu:",
          " شروع کرنے سے پہلے، ایک بات بتا دیں:",
          "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
          "",
          "Options:",
          " 1️⃣ جی ہاں",
          "2️⃣ نہیں"
        ].join("\n"),
        RUR: [
          "Roman Urdu:",
          " Shuru karne se pehle, ek baat bata dein:",
          "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
          "",
          "Options:",
          " 1️⃣ Haan",
          "2️⃣ Nahi"
        ].join("\n")
      }
    };

    const regionMap = map[region] || map.OTHER;
    return regionMap[lang] || regionMap.EN;
  },

  /***********************************************************
   * ELIGIBILITY REJECTION MESSAGE (IMMEDIATE RESPONSE)
   ***********************************************************/
  sendEligibilityRejection(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "We’re truly sorry for your situation. Unfortunately, we are not able to take such cases.",
      UR: "ہم آپ کے دکھ میں شریک ہیں لیکن ہم پولیس یا ایجنسی کے کیسز نہیں لیتے۔",
      RUR: "Hum aap ke dukh mein shareek hain, lekin hum police ya agency ke cases handle nahi karte.",
      HI: "हमें आपकी स्थिति के लिए बहुत खेद है। दुर्भाग्यवश, हम ऐसे मामलों को नहीं ले सकते।",
      BN: "আমরা আপনার পরিস্থিতির জন্য আন্তরিকভাবে দুঃখিত। দুর্ভাগ্যবশত, আমরা এ ধরনের কেস নিতে পারি না।",
      AR: "نحن آسفون جدًا لوضعك. للأسف، لا يمكننا التعامل مع مثل هذه الحالات."
    };

    return map[lang] || map.EN;
  },

  /***********************************************************
   * AFTER REJECTION → RESTART OR END PROMPT
   ***********************************************************/
  sendEligibilityAfterRejectAsk(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "We are sorry for your situation, but we are unable to take police or agency-related cases.",
        "Would you like to submit a new case?",
        "1️⃣ Yes",
        "2️⃣ No"
      ].join("\n"),
      UR: [
        "ہم آپ کے دُکھ میں شریک ہیں، مگر ہم پولیس یا ادارے کے کیسز نہیں لیتے۔",
        "کیا آپ کوئی نیا کیس جمع کروانا چاہتے ہیں؟",
        "1️⃣ جی ہاں",
        "2️⃣ نہیں"
      ].join("\n"),
      RUR: [
        "Hum aap ke dukh mein shareek hain, magar hum police ya idaray ke cases handle nahi karte.",
        "Kya aap koi naya case submit karna chahte hain?",
        "1️⃣ Haan",
        "2️⃣ Nahi"
      ].join("\n"),
      HI: [
        "हमें आपके हालात का दुःख है, लेकिन हम पुलिस या एजेंसी से जुड़े मामलों को नहीं ले सकते।",
        "क्या आप नया केस जमा करना चाहते हैं?",
        "1️⃣ हाँ",
        "2️⃣ नहीं"
      ].join("\n"),
      BN: [
        "আমরা আপনার পরিস্থিতির জন্য দুঃখিত, কিন্তু আমরা পুলিশ বা এজেন্সি-সংক্রান্ত মামলা গ্রহণ করি না।",
        "আপনি কি একটি নতুন কেস জমা দিতে চান?",
        "1️⃣ হ্যাঁ",
        "2️⃣ না"
      ].join("\n"),
      AR: [
        "نحن متأسفون لوضعك، ولكن لا يمكننا التعامل مع القضايا المتعلقة بالشرطة أو الجهات الأمنية.",
        "هل ترغب في تقديم بلاغ جديد؟",
        "1️⃣ نعم",
        "2️⃣ لا"
      ].join("\n")
    };

    return map[lang] || map.EN;
  }

};

/***************************************************************
 * Texts_ExistingCases.gs — Existing Case Menus & Messages
 * Exact copy of master flow wording (multi-language)
 ***************************************************************/

const Texts_ExistingCases = {

  /***********************************************************
   * MAIN MENU — Existing case detected
   ***********************************************************/
  sendExistingCaseMenu(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "Our system shows that you have already submitted a case from this number.",
        "Your last case ID is: {{CASE_ID}}",
        "Please choose an option:",
        "1️⃣ Review your submitted case details",
        "2️⃣ Check the status of your case",
        "3️⃣ Submit a new case",
        "4️⃣ I want to update my submitted case"
      ].join("\n"),

      UR: [
        "ہمارے سسٹم کے مطابق آپ اس نمبر سے پہلے ہی ایک کیس جمع کر چکے ہیں۔",
        "آپ کا آخری کیس نمبر ہے: {{CASE_ID}}",
        "براہِ کرم ایک آپشن منتخب کریں:",
        "1️⃣ میں اپنے جمع شدہ کیس کی تفصیل دیکھنا چاہتا/چاہتی ہوں۔",
        "2️⃣ میں اپنے کیس کی موجودہ صورتحال جاننا چاہتا/چاہتی ہوں۔",
        "3️⃣ میں نیا کیس جمع کروانا چاہتا/چاہتی ہوں۔",
        "4️⃣ میں اپنے جمع شدہ کیس میں اپڈیٹ دینا چاہتا/چاہتی ہوں۔"
      ].join("\n"),

      RUR: [
        "Hamare nizaam ke mutabiq aap is number se pehle hi ek case submit kar chuke hain.",
        "Aap ka aakhri case number hai: {{CASE_ID}}",
        "Barah-e-karam ek option ka intikhab karein:",
        "1️⃣ Submit kiya hua case ki tafseel dekhna chahta/chahti hoon.",
        "2️⃣ Apne case ki maujooda status maloom karna chahta/chahti hoon.",
        "3️⃣ Naya case submit karna chahta/chahti hoon.",
        "4️⃣ Main apne submit kiye gaye case mein update dena chahta/chahti hoon."
      ].join("\n"),

      HI: [
        "हमारे सिस्टम के अनुसार आपने इस नंबर से पहले ही एक केस दर्ज किया है।",
        "आपका आखिरी केस नंबर है: {{CASE_ID}}",
        "कृपया एक विकल्प चुनें:",
        "1️⃣ मैं अपने सबमिट किए गए केस की डिटेल देखना चाहता/चाहती हूँ।",
        "2️⃣ मैं अपने केस की मौजूदा स्थिति जानना चाहता/चाहती हूँ।",
        "3️⃣ मैं एक नया केस दर्ज करना चाहता/चाहती हूँ।",
        "4️⃣ मैं अपने सबमिट किए गए केस में अपडेट देना चाहता/चाहती हूँ।"
      ].join("\n"),

      BN: [
        "আমাদের সিস্টেম অনুযায়ী, আপনি এই নম্বর থেকে আগে একটি কেস জমা দিয়েছেন।",
        "আপনার শেষ কেস নম্বর হলো: {{CASE_ID}}",
        "অনুগ্রহ করে একটি অপশন নির্বাচন করুন:",
        "1️⃣ আমি জমা দেওয়া কেসের বিস্তারিত দেখতে চাই।",
        "2️⃣ আমি আমার কেসের বর্তমান স্ট্যাটাস জানতে চাই।",
        "3️⃣ আমি একটি নতুন কেস জমা দিতে চাই।",
        "4️⃣ আমি আমার জমা দেওয়া কেসে নতুন আপডেট دینا चाहता/চাই।"
      ].join("\n"),

      AR: [
        "يُظهر نظامنا أنك قد قدّمت بلاغًا من هذا الرقم من قبل.",
        "رقم قضيتك الأخيرة هو: {{CASE_ID}}",
        "يرجى اختيار أحد الخيارات:",
        "1️⃣ أريد مراجعة تفاصيل القضية التي قدّمتها.",
        "2️⃣ أريد معرفة حالة قضيتي الحالية.",
        "3️⃣ أريد تقديم قضية جديدة.",
        "4️⃣ أريد إضافة تحديث على قضيتي المقدَّمة."
      ].join("\n")
    };

    const template = map[lang] || map.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },

  /***********************************************************
   * MULTIPLE CASES — Ask which Case ID
   ***********************************************************/
  sendMultipleCasesMenu(session, caseList) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "Our system shows that you have multiple cases submitted from this number.",
        "Your case IDs include, for example:",
        "{{CASE_LIST}}",
        "(e.g. PK-00001, PK-00005, PK-00009)",
        "Please type the Case ID you want to review or check the status of.",
        "For example: PK-00005",
        "If you want to cancel, you can reply with 0."
      ].join("\n"),

      UR: [
        "ہمارے سسٹم کے مطابق آپ اس نمبر سے متعدد کیسز جمع کر چکے ہیں۔",
        "آپ کے کیس نمبرز، مثال کے طور پر، یہ ہیں:",
        "{{CASE_LIST}}",
        "(مثال: PK-00001, PK-00005, PK-00009)",
        "براہِ کرم وہ کیس نمبر لکھیں جس کی تفصیل یا اسٹیٹس دیکھنا چاہتے ہیں۔",
        "مثال کے طور پر: PK-00005",
        "اگر آپ واپس جانا چاہتے ہیں تو 0 لکھ دیں۔"
      ].join("\n"),

      RUR: [
        "Hamare nizaam ke mutabiq aap is number se kayee cases submit kar chuke hain.",
        "Aap ke case numbers, misaal ke taur par, yeh hain:",
        "{{CASE_LIST}}",
        "(misaal: PK-00001, PK-00005, PK-00009)",
        "Barah-e-karam woh Case ID type karein jiska review ya status dekhna chahte hain.",
        "Misaal: PK-00005",
        "Agar aap wapas jana chahte hain to 0 likh dein."
      ].join("\n"),

      HI: [
        "हमारे सिस्टम के अनुसार, आपने इस नंबर से एक से ज़्यादा केस दर्ज किए हैं।",
        "आपके केस नंबर, उदाहरण के तौर पर, ये हैं:",
        "{{CASE_LIST}}",
        "(जैसे: PK-00001, PK-00005, PK-00009)",
        "कृपया वह Case ID लिखें जिसका विवरण या स्टेटस आप देखना चाहते हैं।",
        "उदाहरण: PK-00005",
        "अगर आप वापस जाना चाहते हैं, तो 0 लिख दें।"
      ].join("\n"),

      BN: [
        "আমাদের সিস্টেম অনুযায়ী, আপনি এই নম্বর থেকে একাধিক কেস জমা দিয়েছেন।",
        "আপনার কেস নম্বরগুলো, উদাহরণ হিসেবে, এমন হতে পারে:",
        "{{CASE_LIST}}",
        "(যেমন: PK-00001, PK-00005, PK-00009)",
        "যে কেসটির বিস্তারিত বা স্ট্যাটাস দেখতে চান, অনুগ্রহ করে সেই Case ID লিখুন।",
        "উদাহরণ: PK-00005",
        "যদি ফিরতে চান, তবে 0 লিখে পাঠান।"
      ].join("\n"),

      AR: [
        "يُظهر نظامنا أنك قد قدّمت عدة قضايا من هذا الرقم.",
        "أرقام القضايا الخاصة بك، على سبيل المثال، هي:",
        "{{CASE_LIST}}",
        "(مثال: PK-00001, PK-00005, PK-00009)",
        "يرجى كتابة رقم القضية (Case ID) التي تريد مراجعة تفاصيلها أو معرفة حالتها.",
        "على سبيل المثال: PK-00005",
        "إذا أردت الرجوع، فيُمكنك إرسال 0."
      ].join("\n")
    };

    const template = map[lang] || map.EN;
    return template.replace(/{{CASE_LIST}}/g, caseList || "");
  },

  /***********************************************************
   * CASE DETAILS — Option 1
   ***********************************************************/
  sendCaseDetails(session, caseID, detailsText) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: {
        intro: "Here are the main details of your submitted case (Case ID: {{CASE_ID}}).",
        outro: "If anything is incorrect or you want to add more information, please type and send the correction here."
      },
      UR: {
        intro: "یہ آپ کے جمع شدہ کیس (کیس نمبر: {{CASE_ID}}) کی اہم تفصیلات ہیں۔",
        outro: "اگر کوئی بات غلط ہو یا آپ مزید معلومات شامل کرنا چاہیں تو براہِ کرم یہی پر لکھ کر بھیج دیں۔"
      },
      RUR: {
        intro: "Yeh aap ke submit kiye gaye case (Case ID: {{CASE_ID}}) ki aham tafseelaat hain.",
        outro: "Agar koi baat ghalat ho ya aap kuch mazeed maloomat add karna chahte hain to barah-e-karam yahin likh kar bhej dein."
      },
      HI: {
        intro: "यह आपके सबमिट किए गए केस (Case ID: {{CASE_ID}}) की मुख्य जानकारी है।",
        outro: "अगर कुछ गलत हो या आप और जानकारी जोड़ना चाहें, तो कृपया यहीं पर लिखकर भेज दें।"
      },
      BN: {
        intro: "এগুলো আপনার জমা দেওয়া কেসের (Case ID: {{CASE_ID}}) প্রধান তথ্য।",
        outro: "কিছু ভুল থাকলে বা নতুন তথ্য যোগ করতে চাইলে, অনুগ্রহ করে এখানেই লিখে পাঠান।"
      },
      AR: {
        intro: "هذه هي التفاصيل الأساسية للقضية التي قدّمتها (رقم القضية: {{CASE_ID}}).",
        outro: "إذا كانت هناك أي معلومات غير صحيحة أو أردت إضافة شيء جديد، فيرجى كتابته هنا وإرساله."
      }
    };

    const template = map[lang] || map.EN;
    const intro = template.intro.replace(/{{CASE_ID}}/g, caseID || "");
    const outro = template.outro;
    return [intro, detailsText || "", outro].filter(Boolean).join("\n");
  },

  /***********************************************************
   * CASE STATUS — Option 2
   ***********************************************************/
  sendCaseStatus(session, caseID, status) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: {
        line1: "The current status of your case (Case ID: {{CASE_ID}}) is: {{STATUS}}.",
        line2: "Our team is reviewing your case, and inshaAllah we will contact you if there is any update."
      },
      UR: {
        line1: "آپ کے کیس (کیس نمبر: {{CASE_ID}}) کی موجودہ صورتحال یہ ہے: {{STATUS}}",
        line2: "ہماری ٹیم آپ کے کیس کا جائزہ لے رہی ہے اور ان شاء اللہ کسی بھی اپڈیٹ کی صورت میں آپ سے رابطہ کرے گی۔"
      },
      RUR: {
        line1: "Aap ke case (Case ID: {{CASE_ID}}) ki maujooda status yeh hai: {{STATUS}}",
        line2: "Hamari team aap ke case ka jaiza le rahi hai, aur InshaAllah jab bhi koi nayi update hogi hum aap se rabta karein ge."
      },
      HI: {
        line1: "आपके केस (Case ID: {{CASE_ID}}) की मौजूदा स्थिति है: {{STATUS}}",
        line2: "हमारी टीम आपका केस देख रही है, और इंशाअल्लाह किसी भी नए अपडेट पर हम आपसे संपर्क करेंगे।"
      },
      BN: {
        line1: "আপনার কেসের (Case ID: {{CASE_ID}}) বর্তমান স্ট্যাটাস: {{STATUS}}",
        line2: "আমাদের টিম আপনার কেস পর্যালোচনা করছে, ইনশাআল্লাহ কোনো নতুন আপডেট হলে আমরা আপনার সাথে যোগাযোগ করব।"
      },
      AR: {
        line1: "حالة قضيتك الحالية (رقم القضية: {{CASE_ID}}) هي: {{STATUS}}",
        line2: "فريقنا يقوم بمراجعة قضيتك، وإن شاء الله سنقوم بالتواصل معك عند وجود أي تحديث جديد."
      }
    };

    const template = map[lang] || map.EN;
    const line1 = template.line1
      .replace(/{{CASE_ID}}/g, caseID || "")
      .replace(/{{STATUS}}/g, status || "");
    const line2 = template.line2;
    return [line1, line2].join("\n");
  },

  /***********************************************************
   * NEW CASE — Option 3 confirmation
   ***********************************************************/
  sendNewCaseStart(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "Okay, we will create a new case for you from this number.",
        "We will now start the questions again to collect your details inshaAllah."
      ].join("\n"),

      UR: [
        "ٹھیک ہے، ہم اسی نمبر سے آپ کے لیے ایک نیا کیس بنا رہے ہیں۔",
        "اب ہم آپ سے دوبارہ چند سوالات کریں گے تاکہ نئی تفصیل حاصل کی جا سکے، ان شاء اللہ۔"
      ].join("\n"),

      RUR: [
        "Theek hai, hum isi number se aap ke liye naya case bana rahe hain.",
        "Ab hum dobara aap se kuch sawalat karein ge taa-ke nayi tafseel hasil ki ja sake, InshaAllah."
      ].join("\n"),

      HI: [
        "ठीक है, हम इसी नंबर से आपके लिए एक नया केस बना रहे हैं।",
        "अब हम दोबारा कुछ सवाल पूछेंगे ताकि आपकी नई जानकारी ली जा सके, इंशाअल्लाह।"
      ].join("\n"),

      BN: [
        "ঠিক আছে, আমরা এই নম্বর থেকে আপনার জন্য একটি নতুন কেস তৈরি করছি।",
        "এখন আমরা আবার কয়েকটি প্রশ্ন করব, যাতে আপনার নতুন তথ্য সংগ্রহ করা যায়, ইনশাআল্লাহ।"
      ].join("\n"),

      AR: [
        "حسنًا، سنقوم بإنشاء قضية جديدة لك بهذا الرقم.",
        "سنسألك الآن بعض الأسئلة مرة أخرى لجمع بياناتك الجديدة، إن شاء الله."
      ].join("\n")
    };

    const template = map[lang] || map.EN;
    return template;
  },

  /***********************************************************
   * UPDATE CASE MENU — Option 4
   ***********************************************************/
  sendUpdateCaseMenu(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "Would you like to share an update about your submitted case (Case ID: {{CASE_ID}})?",
        "Please choose an option:",
        "1️⃣ I have new information about the case.",
        "2️⃣ The case is closed – the missing person has been found."
      ].join("\n"),

      UR: [
        "کیا آپ اپنے جمع شدہ کیس (کیس نمبر: {{CASE_ID}}) کے بارے میں کوئی اپڈیٹ شیئر کرنا چاہتے ہیں؟",
        "براہِ کرم ایک آپشن منتخب کریں:",
        "1️⃣ میرے پاس کیس کے بارے میں نئی معلومات ہے۔",
        "2️⃣ کیس کلوز ہو چکا ہے — گمشدہ شخص مل گیا ہے۔"
      ].join("\n"),

      RUR: [
        "Kya aap apne submit kiye gaye case (Case ID: {{CASE_ID}}) ke bare mein koi update share karna chahte hain?",
        "Barah-e-karam ek option ka intikhab karein:",
        "1️⃣ Mere paas case ke bare mein nayi maloomat hai.",
        "2️⃣ Case close ho chuka hai — gumshuda shakhs mil gaya hai."
      ].join("\n"),

      HI: [
        "क्या आप अपने सबमिट किए गए केस (Case ID: {{CASE_ID}}) के बारे में कोई अपडेट देना चाहते हैं?",
        "कृपया एक विकल्प चुनें:",
        "1️⃣ मेरे पास केस के बारे में नई जानकारी है।",
        "2️⃣ केस क्लोज हो चुका है — गुमशुदा व्यक्ति मिल गया है।"
      ].join("\n"),

      BN: [
        "আপনি কি আপনার জমা দেওয়া কেস (Case ID: {{CASE_ID}}) সম্পর্কে কোনো আপডেট দিতে চান?",
        "অনুগ্রহ করে একটি অপশন নির্বাচন করুন:",
        "1️⃣ আমার কাছে কেস সম্পর্কে নতুন তথ্য আছে।",
        "2️⃣ কেস ক্লোজ হয়ে গেছে — নিখোঁজ ব্যক্তি মিলেছে।"
      ].join("\n"),

      AR: [
        "هل تودّ مشاركة تحديث بخصوص قضيتك المقدَّمة (رقم القضية: {{CASE_ID}})?",
        "يرجى اختيار أحد الخيارات:",
        "1️⃣ لدي معلومات جديدة عن القضية.",
        "2️⃣ تم إغلاق القضية — تم العثور على الشخص المفقود."
      ].join("\n")
    };

    const template = map[lang] || map.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },

  /***********************************************************
   * UPDATE CASE — New information prompt
   ***********************************************************/
  sendUpdateNewInfoPrompt(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "Please type the new information you would like to add to your case (Case ID: {{CASE_ID}}).",
        "You can also send any new photos, documents, or voice notes that may help.",
        "Once you have shared everything, you can type DONE."
      ].join("\n"),

      UR: [
        "براہِ کرم وہ نئی معلومات لکھیں جو آپ اپنے کیس (کیس نمبر: {{CASE_ID}}) میں شامل کرنا چاہتے ہیں۔",
        "آپ چاہیں تو نئی تصاویر، دستاویزات، یا وائس نوٹس بھی بھیج سکتے ہیں جو مددگار ہوں۔",
        "جب آپ ساری معلومات بھیج چکیں تو آخر میں DONE لکھ کر بھیج دیں۔"
      ].join("\n"),

      RUR: [
        "Barah-e-karam woh nayi maloomat likhein jo aap apne case (Case ID: {{CASE_ID}}) mein add karna chahte hain.",
        "Aap chahen to nayi tasveerain, documents, ya voice notes bhi bhej sakte hain jo madadgar hon.",
        "Jab aap sab kuch share kar chuken, to aakhri mein DONE likh kar bhej dein."
      ].join("\n"),

      HI: [
        "कृपया वह नई जानकारी लिखें जो आप अपने केस (Case ID: {{CASE_ID}}) में जोड़ना चाहते हैं।",
        "आप चाहें तो नई फोटो, डॉक्यूमेंट या वॉइस नोट भी भेज सकते हैं जो मदद कर सके।",
        "जब आप सारी जानकारी भेज दें, तो आख़िर में DONE लिखकर भेजें।"
      ].join("\n"),

      BN: [
        "অনুগ্রহ করে সেই নতুন তথ্য লিখুন যা আপনি আপনার কেসে (Case ID: {{CASE_ID}}) যুক্ত করতে চান।",
        "আপনি চাইলে নতুন ছবি, ডকুমেন্ট বা ভয়েস নোটও পাঠাতে পারেন যা সহায়ক হতে পারে।",
        "সব তথ্য পাঠানোর পর শেষে DONE লিখে পাঠান।"
      ].join("\n"),

      AR: [
        "يرجى كتابة المعلومات الجديدة التي تودّ إضافتها إلى قضيتك (رقم القضية: {{CASE_ID}}).",
        "يمكنك أيضًا إرسال صور جديدة، مستندات، أو رسائل صوتية قد تكون مفيدة.",
        "بعد الانتهاء من مشاركة كل شيء، أرسل الكلمة DONE."
      ].join("\n")
    };

    const template = map[lang] || map.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },

  /***********************************************************
   * UPDATE CASE — Confirmation after DONE
   ***********************************************************/
  sendUpdateConfirmation(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "JazakAllah khair, your new information has been added to your case.",
        "Our team will inshaAllah review these updates as well."
      ].join("\n"),

      UR: [
        "جزاک اللہ خیر، آپ کی نئی معلومات آپ کے کیس میں شامل کر دی گئی ہیں۔",
        "ہماری ٹیم ان اپڈیٹس کا بھی ان شاء اللہ جائزہ لے گی۔"
      ].join("\n"),

      RUR: [
        "JazakAllah khair, aap ki nayi maloomat aap ke case mein add kar di gayi hain.",
        "Hamari team in updates ka bhi InshaAllah jaiza legi."
      ].join("\n"),

      HI: [
        "जज़ाकअल्लाह ख़ैर, आपकी नई जानकारी आपके केस में जोड़ दी गई है।",
        "हमारी टीम इंशाअल्लाह इन अपडेट्स की भी समीक्षा करेगी।"
      ].join("\n"),

      BN: [
        "জাযাকআল্লাহ খাইর, আপনার নতুন তথ্য কেসের সাথে যোগ করা হয়েছে।",
        "আমাদের টিম ইনশাআল্লাহ এই আপডেটগুলোও পর্যালোচনা করবে।"
      ].join("\n"),

      AR: [
        "جزاك الله خيرًا، تمت إضافة المعلومات الجديدة إلى قضيتك.",
        "فريقنا سيقوم إن شاء الله بمراجعة هذه التحديثات أيضًا."
      ].join("\n")
    };

    return map[lang] || map.EN;
  },

  /***********************************************************
   * CASE CLOSED — Option 2 confirmation
   ***********************************************************/
  sendCaseClosed(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "Alhamdulillah!",
        "We are very happy to hear that the missing person has been found.",
        "We will now mark your case (Case ID: {{CASE_ID}}) as “Closed – Resolved by Family / Initiator” in our system.",
        "May Allah bless you and your family, and keep everyone safe. Ameen."
      ].join("\n"),

      UR: [
        "الحمد للہ!",
        "یہ سن کر ہمیں بہت خوشی ہوئی کہ گمشدہ شخص مل گیا ہے۔",
        "ہم اب آپ کے کیس (کیس نمبر: {{CASE_ID}}) کو اپنے سسٹم میں",
        "“کلوزڈ — خاندان / درخواست دہندہ کی طرف سے حل شدہ” کے طور پر مارک کر رہے ہیں۔",
        "اللہ آپ کو اور آپ کے گھر والوں کو اپنی حفظ و امان میں رکھے۔ آمین۔"
      ].join("\n"),

      RUR: [
        "Alhamdulillah!",
        "Yeh sunkar hamein bohot khushi hui ke gumshuda shakhs mil gaya hai.",
        "Hum ab aap ke case (Case ID: {{CASE_ID}}) ko apne system mein",
        "“Closed — family / initiator ke zariye resolve ho chuka” mark kar rahe hain.",
        "Allah aap ko aur aap ke ghar walon ko hamesha apni hifazat mein rakhe. Ameen."
      ].join("\n"),

      HI: [
        "अल्हम्दुलिल्लाह!",
        "यह सुनकर हमें बहुत खुशी हुई कि गुमशुदा व्यक्ति मिल चुका है।",
        "अब हम आपके केस (Case ID: {{CASE_ID}}) को अपने सिस्टम में",
        "“Closed — परिवार / इनिशिएटर द्वारा हल हो चुका” मार्क कर रहे हैं।",
        "अल्लाह आप और आपके परिवार को महफ़ूज़ रखे। आमीन।"
      ].join("\n"),

      BN: [
        "আলহামদুলিল্লাহ!",
        "এটি শুনে আমরা অত্যন্ত আনন্দিত যে নিখোঁজ ব্যক্তি ফিরে এসেছে।",
        "আমরা এখন আপনার কেস (Case ID: {{CASE_ID}}) আমাদের সিস্টেমে",
        "“Closed — পরিবার / উদ্যোগকারীর মাধ্যমে সমাধান হয়েছে” হিসেবে মার্ক করব।",
        "আল্লাহ আপনাকে এবং আপনার পরিবারকে নিরাপদে রাখুন। আমীন।"
      ].join("\n"),

      AR: [
        "الحمد لله!",
        "سعدنا كثيرًا بسماع أن الشخص المفقود قد تم العثور عليه.",
        "سنقوم الآن بوضع علامـة على قضيتك (رقم القضية: {{CASE_ID}}) في نظامنا بأنها",
        "“مغلقة — تم حلّها بواسطة الأسرة / مقدّم البلاغ”.",
        "نسأل الله أن يحفظك ويحفظ أسرتك، وأن يجمع بينكم دائمًا على خير. آمين."
      ].join("\n")
    };

    const template = map[lang] || map.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },

  /***********************************************************
   * INVALID CASE ID — Error handling
   ***********************************************************/
  sendInvalidCaseSelection(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "The Case ID you entered was not found for this number.",
        "Please check and type the correct Case ID, or reply 0 to go back."
      ].join("\n"),

      UR: [
        "آپ نے جو کیس نمبر بھیجا ہے وہ اس نمبر کے ساتھ نہیں ملا۔",
        "براہِ کرم دوبارہ درست کیس نمبر لکھیں، یا واپس جانے کے لیے 0 لکھ دیں۔"
      ].join("\n"),

      RUR: [
        "Aap ne jo Case ID bheji hai woh is number ke sath match nahi hui.",
        "Meherbani karke sahi Case ID dobara type karein, ya wapas jane ke liye 0 likh dein."
      ].join("\n"),

      HI: [
        "आपने जो Case ID भेजी है, वह इस नंबर के लिए नहीं मिली।",
        "कृपया सही Case ID दोबारा लिखें, या वापस जाने के लिए 0 लिख दें।"
      ].join("\n"),

      BN: [
        "আপনি যে Case ID পাঠিয়েছেন, সেটি এই নম্বরের সাথে মিলে না।",
        "অনুগ্রহ করে সঠিক Case ID আবার লিখুন, অথবা ফিরে যেতে 0 লিখুন।"
      ].join("\n"),

      AR: [
        "رقم القضية الذي أدخلته غير مرتبط بهذا الرقم.",
        "يرجى إعادة كتابة رقم القضية الصحيح، أو إرسال 0 للرجوع."
      ].join("\n")
    };

    return map[lang] || map.EN;
  }

};

/***************************************************************
 * EXPORT HELPERS
 ***************************************************************/
if (typeof Texts === "undefined") {
  var Texts = {};
}

Texts.sendExistingCaseMenu = function(session, caseID) {
  return Texts_ExistingCases.sendExistingCaseMenu(session, caseID);
};

Texts.sendMultipleCasesMenu = function(session, caseList) {
  return Texts_ExistingCases.sendMultipleCasesMenu(session, caseList);
};

Texts.sendCaseDetails = function(session, caseID, detailsText) {
  return Texts_ExistingCases.sendCaseDetails(session, caseID, detailsText);
};

Texts.sendCaseStatus = function(session, caseID, status) {
  return Texts_ExistingCases.sendCaseStatus(session, caseID, status);
};

Texts.sendNewCaseStart = function(session) {
  return Texts_ExistingCases.sendNewCaseStart(session);
};

Texts.sendUpdateCaseMenu = function(session, caseID) {
  return Texts_ExistingCases.sendUpdateCaseMenu(session, caseID);
};

Texts.sendUpdateNewInfoPrompt = function(session, caseID) {
  return Texts_ExistingCases.sendUpdateNewInfoPrompt(session, caseID);
};

Texts.sendUpdateConfirmation = function(session) {
  return Texts_ExistingCases.sendUpdateConfirmation(session);
};

Texts.sendCaseClosed = function(session, caseID) {
  return Texts_ExistingCases.sendCaseClosed(session, caseID);
};

Texts.sendInvalidCaseSelection = function(session) {
  return Texts_ExistingCases.sendInvalidCaseSelection(session);
};
/************************************************************
 * Texts_CaseEntryCheck.gs — Case Entry Verification & Existing Case Menus
 ************************************************************/

const Texts_CaseEntryCheck = {

  /************************************************************
   * BEFORE WE BEGIN — ELIGIBILITY SCREEN (REGION SPECIFIC)
   ************************************************************/
  sendPrecheckQuestion(session) {
    const region = session.Region_Group || "OTHER";
    const lang = session.Preferred_Language || "EN";

    const map = {
      PK: {
        EN: [
          "English:",
          " Before we begin, please clarify one thing:",
          "Has your loved one been arrested by the police or any agency?",
          "",
          "Options:",
          " 1️⃣ Yes / Haan — جی ہاں",
          "2️⃣ No / Nahi — نہیں"
        ].join("\n"),
        UR: [
          "Urdu:",
          " شروع کرنے سے پہلے، ایک بات بتا دیں:",
          "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
          "",
          "Options:",
          " 1️⃣ جی ہاں",
          "2️⃣ نہیں"
        ].join("\n"),
        RUR: [
          "Roman Urdu:",
          " Shuru karne se pehle, ek baat bata dein:",
          "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
          "",
          "Options:",
          " 1️⃣ Haan",
          "2️⃣ Nahi"
        ].join("\n")
      },

      IN: {
        EN: [
          "English:",
          " Before we begin, please clarify one thing:",
          "Has your loved one been arrested by the police or any agency?",
          "",
          "Options:",
          " 1️⃣ Yes / Haan / हाँ — جی ہاں",
          "2️⃣ No / Nahi / नहीं — نہیں"
        ].join("\n"),
        HI: [
          "Hindi:",
          " शुरू کرنے से पहले, कृपया एक बात बताइए:",
          "क्या आपके प्रियजन को पुलिस या किसी एजेंसी نے गिरफ्तार کیا है؟",
          "",
          "Options:",
          " 1️⃣ हाँ",
          "2️⃣ नहीं"
        ].join("\n"),
        UR: [
          "Urdu:",
          " شروع کرنے سے پہلے، ایک بات بتا دیں:",
          "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
          "",
          "Options:",
          " 1️⃣ جی ہاں",
          "2️⃣ نہیں"
        ].join("\n"),
        RUR: [
          "Roman Urdu:",
          " Shuru karne se pehle, ek baat bata dein:",
          "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
          "",
          "Options:",
          " 1️⃣ Haan",
          "2️⃣ Nahi"
        ].join("\n")
      },

      BD: {
        EN: [
          "English:",
          " Before we begin, please clarify one thing:",
          "Has your loved one been arrested by the police or any agency?",
          "",
          "Options:",
          " 1️⃣ Yes / Haan / হ্যাঁ — جی ہاں",
          "2️⃣ No / Nahi / না — نہیں"
        ].join("\n"),
        BN: [
          "Bangla (বাংলা):",
          " শুরু করার আগে, দয়া করে একটি কথা বলুন:",
          "আপনার প্রিয়জনকে কি পুলিশ বা কোনো এজেন্সি গ্রেফতার করেছে?",
          "",
          "Options:",
          " 1️⃣ হ্যাঁ",
          "2️⃣ না"
        ].join("\n"),
        UR: [
          "Urdu:",
          " شروع کرنے سے پہلے، ایک بات بتا دیں:",
          "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
          "",
          "Options:",
          " 1️⃣ جی ہاں",
          "2️⃣ نہیں"
        ].join("\n"),
        RUR: [
          "Roman Urdu:",
          " Shuru karne se pehle, ek baat bata dein:",
          "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
          "",
          "Options:",
          " 1️⃣ Haan",
          "2️⃣ Nahi"
        ].join("\n")
      },

      ME: {
        EN: [
          "English:",
          " Before we begin, please clarify one thing:",
          "Has your loved one been arrested by the police or any agency?",
          "",
          "Options:",
          " 1️⃣ Yes / Haan / نعم — جی ہاں",
          "2️⃣ No / Nahi / لا — نہیں"
        ].join("\n"),
        AR: [
          "Arabic (العربية):",
          " قبل أن نبدأ، يرجى توضيح أمر واحد:",
          "هل تم اعتقال قريبك من قبل الشرطة أو أي جهة؟",
          "",
          "Options:",
          " 1️⃣ نعم",
          "2️⃣ لا"
        ].join("\n"),
        UR: [
          "Urdu:",
          " شروع کرنے سے پہلے، ایک بات بتا دیں:",
          "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
          "",
          "Options:",
          " 1️⃣ جی ہاں",
          "2️⃣ نہیں"
        ].join("\n"),
        RUR: [
          "Roman Urdu:",
          " Shuru karne se pehle, ek baat bata dein:",
          "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
          "",
          "Options:",
          " 1️⃣ Haan",
          "2️⃣ Nahi"
        ].join("\n")
      },

      OTHER: {
        EN: [
          "English:",
          " Before we begin, please clarify one thing:",
          "Has your loved one been arrested by the police or any agency?",
          "",
          "Options:",
          " 1️⃣ Yes / Haan — جی ہاں",
          "2️⃣ No / Nahi — نہیں"
        ].join("\n"),
        UR: [
          "Urdu:",
          " شروع کرنے سے پہلے، ایک بات بتا دیں:",
          "کیا آپ کے پیارے کو پولیس یا کسی ادارے نے گرفتار کر لیا ہے؟",
          "",
          "Options:",
          " 1️⃣ جی ہاں",
          "2️⃣ نہیں"
        ].join("\n"),
        RUR: [
          "Roman Urdu:",
          " Shuru karne se pehle, ek baat bata dein:",
          "Kya aap ke pyaare ko police ya kisi idaray ne giraftar kar liya hai?",
          "",
          "Options:",
          " 1️⃣ Haan",
          "2️⃣ Nahi"
        ].join("\n")
      }
    };

    const regionBlock = map[region] || map.OTHER;
    return regionBlock[lang] || regionBlock.EN;
  },


  /************************************************************
   * EXISTING CASE DETECTED — MENU WITH UPDATE OPTION
   ************************************************************/
  sendExistingCaseDetected(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
      EN: [
        "Our system shows that you have already submitted a case from this number.",
        "Your last case ID is: {{CASE_ID}}",
        "Please choose an option:",
        "1️⃣ Review your submitted case details",
        "2️⃣ Check the status of your case",
        "3️⃣ Submit a new case",
        "4️⃣ I want to update my submitted case"
      ].join("\n"),
      UR: [
        "ہمارے سسٹم کے مطابق آپ اس نمبر سے پہلے ہی ایک کیس جمع کر چکے ہیں۔",
        "آپ کا آخری کیس نمبر ہے: {{CASE_ID}}",
        "براہِ کرم ایک آپشن منتخب کریں:",
        "1️⃣ میں اپنے جمع شدہ کیس کی تفصیل دیکھنا چاہتا/چاہتی ہوں۔",
        "2️⃣ میں اپنے کیس کی موجودہ صورتحال جاننا چاہتا/چاہتی ہوں۔",
        "3️⃣ میں نیا کیس جمع کروانا چاہتا/چاہتی ہوں۔",
        "4️⃣ میں اپنے جمع شدہ کیس میں اپڈیٹ دینا چاہتا/چاہتی ہوں۔"
      ].join("\n"),
      RUR: [
        "Hamare nizaam ke mutabiq aap is number se pehle hi ek case submit kar chuke hain.",
        "Aap ka aakhri case number hai: {{CASE_ID}}",
        "Barah-e-karam ek option ka intikhab karein:",
        "1️⃣ Submit kiya hua case ki tafseel dekhna chahta/chahti hoon.",
        "2️⃣ Apne case ki maujooda status maloom karna chahta/chahti hoon.",
        "3️⃣ Naya case submit karna chahta/chahti hoon.",
        "4️⃣ Main apne submit kiye gaye case mein update dena chahta/chahti hoon."
      ].join("\n"),
      HI: [
        "हमारे सिस्टम के अनुसार आपने इस नंबर से पहले ही एक केस दर्ज किया है।",
        "आपका आखिरी केस नंबर है: {{CASE_ID}}",
        "कृपया एक विकल्प चुनें:",
        "1️⃣ मैं अपने सबमिट किए गए केस की डिटेल देखना चाहता/चाहती हूँ।",
        "2️⃣ मैं अपने केस की मौजूदा स्थिति (स्टेटस) जानना चाहता/चाहती हूँ।",
        "3️⃣ मैं एक नया केस दर्ज करना चाहता/चाहती हूँ।",
        "4️⃣ मैं अपने सबमिट किए गए केस में अपडेट देना चाहता/चाहती हूँ।"
      ].join("\n"),
      BN: [
        "আমাদের সিস্টেম অনুযায়ী, আপনি এই নম্বর থেকে আগে একটি কেস জমা দিয়েছেন।",
        "আপনার শেষ কেস নম্বর হলো: {{CASE_ID}}",
        "অনুগ্রহ করে একটি অপশন নির্বাচন করুন:",
        "1️⃣ আমি জমা দেওয়া কেসের বিস্তারিত দেখতে চাই।",
        "2️⃣ আমি আমার কেসের বর্তমান স্ট্যাটাস জানতে চাই।",
        "3️⃣ আমি একটি নতুন কেস জমা দিতে চাই।",
        "4️⃣ আমি আমার জমা দেওয়া কেসে নতুন اپڈیٹ دینا चाहता/চাই।"
      ].join("\n"),
      AR: [
        "يُظهر نظامنا أنك قد قدّمت بلاغًا من هذا الرقم من قبل.",
        "رقم قضيتك الأخيرة هو: {{CASE_ID}}",
        "يرجى اختيار أحد الخيارات:",
        "1️⃣ أريد مراجعة تفاصيل القضية التي قدّمتها.",
        "2️⃣ أريد معرفة حالة قضيتي الحالية.",
        "3️⃣ أريد تقديم قضية جديدة.",
        "4️⃣ أريد إضافة تحديث على قضيتي المقدَّمة."
      ].join("\n")
    };

    const template = templates[lang] || templates.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },


  /************************************************************
   * MULTIPLE CASES — ASK FOR CASE ID
   ************************************************************/
  sendMultipleCaseList(session, caseList) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
      EN: [
        "Our system shows that you have multiple cases submitted from this number.",
        "Your case IDs include, for example:",
        "{{CASE_LIST}}",
        "(e.g. PK-00001, PK-00005, PK-00009)",
        "Please type the Case ID you want to review or check the status of.",
        "For example: PK-00005",
        "If you want to cancel, you can reply with 0."
      ].join("\n"),
      UR: [
        "ہمارے سسٹم کے مطابق آپ اس نمبر سے متعدد کیسز جمع کر چکے ہیں۔",
        "آپ کے کیس نمبرز، مثال کے طور پر، یہ ہیں:",
        "{{CASE_LIST}}",
        "(مثال: PK-00001, PK-00005, PK-00009)",
        "براہِ کرم وہ کیس نمبر لکھیں جس کی تفصیل یا اسٹیٹس دیکھنا چاہتے ہیں۔",
        "مثال کے طور پر: PK-00005",
        "اگر آپ واپس جانا چاہتے ہیں تو 0 لکھ دیں۔"
      ].join("\n"),
      RUR: [
        "Hamare nizaam ke mutabiq aap is number se kayee cases submit kar chuke hain.",
        "Aap ke case numbers, misaal ke taur par, yeh hain:",
        "{{CASE_LIST}}",
        "(misaal: PK-00001, PK-00005, PK-00009)",
        "Barah-e-karam woh Case ID type karein jiska review ya status dekhna chahte hain.",
        "Misaal: PK-00005",
        "Agar aap wapas jana chahte hain to 0 likh dein."
      ].join("\n"),
      HI: [
        "हमारे सिस्टम के अनुसार, आपने इस नंबर से एक से ज़्यादा केस दर्ज किए हैं।",
        "आपके केस नंबर, उदाहरण के तौर पर, ये हैं:",
        "{{CASE_LIST}}",
        "(जैसे: PK-00001, PK-00005, PK-00009)",
        "कृपया वह Case ID लिखें जिसका विवरण या स्टेटस आप देखना चाहते हैं।",
        "उदाहरण: PK-00005",
        "अगर आप वापस जाना चाहते हैं, तो 0 लिख दें।"
      ].join("\n"),
      BN: [
        "আমাদের সিস্টেম অনুযায়ী, আপনি এই নম্বর থেকে একাধিক কেস জমা দিয়েছেন।",
        "আপনার কেস নম্বরগুলো, উদাহরণ হিসেবে, এমন হতে পারে:",
        "{{CASE_LIST}}",
        "(যেমন: PK-00001, PK-00005, PK-00009)",
        "যে কেসটির বিস্তারিত বা স্ট্যাটাস দেখতে চান, অনুগ্রহ করে সেই Case ID লিখুন।",
        "উদাহরণ: PK-00005",
        "যদি ফিরতে চান, তবে 0 লিখে পাঠান।"
      ].join("\n"),
      AR: [
        "يُظهر نظامنا أنك قد قدّمت عدة قضايا من هذا الرقم.",
        "أرقام القضايا الخاصة بك، على سبيل المثال، هي:",
        "{{CASE_LIST}}",
        "(مثال: PK-00001, PK-00005, PK-00009)",
        "يرجى كتابة رقم القضية (Case ID) التي تريد مراجعة تفاصيلها أو معرفة حالتها.",
        "على سبيل المثال: PK-00005",
        "إذا أردت الرجوع، فيُمكنك إرسال 0."
      ].join("\n")
    };

    const template = templates[lang] || templates.EN;
    return template.replace(/{{CASE_LIST}}/g, caseList || "");
  },


  /************************************************************
   * INVALID CASE ID INPUT
   ************************************************************/
  sendInvalidCaseId(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "The Case ID you entered was not found for this number.",
        "Please check and type the correct Case ID, or reply 0 to go back."
      ].join("\n"),
      UR: [
        "آپ نے جو کیس نمبر بھیجا ہے وہ اس نمبر کے ساتھ نہیں ملا۔",
        "براہِ کرم دوبارہ درست کیس نمبر لکھیں، یا واپس جانے کے لیے 0 لکھ دیں۔"
      ].join("\n"),
      RUR: [
        "Aap ne jo Case ID bheji hai woh is number ke sath match nahi hui.",
        "Meherbani karke sahi Case ID dobara type karein, ya wapas jane ke liye 0 likh dein."
      ].join("\n"),
      HI: [
        "आपने जो Case ID भेजी है, वह इस नंबर के लिए नहीं मिली।",
        "कृपया सही Case ID दोबारा लिखें, या वापस जाने के लिए 0 लिख दें।"
      ].join("\n"),
      BN: [
        "আপনি যে Case ID পাঠিয়েছেন, সেটি এই নম্বরের সাথে মিলে না।",
        "অনুগ্রহ করে সঠিক Case ID আবার লিখুন, অথবা ফিরে যেতে 0 লিখুন।"
      ].join("\n"),
      AR: [
        "رقم القضية الذي أدخلته غير مرتبط بهذا الرقم.",
        "يرجى إعادة كتابة رقم القضية الصحيح، أو إرسال 0 للرجوع."
      ].join("\n")
    };

    return map[lang] || map.EN;
  },


  /************************************************************
   * OPTION 1 — CASE SUMMARY PREVIEW
   ************************************************************/
  sendCaseDetailsPreview(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
      EN: [
        "Here are the main details of your submitted case (Case ID: {{CASE_ID}}).",
        "If anything is incorrect or you want to add more information, please type and send the correction here."
      ].join("\n"),
      UR: [
        "یہ آپ کے جمع شدہ کیس (کیس نمبر: {{CASE_ID}}) کی اہم تفصیلات ہیں۔",
        "اگر کوئی بات غلط ہو یا آپ مزید معلومات شامل کرنا چاہیں تو براہِ کرم یہی پر لکھ کر بھیج دیں۔"
      ].join("\n"),
      RUR: [
        "Yeh aap ke submit kiye gaye case (Case ID: {{CASE_ID}}) ki aham tafseelaat hain.",
        "Agar koi baat ghalat ho ya aap kuch mazeed maloomat add karna chahte hain to barah-e-karam yahin likh kar bhej dein."
      ].join("\n"),
      HI: [
        "यह आपके सबमिट किए गए केस (Case ID: {{CASE_ID}}) की मुख्य जानकारी है।",
        "अगर कुछ गलत हो या आप और जानकारी जोड़ना चाहें, तो कृपया यहीं पर लिखकर भेज दें।"
      ].join("\n"),
      BN: [
        "এগুলো আপনার জমা দেওয়া কেসের (Case ID: {{CASE_ID}}) প্রধান তথ্য।",
        "কিছু ভুল থাকলে বা নতুন তথ্য যোগ করতে চাইলে, অনুগ্রহ করে এখানেই লিখে পাঠান।"
      ].join("\n"),
      AR: [
        "هذه هي التفاصيل الأساسية للقضية التي قدّمتها (رقم القضية: {{CASE_ID}}).",
        "إذا كانت هناك أي معلومات غير صحيحة أو أردت إضافة شيء جديد، فيرجى كتابته هنا وإرساله."
      ].join("\n")
    };

    const template = templates[lang] || templates.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },


  /************************************************************
   * OPTION 2 — CASE STATUS
   ************************************************************/
  sendCaseStatus(session, caseID, status) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
      EN: [
        "The current status of your case (Case ID: {{CASE_ID}}) is: {{STATUS}}.",
        "Our team is reviewing your case, and inshaAllah we will contact you if there is any update."
      ].join("\n"),
      UR: [
        "آپ کے کیس (کیس نمبر: {{CASE_ID}}) کی موجودہ صورتحال یہ ہے: {{STATUS}}",
        "ہماری ٹیم آپ کے کیس کا جائزہ لے رہی ہے اور ان شاء اللہ کسی بھی اپڈیٹ کی صورت میں آپ سے رابطہ کرے گی۔"
      ].join("\n"),
      RUR: [
        "Aap ke case (Case ID: {{CASE_ID}}) ki maujooda status yeh hai: {{STATUS}}",
        "Hamari team aap ke case ka jaiza le rahi hai, aur InshaAllah jab bhi koi nayi update hogi hum aap se rabta karein ge."
      ].join("\n"),
      HI: [
        "आपके केस (Case ID: {{CASE_ID}}) की मौजूदा स्थिति है: {{STATUS}}",
        "हमारी टीम आपका केस देख रही है, और इंशाअल्लाह किसी भी नए अपडेट पर हम आपसे संपर्क करेंगे।"
      ].join("\n"),
      BN: [
        "আপনার কেসের (Case ID: {{CASE_ID}}) বর্তমান স্ট্যাটাস: {{STATUS}}",
        "আমাদের টিম আপনার কেস পর্যালোচনা করছে, ইনশাআল্লাহ কোনো নতুন আপডেট হলে আমরা আপনার সাথে যোগাযোগ করব।"
      ].join("\n"),
      AR: [
        "حالة قضيتك الحالية (رقم القضية: {{CASE_ID}}) هي: {{STATUS}}",
        "فريقنا يقوم بمراجعة قضيتك، وإن شاء الله سنقوم بالتواصل معك عند وجود أي تحديث جديد."
      ].join("\n")
    };

    const template = templates[lang] || templates.EN;
    return template
      .replace(/{{CASE_ID}}/g, caseID || "")
      .replace(/{{STATUS}}/g, status || "");
  },


  /************************************************************
   * OPTION 3 — START A NEW CASE
   ************************************************************/
  sendNewCaseStart(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "Okay, we will create a new case for you from this number.",
        "We will now start the questions again to collect your details inshaAllah."
      ].join("\n"),
      UR: [
        "ٹھیک ہے، ہم اسی نمبر سے آپ کے لیے ایک نیا کیس بنا رہے ہیں۔",
        "اب ہم آپ سے دوبارہ چند سوالات کریں گے تاکہ نئی تفصیل حاصل کی جا سکے، ان شاء اللہ۔"
      ].join("\n"),
      RUR: [
        "Theek hai, hum isi number se aap ke liye naya case bana rahe hain.",
        "Ab hum dobara aap se kuch sawalat karein ge taa-ke nayi tafseel hasil ki ja sake, InshaAllah."
      ].join("\n"),
      HI: [
        "ठीक है, हम इसी नंबर से आपके लिए एक नया केस बना रहे हैं।",
        "अब हम दोबारा कुछ सवाल पूछेंगे ताकि आपकी नई जानकारी ली जा सके, इंशाअल्लाह।"
      ].join("\n"),
      BN: [
        "ঠিক আছে, আমরা এই নম্বর থেকে আপনার জন্য একটি নতুন কেস তৈরি করছি।",
        "এখন আমরা আবার কয়েকটি প্রশ্ন করব, যাতে আপনার নতুন তথ্য সংগ্রহ করা যায়, ইনশাআল্লাহ।"
      ].join("\n"),
      AR: [
        "حسنًا، سنقوم بإنشاء قضية جديدة لك بهذا الرقم.",
        "سنسألك الآن بعض الأسئلة مرة أخرى لجمع بياناتك الجديدة، إن شاء الله."
      ].join("\n")
    };

    return map[lang] || map.EN;
  },


  /************************************************************
   * OPTION 4 — UPDATE MENU
   ************************************************************/
  sendUpdateMenu(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
      EN: [
        "English",
        "Would you like to share an update about your submitted case (Case ID: {{CASE_ID}})?",
        "Please choose an option:",
        "1️⃣ I have new information about the case.",
        "2️⃣ The case is closed – the missing person has been found."
      ].join("\n"),
      UR: [
        "اُردو (Urdu)",
        "کیا آپ اپنے جمع شدہ کیس (کیس نمبر: {{CASE_ID}}) کے بارے میں کوئی اپڈیٹ شیئر کرنا چاہتے ہیں؟",
        "براہِ کرم ایک آپشن منتخب کریں:",
        "1️⃣ میرے پاس کیس کے بارے میں نئی معلومات ہے۔",
        "2️⃣ کیس کلوز ہو چکا ہے — گمشدہ شخص مل گیا ہے۔"
      ].join("\n"),
      RUR: [
        "Roman Urdu",
        "Kya aap apne submit kiye gaye case (Case ID: {{CASE_ID}}) ke bare mein koi update share karna chahte hain?",
        "Barah-e-karam ek option ka intikhab karein:",
        "1️⃣ Mere paas case ke bare mein nayi maloomat hai.",
        "2️⃣ Case close ho chuka hai — gumshuda shakhs mil gaya hai."
      ].join("\n"),
      HI: [
        "हिन्दी (Hindi) – India",
        "क्या आप अपने सबमिट किए गए केस (Case ID: {{CASE_ID}}) के बारे में कोई अपडेट देना चाहते हैं?",
        "कृपया एक विकल्प चुनें:",
        "1️⃣ मेरे पास केस के बारे में नई जानकारी है।",
        "2️⃣ केस क्लोज हो चुका है — गुमशुदा व्यक्ति मिल गया है।"
      ].join("\n"),
      BN: [
        "বাংলা (Bangla) – Bangladesh",
        "আপনি কি আপনার জমা দেওয়া কেস (Case ID: {{CASE_ID}}) সম্পর্কে কোনো আপডেট দিতে চান?",
        "অনুগ্রহ করে একটি অপশন নির্বাচন করুন:",
        "1️⃣ আমার কাছে কেস সম্পর্কে নতুন তথ্য আছে।",
        "2️⃣ কেস ক্লোজ হয়ে গেছে — নিখোঁজ ব্যক্তি মিলেছে।"
      ].join("\n"),
      AR: [
        "العربية (Arabic) – Middle East",
        "هل تودّ مشاركة تحديث بخصوص قضيتك المقدَّمة (رقم القضية: {{CASE_ID}})?",
        "يرجى اختيار أحد الخيارات:",
        "1️⃣ لدي معلومات جديدة عن القضية.",
        "2️⃣ تم إغلاق القضية — تم العثور على الشخص المفقود."
      ].join("\n")
    };

    const template = templates[lang] || templates.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },


  /************************************************************
   * UPDATE FLOW — ASK FOR NEW INFORMATION
   ************************************************************/
  askUpdateNewInfo(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
      EN: [
        "Please type the new information you would like to add to your case (Case ID: {{CASE_ID}}).",
        "You can also send any new photos, documents, or voice notes that may help.",
        "Once you have shared everything, you can type DONE."
      ].join("\n"),
      UR: [
        "براہِ کرم وہ نئی معلومات لکھیں جو آپ اپنے کیس (کیس نمبر: {{CASE_ID}}) میں شامل کرنا چاہتے ہیں۔",
        "آپ چاہیں تو نئی تصاویر، دستاویزات، یا وائس نوٹس بھی بھیج سکتے ہیں جو مددگار ہوں۔",
        "جب آپ ساری معلومات بھیج چکیں تو آخر میں DONE لکھ کر بھیج دیں۔"
      ].join("\n"),
      RUR: [
        "Barah-e-karam woh nayi maloomat likhein jo aap apne case (Case ID: {{CASE_ID}}) mein add karna chahte hain.",
        "Aap chahen to nayi tasveerain, documents, ya voice notes bhi bhej sakte hain jo madadgar hon.",
        "Jab aap sab kuch share kar chuken, to aakhri mein DONE likh kar bhej dein."
      ].join("\n"),
      HI: [
        "कृपया वह नई जानकारी लिखें जो आप अपने केस (Case ID: {{CASE_ID}}) में जोड़ना चाहते हैं।",
        "आप चाहें तो नई फोटो, डॉक्यूमेंट या वॉइस नोट भी भेज सकते हैं जो मदद कर सके।",
        "जब आप सारी जानकारी भेज दें, तो आख़िर में DONE लिखकर भेजें।"
      ].join("\n"),
      BN: [
        "অনুগ্রহ করে সেই নতুন তথ্য লিখুন যা আপনি আপনার কেসে (Case ID: {{CASE_ID}}) যুক্ত করতে চান।",
        "আপনি চাইলে নতুন ছবি, ডকুমেন্ট বা ভয়েস নোটও পাঠাতে পারেন যা সহায়ক হতে পারে।",
        "সব তথ্য পাঠানোর পর শেষে DONE লিখে পাঠান।"
      ].join("\n"),
      AR: [
        "يرجى كتابة المعلومات الجديدة التي تودّ إضافتها إلى قضيتك (رقم القضية: {{CASE_ID}}).",
        "يمكنك أيضًا إرسال صور جديدة، مستندات، أو رسائل صوتية قد تكون مفيدة.",
        "بعد الانتهاء من مشاركة كل شيء، أرسل الكلمة DONE."
      ].join("\n")
    };

    const template = templates[lang] || templates.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },


  /************************************************************
   * UPDATE FLOW — CONFIRM NEW INFORMATION ADDED
   ************************************************************/
  confirmNewInfoAdded(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "JazakAllah khair, your new information has been added to your case.",
        "Our team will inshaAllah review these updates as well."
      ].join("\n"),
      UR: [
        "جزاک اللہ خیر، آپ کی نئی معلومات آپ کے کیس میں شامل کر دی گئی ہیں۔",
        "ہماری ٹیم ان اپڈیٹس کا بھی ان شاء اللہ جائزہ لے گی۔"
      ].join("\n"),
      RUR: [
        "JazakAllah khair, aap ki nayi maloomat aap ke case mein add kar di gayi hain.",
        "Hamari team in updates ka bhi InshaAllah jaiza legi."
      ].join("\n"),
      HI: [
        "जज़ाकअल्लाह ख़ैर, आपकी नई जानकारी आपके केस में जोड़ दी गई है।",
        "हमारी टीम इंशाअल्लाह इन अपडेट्स की भी समीक्षा करेगी।"
      ].join("\n"),
      BN: [
        "জাযাকআল্লাহ খাইর, আপনার নতুন তথ্য কেসের সাথে যোগ করা হয়েছে।",
        "আমাদের টিম ইনশাআল্লাহ এই আপডেটগুলোও পর্যালোচনা করবে।"
      ].join("\n"),
      AR: [
        "جزاك الله خيرًا، تمت إضافة المعلومات الجديدة إلى قضيتك.",
        "فريقنا سيقوم إن شاء الله بمراجعة هذه التحديثات أيضًا."
      ].join("\n")
    };

    return map[lang] || map.EN;
  },


  /************************************************************
   * UPDATE FLOW — CASE CLOSED MESSAGE
   ************************************************************/
  sendCaseClosed(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
      EN: [
        "Alhamdulillah!",
        "We are very happy to hear that the missing person has been found.",
        "We will now mark your case (Case ID: {{CASE_ID}}) as “Closed – Resolved by Family / Initiator” in our system.",
        "May Allah bless you and your family, and keep everyone safe. Ameen."
      ].join("\n"),
      UR: [
        "الحمد للہ!",
        "یہ سن کر ہمیں بہت خوشی ہوئی کہ گمشدہ شخص مل گیا ہے۔",
        "ہم اب آپ کے کیس (کیس نمبر: {{CASE_ID}}) کو اپنے سسٹم میں",
        "\"کلوزڈ — خاندان / درخواست دہندہ کی طرف سے حل شدہ\" کے طور پر مارک کر رہے ہیں۔",
        "اللہ آپ کو اور آپ کے گھر والوں کو اپنی حفظ و امان میں رکھے۔ آمین۔"
      ].join("\n"),
      RUR: [
        "Alhamdulillah!",
        "Yeh sunkar hamein bohot khushi hui ke gumshuda shakhs mil gaya hai.",
        "Hum ab aap ke case (Case ID: {{CASE_ID}}) ko apne system mein",
        "\"Closed — family / initiator ke zariye resolve ho chuka\" mark kar rahe hain.",
        "Allah aap ko aur aap ke ghar walon ko hamesha apni hifazat mein rakhe. Ameen."
      ].join("\n"),
      HI: [
        "अल्हम्दुलिल्लाह!",
        "यह सुनकर हमें बहुत खुशी हुई कि गुमशुदा व्यक्ति मिल चुका है।",
        "अब हम आपके केस (Case ID: {{CASE_ID}}) को अपने सिस्टम में",
        "\"Closed — परिवार / इनिशिएटर द्वारा हल हो चुका\" मार्क कर रहे हैं।",
        "अल्लाह आप और आपके परिवार को महफूज़ रखे। आमीन।"
      ].join("\n"),
      BN: [
        "আলহামদুলিল্লাহ!",
        "এটি শুনে আমরা অত্যন্ত আনন্দিত যে নিখোঁজ ব্যক্তি ফিরে এসেছে।",
        "আমরা এখন আপনার কেস (Case ID: {{CASE_ID}}) আমাদের সিস্টেমে",
        "\"Closed — পরিবার / উদ্যোগকারীর মাধ্যমে সমাধান হয়েছে\" হিসেবে মার্ক করব।",
        "আল্লাহ আপনাকে এবং আপনার পরিবারকে নিরাপদে রাখুন। আমীন।"
      ].join("\n"),
      AR: [
        "الحمد لله!",
        "سعدنا كثيرًا بسماع أن الشخص المفقود قد تم العثور عليه.",
        "سنقوم الآن بوضع علامـة على قضيتك (رقم القضية: {{CASE_ID}}) في نظامنا بأنها",
        "\"مغلقة — تم حلّها بواسطة الأسرة / مقدّم البلاغ\".",
        "نسأل الله أن يحفظك ويحفظ أسرتك، وأن يجمع بينكم دائمًا على خير. آمين."
      ].join("\n")
    };

    const template = templates[lang] || templates.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  }

};
/***************************************************************
 * Texts_CaseUpdates.gs — Case Update Flow (Master Copy)
 ***************************************************************/

const Texts_CaseUpdates = {

  /***********************************************************
   * MAIN UPDATE MENU (Existing Case → Option 4)
   ***********************************************************/
  sendUpdateMenu(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
      EN: [
        "Would you like to share an update about your submitted case (Case ID: {{CASE_ID}})?",
        "Please choose an option:",
        "1️⃣ I have new information about the case.",
        "2️⃣ The case is closed – the missing person has been found."
      ].join("\n"),

      UR: [
        "کیا آپ اپنے جمع شدہ کیس (کیس نمبر: {{CASE_ID}}) کے بارے میں کوئی اپڈیٹ شیئر کرنا چاہتے ہیں؟",
        "براہِ کرم ایک آپشن منتخب کریں:",
        "1️⃣ میرے پاس کیس کے بارے میں نئی معلومات ہے۔",
        "2️⃣ کیس کلوز ہو چکا ہے — گمشدہ شخص مل گیا ہے۔"
      ].join("\n"),

      RUR: [
        "Kya aap apne submit kiye gaye case (Case ID: {{CASE_ID}}) ke bare mein koi update share karna chahte hain?",
        "Barah-e-karam ek option ka intikhab karein:",
        "1️⃣ Mere paas case ke bare mein nayi maloomat hai.",
        "2️⃣ Case close ho chuka hai — gumshuda shakhs mil gaya hai."
      ].join("\n"),

      HI: [
        "क्या आप अपने सबमिट किए गए केस (Case ID: {{CASE_ID}}) के बारे में कोई अपडेट देना चाहते हैं?",
        "कृपया एक विकल्प चुनें:",
        "1️⃣ मेरे पास केस के बारे में नई जानकारी है।",
        "2️⃣ केस क्लोज हो चुका है — गुमशुदा व्यक्ति मिल गया है।"
      ].join("\n"),

      BN: [
        "আপনি কি আপনার জমা দেওয়া কেস (Case ID: {{CASE_ID}}) সম্পর্কে কোনো আপডেট দিতে চান?",
        "অনুগ্রহ করে একটি অপশন নির্বাচন করুন:",
        "1️⃣ আমার কাছে কেস সম্পর্কে নতুন তথ্য আছে।",
        "2️⃣ কেস ক্লোজ হয়ে গেছে — নিখোঁজ ব্যক্তি মিলেছে।"
      ].join("\n"),

      AR: [
        "هل تودّ مشاركة تحديث بخصوص قضيتك المقدَّمة (رقم القضية: {{CASE_ID}})؟",
        "يرجى اختيار أحد الخيارات:",
        "1️⃣ لدي معلومات جديدة عن القضية.",
        "2️⃣ تم إغلاق القضية — تم العثور على الشخص المفقود."
      ].join("\n")
    };

    const template = templates[lang] || templates.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },


  /***********************************************************
   * USER CHOSE 1️⃣ — NEW INFORMATION
   ***********************************************************/
  askNewInfo(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
      EN: [
        "Please type the new information you would like to add to your case (Case ID: {{CASE_ID}}).",
        "You can also send any new photos, documents, or voice notes that may help.",
        "Once you have shared everything, you can type DONE."
      ].join("\n"),

      UR: [
        "براہِ کرم وہ نئی معلومات لکھیں جو آپ اپنے کیس (کیس نمبر: {{CASE_ID}}) میں شامل کرنا چاہتے ہیں۔",
        "آپ چاہیں تو نئی تصاویر، دستاویزات، یا وائس نوٹس بھی بھیج سکتے ہیں جو مددگار ہوں۔",
        "جب آپ ساری معلومات بھیج چکیں تو آخر میں DONE لکھ کر بھیج دیں۔"
      ].join("\n"),

      RUR: [
        "Barah-e-karam woh nayi maloomat likhein jo aap apne case (Case ID: {{CASE_ID}}) mein add karna chahte hain.",
        "Aap chahen to nayi tasveerain, documents, ya voice notes bhi bhej sakte hain jo madadgar hon.",
        "Jab aap sab kuch share kar chuken, to aakhri mein DONE likh kar bhej dein."
      ].join("\n"),

      HI: [
        "कृपया वह नई जानकारी लिखें जो आप अपने केस (Case ID: {{CASE_ID}}) में जोड़ना चाहते हैं।",
        "आप चाहें तो नई फोटो, डॉक्यूमेंट या वॉइस नोट भी भेज सकते हैं जो मदद कर सके।",
        "जब आप सारी जानकारी भेज दें, तो आख़िर में DONE लिखकर भेजें।"
      ].join("\n"),

      BN: [
        "অনুগ্রহ করে সেই নতুন তথ্য লিখুন যা আপনি আপনার কেসে (Case ID: {{CASE_ID}}) যুক্ত করতে চান।",
        "আপনি চাইলে নতুন ছবি, ডকুমেন্ট বা ভয়েস নোটও পাঠাতে পারেন যা সহায়ক হতে পারে।",
        "সব তথ্য পাঠানোর পর শেষে DONE লিখে পাঠান।"
      ].join("\n"),

      AR: [
        "يرجى كتابة المعلومات الجديدة التي تودّ إضافتها إلى قضيتك (رقم القضية: {{CASE_ID}}).",
        "يمكنك أيضًا إرسال صور جديدة، مستندات، أو رسائل صوتية قد تكون مفيدة.",
        "بعد الانتهاء من مشاركة كل شيء، أرسل الكلمة DONE."
      ].join("\n")
    };

    const template = templates[lang] || templates.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  },

  confirmNewInfoAdded(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "JazakAllah khair, your new information has been added to your case.",
        "Our team will inshaAllah review these updates as well."
      ].join("\n"),

      UR: [
        "جزاک اللہ خیر، آپ کی نئی معلومات آپ کے کیس میں شامل کر دی گئی ہیں۔",
        "ہماری ٹیم ان اپڈیٹس کا بھی ان شاء اللہ جائزہ لے گی۔"
      ].join("\n"),

      RUR: [
        "JazakAllah khair, aap ki nayi maloomat aap ke case mein add kar di gayi hain.",
        "Hamari team in updates ka bhi InshaAllah jaiza legi."
      ].join("\n"),

      HI: [
        "जज़ाकअल्लाह ख़ैर, आपकी नई जानकारी आपके केस में जोड़ दी गई है।",
        "हमारी टीम इंशाअल्लाह इन अपडेट्स की भी समीक्षा करेगी।"
      ].join("\n"),

      BN: [
        "জাযাকআল্লাহ খাইর, আপনার নতুন তথ্য কেসের সাথে যোগ করা হয়েছে।",
        "আমাদের টিম ইনশাআল্লাহ এই আপডেটগুলোও পর্যালোচনা করবে।"
      ].join("\n"),

      AR: [
        "جزاك الله خيرًا، تمت إضافة المعلومات الجديدة إلى قضيتك.",
        "فريقنا سيقوم إن شاء الله بمراجعة هذه التحديثات أيضًا."
      ].join("\n")
    };

    return map[lang] || map.EN;
  },


  /***********************************************************
   * USER CHOSE 2️⃣ — CASE CLOSED (PERSON FOUND)
   ***********************************************************/
  sendCaseClosed(session, caseID) {
    const lang = session.Preferred_Language || "EN";

    const templates = {
      EN: [
        "Alhamdulillah!",
        "We are very happy to hear that the missing person has been found.",
        "We will now mark your case (Case ID: {{CASE_ID}}) as “Closed – Resolved by Family / Initiator” in our system.",
        "May Allah bless you and your family, and keep everyone safe. Ameen."
      ].join("\n"),

      UR: [
        "الحمد للہ!",
        "یہ سن کر ہمیں بہت خوشی ہوئی کہ گمشدہ شخص مل گیا ہے۔",
        "ہم اب آپ کے کیس (کیس نمبر: {{CASE_ID}}) کو اپنے سسٹم میں",
        "“کلوزڈ — خاندان / درخواست دہندہ کی طرف سے حل شدہ” کے طور پر مارک کر رہے ہیں۔",
        "اللہ آپ کو اور آپ کے گھر والوں کو اپنی حفظ و امان میں رکھے۔ آمین۔"
      ].join("\n"),

      RUR: [
        "Alhamdulillah!",
        "Yeh sunkar hamein bohot khushi hui ke gumshuda shakhs mil gaya hai.",
        "Hum ab aap ke case (Case ID: {{CASE_ID}}) ko apne system mein",
        "“Closed — family / initiator ke zariye resolve ho chuka” mark kar rahe hain.",
        "Allah aap ko aur aap ke ghar walon ko hamesha apni hifazat mein rakhe. Ameen."
      ].join("\n"),

      HI: [
        "अल्हम्दुलिल्लाह!",
        "यह सुनकर हमें बहुत खुशी हुई कि गुमशुदा व्यक्ति मिल चुका है।",
        "अब हम आपके केस (Case ID: {{CASE_ID}}) को अपने सिस्टम में",
        "“Closed — परिवार / इनिशिएटर द्वारा हल हो चुका” मार्क कर रहे हैं।",
        "अल्लाह आप और आपके परिवार को महफूज़ रखे। आमीन।"
      ].join("\n"),

      BN: [
        "আলহামদুলিল্লাহ!",
        "এটি শুনে আমরা অত্যন্ত আনন্দিত যে নিখোঁজ ব্যক্তি ফিরে এসেছে।",
        "আমরা এখন আপনার কেস (Case ID: {{CASE_ID}}) আমাদের সিস্টেমে",
        "“Closed — পরিবার / উদ্যোগকারীর মাধ্যমে সমাধান হয়েছে” হিসেবে মার্ক করব।",
        "আল্লাহ আপনাকে এবং আপনার পরিবারকে নিরাপদে রাখুন। আমীন।"
      ].join("\n"),

      AR: [
        "الحمد لله!",
        "سعدنا كثيرًا بسماع أن الشخص المفقود قد تم العثور عليه.",
        "سنقوم الآن بوضع علامـة على قضيتك (رقم القضية: {{CASE_ID}}) في نظامنا بأنها",
        "“مغلقة — تم حلّها بواسطة الأسرة / مقدّم البلاغ”.",
        "نسأل الله أن يحفظك ويحفظ أسرتك، وأن يجمع بينكم دائمًا على خير. آمين."
      ].join("\n")
    };

    const template = templates[lang] || templates.EN;
    return template.replace(/{{CASE_ID}}/g, caseID || "");
  }

};
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
/***************************************************************
 * Texts_A.gs — FLOW A (Missing Loved One — Official Prompts)
 ***************************************************************/

const Texts_A = {

  /*********************** Q1 ************************/
  sendQ1(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "We’ll ask you a few short questions to help us search effectively, inshaAllah. You can type or send a voice note if that’s easier.",
        "",
        "1️⃣ 🌍 What country is the missing person from?",
        "Options:",
        "🇵🇰 Pakistan",
        "🌐 Other country (Write the name)"
      ].join("\n"),

      UR: [
        "ہم چند مختصر سوالات کریں گے تاکہ بہتر مدد کر سکیں، ان شاء اللہ۔ آپ لکھ سکتے ہیں یا آواز کا پیغام بھیج سکتے ہیں۔",
        "",
        "1️⃣ 🌍 گمشدہ شخص کا تعلق کس ملک سے ہے؟",
        "Options:",
        "🇵🇰 Pakistan",
        "🌐 Other country (Write the name)"
      ].join("\n"),

      RUR: [
        "Hum kuch mukhtasir sawalat karein ge taake behtar madad kar saken, inshaAllah. Aap likh sakte hain ya awaaz ka paigham bhej sakte hain.",
        "",
        "1️⃣ 🌍 Gumshuda shakhs ka ta‘alluq kis mulk se hai?",
        "Options:",
        "🇵🇰 Pakistan",
        "🌐 Other country (Write the name)"
      ].join("\n"),

      HI: [
        "हम आपसे कुछ छोटे सवाल पूछेंगे ताकि हम बेहतर मदद कर सकें, इंशाअल्लाह। आप लिख सकते हैं या वॉइस नोट भेज सकते हैं।",
        "",
        "1️⃣ 🌍 गुमशुदा व्यक्ति किस देश से है?",
        "Options:",
        "🇵🇰 Pakistan",
        "🌐 Other country (Write the name)"
      ].join("\n"),

      BN: [
        "আমরা কয়েকটি সংক্ষিপ্ত প্রশ্ন করব যাতে আমরা ভালোভাবে সাহায্য করতে পারি, ইনশাআল্লাহ। আপনি লিখতে পারেন বা ভয়েস নোট পাঠাতে পারেন।",
        "",
        "1️⃣ 🌍 নিখোঁজ ব্যক্তির দেশ কোনটি?",
        "Options:",
        "🇵🇰 Pakistan",
        "🌐 Other country (Write the name)"
      ].join("\n"),

      AR: [
        "سنسألك بعض الأسئلة القصيرة لمساعدتنا في البحث بشكل أفضل، إن شاء الله. يمكنك الكتابة أو إرسال رسالة صوتية إذا كان ذلك أسهل.",
        "",
        "1️⃣ 🌍 من أي بلد الشخص المفقود؟",
        "Options:",
        "🇵🇰 Pakistan",
        "🌐 Other country (Write the name)"
      ].join("\n")
    };

    return map[lang] || map.EN;
  },


  /*********************** Q2 ************************/
  sendQ2(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "2️⃣ 📝 What is the full name of the missing person?",
      UR: "2️⃣ 📝 گمشدہ شخص کا پورا نام کیا ہے؟",
      RUR: "2️⃣ 📝 Missing shakhs ka poora naam kya hai?",
      HI: "2️⃣ 📝 गुमशुदा व्यक्ति का पूरा नाम क्या है?",
      BN: "2️⃣ 📝 নিখোঁজ ব্যক্তির পুরো নাম কী?",
      AR: "2️⃣ 📝 ما الاسم الكامل للشخص المفقود؟"
    };

    return map[lang] || map.EN;
  },


  /*********************** Q3 ************************/
  sendQ3(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "3️⃣ 🎂 How old are they? Approximate age is fine.",
      UR: "3️⃣ 🎂 ان کی عمر کتنی ہے؟ تقریبی عمر بھی چل جائے گی۔",
      RUR: "3️⃣ 🎂 Unki umar kitni hai? Taqreeban umar bhi chalegi.",
      HI: "3️⃣ 🎂 उनकी उम्र कितनी है? अनुमानित उम्र भी चलेगी।",
      BN: "3️⃣ 🎂 তার বয়স কত? আনুমানিক বয়সও চলবে।",
      AR: "3️⃣ 🎂 كم عمره؟ العمر التقريبي يكفي."
    };

    return map[lang] || map.EN;
  },


  sendInvalidAge(session) {
    return this.sendQ3(session);
  },


  /*********************** Q4 ************************/
  sendQ4(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "4️⃣ 🚻 What is their gender?",
        "Options:",
        "1️⃣ Male — (Mard / पुरुष / পুরুষ / ذكر)",
        "2️⃣ Female — (Aurat / महिला / নারী / أنثى)",
        "3️⃣ Other — (Doosri / अन्य / অন্যান্য / آخر)"
      ].join("\n"),

      UR: [
        "4️⃣ 🚻 ان کی جنس کیا ہے؟",
        "Options:",
        "1️⃣ Male — (Mard / पुरुष / পুরুষ / ذكر)",
        "2️⃣ Female — (Aurat / महिला / নারী / أنثى)",
        "3️⃣ Other — (Doosri / अन्य / অন্যান্য / آخر)"
      ].join("\n"),

      RUR: [
        "4️⃣ 🚻 Unki jins kya hai?",
        "Options:",
        "1️⃣ Male — (Mard / पुरुष / পুরুষ / ذكر)",
        "2️⃣ Female — (Aurat / महिला / নারী / أنثى)",
        "3️⃣ Other — (Doosri / अन्य / অন্যান্য / آخر)"
      ].join("\n"),

      HI: [
        "4️⃣ 🚻 उनका लिंग क्या है?",
        "Options:",
        "1️⃣ Male — (Mard / पुरुष / পুরুষ / ذكر)",
        "2️⃣ Female — (Aurat / महिला / নারী / أنثى)",
        "3️⃣ Other — (Doosri / अन्य / অন্যান্য / آخر)"
      ].join("\n"),

      BN: [
        "4️⃣ 🚻 তার লিঙ্গ কী?",
        "Options:",
        "1️⃣ Male — (Mard / पुरुष / পুরুষ / ذكر)",
        "2️⃣ Female — (Aurat / महिला / নারী / أنثى)",
        "3️⃣ Other — (Doosri / अन्य / অন্যান্য / آخر)"
      ].join("\n"),

      AR: [
        "4️⃣ 🚻 ما جنسهم؟",
        "Options:",
        "1️⃣ Male — (Mard / पुरुष / পুরুষ / ذكر)",
        "2️⃣ Female — (Aurat / महिला / নারী / أنثى)",
        "3️⃣ Other — (Doosri / अन्य / অন্যান্য / آخر)"
      ].join("\n")
    };

    return map[lang] || map.EN;
  },


  /*********************** Q5 ************************/
  sendQ5(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "5️⃣ 📍 Where were they last seen (city/area)?",
      UR: "5️⃣ 📍 انہیں آخری بار کہاں دیکھا گیا تھا — شہر یا علاقہ؟",
      RUR: "5️⃣ 📍 Akhri martaba kahan dekha gaya tha — shehar ya ilaqa?",
      HI: "5️⃣ 📍 उन्हें आखिरी बार कहाँ देखा गया था — शहर या इलाका?",
      BN: "5️⃣ 📍 তাকে শেষবার কোথায় দেখা গিয়েছিল — শহর বা এলাকা?",
      AR: "5️⃣ 📍 أين شوهد آخر مرة (مدينة / منطقة)؟"
    };

    return map[lang] || map.EN;
  },


  /*********************** Q6 ************************/
  sendQ6(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "6️⃣ ⏰ When were they last seen (date or approximate time)?",
      UR: "6️⃣ ⏰ انہیں آخری بار کب دیکھا گیا تھا — تاریخ یا اندازہ؟",
      RUR: "6️⃣ ⏰ Akhri martaba kab dekha gaya tha — tareekh ya andaza?",
      HI: "6️⃣ ⏰ उन्हें आखिरी बार कब देखा गया था — तारीख या अनुमानित समय?",
      BN: "6️⃣ ⏰ তাকে শেষবার কবে দেখা গিয়েছিল — তারিখ বা আনুমানিক সময়?",
      AR: "6️⃣ ⏰ متى شوهد آخر مرة (تاريخ أو وقت تقريبي)؟"
    };

    return map[lang] || map.EN;
  },


  /*********************** Q7 ************************/
  sendQ7(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "7️⃣ 👨‍👩‍👧‍👦 What is your relationship to the missing person (brother, mother, friend, etc.)?",
      UR: "7️⃣ 👨‍👩‍👧‍👦 آپ کا گمشدہ شخص سے کیا رشتہ ہے — بھائی، ماں، دوست وغیرہ؟",
      RUR: "7️⃣ 👨‍👩‍👧‍👦 Aapka gumshuda shakhs se kya rishta hai — bhai, maa, dost waghera?",
      HI: "7️⃣ 👨‍👩‍👧‍👦 आपका गुमशुदा व्यक्ति से क्या रिश्ता है — भाई, माँ, दोस्त आदि?",
      BN: "7️⃣ 👨‍👩‍👧‍👦 নিখোঁজ ব্যক্তির সাথে আপনার সম্পর্ক কী — ভাই, মা, বন্ধু ইত্যাদি?",
      AR: "7️⃣ 👨‍👩‍👧‍👦 ما علاقتك بالشخص المفقود (أخ، أم، صديق، إلخ)؟"
    };

    return map[lang] || map.EN;
  },


  /*********************** Q8 ************************/
  sendQ8(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "8️⃣ 📞 Please share a contact number where we can reach you.",
      UR: "8️⃣ 📞 براہ کرم اپنا فون نمبر بتائیں تاکہ ہم رابطہ کر سکیں۔",
      RUR: "8️⃣ 📞 Mehrbani kar ke apna phone number likhein jahan hum rabta kar saken.",
      HI: "8️⃣ 📞 कृपया वह फ़ोन नंबर साझा करें जहाँ हम आपसे संपर्क कर सकें।",
      BN: "8️⃣ 📞 অনুগ্রহ করে একটি ফোন নম্বর দিন যেখানে আমরা আপনার সাথে যোগাযোগ করতে পারি।",
      AR: "8️⃣ 📞 يرجى مشاركة رقم هاتف يمكننا الوصول إليك من خلاله."
    };

    return map[lang] || map.EN;
  },


  /*********************** Q9 ************************/
  sendQ9(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "9️⃣ 🖼️ If you have a photo, please send it now. If not, reply “No” or describe in a voice note.",
      UR: "9️⃣ 🖼️ اگر تصویر موجود ہے تو ابھی بھیج دیں۔ اگر نہیں ہے تو “نہیں” لکھ دیں یا آواز میں بیان کر دیں۔",
      RUR: "9️⃣ 🖼️ Agar tasveer hai to ab bhej dein. Agar nahi hai to “Nahi” likh dein ya awaaz mein bayan kar dein.",
      HI: "9️⃣ 🖼️ यदि आपके पास कोई फ़ोटो है तो कृपया अभी भेजें। यदि नहीं है तो “No” लिखें या वॉइस नोट में बताएं।",
      BN: "9️⃣ 🖼️ যদি আপনার কাছে ছবি থাকে তবে এখন পাঠান। না থাকলে “না” লিখুন বা ভয়েস নোটে বর্ণনা করুন।",
      AR: "9️⃣ 🖼️ إذا كان لديك صورة، يرجى إرسالها الآن. إذا لم يكن لديك، فاكتب \"لا\" أو صفه في رسالة صوتية."
    };

    return map[lang] || map.EN;
  }

};
/***************************************************************
 * Texts_B.gs — Flow B (If you are the missing person)
 ***************************************************************/

const Texts_B = {

  /*********************** Q1 ************************/
  sendQ1(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "We’ll ask you a few short questions to understand your background better, inshaAllah. You can type or send a voice note if that’s easier.",
        "",
        "1️⃣ 🌍 What country are you originally from?",
        "Options:",
        "🇵🇰 Pakistan",
        "🌐 Other country (Write the name)"
      ].join("\n"),

      UR: [
        "ہم چند مختصر سوالات کریں گے تاکہ آپ کے بارے میں بہتر سمجھ سکیں، ان شاء اللہ۔ آپ لکھ سکتے ہیں یا آواز کا پیغام بھیج سکتے ہیں۔",
        "",
        "1️⃣ 🌍 آپ کا تعلق کس ملک سے تھا؟",
        "Options:",
        "🇵🇰 Pakistan",
        "🌐 Other country (Write the name)"
      ].join("\n"),

      RUR: [
        "Hum kuch mukhtasir sawalat karein ge taake aap ke bare mein behtar samajh saken, inshaAllah. Aap likh sakte hain ya awaaz ka paigham bhej sakte hain.",
        "",
        "1️⃣ 🌍 Aapka ta‘alluq kis mulk se tha?",
        "Options:",
        "🇵🇰 Pakistan",
        "🌐 Other country (Write the name)"
      ].join("\n"),

      HI: [
        "हम आपसे कुछ छोटे सवाल पूछेंगे ताकि हम आपके बारे में बेहतर समझ सकें, इंशाअल्लाह। आप लिख सकते हैं या वॉइस नोट भेज सकते हैं।",
        "",
        "1️⃣ 🌍 आपका ताल्लुक किस देश से था?",
        "Options:",
        "🇵🇰 Pakistan",
        "🌐 Other country (Write the name)"
      ].join("\n"),

      BN: [
        "আমরা কয়েকটি সংক্ষিপ্ত প্রশ্ন করব যাতে আমরা আপনাকে ভালোভাবে বুঝতে পারি, ইনশাআল্লাহ। আপনি লিখতে পারেন বা ভয়েস নোট পাঠাতে পারেন।",
        "",
        "1️⃣ 🌍 আপনি মূলত কোন দেশ থেকে এসেছেন?",
        "Options:",
        "🇵🇰 Pakistan",
        "🌐 Other country (Write the name)"
      ].join("\n"),

      AR: [
        "سنسألك بعض الأسئلة القصيرة لفهمك بشكل أفضل، إن شاء الله. يمكنك الكتابة أو إرسال رسالة صوتية إذا كان ذلك أسهل.",
        "",
        "1️⃣ 🌍 من أي بلد أنت أصلاً؟",
        "Options:",
        "🇵🇰 Pakistan",
        "🌐 Other country (Write the name)"
      ].join("\n")
    };

    return map[lang] || map.EN;
  },

  /*********************** Q2 ************************/
  sendQ2(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "2️⃣ 📝 What is your full name (as given by your parents, if you remember)?",
      UR: "2️⃣ 📝 آپ کا پورا نام کیا ہے (جو والدین نے رکھا تھا، اگر یاد ہو)؟",
      RUR: "2️⃣ 📝 Aapka poora naam kya hai (jo walidain ne rakha tha, agar yaad ho)?",
      HI: "2️⃣ 📝 आपका पूरा नाम क्या है (जो आपके माता-पिता ने रखा था, अगर याद हो)?",
      BN: "2️⃣ 📝 আপনার পুরো নাম কী (যদি মনে থাকে, বাবা-মা যে নাম দিয়েছিলেন)?",
      AR: "2️⃣ 📝 ما اسمك الكامل (كما سماك والداك، إذا كنت تتذكر)؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q3 ************************/
  sendQ3(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "3️⃣ 🎂 How old are you (approximate age is fine)?",
      UR: "3️⃣ 🎂 آپ کی عمر کتنی ہے؟ (تقریبی عمر بھی بتا سکتے ہیں)",
      RUR: "3️⃣ 🎂 Aapki umar kitni hai? (Taqreebi umar bhi chal jayegi)",
      HI: "3️⃣ 🎂 आपकी उम्र कितनी है? (अनुमानित उम्र भी चलेगी)",
      BN: "3️⃣ 🎂 আপনার বয়স কত? (আনুমানিক বয়সও চলবে)",
      AR: "3️⃣ 🎂 كم عمرك؟ (العمر التقريبي يكفي)"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q4 ************************/
  sendQ4(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "4️⃣ 🏡 Which city or area were you originally from?",
      UR: "4️⃣ 🏡 آپ کا تعلق کس شہر یا علاقے سے تھا؟",
      RUR: "4️⃣ 🏡 Aapka ta‘alluq kis shehar ya ilaqe se tha?",
      HI: "4️⃣ 🏡 आपका ताल्लुक किस शहर या इलाके से था?",
      BN: "4️⃣ 🏡 আপনি মূলত কোন শহর বা এলাকা থেকে এসেছেন?",
      AR: "4️⃣ 🏡 من أي مدينة أو منطقة كنت أصلاً؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q5 ************************/
  sendQ5(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "5️⃣ 🏠 Do you remember your home’s area or any nearby famous landmark?",
      UR: "5️⃣ 🏠 کیا آپ کو اپنے گھر کا علاقہ یا قریبی مشہور جگہ یاد ہے؟",
      RUR: "5️⃣ 🏠 Kya aapko apne ghar ka ilaqa ya qareebi mashhoor jagah yaad hai?",
      HI: "5️⃣ 🏠 क्या आपको अपने घर का इलाका या पास की कोई मशहूर जगह याद है?",
      BN: "5️⃣ 🏠 আপনার বাড়ির এলাকা বা কাছের কোন বিখ্যাত জায়গা মনে আছে?",
      AR: "5️⃣ 🏠 هل تتذكر منطقة منزلك أو أي معلم مشهور قريب منه؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q6 ************************/
  sendQ6(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "6️⃣ 🤔 Do you remember how you got separated from your family? Please share details if possible.",
      UR: "6️⃣ 🤔 کیا آپ کو یاد ہے کہ آپ اپنے گھر والوں سے کیسے جدا ہوئے؟ اگر ممکن ہو تو تفصیل سے بتائیں۔",
      RUR: "6️⃣ 🤔 Kya aapko yaad hai ke aap apne ghar walon se kaise juda huay? Agar mumkin ho to tafseel se batayein.",
      HI: "6️⃣ 🤔 क्या आपको याद है कि आप अपने परिवार से कैसे अलग हुए? अगर संभव हो तो विस्तार से बताइए।",
      BN: "6️⃣ 🤔 আপনি কিভাবে আপনার পরিবারের থেকে আলাদা হয়েছিলেন মনে আছে? সম্ভব হলে বিস্তারিত বলুন।",
      AR: "6️⃣ 🤔 هل تتذكر كيف انفصلت عن عائلتك؟ يرجى ذكر التفاصيل إن أمكن."
    };

    return map[lang] || map.EN;
  },

  /*********************** Q7 ************************/
  sendQ7(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "7️⃣ 👥 Who raised you after separation, and what did they tell you about how you were found?",
      UR: "7️⃣ 👥 جدائی کے بعد آپ کی پرورش کس نے کی اور انہوں نے کیا بتایا کہ آپ کیسے ملے تھے؟",
      RUR: "7️⃣ 👥 Judaai ke baad aapki parwarish kis ne ki aur unho ne kya bataya ke aap kaise mile the?",
      HI: "7️⃣ 👥 अलग होने के बाद आपकी परवरिश किसने की और उन्होंने क्या बताया कि आप कैसे मिले थे?",
      BN: "7️⃣ 👥 আলাদা হওয়ার পর আপনাকে কে লালন-পালন করেছে এবং তারা কি বলেছে আপনি কিভাবে পাওয়া গিয়েছিলেন?",
      AR: "7️⃣ 👥 من ربّاك بعد الانفصال، وماذا أخبروك عن كيفية العثور عليك؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q8 ************************/
  sendQ8(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "8️⃣ 📍 Which city or area are you currently in?",
      UR: "8️⃣ 📍 آپ اس وقت کس شہر یا علاقے میں ہیں؟",
      RUR: "8️⃣ 📍 Aap is waqt kis shehar ya ilaqe mein hain?",
      HI: "8️⃣ 📍 आप इस समय किस शहर या इलाके में हैं?",
      BN: "8️⃣ 📍 আপনি বর্তমানে কোন শহর বা এলাকায় আছেন?",
      AR: "8️⃣ 📍 في أي مدينة أو منطقة أنت الآن؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q9 ************************/
  sendQ9(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "9️⃣ 👨‍👩‍👧‍👦 Do you remember the name of any family member or relative?",
      UR: "9️⃣ 👨‍👩‍👧‍👦 کیا آپ کو کسی گھر والے یا رشتہ دار کا نام یاد ہے؟",
      RUR: "9️⃣ 👨‍👩‍👧‍👦 Kya aapko kisi ghar walay ya rishtedaar ka naam yaad hai?",
      HI: "9️⃣ 👨‍👩‍👧‍👦 क्या आपको किसी परिवार के सदस्य या रिश्तेदार का नाम याद है?",
      BN: "9️⃣ 👨‍👩‍👧‍👦 আপনার কি কোনো পরিবারের সদস্য বা আত্মীয়ের নাম মনে আছে?",
      AR: "9️⃣ 👨‍👩‍👧‍👦 هل تتذكر اسم أي فرد من العائلة أو قريب؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q10 ************************/
  sendQ10(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "🔟 📞 Please share a phone number or way to reach you.",
      UR: "🔟 📞 براہ کرم اپنا نمبر یا رابطے کا طریقہ بتائیں۔",
      RUR: "🔟 📞 Mehrbani kar ke apna number ya rabte ka tareeqa batayein.",
      HI: "🔟 📞 कृपया अपना नंबर या संपर्क का तरीका बताइए।",
      BN: "🔟 📞 অনুগ্রহ করে আপনার নম্বর বা যোগাযোগের কোনো উপায় দিন।",
      AR: "🔟 📞 يرجى مشاركة رقم هاتفك أو طريقة للتواصل معك."
    };

    return map[lang] || map.EN;
  },

  /*********************** Q11 ************************/
  sendQ11(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "1️⃣1️⃣ 🖼️ If you have a photo from the time you were found and a recent photo, please share both.",
      UR: "1️⃣1️⃣ 🖼️ اگر آپ کے پاس وہ تصویر ہے جب آپ ملے تھے اور آج کی موجودہ تصویر بھی ہے تو براہ کرم دونوں بھیج دیں۔",
      RUR: "1️⃣1️⃣ 🖼️ Agar aapke paas woh tasveer hai jab aap milay thay aur aaj ki mojooda tasveer bhi hai to mehrbani karke dono bhej dein.",
      HI: "1️⃣1️⃣ 🖼️ अगर आपके पास वह तस्वीर है जब आप मिले थे और अभी की हाल की तस्वीर भी है, तो कृपया दोनों भेजें।",
      BN: "1️⃣1️⃣ 🖼️ যদি আপনার কাছে সেই সময়ের ছবি থাকে যখন আপনাকে পাওয়া গিয়েছিল এবং একটি বর্তমান ছবি থাকে, তবে দয়া করে দুটোই পাঠান।",
      AR: "1️⃣1️⃣ 🖼️ إذا كان لديك صورة من وقت العثور عليك وصورة حديثة، يرجى إرسال كلتيهما."
    };

    return map[lang] || map.EN;
  }
};

/***************************************************************
 * Texts_C.gs — FLOW C (Helping a Missing Person — Official Prompts)
 ***************************************************************/

const Texts_C = {

  /*********************** INTRO ************************/
  sendIntro(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "We’ll ask a few simple questions to help reconnect the missing person with their family, inshaAllah. You can type or send a voice message if you prefer.",
      UR: "ہم چند آسان سوالات کریں گے تاکہ اس شخص کو ان کے گھر والوں تک پہنچانے میں مدد ملے، ان شاء اللہ۔ آپ چاہیں تو آواز کا پیغام بھی بھیج سکتے ہیں۔",
      RUR: "Hum kuch asaan sawalat karenge taake unko unke ghar walon tak pohchane mein madad mile, InshaAllah. Agar likhna mushkil hai to awaaz ka paigham bhi bhej dein.",
      HI: "हम कुछ आसान सवाल पूछेंगे ताकि उस व्यक्ति को उनके घरवालों तक पहुँचाने में मदद मिल सके, इंशाअल्लाह। आप चाहें तो आवाज़ का संदेश भी भेज सकते हैं।",
      BN: "আমরা কিছু সহজ প্রশ্ন করব যাতে তাকে তার পরিবারে পৌঁছে দিতে সাহায্য করা যায়, ইনশাআল্লাহ। আপনি চাইলে লিখে বা ভয়েস মেসেজ দিয়ে উত্তর দিতে পারেন।",
      AR: "سنطرح بعض الأسئلة البسيطة لمساعدة الشخص المفقود على الوصول إلى أسرته، إن شاء الله. يمكنك الكتابة أو إرسال رسالة صوتية إذا أردت."
    };

    return map[lang] || map.EN;
  },

  /*********************** Q0 ************************/
  sendQ0(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: [
        "❓ First Question: Source of Information",
        "Do you have direct access to the missing person, or did you just see a post / hear about them?",
        "1️⃣ Yes, I have access and can directly connect you.",
        "2️⃣ No, I don’t have access. I only saw a post / heard from someone.",
        "3️⃣ I belong to an organization where the missing person is present."
      ].join("\n"),

      UR: [
        "❓ پہلی معلومات: ذریعہ",
        "کیا آپ کے پاس اس گمشدہ شخص تک براہِ راست رسائی ہے یا آپ نے صرف کوئی پوسٹ دیکھی/سنی ہے؟",
        "1️⃣ ہاں، میرے پاس رسائی ہے اور میں براہِ راست ملا سکتا ہوں۔",
        "2️⃣ نہیں، میرے پاس رسائی نہیں۔ صرف پوسٹ دیکھی یا کسی سے سنا ہے۔",
        "3️⃣ میں ایسے ادارے سے تعلق رکھتا ہوں جہاں وہ شخص موجود ہے۔"
      ].join("\n"),

      RUR: [
        "❓ Pehli maloomat: zariya",
        "Kya aap ke paas us gumshuda shakhs tak seedhi rasai hai ya sirf post dekhi / kisi se suna hai?",
        "1️⃣ Haan, meri access hai aur main un tak barah-e-raast milwa sakta hoon.",
        "2️⃣ Nahi, meri rasai nahi. Maine sirf post dekhi ya kisi se suna hai.",
        "3️⃣ Main aise idare se taluq rakhta hoon jahan woh shakhs mojood hai."
      ].join("\n"),

      HI: [
        "❓ पहली जानकारी: स्रोत",
        "क्या आपके पास उस लापता व्यक्ति तक सीधी पहुँच है, या आपने सिर्फ कोई पोस्ट देखी/सुनी है?",
        "1️⃣ हाँ, मेरे पास पहुँच है और मैं सीधे मिलवा सकता/सकती हूँ।",
        "2️⃣ नहीं, मेरे पास पहुँच नहीं। मैंने सिर्फ पोस्ट देखी या किसी से सुना है।",
        "3️⃣ मैं ऐसे संगठन से जुड़ा/जुड़ी हूँ जहाँ वह व्यक्ति मौजूद है।"
      ].join("\n"),

      BN: [
        "❓ প্রথম প্রশ্ন: তথ্যের উৎস",
        "আপনার কি নিখোঁজ ব্যক্তির কাছে সরাসরি পৌঁছানোর সুযোগ আছে, নাকি শুধু পোস্ট দেখেছেন / কারো কাছ থেকে শুনেছেন?",
        "1️⃣ হ্যাঁ, আমার সরাসরি যোগাযোগ আছে।",
        "2️⃣ না, আমার কাছে কোনো যোগাযোগ নেই। শুধু পোস্ট দেখেছি বা শুনেছি।",
        "3️⃣ আমি এমন প্রতিষ্ঠানের সাথে যুক্ত যেখানে নিখোঁজ ব্যক্তি আছেন।"
      ].join("\n"),

      AR: [
        "❓ السؤال الأول: مصدر المعلومة",
        "هل لديك وصول مباشر إلى الشخص المفقود، أم أنك فقط رأيت منشورًا/سمعت عنه؟",
        "1️⃣ نعم، لدي وصول ويمكنني توصيلكم مباشرة.",
        "2️⃣ لا، ليس لدي وصول. فقط رأيت منشورًا أو سمعت من أحد.",
        "3️⃣ أنتمي إلى مؤسسة يوجد فيها هذا الشخص المفقود."
      ].join("\n")
    };

    return map[lang] || map.EN;
  },

  /*********************** REJECT OPTION (NO ACCESS) ************************/
  sendRejectNoAccess(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "Since you don’t have direct access, we cannot proceed further. If you ever meet the missing person, please share details then.",
      UR: "چونکہ آپ کے پاس براہِ راست رسائی نہیں ہے، ہم مزید کارروائی نہیں کر سکتے۔ اگر کبھی آپ کی ان سے ملاقات ہو تو براہِ کرم تفصیل بتائیے گا۔",
      RUR: "Chunke aap ke paas direct rasai nahi hai, hum mazeed madad nahi kar sakte. Agar kabhi mulaqat ho to tafseel batayein.",
      HI: "क्योंकि आपके पास सीधी पहुँच नहीं है, हम आगे मदद नहीं कर सकते। अगर कभी आप उनसे मिलें तो कृपया जानकारी दें।",
      BN: "যেহেতু আপনার সরাসরি যোগাযোগ নেই, আমরা আর এগোতে পারছি না। যদি কখনও তার সাথে দেখা হয়, দয়া করে বিস্তারিত জানান।",
      AR: "بما أنه ليس لديك وصول مباشر، لا يمكننا المتابعة. إذا قابلت الشخص يومًا ما، يرجى تزويدنا بالتفاصيل."
    };

    return map[lang] || map.EN;
  },

  /*********************** Q1 ************************/
  sendQ1(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "1️⃣ Where did you meet the missing person?",
      UR: "1️⃣ آپ کو گمشدہ شخص کہاں سے ملا تھا؟",
      RUR: "1️⃣ Aap ko gumshuda shakhs kahan se mila tha?",
      HI: "1️⃣ आपको लापता व्यक्ति कहाँ मिला था?",
      BN: "1️⃣ আপনি নিখোঁজ ব্যক্তিকে কোথায় পেয়েছিলেন?",
      AR: "1️⃣ أين التقيت بالشخص المفقود؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q2 ************************/
  sendQ2(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "2️⃣ When did you meet them?",
      UR: "2️⃣ آپ کو وہ کب ملے تھے؟",
      RUR: "2️⃣ Aap ko woh kab mile the?",
      HI: "2️⃣ आप उनसे कब मिले थे?",
      BN: "2️⃣ আপনি কবে তার সাথে দেখা করেছিলেন?",
      AR: "2️⃣ متى التقيت بهم؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q3 ************************/
  sendQ3(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "3️⃣ What is their full name?",
      UR: "3️⃣ ان کا پورا نام کیا ہے؟",
      RUR: "3️⃣ Unka poora naam kya hai?",
      HI: "3️⃣ उनका पूरा नाम क्या है?",
      BN: "3️⃣ তার পুরো নাম কী?",
      AR: "3️⃣ ما هو اسمهم الكامل؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q4 ************************/
  sendQ4(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "4️⃣ What is their approximate age?",
      UR: "4️⃣ ان کی عمر کتنی ہے؟ (تقریباً بھی بتا سکتے ہیں)",
      RUR: "4️⃣ Unki umar kitni hai? Taqreeban bhi chalegi.",
      HI: "4️⃣ उनकी उम्र कितनी है? (लगभग भी बता सकते हैं)",
      BN: "4️⃣ তাদের বয়স কত? (আনুমানিক হলেও চলবে)",
      AR: "4️⃣ كم عمرهم تقريبًا؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q5 ************************/
  sendQ5(session) {
    const block = [
      "5️⃣ What is their gender?",
      "Options:",
      "1️⃣ Male — (Mard / पुरुष / পুরুষ / ذكر)",
      "2️⃣ Female — (Aurat / महिला / নারী / أنثى)",
      "3️⃣ Other — (Doosri / अन्य / অন্যান্য / آخر)"
    ].join("\n");

    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: block,
      UR: block,
      RUR: block,
      HI: block,
      BN: block,
      AR: block
    };

    return map[lang] || block;
  },

  /*********************** Q6 ************************/
  sendQ6(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "6️⃣ Which country do they belong to?",
      UR: "6️⃣ ان کا تعلق کس ملک سے ہے؟",
      RUR: "6️⃣ Unka taluq kis mulk se hai?",
      HI: "6️⃣ उनका ताल्लुक किस देश से है?",
      BN: "6️⃣ তাদের কোন দেশের সাথে সম্পর্কিত?",
      AR: "6️⃣ إلى أي بلد ينتمون؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q7 ************************/
  sendQ7(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "7️⃣ Which city/area do they belong to (if remembered)?",
      UR: "7️⃣ ان کا تعلق کس شہر یا علاقے سے ہے؟ (اگر یاد ہو)",
      RUR: "7️⃣ Unka taluq kis shehar ya ilaqe se hai? (agar yaad ho)",
      HI: "7️⃣ उनका ताल्लुक किस शहर/इलाके से है? (अगर याद हो)",
      BN: "7️⃣ তারা কোন শহর/এলাকা থেকে? (যদি মনে থাকে)",
      AR: "7️⃣ من أي مدينة/منطقة ينتمون (إذا كان يتذكر)؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q8 ************************/
  sendQ8(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "8️⃣ Do they remember any landmark or nearby famous place of their home?",
      UR: "8️⃣ کیا انہیں اپنے گھر کے علاقے یا قریبی مشہور جگہ یاد ہے؟",
      RUR: "8️⃣ Kya unko ghar ke ilaqe ya qareebi mashhoor jagah yaad hai?",
      HI: "8️⃣ क्या उन्हें अपने घर का इलाका या पास की कोई मशहूर जगह याद है?",
      BN: "8️⃣ তারা কি তাদের বাড়ির এলাকা বা কাছাকাছি কোনো বিখ্যাত জায়গা মনে রাখে?",
      AR: "8️⃣ هل يتذكرون أي معلم أو مكان مشهور بالقرب من منزلهم؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q9 ************************/
  sendQ9(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "9️⃣ Do they remember how they got separated from family? Please describe.",
      UR: "9️⃣ کیا انہیں یاد ہے کہ وہ گھر والوں سے کیسے جدا ہوئے؟ براہ کرم وضاحت کریں۔",
      RUR: "9️⃣ Kya unko yaad hai ke woh ghar walon se kaise juda huay? Tafseel se batayein.",
      HI: "9️⃣ क्या उन्हें याद है कि वे घरवालों से कैसे अलग हुए? कृपया बताएँ।",
      BN: "9️⃣ তারা কি মনে করতে পারে কীভাবে তারা পরিবার থেকে আলাদা হয়েছে? বিস্তারিত বলুন।",
      AR: "9️⃣ هل يتذكرون كيف انفصلوا عن عائلتهم؟ يرجى التوضيح."
    };

    return map[lang] || map.EN;
  },

  /*********************** Q10 ************************/
  sendQ10(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "🔟 Who raised them after separation, and what did they share about their past?",
      UR: "🔟 جدائی کے بعد ان کی پرورش کس نے کی اور انہوں نے اپنے ماضی کے بارے میں کیا بتایا؟",
      RUR: "🔟 Judaai ke baad unki parwarish kis ne ki aur unho ne apne mazi ke bare mein kya bataya?",
      HI: "🔟 जुदाई के बाद उनकी परवरिश किसने की और उन्होंने अपने अतीत के बारे में क्या बताया?",
      BN: "🔟 বিচ্ছেদের পর তাদের লালন-পালন কে করেছে এবং তারা তাদের অতীত সম্পর্কে কী বলেছে?",
      AR: "🔟 من ربّاهم بعد الانفصال، وماذا قالوا عن ماضيهم؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q11 ************************/
  sendQ11(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "1️⃣1️⃣ Which country are they currently in?",
      UR: "1️⃣1️⃣ وہ اس وقت کس ملک میں ہیں؟",
      RUR: "1️⃣1️⃣ Woh is waqt kis mulk mein hain?",
      HI: "1️⃣1️⃣ वे इस समय किस देश में हैं?",
      BN: "1️⃣1️⃣ তারা বর্তমানে কোন দেশে আছে?",
      AR: "1️⃣1️⃣ في أي بلد هم الآن؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q12 ************************/
  sendQ12(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "1️⃣2️⃣ Which city/area are they currently in?",
      UR: "1️⃣2️⃣ وہ اس وقت کس شہر یا علاقے میں ہیں؟",
      RUR: "1️⃣2️⃣ Woh is waqt kis shehar ya ilaqe mein hain?",
      HI: "1️⃣2️⃣ वे इस समय किस शहर/इलाके में हैं?",
      BN: "1️⃣2️⃣ তারা বর্তমানে কোন শহর/এলাকায় আছে?",
      AR: "1️⃣2️⃣ في أي مدينة/منطقة هم الآن؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q13 ************************/
  sendQ13(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "1️⃣3️⃣ Do they remember the name of any family member or relative?",
      UR: "1️⃣3️⃣ کیا انہیں کسی گھر والے یا رشتہ دار کا نام یاد ہے؟",
      RUR: "1️⃣3️⃣ Kya unko kisi ghar walay ya rishtedaar ka naam yaad hai?",
      HI: "1️⃣3️⃣ क्या उन्हें किसी घरवाले या रिश्तेदार का नाम याद है?",
      BN: "1️⃣3️⃣ তারা কি কোনো পরিবারের সদস্য বা আত্মীয়ের নাম মনে রাখে?",
      AR: "1️⃣3️⃣ هل يتذكرون اسم أي فرد من العائلة أو قريب؟"
    };

    return map[lang] || map.EN;
  },

  /*********************** Q14 ************************/
  sendQ14(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "1️⃣4️⃣ Please share your contact number or preferred way to connect.",
      UR: "1️⃣4️⃣ براہ کرم اپنا نمبر یا رابطے کا طریقہ بتائیے۔",
      RUR: "1️⃣4️⃣ Mehrbani karke apna number ya rabte ka tareeqa batayein.",
      HI: "1️⃣4️⃣ कृपया अपना नंबर या संपर्क का तरीका बताएँ।",
      BN: "1️⃣4️⃣ অনুগ্রহ করে আপনার নম্বর বা যোগাযোগের উপায় দিন।",
      AR: "1️⃣4️⃣ يرجى مشاركة رقم هاتفك أو وسيلة الاتصال المفضلة."
    };

    return map[lang] || map.EN;
  },

  /*********************** Q15 ************************/
  sendQ15(session) {
    const lang = session.Preferred_Language || "EN";

    const map = {
      EN: "1️⃣5️⃣ If you have a photo (then & now), please share both.",
      UR: "1️⃣5️⃣ اگر آپ کے پاس وہ تصویر ہے جب وہ ملے تھے اور آج کی تصویر بھی ہے تو دونوں بھیج دیں۔",
      RUR: "1️⃣5️⃣ Agar aapke paas woh tasveer hai jab woh mile the aur aaj ki bhi hai to dono bhej dein.",
      HI: "1️⃣5️⃣ अगर आपके पास उनकी पहली मुलाक़ात की और अभी की तस्वीर है तो दोनों भेजें।",
      BN: "1️⃣5️⃣ যদি আপনার কাছে প্রথম দেখা সময়ের এবং বর্তমানের ছবি থাকে তবে দুটোই পাঠান।",
      AR: "1️⃣5️⃣ إذا كان لديك صورة عند لقائهم أول مرة وصورة حالية، يرجى إرسال كلتاهما."
    };

    return map[lang] || map.EN;
  }

};
/************************************************************
 *  Flows.gs — MASTER FLOW ROUTER (FINAL PRODUCTION)
 ************************************************************/

const Flows = {

  /************************************************************
   * MAIN ROUTER — Delegates to the correct flow handler
   ************************************************************/
  routeMessage(session, msg, raw, mediaUrl, mediaMime) {

    session.Temp = session.Temp || {};

    const incomingText = (msg || "").trim();
    let step = session.Current_Step_Code || "";

    /****************************************************
     * Ensure region + language are always established
     ****************************************************/
    if (!session.Region_Group) {
      session.Region_Group = detectRegionByPhone(session.WhatsApp_Number);
      Session.save(session);
    }

    if (step !== "LANG_SELECT" && !session.Preferred_Language) {
      session.Current_Step_Code = "LANG_SELECT";
      Session.save(session);
      return Texts.sendLanguageMenu(session);
    }

    if (step === "LANG_SELECT") {
      return this.handleLanguageSelection(session, incomingText);
    }

    // Default idle state → return to user type selection
    if (!step) {
      session.Current_Step_Code = "USER_TYPE";
      Session.save(session);
      step = "USER_TYPE";
    }

    if (step === "USER_TYPE") {
      return this.handleUserType(session, incomingText);
    }

    if (step === "A_ELIGIBILITY") {
      return this.handleEligibility_A(session, incomingText);
    }

    if (step === "A_ELIGIBILITY_REJECTED") {
      return this.handleRejected_A(session, incomingText);
    }

    if (step === "EXISTING_CASE_REVIEW") {
      return ExistingCaseFlow.handleReview(session, incomingText, mediaUrl, mediaMime);
    }

    if (step === "CASE_UPDATE_MENU" || step === "CASE_UPDATE_INFO") {
      return CaseUpdateFlow.handle(session, incomingText, mediaUrl, mediaMime);
    }

    if (step.startsWith("A_")) {
      return FlowA.handle(session, incomingText, raw, mediaUrl, mediaMime);
    }

    if (step.startsWith("B_")) {
      return FlowB.handle(session, incomingText, raw, mediaUrl, mediaMime);
    }

    if (step.startsWith("C_")) {
      return FlowC.handle(session, incomingText, raw, mediaUrl, mediaMime);
    }

    return Texts_Validation.sendInvalidOption(session);
  },


  /************************************************************
   * LANGUAGE SELECTION HANDLER
   ************************************************************/
  handleLanguageSelection(session, msg) {

    const lang = Texts.mapLanguageChoice(session.Region_Group, msg);

    if (!lang) {
      return (
        Texts_Validation.sendInvalidOption(session)
        + "\n\n"
        + Texts.sendLanguageMenu(session)
      );
    }

    session.Preferred_Language = lang;
    session.Current_Step_Code = "USER_TYPE";
    Session.save(session);

    return Texts.sendUserTypeMenu(session);
  },


  /************************************************************
   * USER TYPE HANDLER — Routes to Flow A/B/C
   ************************************************************/
  handleUserType(session, msg) {

    if (msg === "1") {
      session.Flow_Type = "A";
      session.Current_Step_Code = "A_ELIGIBILITY";
      Session.save(session);
      return Texts_Eligibility.sendEligibilityQuestion(session);
    }

    if (msg === "2") {
      session.Flow_Type = "B";
      Session.save(session);
      return FlowB.start(session);
    }

    if (msg === "3") {
      session.Flow_Type = "C";
      Session.save(session);
      return FlowC.start(session);
    }

    return (
      Texts_Validation.sendInvalidOption(session)
      + "\n\n"
      + Texts.sendUserTypeMenu(session)
    );
  },


  /************************************************************
   * FLOW A — Eligibility gate
   ************************************************************/
  handleEligibility_A(session, msg) {

    if (msg === "1") {
      session.Current_Step_Code = "A_ELIGIBILITY_REJECTED";
      Session.save(session);

      return (
        Texts_Eligibility.sendEligibilityRejection(session)
        + "\n\n"
        + Texts_Eligibility.sendEligibilityAfterRejectAsk(session)
      );
    }

    if (msg === "2") {
      session.Current_Step_Code = "A_Q1";
      Session.save(session);
      return FlowA.start(session);
    }

    return (
      Texts_Validation.sendInvalidOption(session)
      + "\n\n"
      + Texts_Eligibility.sendEligibilityQuestion(session)
    );
  },


  /************************************************************
   * FLOW A — Rejection follow-up
   ************************************************************/
  handleRejected_A(session, msg) {

    if (msg === "1") {
      session.Flow_Type = "";
      session.Temp = session.Temp || {};
      session.Current_Step_Code = "USER_TYPE";
      Session.save(session);
      return Texts.sendUserTypeMenu(session);
    }

    if (msg === "2") {
      const dua = Texts_Closing.sendClosing(session);
      Session.delete(session.WhatsApp_Number);
      return dua;
    }

    return Texts_Validation.sendInvalidOption(session);
  }

};


/************************************************************
 * ================== FLOW A (FLOW TYPE A) ===================
 ************************************************************/
const FlowA = {

  start(session) {
    session.Temp = session.Temp || {};
    session.Flow_Type = "A";

    const caseID = createCase(session);
    session.Temp.caseID = caseID;
    session.Temp.flow = "A";

    session.Current_Step_Code = "A_Q1";
    Session.save(session);

    return Texts_A.sendQ1(session);
  },

  handle(session, msg, raw, mediaUrl, mediaMime) {

    const step = session.Current_Step_Code;
    const caseID = session.Temp.caseID;

    switch (step) {
      case "A_Q1":
        saveAnswer(caseID, 1, msg);
        session.Current_Step_Code = "A_Q2";
        Session.save(session);
        return Texts_A.sendQ2(session);

      case "A_Q2":
        if (mediaUrl && !msg) {
          return Texts_A.sendQ2(session);
        }
        saveAnswer(caseID, 2, msg);
        session.Current_Step_Code = "A_Q3";
        Session.save(session);
        return Texts_A.sendQ3(session);

      case "A_Q3":
        if (isNaN(Number(msg))) {
          return Texts_A.sendInvalidAge(session);
        }
        saveAnswer(caseID, 3, msg);
        session.Current_Step_Code = "A_Q4";
        Session.save(session);
        return Texts_A.sendQ4(session);

      case "A_Q4":
        saveAnswer(caseID, 4, msg);
        session.Current_Step_Code = "A_Q5";
        Session.save(session);
        return Texts_A.sendQ5(session);

      case "A_Q5":
        saveAnswer(caseID, 5, msg);
        session.Current_Step_Code = "A_Q6";
        Session.save(session);
        return Texts_A.sendQ6(session);

      case "A_Q6":
        saveAnswer(caseID, 6, msg);
        session.Current_Step_Code = "A_Q7";
        Session.save(session);
        return Texts_A.sendQ7(session);

      case "A_Q7":
        saveAnswer(caseID, 7, msg);
        session.Current_Step_Code = "A_Q8";
        Session.save(session);
        return Texts_A.sendQ8(session);

      case "A_Q8":
        saveAnswer(caseID, 8, msg);
        session.Current_Step_Code = "A_Q9";
        Session.save(session);
        return Texts_A.sendQ9(session);

      case "A_Q9":
        saveAnswer(caseID, 9, msg);
        return this.finish(session);

      default:
        return Texts_Validation.sendInvalidOption(session);
    }
  },

  finish(session) {
    const dua = Texts_Closing.sendClosing(session);

    const existingFlag = session.Temp?.existingChecked;
    session.Current_Step_Code = "";
    session.Flow_Type = "";
    session.Temp = {};
    if (existingFlag) session.Temp.existingChecked = true;
    Session.save(session);

    Session.delete(session.WhatsApp_Number);
    return dua;
  }
};


/************************************************************
 * ================== FLOW B (FLOW TYPE B) ===================
 ************************************************************/
const FlowB = {

  start(session) {
    session.Temp = session.Temp || {};
    session.Flow_Type = "B";

    const caseID = createCase(session);
    session.Temp.caseID = caseID;
    session.Temp.flow = "B";

    session.Current_Step_Code = "B_Q1";
    Session.save(session);

    return Texts_B.sendQ1(session);
  },

  handle(session, msg, raw, mediaUrl, mediaMime) {

    const step = session.Current_Step_Code;
    const caseID = session.Temp.caseID;

    switch (step) {
      case "B_Q1":
        saveAnswer(caseID, 1, msg);
        session.Current_Step_Code = "B_Q2";
        Session.save(session);
        return Texts_B.sendQ2(session);

      case "B_Q2":
        saveAnswer(caseID, 2, msg);
        session.Current_Step_Code = "B_Q3";
        Session.save(session);
        return Texts_B.sendQ3(session);

      case "B_Q3":
        if (mediaUrl && !msg) {
          return Texts_B.sendQ3(session);
        }
        saveAnswer(caseID, 3, msg);
        session.Current_Step_Code = "B_Q4";
        Session.save(session);
        return Texts_B.sendQ4(session);

      case "B_Q4":
        saveAnswer(caseID, 4, msg);
        session.Current_Step_Code = "B_Q5";
        Session.save(session);
        return Texts_B.sendQ5(session);

      case "B_Q5":
        saveAnswer(caseID, 5, msg);
        session.Current_Step_Code = "B_Q6";
        Session.save(session);
        return Texts_B.sendQ6(session);

      case "B_Q6":
        saveAnswer(caseID, 6, msg);
        session.Current_Step_Code = "B_Q7";
        Session.save(session);
        return Texts_B.sendQ7(session);

      case "B_Q7":
        saveAnswer(caseID, 7, msg);
        session.Current_Step_Code = "B_Q8";
        Session.save(session);
        return Texts_B.sendQ8(session);

      case "B_Q8":
        saveAnswer(caseID, 8, msg);
        session.Current_Step_Code = "B_Q9";
        Session.save(session);
        return Texts_B.sendQ9(session);

      case "B_Q9":
        saveAnswer(caseID, 9, msg);
        session.Current_Step_Code = "B_Q10";
        Session.save(session);
        return Texts_B.sendQ10(session);

      case "B_Q10":
        saveAnswer(caseID, 10, msg);
        session.Current_Step_Code = "B_Q11";
        Session.save(session);
        return Texts_B.sendQ11(session);

      case "B_Q11":
        if (mediaUrl) {
          saveMediaToCase(caseID, mediaUrl, mediaMime);
        } else {
          saveAnswer(caseID, 11, msg);
        }
        return this.finish(session);

      default:
        return Texts_Validation.sendInvalidOption(session);
    }
  },

  finish(session) {
    const dua = Texts_Closing.sendClosing(session);

    const existingFlag = session.Temp?.existingChecked;
    session.Current_Step_Code = "";
    session.Flow_Type = "";
    session.Temp = {};
    if (existingFlag) session.Temp.existingChecked = true;
    Session.save(session);

    Session.delete(session.WhatsApp_Number);
    return dua;
  }
};


/************************************************************
 * ================== FLOW C (FLOW TYPE C) ===================
 ************************************************************/
const FlowC = {

  start(session) {
    session.Temp = session.Temp || {};
    session.Flow_Type = "C";

    const caseID = createCase(session);
    session.Temp.caseID = caseID;
    session.Temp.flow = "C";

    session.Current_Step_Code = "C_Q0";
    Session.save(session);

    return Texts_C.sendIntro(session) + "\n\n" + Texts_C.sendQ0(session);
  },

  handle(session, msg, raw, mediaUrl, mediaMime) {

    const step = session.Current_Step_Code;
    const caseID = session.Temp.caseID;

    switch (step) {
      case "C_Q0":
        if (msg === "2") {
          return this.rejectNoAccess(session);
        }
        if (msg !== "1" && msg !== "3") {
          return Texts_Validation.sendInvalidOption(session);
        }
        saveAnswer(caseID, 1, msg);
        session.Current_Step_Code = "C_Q1";
        Session.save(session);
        return Texts_C.sendQ1(session);

      case "C_Q1":
        if (mediaUrl && !msg) {
          return Texts_C.sendQ1(session);
        }
        saveAnswer(caseID, 2, msg);
        session.Current_Step_Code = "C_Q2";
        Session.save(session);
        return Texts_C.sendQ2(session);

      case "C_Q2":
        saveAnswer(caseID, 3, msg);
        session.Current_Step_Code = "C_Q3";
        Session.save(session);
        return Texts_C.sendQ3(session);

      case "C_Q3":
        saveAnswer(caseID, 4, msg);
        session.Current_Step_Code = "C_Q4";
        Session.save(session);
        return Texts_C.sendQ4(session);

      case "C_Q4":
        saveAnswer(caseID, 5, msg);
        session.Current_Step_Code = "C_Q5";
        Session.save(session);
        return Texts_C.sendQ5(session);

      case "C_Q5":
        saveAnswer(caseID, 6, msg);
        session.Current_Step_Code = "C_Q6";
        Session.save(session);
        return Texts_C.sendQ6(session);

      case "C_Q6":
        saveAnswer(caseID, 7, msg);
        session.Current_Step_Code = "C_Q7";
        Session.save(session);
        return Texts_C.sendQ7(session);

      case "C_Q7":
        saveAnswer(caseID, 8, msg);
        session.Current_Step_Code = "C_Q8";
        Session.save(session);
        return Texts_C.sendQ8(session);

      case "C_Q8":
        saveAnswer(caseID, 9, msg);
        session.Current_Step_Code = "C_Q9";
        Session.save(session);
        return Texts_C.sendQ9(session);

      case "C_Q9":
        saveAnswer(caseID, 10, msg);
        session.Current_Step_Code = "C_Q10";
        Session.save(session);
        return Texts_C.sendQ10(session);

      case "C_Q10":
        saveAnswer(caseID, 11, msg);
        session.Current_Step_Code = "C_Q11";
        Session.save(session);
        return Texts_C.sendQ11(session);

      case "C_Q11":
        saveAnswer(caseID, 12, msg);
        session.Current_Step_Code = "C_Q12";
        Session.save(session);
        return Texts_C.sendQ12(session);

      case "C_Q12":
        saveAnswer(caseID, 13, msg);
        session.Current_Step_Code = "C_Q13";
        Session.save(session);
        return Texts_C.sendQ13(session);

      case "C_Q13":
        saveAnswer(caseID, 14, msg);
        session.Current_Step_Code = "C_Q14";
        Session.save(session);
        return Texts_C.sendQ14(session);

      case "C_Q14":
        saveAnswer(caseID, 15, msg);
        session.Current_Step_Code = "C_Q15";
        Session.save(session);
        return Texts_C.sendQ15(session);

      case "C_Q15":
        if (mediaUrl) {
          saveMediaToCase(caseID, mediaUrl, mediaMime);
        } else {
          saveAnswer(caseID, 16, msg);
        }
        return this.finish(session);

      default:
        return Texts_Validation.sendInvalidOption(session);
    }
  },

  rejectNoAccess(session) {
    const message = Texts_C.sendRejectNoAccess(session);
    Session.delete(session.WhatsApp_Number);
    return message;
  },

  finish(session) {
    const dua = Texts_Closing.sendClosing(session);

    const existingFlag = session.Temp?.existingChecked;
    session.Current_Step_Code = "";
    session.Flow_Type = "";
    session.Temp = {};
    if (existingFlag) session.Temp.existingChecked = true;
    Session.save(session);

    Session.delete(session.WhatsApp_Number);
    return dua;
  }
};


/************************************************************
 * ============== EXISTING CASE FLOW (MENU) =================
 ************************************************************/
const ExistingCaseFlow = {

  route(session, msg) {
    session.Temp = session.Temp || {};

    const choice = (msg || "").trim();
    const caseID = session.Temp.lastCaseID;

    if (!caseID) {
      return "__EC_BACK__";
    }

    if (choice === "0" || choice.toUpperCase() === "BACK") {
      return "__EC_BACK__";
    }

    switch (choice) {
      case "1":
        session.Temp.reviewCaseID = caseID;
        session.Temp.caseID = caseID;
        session.Current_Step_Code = "EXISTING_CASE_REVIEW";
        Session.save(session);

        const record = this.lookupCase(session, caseID);
        const details = this.formatCaseDetails(session, record);
        return Texts_ExistingCases.sendCaseDetails(session, caseID, details);

      case "2":
        session.Current_Step_Code = "EXISTING_CASE_MENU";
        Session.save(session);
        const status = Cases.getCaseStatus(caseID) || "";
        return (
          Texts_ExistingCases.sendCaseStatus(session, caseID, status)
          + "\n\n"
          + Texts_ExistingCases.sendExistingCaseMenu(session, caseID)
        );

      case "3":
        session.Flow_Type = "";
        session.Temp.caseID = undefined;
        session.Temp.reviewCaseID = undefined;
        session.Current_Step_Code = "USER_TYPE";
        Session.save(session);
        return (
          Texts_ExistingCases.sendNewCaseStart(session)
          + "\n\n"
          + Texts.sendUserTypeMenu(session)
        );

      case "4":
        session.Temp.updateCaseID = caseID;
        session.Temp.caseID = caseID;
        session.Current_Step_Code = "CASE_UPDATE_MENU";
        Session.save(session);
        return Texts_CaseUpdates.sendUpdateMenu(session, caseID);

      default:
        return (
          Texts_Validation.sendInvalidOption(session)
          + "\n\n"
          + Texts_ExistingCases.sendExistingCaseMenu(session, caseID)
        );
    }
  },

  handleReview(session, msg, mediaUrl, mediaMime) {
    session.Temp = session.Temp || {};

    const caseID = session.Temp.reviewCaseID || session.Temp.lastCaseID;
    if (!caseID) {
      session.Current_Step_Code = "USER_TYPE";
      Session.save(session);
      return Texts.sendUserTypeMenu(session);
    }

    const trimmed = (msg || "").trim();

    if (trimmed === "0" || trimmed.toUpperCase() === "BACK") {
      session.Current_Step_Code = "EXISTING_CASE_MENU";
      Session.save(session);
      return Texts_ExistingCases.sendExistingCaseMenu(session, caseID);
    }

    if (mediaUrl) {
      saveMediaToCase(caseID, mediaUrl, mediaMime);
      session.Current_Step_Code = "EXISTING_CASE_MENU";
      Session.save(session);
      return (
        Texts_CaseUpdates.confirmNewInfoAdded(session)
        + "\n\n"
        + Texts_ExistingCases.sendExistingCaseMenu(session, caseID)
      );
    }

    if (trimmed) {
      saveExtra(caseID, trimmed);
      saveCaseUpdate(caseID, "UPDATE_TEXT", trimmed, "", "");
      session.Current_Step_Code = "EXISTING_CASE_MENU";
      Session.save(session);
      return (
        Texts_CaseUpdates.confirmNewInfoAdded(session)
        + "\n\n"
        + Texts_ExistingCases.sendExistingCaseMenu(session, caseID)
      );
    }

    return Texts_ExistingCases.sendExistingCaseMenu(session, caseID);
  },

  lookupCase(session, caseID) {
    const list = Cases.getCasesByNumber(session.WhatsApp_Number);
    for (let i = 0; i < list.length; i++) {
      if (list[i].Case_ID === caseID) {
        return list[i];
      }
    }
    return null;
  },

  formatCaseDetails(session, record) {
    if (!record) return "";

    const reviewSession = Object.assign({}, session, {
      Preferred_Language: record.Language || session.Preferred_Language
    });

    const map = {
      A: [
        () => Texts_A.sendQ1(reviewSession),
        () => Texts_A.sendQ2(reviewSession),
        () => Texts_A.sendQ3(reviewSession),
        () => Texts_A.sendQ4(reviewSession),
        () => Texts_A.sendQ5(reviewSession),
        () => Texts_A.sendQ6(reviewSession),
        () => Texts_A.sendQ7(reviewSession),
        () => Texts_A.sendQ8(reviewSession),
        () => Texts_A.sendQ9(reviewSession)
      ],
      B: [
        () => Texts_B.sendQ1(reviewSession),
        () => Texts_B.sendQ2(reviewSession),
        () => Texts_B.sendQ3(reviewSession),
        () => Texts_B.sendQ4(reviewSession),
        () => Texts_B.sendQ5(reviewSession),
        () => Texts_B.sendQ6(reviewSession),
        () => Texts_B.sendQ7(reviewSession),
        () => Texts_B.sendQ8(reviewSession),
        () => Texts_B.sendQ9(reviewSession),
        () => Texts_B.sendQ10(reviewSession),
        () => Texts_B.sendQ11(reviewSession)
      ],
      C: [
        () => Texts_C.sendQ0(reviewSession),
        () => Texts_C.sendQ1(reviewSession),
        () => Texts_C.sendQ2(reviewSession),
        () => Texts_C.sendQ3(reviewSession),
        () => Texts_C.sendQ4(reviewSession),
        () => Texts_C.sendQ5(reviewSession),
        () => Texts_C.sendQ6(reviewSession),
        () => Texts_C.sendQ7(reviewSession),
        () => Texts_C.sendQ8(reviewSession),
        () => Texts_C.sendQ9(reviewSession),
        () => Texts_C.sendQ10(reviewSession),
        () => Texts_C.sendQ11(reviewSession),
        () => Texts_C.sendQ12(reviewSession),
        () => Texts_C.sendQ13(reviewSession),
        () => Texts_C.sendQ14(reviewSession),
        () => Texts_C.sendQ15(reviewSession)
      ]
    };

    const flowKey = (record.Flow_Type || "").toUpperCase();
    const providers = map[flowKey] || [];
    const answers = record.Q || [];

    const lines = [];
    for (let i = 0; i < answers.length; i++) {
      const answer = (answers[i] || "").toString().trim();
      if (!answer) continue;
      const provider = providers[i];
      const prompt = provider ? provider() : ("Q" + (i + 1));
      lines.push(prompt + "\n" + answer);
    }

    return lines.join("\n\n");
  }
};


/************************************************************
 * ================= CASE UPDATE FLOW =======================
 ************************************************************/
const CaseUpdateFlow = {

  handle(session, msg, mediaUrl, mediaMime) {
    session.Temp = session.Temp || {};

    const step = session.Current_Step_Code;
    const caseID = session.Temp.updateCaseID;

    if (!caseID) {
      session.Current_Step_Code = "EXISTING_CASE_MENU";
      Session.save(session);
      return Texts_ExistingCases.sendExistingCaseMenu(session, session.Temp.lastCaseID || "");
    }

    if (step === "CASE_UPDATE_MENU") {
      if (msg === "1") {
        session.Current_Step_Code = "CASE_UPDATE_INFO";
        session.Temp.caseID = caseID;
        Session.save(session);
        return Texts_CaseUpdates.askNewInfo(session, caseID);
      }

      if (msg === "2") {
        closeCase(caseID, "Closed — Resolved by Family / Initiator");
        saveCaseUpdate(caseID, "STATUS", "Closed — Resolved by Family / Initiator", "", "");

        session.Current_Step_Code = "";
        session.Flow_Type = "";
        session.Temp.caseID = undefined;
        session.Temp.updateCaseID = undefined;
        Session.save(session);

        return Texts_CaseUpdates.sendCaseClosed(session, caseID);
      }

      return (
        Texts_Validation.sendInvalidOption(session)
        + "\n\n"
        + Texts_CaseUpdates.sendUpdateMenu(session, caseID)
      );
    }

    if (step === "CASE_UPDATE_INFO") {
      const trimmed = (msg || "").trim();

      if (trimmed === "0" || trimmed.toUpperCase() === "BACK") {
        session.Current_Step_Code = "EXISTING_CASE_MENU";
        session.Temp.caseID = caseID;
        Session.save(session);
        return Texts_ExistingCases.sendExistingCaseMenu(session, caseID);
      }

      if (trimmed.toUpperCase() === "DONE") {
        session.Current_Step_Code = "EXISTING_CASE_MENU";
        session.Temp.caseID = caseID;
        Session.save(session);
        return (
          Texts_CaseUpdates.confirmNewInfoAdded(session)
          + "\n\n"
          + Texts_ExistingCases.sendExistingCaseMenu(session, caseID)
        );
      }

      if (mediaUrl) {
        saveMediaToCase(caseID, mediaUrl, mediaMime);
        return "";
      }

      if (trimmed) {
        saveExtra(caseID, trimmed);
        saveCaseUpdate(caseID, "UPDATE_TEXT", trimmed, "", "");
        return "";
      }

      return Texts_CaseUpdates.askNewInfo(session, caseID);
    }

    return Texts_Validation.sendInvalidOption(session);
  }
};
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
