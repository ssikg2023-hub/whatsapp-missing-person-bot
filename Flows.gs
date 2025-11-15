/************************************************************
 *  Flows.gs — MASTER FLOW ROUTER (FINAL FIXED VERSION)
 ************************************************************/

const Flows = {

  /************************************************************
   * MAIN ROUTER — Decides which flow will handle the message
   ************************************************************/
  routeMessage(session, msg, raw, mediaUrl, mediaMime) {

    const step = session.Current_Step_Code || "";
    const flow = session.Flow_Type || "";

    /****************************************************
     * SAFETY FIX #1 — Ensure Region Detected
     ****************************************************/
    if (!session.Region_Group) {
      session.Region_Group = detectRegionByPhone(session.WhatsApp_Number);
      Session.save(session);
    }

    /****************************************************
     * SAFETY FIX #2 — If no language → force LANG_SELECT
     ****************************************************/
    if (!session.Preferred_Language) {
      session.Current_Step_Code = "LANG_SELECT";
      Session.save(session);
      return Texts.sendLanguageMenu(session);
    }

    /****************************************************
     * STEP 1 — LANGUAGE SELECTION (NEW ADDED HANDLER)
     ****************************************************/
    if (step === "LANG_SELECT") {
      return this.handleLanguageSelection(session, msg);
    }

    /****************************************************
     * STEP 2 — USER TYPE SELECT
     ****************************************************/
    if (step === "USER_TYPE") {
      return this.handleUserType(session, msg);
    }

    /****************************************************
     * =================== FLOW A ========================
     ****************************************************/
    if (step === "A_ELIGIBILITY") {
      return this.handleEligibility_A(session, msg);
    }

    if (step === "A_ELIGIBILITY_REJECTED") {
      return this.handleRejected_A(session, msg);
    }

    if (step.startsWith("A_")) {
      return FlowA.handle(session, msg, raw, mediaUrl, mediaMime);
    }

    /****************************************************
     * =================== FLOW B ========================
     ****************************************************/
    if (step.startsWith("B_")) {
      return FlowB.handle(session, msg, raw, mediaUrl, mediaMime);
    }

    /****************************************************
     * =================== FLOW C ========================
     ****************************************************/
    if (step.startsWith("C_")) {
      return FlowC.handle(session, msg, raw, mediaUrl, mediaMime);
    }

    /****************************************************
     * DEFAULT
     ****************************************************/
    return Texts_Validation.sendInvalidOption(session);
  },


  /************************************************************
   * LANGUAGE SELECTION HANDLER (100% NEW)
   ************************************************************/
  handleLanguageSelection(session, msg) {

    // Map user choice → language
    const lang = Texts.mapLanguageChoice(session.Region_Group, msg);

    if (!lang) {
      return Texts.sendInvalidOption(session);
    }

    // Save language
    session.Preferred_Language = lang;

    // Move to next step
    session.Current_Step_Code = "USER_TYPE";
    Session.save(session);

    // Send next menu
    return Texts.sendUserTypeMenu(session);
  },


  /************************************************************
   * USER TYPE MENU HANDLER
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

    return Texts_Validation.sendInvalidOption(session);
  },


  /************************************************************
   * FLOW A — Eligibility (YES/NO)
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

    return Texts_Validation.sendInvalidOption(session);
  },


  /************************************************************
   * FLOW A — Rejected Follow-up
   ************************************************************/
  handleRejected_A(session, msg) {

    if (msg === "1") {
      session.Current_Step_Code = "USER_TYPE";
      session.Flow_Type = "";
      session.Temp = {};
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
 * ============= FLOW A (BLOCK 2) ===========================
 ************************************************************/
const FlowA = {

  start(session) {

    session.Temp = session.Temp || {};
    session.Flow_Type = "A";

    const caseID = createCase(session);
    session.Temp.caseID = caseID;

    session.Current_Step_Code = "A_Q1";
    Session.save(session);

    return Texts_A.sendQ1(session);
  },

  handle(session, msg, raw, mediaUrl, mediaMime) {

    const step = session.Current_Step_Code;

    switch (step) {

      case "A_Q1":
        saveAnswer(session.Temp.caseID, 1, msg);
        session.Current_Step_Code = "A_Q2";
        Session.save(session);
        return Texts_A.sendQ2(session);

      case "A_Q2":
        saveAnswer(session.Temp.caseID, 2, msg);
        session.Current_Step_Code = "A_Q3";
        Session.save(session);
        return Texts_A.sendQ3(session);

      case "A_Q3":
        if (isNaN(Number(msg))) {
          return Texts_A.sendInvalidAge(session);
        }
        saveAnswer(session.Temp.caseID, 3, msg);
        session.Current_Step_Code = "A_Q4";
        Session.save(session);
        return Texts_A.sendQ4(session);

      case "A_Q4":
        saveAnswer(session.Temp.caseID, 4, msg);
        session.Current_Step_Code = "A_Q5";
        Session.save(session);
        return Texts_A.sendQ5(session);

      case "A_Q5":
        saveAnswer(session.Temp.caseID, 5, msg);
        session.Current_Step_Code = "A_Q6";
        Session.save(session);
        return Texts_A.sendQ6(session);

      case "A_Q6":
        saveAnswer(session.Temp.caseID, 6, msg);
        session.Current_Step_Code = "A_Q7";
        Session.save(session);
        return Texts_A.sendQ7(session);

      case "A_Q7":
        saveAnswer(session.Temp.caseID, 7, msg);
        session.Current_Step_Code = "A_Q8";
        Session.save(session);
        return Texts_A.sendQ8(session);

      case "A_Q8":
        saveAnswer(session.Temp.caseID, 8, msg);
        session.Current_Step_Code = "A_Q9";
        Session.save(session);
        return Texts_A.sendQ9(session);

      case "A_Q9":
        saveAnswer(session.Temp.caseID, 9, msg);
        return this._finishFlowA(session);

      default:
        return Texts_Validation.sendInvalidOption(session);
    }
  },

  _finishFlowA(session) {

    const dua = Texts_Closing.sendClosing(session);

    session.Current_Step_Code = "";
    session.Flow_Type = "";
    session.Temp = {};
    Session.save(session);

    Session.delete(session.WhatsApp_Number);

    return dua;
  }
};


/************************************************************
 * ============= FLOW B (BLOCK 3) ===========================
 ************************************************************/
const FlowB = {

  start(session) {

    session.Temp = session.Temp || {};
    session.Flow_Type = "B";

    const caseID = createCase(session);
    session.Temp.caseID = caseID;

    session.Current_Step_Code = "B_Q1";
    Session.save(session);

    return Texts_B.sendQ1(session);
  },

  handle(session, msg, raw, mediaUrl, mediaMime) {

    const step = session.Current_Step_Code;

    switch (step) {

      case "B_Q1":
        saveAnswer(session.Temp.caseID, 1, msg);
        session.Current_Step_Code = "B_Q2";
        Session.save(session);
        return Texts_B.sendQ2(session);

      case "B_Q2":
        saveAnswer(session.Temp.caseID, 2, msg);
        session.Current_Step_Code = "B_Q3";
        Session.save(session);
        return Texts_B.sendQ3(session);

      case "B_Q3":
        saveAnswer(session.Temp.caseID, 3, msg);
        session.Current_Step_Code = "B_Q4";
        Session.save(session);
        return Texts_B.sendQ4(session);

      case "B_Q4":
        saveAnswer(session.Temp.caseID, 4, msg);
        session.Current_Step_Code = "B_Q5";
        Session.save(session);
        return Texts_B.sendQ5(session);

      case "B_Q5":
        saveAnswer(session.Temp.caseID, 5, msg);
        session.Current_Step_Code = "B_Q6";
        Session.save(session);
        return Texts_B.sendQ6(session);

      case "B_Q6":
        saveAnswer(session.Temp.caseID, 6, msg);
        session.Current_Step_Code = "B_Q7";
        Session.save(session);
        return Texts_B.sendQ7(session);

      case "B_Q7":
        saveAnswer(session.Temp.caseID, 7, msg);
        session.Current_Step_Code = "B_Q8";
        Session.save(session);
        return Texts_B.sendQ8(session);

      case "B_Q8":
        saveAnswer(session.Temp.caseID, 8, msg);
        session.Current_Step_Code = "B_Q9";
        Session.save(session);
        return Texts_B.sendQ9(session);

      case "B_Q9":
        saveAnswer(session.Temp.caseID, 9, msg);
        session.Current_Step_Code = "B_Q10";
        Session.save(session);
        return Texts_B.sendQ10(session);

      case "B_Q10":
        saveAnswer(session.Temp.caseID, 10, msg);
        session.Current_Step_Code = "B_Q11";
        Session.save(session);
        return Texts_B.sendQ11(session);

      case "B_Q11":
        if (mediaUrl) saveMediaToCase(session.Temp.caseID, mediaUrl, mediaMime);
        else saveAnswer(session.Temp.caseID, 11, msg);
        return this._finishFlowB(session);

      default:
        return Texts_Validation.sendInvalidOption(session);
    }
  },

  _finishFlowB(session) {

    const dua = Texts_Closing.sendClosing(session);

    session.Current_Step_Code = "";
    session.Flow_Type = "";
    session.Temp = {};
    Session.save(session);

    Session.delete(session.WhatsApp_Number);

    return dua;
  }
};


/************************************************************
 * ============= FLOW C (BLOCK 4) ===========================
 ************************************************************/
const FlowC = {

  start(session) {

    session.Temp = session.Temp || {};
    session.Flow_Type = "C";

    const caseID = createCase(session);
    session.Temp.caseID = caseID;

    session.Current_Step_Code = "C_Q0";
    Session.save(session);

    return Texts_C.sendQ0(session);
  },

  handle(session, msg, raw, mediaUrl, mediaMime) {

    const step = session.Current_Step_Code;

    switch (step) {

      case "C_Q0":
        if (msg === "2") return this._rejectNoAccess(session);
        if (msg !== "1" && msg !== "3")
          return Texts_Validation.sendInvalidOption(session);

        saveAnswer(session.Temp.caseID, 1, msg);
        session.Current_Step_Code = "C_Q1";
        Session.save(session);
        return Texts_C.sendQ1(session);

      case "C_Q1":
        saveAnswer(session.Temp.caseID, 2, msg);
        session.Current_Step_Code = "C_Q2";
        Session.save(session);
        return Texts_C.sendQ2(session);

      case "C_Q2":
        saveAnswer(session.Temp.caseID, 3, msg);
        session.Current_Step_Code = "C_Q3";
        Session.save(session);
        return Texts_C.sendQ3(session);

      case "C_Q3":
        saveAnswer(session.Temp.caseID, 4, msg);
        session.Current_Step_Code = "C_Q4";
        Session.save(session);
        return Texts_C.sendQ4(session);

      case "C_Q4":
        saveAnswer(session.Temp.caseID, 5, msg);
        session.Current_Step_Code = "C_Q5";
        Session.save(session);
        return Texts_C.sendQ5(session);

      case "C_Q5":
        saveAnswer(session.Temp.caseID, 6, msg);
        session.Current_Step_Code = "C_Q6";
        Session.save(session);
        return Texts_C.sendQ6(session);

      case "C_Q6":
        saveAnswer(session.Temp.caseID, 7, msg);
        session.Current_Step_Code = "C_Q7";
        Session.save(session);
        return Texts_C.sendQ7(session);

      case "C_Q7":
        saveAnswer(session.Temp.caseID, 8, msg);
        session.Current_Step_Code = "C_Q8";
        Session.save(session);
        return Texts_C.sendQ8(session);

      case "C_Q8":
        saveAnswer(session.Temp.caseID, 9, msg);
        session.Current_Step_Code = "C_Q9";
        Session.save(session);
        return Texts_C.sendQ9(session);

      case "C_Q9":
        saveAnswer(session.Temp.caseID, 10, msg);
        session.Current_Step_Code = "C_Q10";
        Session.save(session);
        return Texts_C.sendQ10(session);

      case "C_Q10":
        saveAnswer(session.Temp.caseID, 11, msg);
        session.Current_Step_Code = "C_Q11";
        Session.save(session);
        return Texts_C.sendQ11(session);

      case "C_Q11":
        saveAnswer(session.Temp.caseID, 12, msg);
        session.Current_Step_Code = "C_Q12";
        Session.save(session);
        return Texts_C.sendQ12(session);

      case "C_Q12":
        saveAnswer(session.Temp.caseID, 13, msg);
        session.Current_Step_Code = "C_Q13";
        Session.save(session);
        return Texts_C.sendQ13(session);

      case "C_Q13":
        saveAnswer(session.Temp.caseID, 14, msg);
        session.Current_Step_Code = "C_Q14";
        Session.save(session);
        return Texts_C.sendQ14(session);

      case "C_Q14":
        saveAnswer(session.Temp.caseID, 15, msg);
        session.Current_Step_Code = "C_Q15";
        Session.save(session);
        return Texts_C.sendQ15(session);

      case "C_Q15":
        if (mediaUrl)
          saveMediaToCase(session.Temp.caseID, mediaUrl, mediaMime);
        else
          saveAnswer(session.Temp.caseID, 16, msg);

        return this._finishFlowC(session);

      default:
        return Texts_Validation.sendInvalidOption(session);
    }
  },

  _rejectNoAccess(session) {
    const msg = Texts_C.sendRejectNoAccess(session);
    Session.delete(session.WhatsApp_Number);
    return msg;
  },

  _finishFlowC(session) {

    const dua = Texts_Closing.sendClosing(session);

    session.Current_Step_Code = "";
    session.Flow_Type = "";
    session.Temp = {};
    Session.save(session);

    Session.delete(session.WhatsApp_Number);

    return dua;
  }
};

