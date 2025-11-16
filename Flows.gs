/************************************************************
 * Flows.gs — State-machine router for the WhatsApp bot
 * ----------------------------------------------------
 * Responsibilities:
 *   • Guarantee every conversation follows the exact order
 *     defined in “Full n Final Flow Updated.txt”
 *   • Coordinate language selection, user type routing,
 *     eligibility screening, rejection handling, and the
 *     master Q1–Q16 sequences for flows A, B, and C
 *   • Power the existing-case & case-update experiences so a
 *     phone number can review, update, or close active cases
 *   • Orchestrate all confirmations, region/language safety,
 *     and media-handling triggers described in the spec
 ************************************************************/

/************************************************************
 * STEP CODE CONSTANTS — keeps comparisons typo-safe
 ************************************************************/
const STEP_CODES = Object.freeze({
  LANG: 'LANG_SELECT',
  USER_TYPE: 'USER_TYPE',
  A_ELIGIBILITY: 'A_ELIGIBILITY',
  A_REJECTED: 'A_ELIGIBILITY_REJECTED',
  EXISTING_SELECT: 'EXISTING_CASE_SELECT',
  EXISTING_MENU: 'EXISTING_CASE_MENU',
  EXISTING_REVIEW: 'EXISTING_CASE_REVIEW',
  CASE_UPDATE_MENU: 'CASE_UPDATE_MENU',
  CASE_UPDATE_INFO: 'CASE_UPDATE_INFO'
});

/************************************************************
 * TOP-LEVEL FLOWS OBJECT — entry point from Code.gs
 ************************************************************/
