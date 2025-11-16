/************************************************************
 * Utils.gs — Enterprise utility suite for the WhatsApp bot
 * ----------------------------------------------------------
 * This file centralizes all shared helpers mandated by the
 * "Full n Final Flow Updated.txt" specification. Every engine
 * (sessions, cases, case updates, validation, media, etc.) is
 * fully commented so future maintainers can reason about the
 * state machine without guesswork.
 ************************************************************/

/************************************************************
 * GOOGLE SHEETS ACCESSORS
 ************************************************************/
/** Lazily open the master spreadsheet referenced in CONFIG. */
function getMainSheet() {
  return SpreadsheetApp.openById(CONF('SHEET_ID'));
}

/** Return a sheet handle by name, throwing when missing. */
function getSheet_(name) {
  var sheet = getMainSheet().getSheetByName(name);
  if (!sheet) {
    throw new Error('Missing sheet: ' + name);
  }
  return sheet;
}

/** Canonical sheet names defined by the product spec. */
const SHEET_NAMES = Object.freeze({
  SESSIONS: 'User_Sessions',
  CASES: 'Cases',
  UPDATES: 'Case_Updates'
});

/** Convenient getters used throughout the codebase. */
const Sheets = Object.freeze({
  sessions: function() { return getSheet_(SHEET_NAMES.SESSIONS); },
  cases: function() { return getSheet_(SHEET_NAMES.CASES); },
  updates: function() { return getSheet_(SHEET_NAMES.UPDATES); }
});

/************************************************************
 * COLUMN MAPS (1-indexed to match Apps Script API)
 ************************************************************/
const SESSION_COLUMNS = Object.freeze({
  NUMBER: 1,
  STEP: 2,
  FLOW: 3,
  REGION: 4,
  LANGUAGE: 5,
  TEMP: 6,
  UPDATED_AT: 7,
  COUNT: 7
});

const CASE_COLUMNS = Object.freeze({
  ID: 1,
  CREATED_AT: 2,
  WHATSAPP: 3,
  REGION: 4,
  LANGUAGE: 5,
  FLOW: 6,
  Q1: 7, // Q1–Q16 occupy columns 7–22
  EXTRA: 23,
  MEDIA: 24,
  STATUS: 25,
  COUNT: 25
});

const CASE_UPDATE_COLUMNS = Object.freeze({
  UPDATE_ID: 1,
  CASE_ID: 2,
  CREATED_AT: 3,
  TYPE: 4,
  CONTENT: 5,
  MEDIA_URLS: 6,
  RAW_JSON: 7,
  COUNT: 7
});

const CASE_TOTAL_QUESTIONS = 16;

/************************************************************
 * SAFE JSON HELPERS
 ************************************************************/
const JsonUtil = {
  stringify: function(obj) {
    try {
      return JSON.stringify(obj || {});
    } catch (err) {
      Logger.log('JSON encode failure → ' + err);
      return '{}';
    }
  },
  parse: function(payload) {
    try {
      if (!payload) return {};
      return JSON.parse(payload);
    } catch (err) {
      Logger.log('JSON parse failure → ' + err);
      return {};
    }
  }
};

/************************************************************
 * GENERAL SANITIZATION + DEBUG HELPERS
 ************************************************************/
function normalizePhoneNumber(number) {
  if (!number && number !== 0) return '';
  var text = ('' + number).trim();
  var prefix = text.startsWith('+') ? '+' : '';
  var digits = text.replace(/[^0-9]/g, '');
  return prefix + digits;
}

function sanitizeInput(value) {
  if (value === null || value === undefined) return '';
  return ('' + value).trim();
}

function parseLocation(message) {
  var loc = message && message.location;
  if (!loc) return null;
  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    name: loc.name || '',
    address: loc.address || ''
  };
}

