/************************************************************
 * Code.gs — WhatsApp webhook entrypoint & dispatcher
 * --------------------------------------------------
 * Responsibilities:
 *   • Expose doGet/doPost for Google Apps Script web app
 *   • Complete webhook verification handshake with Meta
 *   • Parse WhatsApp Cloud API payloads into normalized events
 *   • Load/manage chat sessions and invoke Flows.routeMessage()
 *   • Send outbound messages via WhatsApp Graph API
 ************************************************************/

/************************************************************
 * APPS SCRIPT ENTRYPOINTS
 ************************************************************/
/**
 * Webhook verification (GET) — Meta calls this when saving the URL.
 */
function doGet(e) {
  return WebhookHandler.verify(e);
}

/**
 * WhatsApp webhook (POST) — Processes inbound user messages.
 */
function doPost(e) {
  return WebhookHandler.handle(e);
}

/************************************************************
 * WEBHOOK HANDLER MODULE
 ************************************************************/
const WebhookHandler = (function() {
  /** Convenience helper for Meta's verification handshake. */
  function verify(e) {
    const params = (e && e.parameter) || {};
    const mode = params['hub.mode'];
    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];

    if (mode === 'subscribe' && token === CONF('VERIFY_TOKEN')) {
      return ContentService.createTextOutput(challenge || '');
    }

    return ContentService.createTextOutput('VERIFICATION_FAILED');
  }

  /** Primary webhook processor for POST requests. */
  function handle(e) {
    const ack = ContentService.createTextOutput('EVENT_RECEIVED');

    try {
      const rawBody = e && e.postData && e.postData.contents;
      if (!rawBody) {
        return ack;
      }

      const payload = parseJson(rawBody);
      const events = WebhookParser.extractMessages(payload);

      if (!events.length) {
        WebhookParser.logStatuses(payload);
        return ack;
      }

      events.forEach(function(event) {
        try {
          processEvent(event);
        } catch (err) {
          Logger.log('Webhook event failure → ' + err);
        }
      });

      return ack;
    } catch (err) {
      Logger.log('Webhook handler error → ' + err);
      return ack;
    }
  }

  /** Individual message processor — loads session + dispatches. */
  function processEvent(event) {
    const userNumber = normalizePhoneNumber(event.from);
    if (!userNumber) {
      return;
    }

    let session = loadSession(userNumber);
    let isNewSession = false;

    if (!session) {
      session = newSession(userNumber);
      isNewSession = true;
    }

    session.WhatsApp_Number = userNumber;
    ensurePreferredLanguage(session);

    const incomingText = sanitizeInput(event.text || event.caption || '');

    if (isResetCommand(incomingText)) {
      resetSession(userNumber);
      const fresh = newSession(userNumber);
      Texts.send(userNumber, Texts.sendLanguageMenu(fresh));
      return;
    }

    if (isNewSession) {
      Texts.send(userNumber, Texts.sendLanguageMenu(session));
      return;
    }

    const reply = Flows.routeMessage(
      session,
      incomingText,
      event.raw,
      event.mediaId,
      event.mediaMime
    );

    if (reply) {
      sendWhatsAppMessage(userNumber, reply);
    }
  }

  return { verify: verify, handle: handle };
})();

/************************************************************
 * WEBHOOK PARSER — NORMALIZES WHATSAPP EVENTS
 ************************************************************/