const Flows = {

  /**
   * routeMessage — master dispatcher invoked by Code.gs
   * @param {Object} session  — hydrated session record
   * @param {String} msg      — plain text message body
   * @param {Object} rawEvent — full WhatsApp event (for audits)
   * @param {String} mediaId  — WhatsApp media ID (if any)
   * @param {String} mediaMime— Media mimetype for Drive uploads
   */
  routeMessage(session, msg, rawEvent, mediaId, mediaMime) {
    if (!session) {
      return '';
    }

    session.Temp = session.Temp || {};
    session.Region_Group = session.Region_Group || detectRegionByPhone(session.WhatsApp_Number);
    LanguageEngine.enforceOnSession(session);

    let currentStep = session.Current_Step_Code || STEP_CODES.LANG;
    const trimmed = (msg || '').trim();

    // Always ensure we hold a valid step for persistence safety.
    if (!session.Current_Step_Code) {
      session.Current_Step_Code = currentStep;
      Session.save(session);
    }

    // Step 0: force the language menu until the user picks one.
    if (currentStep === STEP_CODES.LANG) {
      return this.handleLanguageSelection(session, trimmed);
    }

    if (!session.Preferred_Language) {
      session.Current_Step_Code = STEP_CODES.LANG;
      Session.save(session);
      return Texts.sendLanguageMenu(session);
    }

    // Existing-case detection only runs once per session.
    const existingIntercept = ExistingCaseFlow.interceptIfNeeded(session);
    if (existingIntercept) {
      return existingIntercept;
    }

    // Dedicated handlers for existing-case + update flows.
    if (ExistingCaseFlow.handlesStep(currentStep)) {
      return ExistingCaseFlow.handle(session, currentStep, trimmed, rawEvent, mediaId, mediaMime);
    }

    if (currentStep === STEP_CODES.CASE_UPDATE_MENU || currentStep === STEP_CODES.CASE_UPDATE_INFO) {
      return CaseUpdateFlow.handle(session, trimmed, mediaId, mediaMime, rawEvent);
    }

    // Root menus + Flow-specific routers.
    if (currentStep === STEP_CODES.USER_TYPE) {
      return this.handleUserType(session, trimmed);
    }

    if (currentStep === STEP_CODES.A_ELIGIBILITY) {
      return this.handleEligibilityA(session, trimmed);
    }

    if (currentStep === STEP_CODES.A_REJECTED) {
      return this.handleRejectedA(session, trimmed);
    }

    if (/^A_/.test(currentStep)) {
      return FlowA.handle(session, trimmed, mediaId, mediaMime, rawEvent);
    }

    if (/^B_/.test(currentStep)) {
      return FlowB.handle(session, trimmed, mediaId, mediaMime, rawEvent);
    }

    if (/^C_/.test(currentStep)) {
      return FlowC.handle(session, trimmed, mediaId, mediaMime, rawEvent);
    }

    return Texts.sendInvalidOption(session);
  },

  /**********************************************************
   * LANGUAGE SELECTION — Step 1 per spec
   **********************************************************/
  handleLanguageSelection(session, msg) {
    const selected = Texts.mapLanguageChoice(session.Region_Group, msg);
    if (!selected) {
      return [
        Texts.sendInvalidOption(session),
        Texts.sendLanguageMenu(session)
      ].join('\n\n');
    }

    session.Preferred_Language = selected;
    session.Current_Step_Code = STEP_CODES.USER_TYPE;
    Session.save(session);

    return Texts.sendUserTypeMenu(session);
  },

  /**********************************************************
   * USER TYPE MENU — Step 2 from spec
   **********************************************************/
  handleUserType(session, msg) {
    if (msg === '1') {
      session.Flow_Type = 'A';
      session.Current_Step_Code = STEP_CODES.A_ELIGIBILITY;
      Session.save(session);
      return Texts_Eligibility.sendEligibilityQuestion(session);
    }

    if (msg === '2') {
      session.Flow_Type = 'B';
      Session.save(session);
      return FlowB.start(session);
    }

    if (msg === '3') {
      session.Flow_Type = 'C';
      Session.save(session);
      return FlowC.start(session);
    }

    return [
      Texts.sendInvalidOption(session),
      Texts.sendUserTypeMenu(session)
    ].join('\n\n');
  },

  /**********************************************************
   * FLOW A ELIGIBILITY SCREEN — Police/agency filter
   **********************************************************/
  handleEligibilityA(session, msg) {
    const normalized = (msg || '').trim();

    if (normalized === '2') {
      session.Current_Step_Code = 'A_Q1';
      Session.save(session);
      return FlowA.start(session);
    }

    if (normalized === '1') {
      session.Current_Step_Code = STEP_CODES.A_REJECTED;
      Session.save(session);
      return [
        Texts_Eligibility.sendEligibilityRejection(session),
        Texts.sendEligibilityRejected(session)
      ].join('\n\n');
    }

    return [
      Texts.sendInvalidOption(session),
      Texts_Eligibility.sendEligibilityQuestion(session)
    ].join('\n\n');
  },

  /**********************************************************
   * FLOW A REJECTION HANDLER — restart or close
   **********************************************************/
  handleRejectedA(session, msg) {
    if (msg === '1') {
      session.Flow_Type = '';
      session.Current_Step_Code = STEP_CODES.USER_TYPE;
      Session.save(session);
      return Texts.sendUserTypeMenu(session);
    }

    if (msg === '2') {
      const closing = Texts.closingAfterRejection(session);
      Session.delete(session.WhatsApp_Number);
      return closing;
    }

    return Texts.sendInvalidOption(session);
  }
};

/************************************************************
 * FLOW A — Missing loved one (questions Q1–Q9)
 ************************************************************/