function debugLog(payload) {
  if (!CONF('ENABLE_DEBUG_LOGS')) return;
  try {
    Logger.log(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
  } catch (err) {
    Logger.log('debugLog failure → ' + err);
  }
}

/************************************************************
 * REGION DETECTION — STEP 0 FROM FLOW SPEC
 ************************************************************/
const REGION_PREFIXES = Object.freeze([
  { prefix: '+92', code: 'PK' },
  { prefix: '+91', code: 'IN' },
  { prefix: '+880', code: 'BD' },
  { prefix: '+971', code: 'AE' },
  { prefix: '+966', code: 'SA' }
]);
const REGION_FALLBACK = 'OTHER';

function detectRegionByPhone(number) {
  var normalized = normalizePhoneNumber(number);
  for (var i = 0; i < REGION_PREFIXES.length; i++) {
    if (normalized.startsWith(REGION_PREFIXES[i].prefix)) {
      return REGION_PREFIXES[i].code;
    }
  }
  return REGION_FALLBACK;
}

const RegionEngine = Object.freeze({
  detect: function(number) { return detectRegionByPhone(number); },
  fallback: function() { return REGION_FALLBACK; }
});

/************************************************************
 * LANGUAGE ENGINE — FALLBACK + SAFETY RULES
 ************************************************************/
const LANGUAGE_CODES = Object.freeze(['EN', 'UR', 'RUR', 'HI', 'BN', 'AR']);
const DEFAULT_LANGUAGE_CODE = 'EN';

const LanguageEngine = Object.freeze({
  /** True when the provided code is officially supported. */
  isSupported: function(code) {
    if (!code) return false;
    return LANGUAGE_CODES.indexOf(code.toUpperCase()) !== -1;
  },
  /** Normalize arbitrary input into a safe code. */
  sanitize: function(code) {
    return this.isSupported(code) ? code.toUpperCase() : DEFAULT_LANGUAGE_CODE;
  },
  /** Ensure the session always carries a valid Preferred_Language. */
  enforceOnSession: function(session) {
    if (!session) return DEFAULT_LANGUAGE_CODE;
    var clean = this.sanitize(session.Preferred_Language);
    session.Preferred_Language = clean;
    return clean;
  }
});

/************************************************************
 * SESSION TIMEOUT RULES — CONFIG DRIVEN
 ************************************************************/
const SESSION_TTL_MINUTES = Number(CONF('SESSION_TTL_MINUTES')) || (24 * 60);
const SESSION_TIMEOUT_HOURS = SESSION_TTL_MINUTES / 60;

const SessionTimeout = Object.freeze({
  hours: SESSION_TIMEOUT_HOURS,
  /** Returns true when inactivity exceeds TIMEOUT_LIMIT from spec. */
  hasExpired: function(session) {
    if (!session || !session.Updated_At) return false;
    try {
      var last = new Date(session.Updated_At).getTime();
      if (!last) return false;
      var diffHours = (Date.now() - last) / (1000 * 60 * 60);
      return diffHours > this.hours;
    } catch (err) {
      Logger.log('SessionTimeout.hasExpired error → ' + err);
      return false;
    }
  }
});

/************************************************************
 * SESSION ENGINE — LOAD / SAVE / RESET / TEMP DATA
 ************************************************************/
const SessionEngine = (function() {
  /** Convert a sheet row into a session object with parsed Temp data. */
  function hydrate(row, rowIndex) {
    var json = row[SESSION_COLUMNS.TEMP - 1] || '{}';
    var parsedTemp = JsonUtil.parse(json);
    return {
      _row: rowIndex,
      WhatsApp_Number: normalizePhoneNumber(row[SESSION_COLUMNS.NUMBER - 1]),
      Current_Step_Code: sanitizeInput(row[SESSION_COLUMNS.STEP - 1]),
      Flow_Type: sanitizeInput(row[SESSION_COLUMNS.FLOW - 1]),
      Region_Group: sanitizeInput(row[SESSION_COLUMNS.REGION - 1]),
      Preferred_Language: sanitizeInput(row[SESSION_COLUMNS.LANGUAGE - 1]),
      Temp_Data: json,
      Temp: parsedTemp,
      Updated_At: row[SESSION_COLUMNS.UPDATED_AT - 1] || ''
    };
  }

  /** Guarantee mandatory defaults exist before persisting. */
  function ensureDefaults(session) {
    if (!session) return null;
    session.WhatsApp_Number = normalizePhoneNumber(session.WhatsApp_Number);
    session.Region_Group = session.Region_Group || detectRegionByPhone(session.WhatsApp_Number);
    session.Preferred_Language = session.Preferred_Language
      ? LanguageEngine.sanitize(session.Preferred_Language)
      : '';
    session.Flow_Type = session.Flow_Type || '';
    session.Current_Step_Code = session.Current_Step_Code || 'LANG_SELECT';
    session.Temp = session.Temp && typeof session.Temp === 'object' ? session.Temp : {};
    return session;
  }

  /** Persist session to Sheets per the save rules. */
  function persist(session) {
    var record = ensureDefaults(session);
    if (!record) return null;
    var sheet = Sheets.sessions();
    var now = new Date();
    var json = JsonUtil.stringify(record.Temp);
    var rowValues = [
      record.WhatsApp_Number,
      record.Current_Step_Code,
      record.Flow_Type,
      record.Region_Group,
      record.Preferred_Language,
      json,
      now
    ];

    if (record._row) {
      sheet.getRange(record._row, 1, 1, SESSION_COLUMNS.COUNT).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
      record._row = sheet.getLastRow();
    }

    record.Temp_Data = json;
    record.Updated_At = now;
    return record;
  }

  /** Find a session row by phone number, respecting expiration rule. */
  function load(number) {
    var normalized = normalizePhoneNumber(number);
    if (!normalized) return null;

    var sheet = Sheets.sessions();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;

    var data = sheet.getRange(2, 1, lastRow - 1, SESSION_COLUMNS.COUNT).getValues();
    for (var i = 0; i < data.length; i++) {
      if (!data[i][SESSION_COLUMNS.NUMBER - 1]) continue;
      if (normalizePhoneNumber(data[i][SESSION_COLUMNS.NUMBER - 1]) !== normalized) continue;
      var session = hydrate(data[i], i + 2);
      if (SessionTimeout.hasExpired(session)) {
        sheet.deleteRow(session._row);
        return null;
      }
      return ensureDefaults(session);
    }
    return null;
  }

  /** Create a brand-new session row per spec template. */
  function create(number) {
    var session = ensureDefaults({
      WhatsApp_Number: number,
      Current_Step_Code: 'LANG_SELECT',
      Flow_Type: '',
      Region_Group: detectRegionByPhone(number),
      Preferred_Language: '',
      Temp: {},
      Temp_Data: '{}'
    });
    return persist(session);
  }

  /** Remove a session entirely (full reset). */
  function reset(number) {
    var normalized = normalizePhoneNumber(number);
    if (!normalized) return;
    var sheet = Sheets.sessions();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    var numbers = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < numbers.length; i++) {
      if (normalizePhoneNumber(numbers[i][0]) === normalized) {
        sheet.deleteRow(i + 2);
        return;
      }
    }
  }

  /** Convenience for bumping Updated_At without touching other fields. */
  function touch(session) {
    if (!session) return;
    session.Updated_At = new Date();
    persist(session);
  }

  return {
    load: load,
    create: create,
    save: persist,
    reset: reset,
    touch: touch,
    ensureDefaults: ensureDefaults
  };
})();

