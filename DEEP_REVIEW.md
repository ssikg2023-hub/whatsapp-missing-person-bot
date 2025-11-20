# DEEP REVIEW REPORT — SECTION 1 (Function-Level Findings)

- **Flows.gs** calls undefined handlers `_processLanguageSelection`, `_processUserType`, `FlowA.process`, `FlowB.process`, and `FlowC.process`, so routing fails immediately for every flow. 【F:Flows.gs.txt†L59-L107】
- **FlowA.gs** depends on a global `Session` object (e.g., `Session.save`, `Session.resetFull`) that is never defined—only `SessionEngine` exists—so every state transition throws. 【F:FlowA.gs.txt†L15-L189】
- **FlowB.gs** calls `Texts.pickByLang`, `WhatsApp.sendText`, and `Session.save`, but none of these helpers exist in the codebase, making all B-flow question sends unreachable. 【F:FlowB.gs.txt†L93-L259】【F:Texts_Wrapper.gs.txt†L1-L76】
- **FlowC.gs** uses `Session.save` and only implements up to `_finish` without any confirmation or CaseEngine call, leaving the flow without persistence or completion. 【F:FlowC.gs.txt†L15-L186】
- **CaseUpdateFlow.gs** is never invoked: Flows.gs routes to `CaseUpdateFlow.process`, yet the module exposes `start`, `handleCaseID`, `handleMenuChoice`, etc., with no `process` dispatcher, so updates cannot run. 【F:Flows.gs.txt†L83-L86】【F:CaseUpdateFlow.gs.txt†L11-L200】
- **ExistingCaseFlow** similarly lacks a `processMenu`/`processCaseSelection` pair expected by Flows.gs; available methods are differently named, so existing-case interception breaks. 【F:Flows.gs.txt†L73-L79】【F:ExistingCaseFlow.gs.txt†L1-L220】
- **Media handling**: Flows.gs defers to `Utils.questionAllowsMedia` and `Utils.saveFlowMedia`, but neither function exists in Utils.gs, so media uploads are rejected via runtime errors rather than validation. 【F:Flows.gs.txt†L184-L199】【F:Utils.gs.txt†L1-L200】
- **Timeout and replay utilities**: Flows.gs references `Utils.isSessionExpired` and `Utils.isUnexpectedKeyword`, which are missing from Utils.gs, leaving timeout/unexpected keyword checks undefined. 【F:Flows.gs.txt†L36-L47】【F:Utils.gs.txt†L1-L200】
- **CaseEngine integration**: FlowA finalization calls `CaseEngine.createNewCase`, whereas FlowB uses `CaseEngine.finalizeCase` and CaseUpdateFlow expects `CaseEngine.getCaseById`/`saveUpdate`; these signatures are absent in CaseEngine.gs, so saves/resolutions fail. 【F:FlowA.gs.txt†L198-L206】【F:FlowB.gs.txt†L105-L260】【F:CaseUpdateFlow.gs.txt†L58-L176】【F:CaseEngine.gs.txt†L1-L200】
- **Code.gs vs. utility namespace**: Outbound senders mutate `Utils.sendText/sendAudio/...` inline, yet Flows and flow files call `WhatsApp.sendText` or `Code.sendText`, leading to inconsistent namespaces and missing symbols at runtime. 【F:Code.gs.txt†L123-L210】【F:FlowB.gs.txt†L93-L260】【F:Texts_Wrapper.gs.txt†L44-L71】

# DEEP REVIEW REPORT — SECTION 2 (Flow Alignment & Step Codes)

- **Flow strict counts violated**: FlowA includes extra steps `A_NOTES`, `A_FINAL_CONFIRM`, `A_END`, and uses `A_ELIGIBILITY_REJECT`/`A_INTRO`, exceeding the mandated A_Q1–A_Q9 path. 【F:FlowA.gs.txt†L37-L189】
- **FlowB step set** includes `B_INTRO`, `B_NOTES`, `B_FINAL_CONFIRM`, and confirmation branching beyond B_Q1–B_Q11, breaching strict question limits. 【F:FlowB.gs.txt†L42-L259】
- **FlowC sequencing** introduces `C_INTRO`, `C_SOURCE`, `C_Q_INTRO`, and lacks final confirmation/CaseEngine handoff after C_Q15, so the mandated C_Q1–C_Q15 path is incomplete and misaligned. 【F:FlowC.gs.txt†L11-L186】
- **Flows.gs routing mismatch**: initial flow start codes (`FLOW_A_START`, `FLOW_B_START`, `FLOW_C_START`) in router helpers do not match any steps in FlowA/FlowB/FlowC, so the flows cannot be entered correctly. 【F:Flows.gs.txt†L214-L360】【F:FlowA.gs.txt†L13-L189】【F:FlowB.gs.txt†L93-L260】【F:FlowC.gs.txt†L11-L186】
- **Eligibility handling**: FlowC uses `C_SOURCE`/`C_REJECTED` while Flows.gs expects `C_ELIGIBILITY_SOURCE`/`C_REJECTED`; FlowA uses `A_ELIGIBILITY_REJECT` but router checks `A_ELIGIBILITY`, causing branching gaps. 【F:Flows.gs.txt†L214-L320】【F:FlowA.gs.txt†L23-L48】【F:FlowC.gs.txt†L24-L85】

# DEEP REVIEW REPORT — SECTION 3 (Text Library Cross-Match)