const FlowA = {
  start(session) {
    session.Temp = session.Temp || {};
    session.Flow_Type = 'A';

    const caseId = FlowStorage.ensureCase(session);
    session.Temp.caseID = caseId;
    session.Temp.flow = 'A';

    session.Current_Step_Code = 'A_Q1';
    Session.save(session);
    return Texts_A.sendQ1(session);
  },

  handle(session, msg, mediaId, mediaMime, rawEvent) {
    const step = session.Current_Step_Code;
    const caseId = FlowStorage.ensureCase(session);

    switch (step) {
      case 'A_Q1':
        FlowStorage.saveAnswer(caseId, 1, msg);
        return this.next(session, 'A_Q2', Texts_A.sendQ2);

      case 'A_Q2':
        if (mediaId && !msg) {
          return Texts_A.sendQ2(session);
        }
        FlowStorage.saveAnswer(caseId, 2, msg);
        return this.next(session, 'A_Q3', Texts_A.sendQ3);

      case 'A_Q3':
        if (isNaN(Number(msg))) {
          return Texts_A.sendInvalidAge(session);
        }
        FlowStorage.saveAnswer(caseId, 3, msg);
        return this.next(session, 'A_Q4', Texts_A.sendQ4);

      case 'A_Q4':
        FlowStorage.saveAnswer(caseId, 4, msg);
        return this.next(session, 'A_Q5', Texts_A.sendQ5);

      case 'A_Q5':
        FlowStorage.saveAnswer(caseId, 5, msg);
        return this.next(session, 'A_Q6', Texts_A.sendQ6);

      case 'A_Q6':
        FlowStorage.saveAnswer(caseId, 6, msg);
        return this.next(session, 'A_Q7', Texts_A.sendQ7);

      case 'A_Q7':
        FlowStorage.saveAnswer(caseId, 7, msg);
        return this.next(session, 'A_Q8', Texts_A.sendQ8);

      case 'A_Q8':
        FlowStorage.saveAnswer(caseId, 8, msg);
        return this.next(session, 'A_Q9', Texts_A.sendQ9);

      case 'A_Q9':
        FlowStorage.saveAnswer(caseId, 9, msg);
        return FlowFinalizer.finish(session, caseId);
    }

    return Texts.sendInvalidOption(session);
  },

  next(session, nextCode, promptFn) {
    session.Current_Step_Code = nextCode;
    Session.save(session);
    return promptFn(session);
  }
};

/************************************************************
 * FLOW B — User is the missing person (Q1–Q11)
 ************************************************************/
const FlowB = {
  start(session) {
    session.Temp = session.Temp || {};
    session.Flow_Type = 'B';

    const caseId = FlowStorage.ensureCase(session);
    session.Temp.caseID = caseId;
    session.Temp.flow = 'B';

    session.Current_Step_Code = 'B_Q1';
    Session.save(session);
    return Texts_B.sendQ1(session);
  },

  handle(session, msg, mediaId, mediaMime, rawEvent) {
    const step = session.Current_Step_Code;
    const caseId = FlowStorage.ensureCase(session);

    switch (step) {
      case 'B_Q1':
        FlowStorage.saveAnswer(caseId, 1, msg);
        return this.next(session, 'B_Q2', Texts_B.sendQ2);

      case 'B_Q2':
        FlowStorage.saveAnswer(caseId, 2, msg);
        return this.next(session, 'B_Q3', Texts_B.sendQ3);

      case 'B_Q3':
        if (mediaId && !msg) {
          return Texts_B.sendQ3(session);
        }
        FlowStorage.saveAnswer(caseId, 3, msg);
        return this.next(session, 'B_Q4', Texts_B.sendQ4);

      case 'B_Q4':
        FlowStorage.saveAnswer(caseId, 4, msg);
        return this.next(session, 'B_Q5', Texts_B.sendQ5);

      case 'B_Q5':
        FlowStorage.saveAnswer(caseId, 5, msg);
        return this.next(session, 'B_Q6', Texts_B.sendQ6);

      case 'B_Q6':
        FlowStorage.saveAnswer(caseId, 6, msg);
        return this.next(session, 'B_Q7', Texts_B.sendQ7);

      case 'B_Q7':
        FlowStorage.saveAnswer(caseId, 7, msg);
        return this.next(session, 'B_Q8', Texts_B.sendQ8);

      case 'B_Q8':
        FlowStorage.saveAnswer(caseId, 8, msg);
        return this.next(session, 'B_Q9', Texts_B.sendQ9);

      case 'B_Q9':
        FlowStorage.saveAnswer(caseId, 9, msg);
        return this.next(session, 'B_Q10', Texts_B.sendQ10);

      case 'B_Q10':
        FlowStorage.saveAnswer(caseId, 10, msg);
        return this.next(session, 'B_Q11', Texts_B.sendQ11);

      case 'B_Q11':
        if (mediaId) {
          FlowStorage.saveMedia(session, caseId, mediaId, mediaMime, rawEvent);
        } else {
          FlowStorage.saveAnswer(caseId, 11, msg);
        }
        return FlowFinalizer.finish(session, caseId);
    }

    return Texts.sendInvalidOption(session);
  },

  next(session, nextCode, promptFn) {
    session.Current_Step_Code = nextCode;
    Session.save(session);
    return promptFn(session);
  }
};