/************************************************************
 * SESSION UTILITY WRAPPERS (backward compatible names)
 ************************************************************/
function loadSession(number) { return SessionEngine.load(number); }
function newSession(number) { return SessionEngine.create(number); }
function saveSession(session) { return SessionEngine.save(session); }
function resetSession(number) { return SessionEngine.reset(number); }
function touchSessionTimestamp(session) { return SessionEngine.touch(session); }

/************************************************************
 * TEMP DATA HELPERS — ARRAYS, SINGLE VALUES, CLEARERS
 ************************************************************/
const TempData = Object.freeze({
  getAll: function(session) {
    return session && session.Temp ? session.Temp : {};
  },
  get: function(session, key) {
    var data = this.getAll(session);
    return data[key];
  },
  set: function(session, key, value, autoSave) {
    if (!session) return;
    session.Temp = session.Temp || {};
    session.Temp[key] = value;
    if (autoSave !== false) {
      saveSession(session);
    }
  },
  push: function(session, key, value, autoSave) {
    if (!session) return;
    session.Temp = session.Temp || {};
    if (!Array.isArray(session.Temp[key])) {
      session.Temp[key] = [];
    }
    session.Temp[key].push(value);
    if (autoSave !== false) {
      saveSession(session);
    }
  },
  clear: function(session, key, autoSave) {
    if (!session) return;
    session.Temp = session.Temp || {};
    if (Array.isArray(key)) {
      for (var i = 0; i < key.length; i++) {
        delete session.Temp[key[i]];
      }
    } else if (key) {
      delete session.Temp[key];
    } else {
      session.Temp = {};
    }
    if (autoSave !== false) {
      saveSession(session);
    }
  }
});

