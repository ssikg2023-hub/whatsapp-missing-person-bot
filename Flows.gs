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

    if (msg === "9") {
      session.Temp = session.Temp || {};
      session.Temp.checkingExisting = true;
      Session.save(session);

      const cases = Cases.getCasesByNumber(session.WhatsApp_Number);
      if (!cases.length) {
        session.Temp.checkingExisting = false;
        Session.save(session);
        return Texts_ExistingCases.sendNoCases(session);
      }

      if (cases.length === 1) {
        const caseID = cases[0].Case_ID;
        session.Temp.lastCaseID = caseID;
        session.Temp.caseID = caseID;
        session.Temp.checkingExisting = false;
        session.Temp.existingChecked = true;
        session.Current_Step_Code = "EXISTING_CASE_MENU";
        Session.save(session);
        return Texts_ExistingCases.sendExistingCaseMenu(session, caseID);
      }

      const ids = cases.map(function(item) { return item.Case_ID; });
      session.Temp.caseList = ids;
      session.Temp.awaitingCaseSelection = true;
      session.Temp.checkingExisting = false;
      session.Temp.existingChecked = true;
      session.Current_Step_Code = "EXISTING_CASE_MENU";
      Session.save(session);

      return Texts_ExistingCases.sendMultipleCasesMenu(session, ids.join("\n"));
    }

    return (
      Texts_Validation.sendInvalidOption(session)
      + "\n\n"
      + Texts.sendUserTypeMenu(session)
    );
  },


  /************************************************************
   * ELIGIBILITY HANDLER — Flow A screening
   ************************************************************/
  handleEligibility_A(session, msg) {

    const normalized = (msg || "").trim();

    if (normalized === "1") {
      session.Current_Step_Code = "A_Q1";
      Session.save(session);
      return FlowA.start(session);
    }

    if (normalized === "2") {
      session.Current_Step_Code = "A_ELIGIBILITY_REJECTED";
      Session.save(session);
      return Texts_Eligibility.sendIneligibleResponse(session);
    }

    return (
      Texts_Validation.sendInvalidOption(session)
      + "\n\n"
      + Texts_Eligibility.sendEligibilityQuestion(session)
    );
  },


  /************************************************************
   * HANDLE FLOW A REJECTION BRANCH
   ************************************************************/
  handleRejected_A(session, msg) {
    const choice = (msg || "").trim();

    if (choice === "1") {
      session.Current_Step_Code = "USER_TYPE";
      session.Flow_Type = "";
      Session.save(session);
      return Texts.sendUserTypeMenu(session);
    }

    if (choice === "2") {
      session.Current_Step_Code = "";
      Session.save(session);
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
Type NEXT for the next file.