/************************************************************
 * FLOW C — User knows a missing person (Q0 + Q1–Q15)
 ************************************************************/
const FlowC = {
  start(session) {
    session.Temp = session.Temp || {};
    session.Flow_Type = 'C';

    const caseId = FlowStorage.ensureCase(session);
    session.Temp.caseID = caseId;
    session.Temp.flow = 'C';

    session.Current_Step_Code = 'C_Q0';
    Session.save(session);

    return [Texts_C.sendIntro(session), Texts_C.sendQ0(session)].join('\n\n');
  },

  handle(session, msg, mediaId, mediaMime, rawEvent) {
    const step = session.Current_Step_Code;
    const caseId = FlowStorage.ensureCase(session);

    switch (step) {
      case 'C_Q0':
        if (msg === '2') {
          return FlowFinalizer.rejectNoAccess(session);
        }
        if (msg !== '1' && msg !== '3') {
          return Texts.sendInvalidOption(session);
        }
        FlowStorage.saveAnswer(caseId, 1, msg);
        return this.next(session, 'C_Q1', Texts_C.sendQ1);

      case 'C_Q1':
        if (mediaId && !msg) {
          return Texts_C.sendQ1(session);
        }
        FlowStorage.saveAnswer(caseId, 2, msg);
        return this.next(session, 'C_Q2', Texts_C.sendQ2);

      case 'C_Q2':
        FlowStorage.saveAnswer(caseId, 3, msg);
        return this.next(session, 'C_Q3', Texts_C.sendQ3);

      case 'C_Q3':
        FlowStorage.saveAnswer(caseId, 4, msg);
        return this.next(session, 'C_Q4', Texts_C.sendQ4);

      case 'C_Q4':
        FlowStorage.saveAnswer(caseId, 5, msg);
        return this.next(session, 'C_Q5', Texts_C.sendQ5);

      case 'C_Q5':
        FlowStorage.saveAnswer(caseId, 6, msg);
        return this.next(session, 'C_Q6', Texts_C.sendQ6);

      case 'C_Q6':
        FlowStorage.saveAnswer(caseId, 7, msg);
        return this.next(session, 'C_Q7', Texts_C.sendQ7);

      case 'C_Q7':
        FlowStorage.saveAnswer(caseId, 8, msg);
        return this.next(session, 'C_Q8', Texts_C.sendQ8);

      case 'C_Q8':
        FlowStorage.saveAnswer(caseId, 9, msg);
        return this.next(session, 'C_Q9', Texts_C.sendQ9);

      case 'C_Q9':
        FlowStorage.saveAnswer(caseId, 10, msg);
        return this.next(session, 'C_Q10', Texts_C.sendQ10);

      case 'C_Q10':
        FlowStorage.saveAnswer(caseId, 11, msg);
        return this.next(session, 'C_Q11', Texts_C.sendQ11);

      case 'C_Q11':
        FlowStorage.saveAnswer(caseId, 12, msg);
        return this.next(session, 'C_Q12', Texts_C.sendQ12);

      case 'C_Q12':
        FlowStorage.saveAnswer(caseId, 13, msg);
        return this.next(session, 'C_Q13', Texts_C.sendQ13);

      case 'C_Q13':
        FlowStorage.saveAnswer(caseId, 14, msg);
        return this.next(session, 'C_Q14', Texts_C.sendQ14);

      case 'C_Q14':
        FlowStorage.saveAnswer(caseId, 15, msg);
        return this.next(session, 'C_Q15', Texts_C.sendQ15);

      case 'C_Q15':
        if (mediaId) {
          FlowStorage.saveMedia(session, caseId, mediaId, mediaMime, rawEvent);
        } else {
          FlowStorage.saveAnswer(caseId, 16, msg);
        }
        return FlowFinalizer.finish(session, caseId);
    }

    return Texts.sendInvalidOption(session);
  },

  next(session, code, promptFn) {
    session.Current_Step_Code = code;
    Session.save(session);
    return promptFn(session);
  }
};

/************************************************************
 * EXISTING CASE FLOW — auto-detect + menu handlers
 ************************************************************/
