# Audit Report

## Routing and Handler Mismatches
- `Flows.routeMessage` dispatches to `FlowA.process`, `FlowB.process`, and `FlowC.process`, but none of these functions exist in the respective flow files, leaving flow routing undefined. 【F:Flows.gs.txt†L91-L107】【F:FlowA.gs.txt†L8-L114】【F:FlowB.gs.txt†L1-L114】【F:FlowC.gs.txt†L1-L89】
- Existing case interceptors call `ExistingCaseFlow.processMenu` and `processCaseSelection`, which are not implemented (only `start`, `handleCaseId`, etc. exist). 【F:Flows.gs.txt†L73-L79】【F:ExistingCaseFlow.gs.txt†L6-L80】
- Case update interceptor calls `CaseUpdateFlow.process`, but the module exposes `route` instead, so updates cannot be processed. 【F:Flows.gs.txt†L82-L86】【F:CaseUpdateFlow.gs.txt†L229-L256】
- Flow C routing in `Flows._A_next`/`_C_next` expects confirmation steps (`*_FINAL_BEFORE_CONFIRM`), but FlowC stops at `C_CONFIRM_START` without any confirmation handlers, leaving the flow incomplete. 【F:FlowC.gs.txt†L1-L89】【F:Flows.gs.txt†L361-L396】【F:Flows.gs.txt†L1928-L1954】

## Step Sequences vs. Requirements
- Flow A question map in `Flows._A_next` includes `A_Q1`–`A_Q16`, exceeding the strict Q1–Q9 requirement and diverging from the implemented FlowA steps, risking out-of-range navigation. 【F:Flows.gs.txt†L361-L392】【F:FlowA.gs.txt†L55-L114】
- Flow B and Flow C route code in `Flows.gs` reference question sequences and confirmation steps that are absent from the actual flow files, leading to unreachable logic. 【F:Flows.gs.txt†L398-L466】【F:FlowB.gs.txt†L20-L270】【F:FlowC.gs.txt†L1-L89】

## Text Library Misalignment
- `Texts_A` defines getters and placeholders for Q1–Q16, while FlowA only drives Q1–Q9, creating unused and unmatched text keys. 【F:Texts_A.gs.txt†L24-L75】【F:FlowA.gs.txt†L55-L114】
- `Texts_B` relies on `Texts.pickByLang` (not defined anywhere) and includes only text getters; FlowB calls the missing helper, so text resolution fails. 【F:FlowB.gs.txt†L95-L210】【F:Texts_Wrapper.gs.txt†L1-L64】

## Undefined or Missing Utilities
- Flows and flows use `Session.save`/`Session.reset`, but the session utility provided is `SessionEngine`, leaving session persistence calls unresolved. 【F:FlowA.gs.txt†L15-L18】【F:FlowB.gs.txt†L95-L270】【F:FlowC.gs.txt†L11-L88】【F:SessionEngine.gs.txt†L1-L120】
- FlowB and other modules call `WhatsApp.sendText`, which is not defined in the provided codebase. 【F:FlowB.gs.txt†L95-L210】
- FlowB’s routing expects a `process` method and replay helpers that are not present, so timeout/unexpected keyword replays cannot work. 【F:Flows.gs.txt†L95-L106】【F:FlowB.gs.txt†L20-L270】

## Existing Case & Update Flow Gaps
- CaseUpdateFlow uses step codes like `CU_MENU`, `CU_DONE?`, but `Flows` watches for `UPDATE_*` prefixes, so updates will never be reached. 【F:CaseUpdateFlow.gs.txt†L13-L256】【F:Flows.gs.txt†L82-L86】
- ExistingCaseFlow step codes (`EC_CASE_ID`, `EC_SELECT_INDEX`, `EC_MAIN_MENU`, etc.) do not match the `Flows` interceptors (`EXISTING_CASE_MENU`, `EXISTING_CASE_SELECT`), preventing menu handling. 【F:ExistingCaseFlow.gs.txt†L11-L199】【F:Flows.gs.txt†L73-L79】

## Media/Timeout Handling Conflicts
- FlowA and FlowC perform media saves via `MediaEngine` while `Flows._handleMedia` separately routes media using `Utils.questionAllowsMedia`, causing divergent media paths with no shared step map (FlowStorage sets are empty). 【F:FlowA.gs.txt†L116-L181】【F:FlowC.gs.txt†L43-L89】【F:Flows.gs.txt†L51-L69】【F:FlowStorage.gs.txt†L12-L70】
- FlowStorage placeholder sets for step mappings, media allowance, and eligibility are empty, so helper checks for media/text/multi-reply cannot ever return true, breaking consistency with flow expectations. 【F:FlowStorage.gs.txt†L12-L70】

## Duplicate/Unreachable Code
- Flows.gs contains multiple overlapping implementations for language/user-type handling and flow question navigation, leading to conflicting logic paths (e.g., multiple `_handleLanguageSelection` and `_handleUserType` definitions). 【F:Flows.gs.txt†L131-L240】【F:Flows.gs.txt†L400-L470】
- FlowC’s progression stops at `_finish` without any confirmation or case creation linkage, leaving collected data unused. 【F:FlowC.gs.txt†L83-L89】

