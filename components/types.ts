export type Sex = "female" | "male" | "intersex" | "prefer_not_to_say";
export type TriageLevel = "emergency" | "urgent" | "non_urgent" | "self_care";

export type Questionnaire = {
  symptoms: string[];
  ageYears: number | null;
  sex: Sex;
  duration: "hours" | "days" | "weeks" | "months";
  durationValue: number;
  severity: 1 | 2 | 3 | 4 | 5;
  fever: "yes" | "no" | "unknown";
  pregnancy: "yes" | "no" | "unknown";
  redFlags: {
    chestPain: boolean;
    troubleBreathing: boolean;
    faintingOrConfusion: boolean;
    severeBleeding: boolean;
    severeAllergicReaction: boolean;
    oneSidedWeaknessOrFaceDroop: boolean;
    severeHeadacheSudden: boolean;
    suicidalThoughts: boolean;
  };
  notes: string;
};

export type TriageResult = {
  triage_level: TriageLevel;
  summary: string;
  rationale: string[];
  possible_conditions: {
    name: string;
    likelihood: "high" | "medium" | "low";
    why_it_fits: string;
  }[];
  self_care: string[];
  pharmacy_advice: string[];
  see_doctor: string[];
  emergency_actions: string[];
  red_flags_to_watch: string[];
  disclaimer: string;
};