/************************************************************
 * CASE ENGINE — CREATION, ANSWERS, LOOKUPS
 ************************************************************/
const CaseEngine = Object.freeze({
  /** Generate deterministic IDs: REGION + timestamp counter. */
  generateCaseId: function(region) {
    var code = region || REGION_FALLBACK;
    return [code, Utilities.formatDate(new Date(), CONF('ISO_TIMEZONE') || 'Etc/UTC', 'yyyyMMddHHmmss')].join('-');
  },

  /** Append a brand-new case row following spec order. */
  create: function(session) {
    if (!session) throw new Error('Cannot create case without session');
    var sheet = Sheets.cases();
    var now = new Date();
    var region = session.Region_Group || detectRegionByPhone(session.WhatsApp_Number);
    var language = LanguageEngine.enforceOnSession(session);
    var flowType = session.Flow_Type || '';
    var caseId = this.generateCaseId(region);
    var row = [caseId, now, session.WhatsApp_Number, region, language, flowType];
    for (var q = 0; q < CASE_TOTAL_QUESTIONS; q++) {
      row.push('');
    }
    row.push('', '', 'Submitted');
    sheet.appendRow(row);
    return caseId;
  },

  /** Internal helper to locate a case row index and values. */
  _locate: function(caseId) {
    if (!caseId) return null;
    var sheet = Sheets.cases();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;
    var values = sheet.getRange(2, 1, lastRow - 1, CASE_COLUMNS.COUNT).getValues();
    for (var i = 0; i < values.length; i++) {
      if (values[i][CASE_COLUMNS.ID - 1] === caseId) {
        return { rowIndex: i + 2, row: values[i] };
      }
    }
    return null;
  },

  /** Persist a single question answer into the correct Q column. */
  saveAnswer: function(caseId, questionNumber, answer) {
    if (!caseId || !questionNumber) return;
    if (questionNumber < 1 || questionNumber > CASE_TOTAL_QUESTIONS) return;
    var loc = this._locate(caseId);
    if (!loc) return;
    var sheet = Sheets.cases();
    sheet.getRange(loc.rowIndex, CASE_COLUMNS.Q1 + (questionNumber - 1)).setValue(sanitizeInput(answer));
  },

  /** Bulk save answers from an ordered array (Q1..Qn). */
  saveAnswers: function(caseId, answers) {
    if (!caseId || !Array.isArray(answers)) return;
    var loc = this._locate(caseId);
    if (!loc) return;
    var sheet = Sheets.cases();
    var payload = [];
    for (var i = 0; i < CASE_TOTAL_QUESTIONS; i++) {
      payload.push(sanitizeInput(answers[i] || ''));
    }
    sheet.getRange(loc.rowIndex, CASE_COLUMNS.Q1, 1, CASE_TOTAL_QUESTIONS).setValues([payload]);
  },

  /** Append extra notes to the free-text column. */
  appendExtraNotes: function(caseId, note) {
    if (!caseId || !note) return;
    var loc = this._locate(caseId);
    if (!loc) return;
    var prev = sanitizeInput(loc.row[CASE_COLUMNS.EXTRA - 1]);
    var merged = prev ? prev + '\n' + note : note;
    Sheets.cases().getRange(loc.rowIndex, CASE_COLUMNS.EXTRA).setValue(merged);
  },

  /** Append Drive URLs to the media column (newline separated). */
  appendMediaLink: function(caseId, url) {
    if (!caseId || !url) return;
    var loc = this._locate(caseId);
    if (!loc) return;
    var prev = sanitizeInput(loc.row[CASE_COLUMNS.MEDIA - 1]);
    var merged = prev ? prev + '\n' + url : url;
    Sheets.cases().getRange(loc.rowIndex, CASE_COLUMNS.MEDIA).setValue(merged);
  },

  /** Update high-level metadata values. */
  updateMeta: function(caseId, meta) {
    if (!caseId || !meta) return;
    var loc = this._locate(caseId);
    if (!loc) return;
    var sheet = Sheets.cases();
    if (meta.region) sheet.getRange(loc.rowIndex, CASE_COLUMNS.REGION).setValue(meta.region);
    if (meta.language) sheet.getRange(loc.rowIndex, CASE_COLUMNS.LANGUAGE).setValue(meta.language);
    if (meta.flowType) sheet.getRange(loc.rowIndex, CASE_COLUMNS.FLOW).setValue(meta.flowType);
    if (meta.status) sheet.getRange(loc.rowIndex, CASE_COLUMNS.STATUS).setValue(meta.status);
  },

  /** Close a case with the provided status (default "Closed"). */
  close: function(caseId, status) {
    if (!caseId) return;
    this.updateMeta(caseId, { status: status || 'Closed' });
  },

  /** Fetch a case record as an object. */
  getById: function(caseId) {
    var loc = this._locate(caseId);
    if (!loc) return null;
    var row = loc.row;
    return {
      Case_ID: row[CASE_COLUMNS.ID - 1],
      Created_At: row[CASE_COLUMNS.CREATED_AT - 1],
      WhatsApp_Number: row[CASE_COLUMNS.WHATSAPP - 1],
      Region: row[CASE_COLUMNS.REGION - 1],
      Language: row[CASE_COLUMNS.LANGUAGE - 1],
      Flow_Type: row[CASE_COLUMNS.FLOW - 1],
      Questions: row.slice(CASE_COLUMNS.Q1 - 1, CASE_COLUMNS.Q1 - 1 + CASE_TOTAL_QUESTIONS),
      Extra_Notes: row[CASE_COLUMNS.EXTRA - 1],
      Media_Links: row[CASE_COLUMNS.MEDIA - 1],
      Case_Status: row[CASE_COLUMNS.STATUS - 1]
    };
  },

  /** Return all cases for a specific WhatsApp number. */
  listByNumber: function(number) {
    var normalized = normalizePhoneNumber(number);
    if (!normalized) return [];
    var sheet = Sheets.cases();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    var values = sheet.getRange(2, 1, lastRow - 1, CASE_COLUMNS.COUNT).getValues();
    var results = [];
    for (var i = 0; i < values.length; i++) {
      if (normalizePhoneNumber(values[i][CASE_COLUMNS.WHATSAPP - 1]) === normalized) {
        results.push({
          Case_ID: values[i][CASE_COLUMNS.ID - 1],
          Created_At: values[i][CASE_COLUMNS.CREATED_AT - 1],
          Region: values[i][CASE_COLUMNS.REGION - 1],
          Language: values[i][CASE_COLUMNS.LANGUAGE - 1],
          Flow_Type: values[i][CASE_COLUMNS.FLOW - 1],
          Case_Status: values[i][CASE_COLUMNS.STATUS - 1]
        });
      }
    }
    return results;
  }
});