const ExistingCaseFlow = {
  /**
   * Runs once per session to see if the number already has cases.
   * Returns the menu body when we need to interrupt the main flow.
   */
  interceptIfNeeded(session) {
    if (!session || session.Current_Step_Code !== STEP_CODES.USER_TYPE) {
      return '';
    }

    if (session.Temp && session.Temp.skipExistingCheck) {
      return '';
    }

    if (session.Temp && session.Temp.existingChecked) {
      return '';
    }

    const cases = CaseEngine.listByNumber(session.WhatsApp_Number);
    if (!cases.length) {
      session.Temp.existingChecked = true;
      Session.save(session);
      return '';
    }

    session.Temp.existingChecked = true;
    session.Temp.caseList = cases.map(function(record) { return record.Case_ID; });
    session.Temp.lastCaseID = cases[cases.length - 1].Case_ID;

    if (cases.length === 1) {
      session.Temp.caseID = session.Temp.lastCaseID;
      session.Current_Step_Code = STEP_CODES.EXISTING_MENU;
      Session.save(session);
      return Texts_ExistingCases.sendExistingCaseMenu(session, session.Temp.caseID);
    }

    session.Current_Step_Code = STEP_CODES.EXISTING_SELECT;
    Session.save(session);
    return Texts_ExistingCases.sendMultipleCasesMenu(session, session.Temp.caseList.join('\n'));
  },

  handlesStep(step) {
    return step === STEP_CODES.EXISTING_SELECT
      || step === STEP_CODES.EXISTING_MENU
      || step === STEP_CODES.EXISTING_REVIEW;
  },

  handle(session, step, msg, rawEvent, mediaId, mediaMime) {
    if (step === STEP_CODES.EXISTING_SELECT) {
      return this.handleCaseSelection(session, msg);
    }
    if (step === STEP_CODES.EXISTING_MENU) {
      return this.handleMenu(session, msg);
    }
    if (step === STEP_CODES.EXISTING_REVIEW) {
      return this.handleReview(session, msg, mediaId, mediaMime, rawEvent);
    }
    return Texts.sendInvalidOption(session);
  },

  handleCaseSelection(session, msg) {
    const trimmed = (msg || '').trim();
    const upper = trimmed.toUpperCase();

    if (!trimmed) {
      return Texts_ExistingCases.sendMultipleCasesMenu(session, (session.Temp.caseList || []).join('\n'));
    }

    if (trimmed === '0' || upper === 'BACK') {
      session.Current_Step_Code = STEP_CODES.USER_TYPE;
      Session.save(session);
      return Texts.sendUserTypeMenu(session);
    }

    const allowed = session.Temp.caseList || [];
    if (allowed.indexOf(trimmed) === -1) {
      return Texts.sendInvalidCaseID(session) + '\n\n' + Texts_ExistingCases.sendMultipleCasesMenu(session, allowed.join('\n'));
    }

    session.Temp.caseID = trimmed;
    session.Temp.lastCaseID = trimmed;
    session.Current_Step_Code = STEP_CODES.EXISTING_MENU;
    Session.save(session);
    return Texts_ExistingCases.sendExistingCaseMenu(session, trimmed);
  },

  handleMenu(session, msg) {
    const caseId = session.Temp.caseID || session.Temp.lastCaseID;
    if (!caseId) {
      session.Current_Step_Code = STEP_CODES.USER_TYPE;
      Session.save(session);
      return Texts.sendUserTypeMenu(session);
    }

    switch ((msg || '').trim()) {
      case '1':
        session.Current_Step_Code = STEP_CODES.EXISTING_REVIEW;
        Session.save(session);
        return Texts_ExistingCases.sendCaseDetails(session, caseId, this.formatCaseDetails(session, caseId));

      case '2':
        return [
          Texts_ExistingCases.sendCaseStatus(session, caseId, this.lookupCase(caseId)?.Case_Status || 'Submitted'),
          Texts_ExistingCases.sendExistingCaseMenu(session, caseId)
        ].join('\n\n');

      case '3':
        session.Temp.skipExistingCheck = true;
        session.Temp.caseID = undefined;
        session.Flow_Type = '';
        session.Current_Step_Code = STEP_CODES.USER_TYPE;
        Session.save(session);
        return [
          Texts_ExistingCases.sendNewCaseStart(session),
          Texts.sendUserTypeMenu(session)
        ].join('\n\n');

      case '4':
        session.Temp.updateCaseID = caseId;
        session.Current_Step_Code = STEP_CODES.CASE_UPDATE_MENU;
        Session.save(session);
        return Texts_CaseUpdates.sendUpdateMenu(session, caseId);

      default:
        return [
          Texts.sendInvalidOption(session),
          Texts_ExistingCases.sendExistingCaseMenu(session, caseId)
        ].join('\n\n');
    }
  },

  handleReview(session, msg, mediaId, mediaMime, rawEvent) {
    const caseId = session.Temp.caseID || session.Temp.lastCaseID;
    if (!caseId) {
      session.Current_Step_Code = STEP_CODES.USER_TYPE;
      Session.save(session);
      return Texts.sendUserTypeMenu(session);
    }

    const trimmed = (msg || '').trim();
    const upper = trimmed.toUpperCase();

    if (!trimmed && !mediaId) {
      return Texts_ExistingCases.sendCaseDetails(session, caseId, this.formatCaseDetails(session, caseId));
    }

    if (trimmed === '0' || upper === 'BACK') {
      session.Current_Step_Code = STEP_CODES.EXISTING_MENU;
      Session.save(session);
      return Texts_ExistingCases.sendExistingCaseMenu(session, caseId);
    }

    if (mediaId) {
      FlowStorage.saveMedia(session, caseId, mediaId, mediaMime, rawEvent);
      session.Current_Step_Code = STEP_CODES.EXISTING_MENU;
      Session.save(session);
      return [
        Texts_CaseUpdates.confirmNewInfoAdded(session),
        Texts_ExistingCases.sendExistingCaseMenu(session, caseId)
      ].join('\n\n');
    }

    if (trimmed) {
      CaseEngine.appendExtraNotes(caseId, trimmed);
      CaseUpdateEngine.create(caseId, 'UPDATE_TEXT', trimmed, '', rawEvent || {});
      session.Current_Step_Code = STEP_CODES.EXISTING_MENU;
      Session.save(session);
      return [
        Texts_CaseUpdates.confirmNewInfoAdded(session),
        Texts_ExistingCases.sendExistingCaseMenu(session, caseId)
      ].join('\n\n');
    }

    return Texts_ExistingCases.sendCaseDetails(session, caseId, this.formatCaseDetails(session, caseId));
  },

  lookupCase(caseId) {
    return CaseEngine.getById(caseId);
  },

  formatCaseDetails(session, caseId) {
    const record = this.lookupCase(caseId);
    if (!record) {
      return '';
    }

    const answers = record.Questions || [];
    const prompts = this.getPromptProviders(record.Flow_Type || '');
    const reviewSession = Object.assign({}, session, { Preferred_Language: record.Language || session.Preferred_Language });

    const lines = [];
    for (var i = 0; i < answers.length; i++) {
      const answer = (answers[i] || '').toString().trim();
      if (!answer) continue;
      const promptFn = prompts[i];
      const prompt = promptFn ? promptFn(reviewSession) : 'Q' + (i + 1);
      lines.push(prompt + '\n' + answer);
    }

    return lines.join('\n\n');
  },

  getPromptProviders(flowType) {
    const map = {
      A: [
        function(s) { return Texts_A.sendQ1(s); },
        function(s) { return Texts_A.sendQ2(s); },
        function(s) { return Texts_A.sendQ3(s); },
        function(s) { return Texts_A.sendQ4(s); },
        function(s) { return Texts_A.sendQ5(s); },
        function(s) { return Texts_A.sendQ6(s); },
        function(s) { return Texts_A.sendQ7(s); },
        function(s) { return Texts_A.sendQ8(s); },
        function(s) { return Texts_A.sendQ9(s); }
      ],
      B: [
        function(s) { return Texts_B.sendQ1(s); },
        function(s) { return Texts_B.sendQ2(s); },
        function(s) { return Texts_B.sendQ3(s); },
        function(s) { return Texts_B.sendQ4(s); },
        function(s) { return Texts_B.sendQ5(s); },
        function(s) { return Texts_B.sendQ6(s); },
        function(s) { return Texts_B.sendQ7(s); },
        function(s) { return Texts_B.sendQ8(s); },
        function(s) { return Texts_B.sendQ9(s); },
        function(s) { return Texts_B.sendQ10(s); },
        function(s) { return Texts_B.sendQ11(s); }
      ],
      C: [
        function(s) { return Texts_C.sendQ0(s); },
        function(s) { return Texts_C.sendQ1(s); },
        function(s) { return Texts_C.sendQ2(s); },
        function(s) { return Texts_C.sendQ3(s); },
        function(s) { return Texts_C.sendQ4(s); },
        function(s) { return Texts_C.sendQ5(s); },
        function(s) { return Texts_C.sendQ6(s); },
        function(s) { return Texts_C.sendQ7(s); },
        function(s) { return Texts_C.sendQ8(s); },
        function(s) { return Texts_C.sendQ9(s); },
        function(s) { return Texts_C.sendQ10(s); },
        function(s) { return Texts_C.sendQ11(s); },
        function(s) { return Texts_C.sendQ12(s); },
        function(s) { return Texts_C.sendQ13(s); },
        function(s) { return Texts_C.sendQ14(s); },
        function(s) { return Texts_C.sendQ15(s); }
      ]
    };
    return map[(flowType || '').toUpperCase()] || [];
  }
};

