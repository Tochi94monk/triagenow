"use client";

import { useMemo, useState } from "react";
import type { Questionnaire, Sex, TriageResult } from "./types";
import { Badge, Button, Card, CardBody, CardHeader, Divider, Input, TextArea } from "./ui";
import ResultsPanel from "./ResultsPanel";
import NearbyFinder from "./NearbyFinder";

const defaultQ: Questionnaire = {
  symptoms: [],
  ageYears: null,
  sex: "prefer_not_to_say",
  duration: "days",
  durationValue: 2,
  severity: 3,
  fever: "unknown",
  pregnancy: "unknown",
  redFlags: {
    chestPain: false,
    troubleBreathing: false,
    faintingOrConfusion: false,
    severeBleeding: false,
    severeAllergicReaction: false,
    oneSidedWeaknessOrFaceDroop: false,
    severeHeadacheSudden: false,
    suicidalThoughts: false
  },
  notes: ""
};

type Step = 1 | 2 | 3 | 4;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function SymptomChecker() {
  const [q, setQ] = useState<Questionnaire>(defaultQ);
  const [symptomDraft, setSymptomDraft] = useState("");
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<TriageResult | null>(null);

  const progress = useMemo(() => `${(step / 4) * 100}%`, [step]);

  function addSymptom() {
    const s = symptomDraft.trim();
    if (!s) return;
    setQ((prev) => ({
      ...prev,
      symptoms: Array.from(new Set([...prev.symptoms, s])).slice(0, 10)
    }));
    setSymptomDraft("");
  }

  function removeSymptom(s: string) {
    setQ((prev) => ({ ...prev, symptoms: prev.symptoms.filter((x) => x !== s) }));
  }

  function resetAll() {
    setQ(defaultQ);
    setStep(1);
    setError("");
    setResult(null);
    setBusy(false);
    setSymptomDraft("");
  }

  async function submit() {
    setError("");
    if (q.symptoms.length === 0) {
      setError("Please add at least one symptom.");
      return;
    }
    if (q.ageYears !== null && (q.ageYears < 0 || q.ageYears > 120)) {
      setError("Please enter a valid age.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionnaire: q })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { result: TriageResult };
      setResult(data.result);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-6">
        <ResultsPanel q={q} result={result} onReset={resetAll} />
        <NearbyFinder />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Symptom Check"
        subtitle="Answer a short questionnaire. You will receive a triage recommendation and practical next steps."
      />
      <CardBody>
        <div className="flex flex-col gap-4">
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-slate-900" style={{ width: progress }} />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Symptoms</label>
                <p className="mt-1 text-xs text-slate-600">
                  Add up to 10 symptoms (example: “sore throat”, “headache”, “stomach pain”).
                </p>

                <div className="mt-3 flex gap-2">
                  <Input
                    value={symptomDraft}
                    onChange={(e) => setSymptomDraft(e.target.value)}
                    placeholder="Type a symptom and press Add"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSymptom();
                      }
                    }}
                  />
                  <Button onClick={addSymptom} variant="secondary">
                    Add
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {q.symptoms.map((s) => (
                    <button
                      key={s}
                      onClick={() => removeSymptom(s)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      title="Click to remove"
                    >
                      {s} <span className="ml-1 text-slate-400">×</span>
                    </button>
                  ))}
                </div>
              </div>

              <Divider />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <label className="text-xs font-medium text-slate-700">Age (years, optional)</label>
                  <Input
                    className="mt-2"
                    type="number"
                    min={0}
                    max={120}
                    value={q.ageYears ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      setQ((prev) => ({ ...prev, ageYears: v }));
                    }}
                  />
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <label className="text-xs font-medium text-slate-700">Sex</label>
                  <select
                    value={q.sex}
                    onChange={(e) => setQ((prev) => ({ ...prev, sex: e.target.value as Sex }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="prefer_not_to_say">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="intersex">Intersex</option>
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <label className="text-xs font-medium text-slate-700">Fever</label>
                  <select
                    value={q.fever}
                    onChange={(e) => setQ((prev) => ({ ...prev, fever: e.target.value as any }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="unknown">Not sure</option>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button onClick={() => setStep(2)} disabled={q.symptoms.length === 0}>
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <label className="text-xs font-medium text-slate-700">Duration</label>
                  <select
                    value={q.duration}
                    onChange={(e) => setQ((prev) => ({ ...prev, duration: e.target.value as any }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <label className="text-xs font-medium text-slate-700">How many?</label>
                  <Input
                    className="mt-2"
                    type="number"
                    min={1}
                    max={999}
                    value={q.durationValue}
                    onChange={(e) => setQ((prev) => ({ ...prev, durationValue: clamp(Number(e.target.value), 1, 999) }))}
                  />
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <label className="text-xs font-medium text-slate-700">Severity (1–5)</label>
                  <Input
                    className="mt-2"
                    type="number"
                    min={1}
                    max={5}
                    value={q.severity}
                    onChange={(e) =>
                      setQ((prev) => ({ ...prev, severity: clamp(Number(e.target.value), 1, 5) as any }))
                    }
                  />
                  <p className="mt-1 text-xs text-slate-500">1 = mild, 5 = severe.</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <label className="text-xs font-medium text-slate-700">Pregnancy (if applicable)</label>
                <select
                  value={q.pregnancy}
                  onChange={(e) => setQ((prev) => ({ ...prev, pregnancy: e.target.value as any }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 md:max-w-xs"
                >
                  <option value="unknown">Not applicable / not sure</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button onClick={() => setStep(1)} variant="secondary">
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Badge>Safety check</Badge>
                  <p className="text-sm text-slate-700">Select any that apply right now.</p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {[
                    ["chestPain", "Chest pain / pressure"],
                    ["troubleBreathing", "Trouble breathing / severe shortness of breath"],
                    ["severeAllergicReaction", "Severe allergic reaction (swelling, wheeze, widespread hives)"],
                    ["oneSidedWeaknessOrFaceDroop", "Face droop / one-sided weakness / trouble speaking"],
                    ["faintingOrConfusion", "Fainting, confusion, or very hard to wake up"],
                    ["severeBleeding", "Severe bleeding or vomiting blood"],
                    ["severeHeadacheSudden", "Sudden 'worst headache' or severe neck stiffness"],
                    ["suicidalThoughts", "Thoughts of self-harm or suicide"]
                  ].map(([key, label]) => {
                    const k = key as keyof Questionnaire["redFlags"];
                    return (
                      <label key={key} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={q.redFlags[k]}
                          onChange={(e) =>
                            setQ((prev) => ({ ...prev, redFlags: { ...prev.redFlags, [k]: e.target.checked } }))
                          }
                        />
                        <span className="text-sm text-slate-800">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button onClick={() => setStep(2)} variant="secondary">
                  Back
                </Button>
                <Button onClick={() => setStep(4)}>Continue</Button>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Anything else? (optional)</label>
                <p className="mt-1 text-xs text-slate-600">
                  Add context like medications, chronic conditions, or what you are most worried about.
                </p>
                <TextArea
                  className="mt-3 h-28"
                  value={q.notes}
                  onChange={(e) => setQ((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold">Review</h4>
                <div className="mt-2 text-sm text-slate-700 space-y-1">
                  <div>
                    <span className="font-medium">Symptoms:</span> {q.symptoms.join(", ")}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {q.durationValue} {q.duration}
                  </div>
                  <div>
                    <span className="font-medium">Severity:</span> {q.severity}/5
                  </div>
                  <div>
                    <span className="font-medium">Fever:</span> {q.fever}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button onClick={() => setStep(3)} variant="secondary">
                  Back
                </Button>
                <Button onClick={submit} disabled={busy}>
                  {busy ? "Analyzing…" : "Get guidance"}
                </Button>
              </div>

              <p className="text-xs text-slate-500">
                Tip: For best results, be specific about duration and severity. If you selected a red-flag symptom, the result is likely to recommend urgent care.
              </p>
            </div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