/************************************************************
 * CASE UPDATE ENGINE — Case_Updates sheet automation
 ************************************************************/
const CaseUpdateEngine = Object.freeze({
  /** Generate Update_ID via UUID for uniqueness. */
  generateUpdateId: function() {
    return Utilities.getUuid();
  },

  /** Append a new update row with raw payload for audit trails. */
  create: function(caseId, type, content, mediaLinks, rawJson) {
    if (!caseId) throw new Error('CaseUpdateEngine.create requires caseId');
    var sheet = Sheets.updates();
    sheet.appendRow([
      this.generateUpdateId(),
      caseId,
      new Date(),
      type || 'NOTE',
      sanitizeInput(content || ''),
      sanitizeInput(mediaLinks || ''),
      rawJson ? JsonUtil.stringify(rawJson) : ''
    ]);
  },

  /** Convenience helper when attaching Drive URLs to updates. */
  appendMedia: function(caseId, driveUrl, rawJson) {
    this.create(caseId, 'MEDIA', driveUrl, driveUrl, rawJson || {});
  },

  /** Log status transitions into Case_Updates as audit proof. */
  logStatus: function(caseId, newStatus, note) {
    this.create(caseId, 'STATUS_CHANGE', note || newStatus, '', { status: newStatus });
    CaseEngine.updateMeta(caseId, { status: newStatus });
  }
});