/************************************************************
 * CASE UPDATE FLOW — Option 4 from existing-case menu
 ************************************************************/
const CaseUpdateFlow = {
  handle(session, msg, mediaId, mediaMime, rawEvent) {
    session.Temp = session.Temp || {};
    const caseId = session.Temp.updateCaseID;

    if (!caseId) {
      session.Current_Step_Code = STEP_CODES.EXISTING_MENU;
      Session.save(session);
      return Texts_ExistingCases.sendExistingCaseMenu(session, session.Temp.lastCaseID || '');
    }

    if (session.Current_Step_Code === STEP_CODES.CASE_UPDATE_MENU) {
      if (msg === '1') {
        session.Current_Step_Code = STEP_CODES.CASE_UPDATE_INFO;
        Session.save(session);
        return Texts_CaseUpdates.askNewInfo(session, caseId);
      }
      if (msg === '2') {
        CaseEngine.close(caseId, 'Closed — Resolved by Family / Initiator');
        CaseUpdateEngine.logStatus(caseId, 'Closed — Resolved by Family / Initiator', 'User confirmed closure');
        session.Temp.updateCaseID = undefined;
        session.Current_Step_Code = STEP_CODES.EXISTING_MENU;
        Session.save(session);
        return Texts_CaseUpdates.sendCaseClosed(session, caseId);
      }
      return [
        Texts.sendInvalidOption(session),
        Texts_CaseUpdates.sendUpdateMenu(session, caseId)
      ].join('\n\n');
    }

    if (session.Current_Step_Code === STEP_CODES.CASE_UPDATE_INFO) {
      const trimmed = (msg || '').trim();
      const upper = trimmed.toUpperCase();

      if (trimmed === '0' || upper === 'BACK') {
        session.Current_Step_Code = STEP_CODES.EXISTING_MENU;
        Session.save(session);
        return Texts_ExistingCases.sendExistingCaseMenu(session, caseId);
      }

      if (upper === 'DONE') {
        session.Current_Step_Code = STEP_CODES.EXISTING_MENU;
        Session.save(session);
        return [
          Texts_CaseUpdates.confirmNewInfoAdded(session),
          Texts_ExistingCases.sendExistingCaseMenu(session, caseId)
        ].join('\n\n');
      }

      if (mediaId) {
        FlowStorage.saveMedia(session, caseId, mediaId, mediaMime, rawEvent);
        return '';
      }

      if (trimmed) {
        CaseEngine.appendExtraNotes(caseId, trimmed);
        CaseUpdateEngine.create(caseId, 'UPDATE_TEXT', trimmed, '', rawEvent || {});
        return '';
      }

      return Texts_CaseUpdates.askNewInfo(session, caseId);
    }

    return Texts.sendInvalidOption(session);
  }
};

