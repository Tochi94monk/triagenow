import SymptomChecker from "../components/SymptomChecker";
export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-semibold">
              TN
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">TriageNow</h1>
              <p className="text-sm text-slate-600">AI-assisted symptom severity guidance for general health</p>
            </div>
          </div>
          <a href="#privacy" className="text-sm text-slate-600 hover:text-slate-900 underline underline-offset-4">
            Privacy
          </a>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Important:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>This tool provides information, not a medical diagnosis.</li>
            <li>If you think this is an emergency, call your local emergency number or go to the nearest emergency department.</li>
            <li>Do not delay seeking care because of what you read here.</li>
          </ul>
        </div>
      </header>

      <section className="mt-8">
        <SymptomChecker />
      </section>

      <section id="privacy" className="mt-10 border-t border-slate-200 pt-8">
        <h2 className="text-lg font-semibold">Privacy</h2>
        <div className="mt-2 text-sm text-slate-700 space-y-2">
          <p>
            By default, this app is designed to be anonymous: it does not ask for your name, email, or phone number.
            Your answers are used to generate guidance and are not stored in a database.
          </p>
          <p>
            If you choose to share a summary with a doctor/pharmacy, the app will generate a message for you to copy or
            send using your own email client. You remain in control of what you share.
          </p>
        </div>
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
        Built for demonstration and educational purposes. Always consult a licensed clinician for medical advice.
      </footer>
    </main>
  );
}