/************************************************************
 * VALIDATION HELPERS — TEXT, NUMBERS, MEDIA
 ************************************************************/
const Validation = Object.freeze({
  /** Returns numeric value when within allowed range. */
  parseNumericOption: function(text, min, max) {
    var trimmed = sanitizeInput(text);
    if (!trimmed) return null;
    var num = Number(trimmed);
    if (isNaN(num)) return null;
    if (min !== undefined && num < min) return null;
    if (max !== undefined && num > max) return null;
    return num;
  },
  /** Case-insensitive yes/no detection based on simple keywords. */
  isYes: function(text) {
    var t = sanitizeInput(text).toLowerCase();
    return ['yes', 'y', '1', 'haan', 'ji', 'han', 'haa', 'ha'].indexOf(t) !== -1;
  },
  isNo: function(text) {
    var t = sanitizeInput(text).toLowerCase();
    return ['no', 'n', '0', 'nah', 'nahi', 'naa', 'na'].indexOf(t) !== -1;
  },
  /** Determine if arbitrary text is acceptable (non-empty). */
  hasText: function(text) {
    return !!sanitizeInput(text);
  },
  /** Validate mimetype per photo/video/audio restrictions. */
  isAllowedMime: function(mime, allowedList) {
    if (!mime) return false;
    var normalized = mime.toLowerCase();
    for (var i = 0; i < allowedList.length; i++) {
      if (normalized.indexOf(allowedList[i]) !== -1) return true;
    }
    return false;
  }
});

/************************************************************
 * MEDIA ENGINE — DOWNLOAD FROM WHATSAPP + UPLOAD TO DRIVE
 ************************************************************/
const MediaEngine = Object.freeze({
  /** Retrieve the binary blob for a WhatsApp media ID. */
  download: function(mediaId, mimeType) {
    if (!mediaId) return null;
    try {
      var token = CONF('WHATSAPP_TOKEN');
      var metaResponse = UrlFetchApp.fetch(CONF('WHATSAPP_API_URL') + '/' + mediaId, {
        method: 'get',
        headers: { Authorization: 'Bearer ' + token },
        muteHttpExceptions: true,
        escaping: false
      });
      var meta = JsonUtil.parse(metaResponse.getContentText());
      if (!meta.url) return null;
      var fileResponse = UrlFetchApp.fetch(meta.url, {
        method: 'get',
        headers: { Authorization: 'Bearer ' + token },
        muteHttpExceptions: true
      });
      var blob = fileResponse.getBlob();
      if (mimeType) blob.setContentType(mimeType);
      return blob;
    } catch (err) {
      Logger.log('MediaEngine.download error → ' + err);
      return null;
    }
  },

  /** Convert mime type into a safe file extension. */
  mimeToExtension: function(mimeType) {
    if (!mimeType) return 'bin';
    var mime = mimeType.toLowerCase();
    if (mime.indexOf('jpeg') !== -1 || mime.indexOf('jpg') !== -1) return 'jpg';
    if (mime.indexOf('png') !== -1) return 'png';
    if (mime.indexOf('gif') !== -1) return 'gif';
    if (mime.indexOf('mp4') !== -1) return 'mp4';
    if (mime.indexOf('mov') !== -1) return 'mov';
    if (mime.indexOf('pdf') !== -1) return 'pdf';
    if (mime.indexOf('mp3') !== -1) return 'mp3';
    if (mime.indexOf('ogg') !== -1) return 'ogg';
    if (mime.indexOf('wav') !== -1) return 'wav';
    if (mime.indexOf('aac') !== -1) return 'aac';
    return 'bin';
  },

  /** Persist blob into the configured Drive folder. */
  uploadToDrive: function(blob, caseId) {
    if (!blob) return null;
    try {
      var folder = DriveApp.getFolderById(CONF('MEDIA_FOLDER_ID'));
      var extension = this.mimeToExtension(blob.getContentType());
      var filename = (caseId || 'media') + '_' + Date.now() + '.' + extension;
      var file = folder.createFile(blob.setName(filename));
      return { url: file.getUrl(), id: file.getId(), name: filename };
    } catch (err) {
      Logger.log('MediaEngine.upload error → ' + err);
      return null;
    }
  },

  /** Complete pipeline: download → Drive upload → sheet linkage. */
  saveWhatsAppMedia: function(session, caseId, mediaId, mimeType, rawJson) {
    var blob = this.download(mediaId, mimeType);
    if (!blob) return '';
    var uploaded = this.uploadToDrive(blob, caseId);
    if (!uploaded || !uploaded.url) return '';
    if (caseId) {
      CaseEngine.appendMediaLink(caseId, uploaded.url);
      CaseUpdateEngine.appendMedia(caseId, uploaded.url, rawJson || {});
    }
    if (session) {
      TempData.push(session, 'media_list', uploaded.id);
    }
    return uploaded.url;
  }
});