/************************************************************
 * FLOW STORAGE HELPERS — thin wrappers over CaseEngine
 ************************************************************/
const FlowStorage = {
  ensureCase(session) {
    session.Temp = session.Temp || {};
    if (session.Temp.caseID) {
      return session.Temp.caseID;
    }
    const id = CaseEngine.create(session);
    session.Temp.caseID = id;
    Session.save(session);
    return id;
  },

  saveAnswer(caseId, questionNumber, answer) {
    CaseEngine.saveAnswer(caseId, questionNumber, answer || '');
  },

  saveMedia(session, caseId, mediaId, mediaMime, rawEvent) {
    if (!mediaId) return '';
    return MediaEngine.saveWhatsAppMedia(session, caseId, mediaId, mediaMime, rawEvent || {});
  }
};

/************************************************************
 * CASE CONFIRMATION + FINALIZATION LOGIC
 ************************************************************/
const FlowFinalizer = {
  finish(session, caseId) {
    const confirmation = CaseConfirmation.build(session, caseId);
    const closing = Texts_Closing.sendClosing(session);

    const response = [confirmation, closing].join('\n\n');
    Session.delete(session.WhatsApp_Number);
    return response;
  },

  rejectNoAccess(session) {
    const rejection = Texts_C.sendRejectNoAccess(session);
    const closing = Texts.closingAfterRejection(session);
    Session.delete(session.WhatsApp_Number);
    return [rejection, closing].join('\n\n');
  }
};