const WebhookParser = (function() {
  /** Flatten entry → changes → messages into a simple list. */
  function extractMessages(payload) {
    const messages = [];
    if (!payload || !payload.entry) {
      return messages;
    }

    payload.entry.forEach(function(entry) {
      (entry.changes || []).forEach(function(change) {
        const value = change.value || {};
        const waMessages = value.messages || [];

        waMessages.forEach(function(message) {
          const normalized = normalizeMessage(message);
          if (normalized) {
            messages.push(normalized);
          }
        });
      });
    });

    return messages;
  }

  /** Extract statuses for logging/diagnostics. */
  function logStatuses(payload) {
    try {
      if (!payload || !payload.entry) {
        return;
      }
      payload.entry.forEach(function(entry) {
        (entry.changes || []).forEach(function(change) {
          const statuses = (change.value && change.value.statuses) || [];
          statuses.forEach(function(status) {
            Logger.log('WhatsApp status event → ' + JSON.stringify(status));
          });
        });
      });
    } catch (err) {
      Logger.log('Status log failure → ' + err);
    }
  }

  /** Convert a WhatsApp message into a normalized structure. */
  function normalizeMessage(message) {
    if (!message || !message.from) {
      return null;
    }

    const base = {
      id: message.id || '',
      from: message.from || '',
      timestamp: Number(message.timestamp || 0),
      type: message.type || '',
      text: '',
      caption: '',
      mediaId: '',
      mediaMime: '',
      location: null,
      raw: message
    };

    const type = message.type;

    if (type === 'text') {
      base.text = sanitizeInput(message.text && message.text.body);
    } else if (type === 'interactive') {
      const interactive = message.interactive || {};
      if (interactive.type === 'button_reply') {
        base.text = sanitizeInput(
          interactive.button_reply && (interactive.button_reply.id || interactive.button_reply.title)
        );
      } else if (interactive.type === 'list_reply') {
        base.text = sanitizeInput(
          interactive.list_reply && (interactive.list_reply.id || interactive.list_reply.title)
        );
      }
    } else if (type === 'button') {
      base.text = sanitizeInput(message.button && (message.button.payload || message.button.text));
    } else if (type === 'location') {
      base.location = parseLocation(message);
      if (base.location) {
        base.text = [base.location.latitude, base.location.longitude].join(',');
      }
    } else {
      // Media types: image, video, audio, document, sticker, etc.
      const mediaKey = message[type];
      if (mediaKey) {
        base.mediaId = mediaKey.id || '';
        base.mediaMime = mediaKey.mime_type || '';
        base.caption = sanitizeInput(mediaKey.caption || mediaKey.filename || '');
        base.text = base.caption;
      }
    }

    return base;
  }

  return { extractMessages: extractMessages, logStatuses: logStatuses };
})();

/************************************************************
 * WHATSAPP API CLIENT — OUTBOUND TEXT MESSAGES
 ************************************************************/
const WhatsAppApi = (function() {
  const baseUrl = (CONF('WHATSAPP_API_URL') || 'https://graph.facebook.com/v20.0').replace(/\/$/, '');
  const phoneId = CONF('PHONE_ID') || CONF('WHATSAPP_PHONE_NUMBER_ID');
  const token = CONF('WHATSAPP_TOKEN');
  const timeout = Number(CONF('API_TIMEOUT_MS')) || 30000;
  const maxRetries = Number(CONF('MAX_API_RETRIES')) || 3;

  function endpoint(path) {
    return baseUrl + '/' + path.replace(/^\//, '');
  }

  function request(payload) {
    if (!token || !phoneId) {
      throw new Error('WhatsApp API credentials missing.');
    }

    const url = endpoint(phoneId + '/messages');
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      escaping: false,
      followRedirects: true,
      timeout: timeout
    };

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        UrlFetchApp.fetch(url, options);
        return;
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) {
          throw err;
        }
        Utilities.sleep(500 * attempt);
      }
    }
  }

  function sendText(to, body) {
    if (!to || !body) {
      return;
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: body }
    };

    request(payload);
  }

  return { sendText: sendText };
})();

/** Public helper used across Text modules and flows. */
function sendWhatsAppMessage(number, text) {
  try {
    WhatsAppApi.sendText(number, text);
  } catch (err) {
    Logger.log('sendWhatsAppMessage error → ' + err);
  }
}

/************************************************************
 * SESSION SHORTHANDS — REQUIRED BY FLOWS ROUTER
 ************************************************************/
const Session = {
  load: loadSession,
  save: saveSession,
  create: newSession,
  delete: resetSession,
  touch: touchSessionTimestamp
};

/************************************************************
 * MISC HELPERS
 ************************************************************/
function isResetCommand(text) {
  return sanitizeInput(text).toUpperCase() === 'RESET';
}