/** Backwards-compatible free functions for legacy references. */
function downloadWhatsAppMedia(mediaId, mimeType) { return MediaEngine.download(mediaId, mimeType); }
function uploadToDrive(blob, caseId) {
  var uploaded = MediaEngine.uploadToDrive(blob, caseId);
  return uploaded && uploaded.url ? uploaded.url : '';
}
function saveMediaToCase(caseId, mediaId, mimeType, rawJson) {
  return MediaEngine.saveWhatsAppMedia(null, caseId, mediaId, mimeType, rawJson);
}

/************************************************************
 * CASE + SESSION LOOKUP SHORTCUTS FOR FLOWS
 ************************************************************/
function getExistingCasesByNumber(number) { return CaseEngine.listByNumber(number); }
function getCaseById(caseId) { return CaseEngine.getById(caseId); }

/************************************************************
 * CASE UPDATE SHORTCUTS
 ************************************************************/
function createCaseUpdate(caseId, type, content, mediaLinks, rawJson) {
  return CaseUpdateEngine.create(caseId, type, content, mediaLinks, rawJson);
}
function appendCaseUpdateMedia(caseId, mediaUrl, rawJson) {
  return CaseUpdateEngine.appendMedia(caseId, mediaUrl, rawJson);
}

/************************************************************
 * SESSION TIMEOUT + VALIDATION EXPORTS
 ************************************************************/
function checkSessionTimeout(session) {
  return SessionTimeout.hasExpired(session);
}

function ensurePreferredLanguage(session) {
  return LanguageEngine.enforceOnSession(session);
}

/************************************************************
 * LEGACY NO-OP HELPERS (kept for compatibility with older files)
 ************************************************************/
function safeJsonStringify(obj) { return JsonUtil.stringify(obj); }
function safeJsonParse(str) { return JsonUtil.parse(str); }
function toJsonString(obj) { return JsonUtil.stringify(obj); }
function parseJson(str) { return JsonUtil.parse(str); }
function extractMediaUrl(msg) {
  if (!msg) return null;
  if (msg.image && msg.image.id) return msg.image.id;
  if (msg.document && msg.document.id) return msg.document.id;
  if (msg.audio && msg.audio.id) return msg.audio.id;
  if (msg.video && msg.video.id) return msg.video.id;
  return null;
}
function normalizeNumber(num) { return normalizePhoneNumber(num); }
function safeSet(sheet, row, col, value) {
  try {
    sheet.getRange(row, col).setValue(value);
  } catch (err) {
    Logger.log('safeSet error → ' + err);
  }
}
function safeAppend(sheet, values) {
  try {
    sheet.appendRow(values);
  } catch (err) {
    Logger.log('safeAppend error → ' + err);
  }
}
