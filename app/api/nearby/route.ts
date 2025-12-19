import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import type { Questionnaire } from "@/components/types";
import { fallbackTriage } from "@/components/triageFallback";

const TriageResultSchema = z.object({
  triage_level: z.enum(["emergency", "urgent", "non_urgent", "self_care"]),
  summary: z.string(),
  rationale: z.array(z.string()).min(1),
  possible_conditions: z
    .array(
      z.object({
        name: z.string(),
        likelihood: z.enum(["high", "medium", "low"]),
        why_it_fits: z.string()
      })
    )
    .min(1)
    .max(6),
  self_care: z.array(z.string()).min(1).max(10),
  pharmacy_advice: z.array(z.string()).min(1).max(10),
  see_doctor: z.array(z.string()).min(1).max(10),
  emergency_actions: z.array(z.string()).min(1).max(10),
  red_flags_to_watch: z.array(z.string()).min(1).max(12),
  disclaimer: z.string()
});

function safeJson<T>(value: unknown, schema: z.ZodSchema<T>): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error(parsed.error.message);
  return parsed.data;
}

export async function POST(req: Request) {
  const { questionnaire } = (await req.json()) as { questionnaire?: Questionnaire };

  if (!questionnaire || !Array.isArray(questionnaire.symptoms)) {
    return new NextResponse("Invalid request body", { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const result = fallbackTriage(questionnaire);
    return NextResponse.json({ result });
  }

  const client = new OpenAI({ apiKey });
  const q = questionnaire;

  const system = [
    "You are an evidence-informed clinical triage assistant for general health.",
    "Your job is to help a user understand symptom severity and whether to: seek emergency care, urgent care, non-urgent clinician care, or self-care/pharmacy.",
    "You MUST be conservative and safety-first: if red flags are present, recommend urgent or emergency care.",
    "You MUST NOT diagnose with certainty; present possible conditions as hypotheses.",
    "Provide practical next steps including pharmacy guidance where appropriate.",
    "Assume you have no access to vitals, labs, or physical exam unless explicitly provided.",
    "Do not request identifying information."
  ].join("\n");

  const user = {
    symptoms: q.symptoms,
    ageYears: q.ageYears,
    sex: q.sex,
    duration: { value: q.durationValue, unit: q.duration },
    severity_1_to_5: q.severity,
    fever: q.fever,
    pregnancy: q.pregnancy,
    redFlags: q.redFlags,
    notes: q.notes
  };

  try {
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-2024-08-06",
      input: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            "Return a triage guidance JSON object that matches the schema exactly. " +
            "Be concise and action-oriented. " +
            "If suicidalThoughts is true, triage_level MUST be emergency and include crisis guidance." +
            "\n\nUser questionnaire:\n" +
            JSON.stringify(user, null, 2)
        }
      ],
      text: { format: zodTextFormat(TriageResultSchema, "triage_result") },
      store: false
    });

    const result = safeJson(response.output_parsed, TriageResultSchema);
    return NextResponse.json({ result });
  } catch (err: any) {
    const fallback = fallbackTriage(questionnaire);
    return NextResponse.json(
      {
        result: fallback,
        note: "AI triage unavailable; returned fallback guidance."
      },
      { status: 200 }
    );
  }
}
