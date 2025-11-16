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