const CaseConfirmation = {
  build(session, caseId) {
    const lang = (session.Preferred_Language || 'EN').toUpperCase();
    const safeId = caseId || 'XXX-00000';
    const map = {
      EN: [
        'JazakAllah khair, we’ve received your information.',
        'Your case number is (' + safeId + ') (Country-Number) for example: (PK-00001)',
        'Our team will inshaAllah review the details carefully,',
        'and if there’s any update, we will contact you.'
      ].join('\n'),
      UR: [
        'جزاک اللہ خیر، ہم نے آپ کی معلومات حاصل کر لی ہیں۔',
        'آپ کا کیس نمبر ہے (' + safeId + ') (Country-Number) مثال کے طور پر (PK-00001)',
        'ہماری ٹیم ان شاء اللہ تفصیل چیک کرے گی اور اگر کوئی اپڈیٹ ہوئی',
        'تو آپ سے رابطہ کرے گی۔'
      ].join('\n'),
      RUR: [
        'JazakAllah khair, humne aapki maloomat hasil kar li hain.',
        'Apka case number hai (' + safeId + ') (Country-Number) misal ke tor par (PK-00001)',
        'Humari team inshaAllah tafseel check karegi aur agar koi update hui',
        'to aap se rabta karegi.'
      ].join('\n'),
      HI: [
        'जज़ाकअल्लाह खैर, हमने आपकी जानकारी प्राप्त कर ली है।',
        'आपका केस नंबर है (' + safeId + ') (Country-Number) उदाहरण: (PK-00001)',
        'हमारी टीम इंशा अल्लाह विवरण की जाँच करेगी',
        'और यदि कोई अपडेट हुई तो आपसे संपर्क करेगी।'
      ].join('\n'),
      BN: [
        'জাযাকআল্লাহ খাইর, আমরা আপনার তথ্য পেয়েছি।',
        'আপনার কেস নম্বর হলো (' + safeId + ') (Country-Number) যেমন: (PK-00001)',
        'আমাদের টিম ইনশাআল্লাহ বিস্তারিত যাচাই করবে',
        'এবং কোনো আপডেট থাকলে আপনার সাথে যোগাযোগ করবে।'
      ].join('\n'),
      AR: [
        'جزاك الله خيراً، لقد استلمنا معلوماتك.',
        'رقم قضيتك هو (' + safeId + ') (Country-Number) على سبيل المثال: (PK-00001)',
        'فريقنا إن شاء الله سيقوم بمراجعة التفاصيل بعناية',
        'وإذا كان هناك أي تحديث فسوف نتواصل معك.'
      ].join('\n')
    };

    return map[lang] || map.EN;
  }
};