- **Texts_A** exposes getters up to `getQ16`, whereas FlowA only uses `_A_Q1_COUNTRY` through `_A_Q9_PHOTO` plus custom intros; extra unused keys and missing alignment with FlowA’s `A_NOTES`/`A_FINAL_CONFIRM` make the library inconsistent with the strict A_Q1–A_Q9 requirement. 【F:Texts_A.gs.txt†L44-L107】【F:FlowA.gs.txt†L71-L189】
- **Texts_B** lacks helper functions `Texts.pickByLang` used throughout FlowB, so language resolution will fail and messages cannot be rendered. 【F:FlowB.gs.txt†L93-L260】【F:Texts_Wrapper.gs.txt†L24-L71】
- **Texts_C** provides question getters, but FlowC omits confirmation/closing texts and relies on `getAfterQ15` without any follow-on steps, leaving completion messaging undefined. 【F:FlowC.gs.txt†L102-L186】【F:Texts_C.gs.txt†L1-L200】
- **Texts_ExistingCases / Texts_CaseUpdates** are called for menus and prompts, yet Flows.gs routes to `ExistingCaseFlow.processMenu/processCaseSelection` and `CaseUpdateFlow.process`, none of which exist, so their text entries are unreachable. 【F:Flows.gs.txt†L73-L86】【F:ExistingCaseFlow.gs.txt†L1-L220】【F:CaseUpdateFlow.gs.txt†L11-L200】

# DEEP REVIEW REPORT — SECTION 4 (Global Behavior & Media/Timeout)

- **Media path conflicts**: Flows.gs calls `Utils.questionAllowsMedia` and `Utils.saveFlowMedia` that are absent; FlowA and FlowB directly call `MediaEngine.saveMedia` with differing signatures (FlowA passes session, FlowB passes mediaUrl only), leading to inconsistent storage and likely exceptions. 【F:Flows.gs.txt†L184-L199】【F:FlowA.gs.txt†L118-L154】【F:FlowB.gs.txt†L31-L260】【F:MediaEngine.gs.txt†L1-L200】
- **Timeout/unexpected keyword handling** relies on missing Utils helpers (`isSessionExpired`, `isUnexpectedKeyword`), so global interceptors will throw instead of replaying steps. 【F:Flows.gs.txt†L36-L47】【F:Utils.gs.txt†L1-L200】
- **Session persistence mismatch**: SessionEngine stores session data under `Temp_Data`, but flows read/write `Temp` or `Temp_Data_Json`, so user answers are never persisted consistently, risking data loss across all flows. 【F:SessionEngine.gs.txt†L30-L139】【F:FlowA.gs.txt†L64-L189】【F:FlowC.gs.txt†L126-L173】【F:CaseUpdateFlow.gs.txt†L20-L200】
- **Language and region menus**: Flows.gs uses `Texts_LangMenus.getAllowedOptions`/`mapChoiceToLang`, but Texts_LangMenus defines different helper names (`getMenu`, `getLanguageOptions`), causing language selection to fail. 【F:Flows.gs.txt†L115-L206】【F:Texts_LangMenus.gs.txt†L1-L200】

# DEEP REVIEW REPORT — SECTION 5 (Priority Fix List)

- **Critical**: Implement or rewire routing to real dispatcher functions (`_processLanguageSelection`/`_processUserType` or align with existing `_handleLanguageSelection`/`_handleUserType`) and add process entry points for FlowA/B/C plus CaseUpdateFlow/ExistingCaseFlow to restore message handling. 【F:Flows.gs.txt†L59-L107】【F:CaseUpdateFlow.gs.txt†L11-L200】【F:ExistingCaseFlow.gs.txt†L1-L220】
- **Critical**: Replace all `Session.*`/`WhatsApp.*`/`Texts.pickByLang` references with existing engines (SessionEngine, Utils senders) or implement missing helpers to prevent immediate runtime failures. 【F:FlowA.gs.txt†L15-L189】【F:FlowB.gs.txt†L93-L260】【F:FlowC.gs.txt†L11-L186】【F:Texts_Wrapper.gs.txt†L24-L71】
- **Major**: Align question sequences to mandated ranges (A_Q1–A_Q9, B_Q1–B_Q11, C_Q1–C_Q15) and remove or remap extra steps (`A_NOTES`, `B_NOTES`, `C_Q_INTRO`) with corresponding text keys. 【F:FlowA.gs.txt†L64-L189】【F:FlowB.gs.txt†L42-L259】【F:FlowC.gs.txt†L24-L186】
- **Major**: Sync text libraries with flow usage, ensuring every referenced getter exists (e.g., FlowB language picker) and unused Q10–Q16 entries in Texts_A are reconciled with strict flow counts. 【F:FlowB.gs.txt†L93-L260】【F:Texts_A.gs.txt†L44-L107】【F:Texts_Wrapper.gs.txt†L24-L71】
- **Major**: Standardize media handling APIs across Flows, FlowA/B, and CaseUpdateFlow to use MediaEngine consistently and ensure Utils supplies validation helpers referenced by the router. 【F:Flows.gs.txt†L184-L199】【F:FlowA.gs.txt†L118-L154】【F:FlowB.gs.txt†L31-L260】【F:CaseUpdateFlow.gs.txt†L140-L176】【F:Utils.gs.txt†L1-L200】
- **Major**: Finalize completion paths (CaseEngine create/finalize/update) so FlowA/B/C and CaseUpdateFlow persist cases/updates and deliver confirmations using available text libraries. 【F:FlowA.gs.txt†L198-L206】【F:FlowB.gs.txt†L234-L260】【F:FlowC.gs.txt†L176-L186】【F:CaseUpdateFlow.gs.txt†L158-L200】【F:CaseEngine.gs.txt†L1-L200】
