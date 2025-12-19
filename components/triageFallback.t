import type { Questionnaire, TriageResult, TriageLevel } from "./types";

function hasAnyRedFlag(q: Questionnaire): boolean {
  const rf = q.redFlags;
  return Object.values(rf).some(Boolean);
}

function triageFromHeuristics(q: Questionnaire): { level: TriageLevel; reasons: string[] } {
  const reasons: string[] = [];
  const rf = q.redFlags;

  if (rf.suicidalThoughts) {
    return {
      level: "emergency",
      reasons: ["You indicated thoughts of self-harm or suicide, which requires urgent in-person help."]
    };
  }

  if (rf.chestPain || rf.troubleBreathing || rf.severeAllergicReaction || rf.oneSidedWeaknessOrFaceDroop) {
    return {
      level: "emergency",
      reasons: ["You reported one or more red-flag symptoms that can be associated with serious conditions."]
    };
  }

  if (rf.faintingOrConfusion || rf.severeBleeding || rf.severeHeadacheSudden) {
    return {
      level: "urgent",
      reasons: ["You reported symptoms that warrant urgent clinical assessment."]
    };
  }

  if ((q.fever === "yes" && q.severity >= 4) || q.duration === "weeks" || q.duration === "months") {
    reasons.push("Your symptoms are more severe or longer-lasting than typical self-limited illness.");
    return { level: "urgent", reasons };
  }

  if (q.severity <= 2 && q.fever !== "yes" && q.duration === "days" && q.durationValue <= 3 && !hasAnyRedFlag(q)) {
    return { level: "self_care", reasons: ["Symptoms appear mild and short in duration, with no red flags reported."] };
  }

  return {
    level: "non_urgent",
    reasons: ["Symptoms may benefit from a clinician or pharmacist review, especially if they worsen or persist."]
  };
}

export function fallbackTriage(q: Questionnaire): TriageResult {
  const { level, reasons } = triageFromHeuristics(q);

  const baseDisclaimer =
    "This is informational guidance, not a diagnosis. If symptoms worsen, new symptoms appear, or you feel unsafe, seek in-person medical care.";

  const emergencyActions = [
    "If you feel in immediate danger, call your local emergency number or go to the nearest emergency department now.",
    "If breathing is difficult, you have chest pain, severe allergic reaction, weakness on one side, or confusion—do not wait."
  ];

  const seeDoctor = [
    "Consider seeing a clinician if symptoms persist, worsen, or interfere with daily activities.",
    "If you have chronic conditions, are immunocompromised, pregnant, very young, or elderly, seek care sooner."
  ];

  const pharmacy = [
    "A pharmacist can advise on over-the-counter options, dosing, and interactions.",
    "Ask the pharmacist whether you should be examined by a clinician based on your specific symptoms."
  ];

  const selfCare = [
    "Rest, hydration, and monitoring symptoms can help for many mild illnesses.",
    "Use over-the-counter medicines only as directed on the label, unless advised otherwise by a professional."
  ];

  const summaryByLevel: Record<TriageLevel, string> = {
    emergency: "Seek emergency care now.",
    urgent: "Seek urgent medical assessment soon (today/within 24 hours).",
    non_urgent: "Consider a clinic visit; a pharmacy visit may also help for symptom relief.",
    self_care: "Self-care may be appropriate; consider a pharmacy visit for symptom relief."
  };

  return {
    triage_level: level,
    summary: summaryByLevel[level],
    rationale: reasons,
    possible_conditions: [
      { name: "Common viral illness", likelihood: "medium", why_it_fits: "Many symptom combinations fit viral syndromes; a clinician can confirm." },
      { name: "Minor self-limited condition", likelihood: "low", why_it_fits: "Some presentations resolve with rest and OTC support." }
    ],
    self_care: selfCare,
    pharmacy_advice: pharmacy,
    see_doctor: seeDoctor,
    emergency_actions: emergencyActions,
    red_flags_to_watch: [
      "Worsening shortness of breath",
      "Chest pain or pressure",
      "Fainting, confusion, or severe drowsiness",
      "Severe allergic symptoms (swelling of lips/tongue, wheezing)",
      "New weakness on one side, facial droop, trouble speaking"
    ],
    disclaimer: baseDisclaimer
  };
}
