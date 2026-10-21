"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { Button, Input, Stepper } from "@physio/ui";
import { useIntake } from "../intake-store";

const STEPS = [
  { id: "complaint", label: "Your concern" },
  { id: "bodyRegion", label: "Body area" },
  { id: "onset", label: "When it started" },
  { id: "painScore", label: "Pain level" },
  { id: "history", label: "History" },
  { id: "medications", label: "Medications" },
  { id: "redFlags", label: "Safety check" },
  { id: "review", label: "Review" },
];

export default function IntakeStepPage() {
  const router = useRouter();
  const params = useParams<{ step: string }>();
  const stepId = params.step;

  const { draft, update } = useIntake();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentIndex = STEPS.findIndex((s) => s.id === stepId);
  const nextStep = STEPS[currentIndex + 1];
  const prevStep = STEPS[currentIndex - 1];

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/triage/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint: draft.complaint,
          bodyRegion: draft.bodyRegion,
          onset: draft.onset,
          painScore: draft.painScore,
          history: draft.history || undefined,
          medications: draft.medications || undefined,
          redFlagAnswers: Object.entries(draft.redFlags).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? "Failed to submit");
      }
      const data = await res.json();
      router.push(`/app/triage/result?id=${data.triage.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-4 pb-24">
      <Stepper
        steps={STEPS}
        currentStepId={stepId}
        completedStepIds={STEPS.slice(0, currentIndex).map((s) => s.id)}
      />

      <div className="mt-8">
        {stepId === "complaint" && (
          <Input
            label="Describe your main concern"
            value={draft.complaint}
            onChange={(e) => update({ complaint: e.target.value })}
            hint="What's bothering you most?"
          />
        )}
        {stepId === "bodyRegion" && (
          <div className="grid grid-cols-2 gap-2">
            {["NECK", "SHOULDER", "ELBOW", "WRIST_HAND", "UPPER_BACK", "LOWER_BACK", "HIP", "KNEE", "ANKLE_FOOT", "OTHER"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => update({ bodyRegion: r })}
                className={`h-12 rounded-md border text-sm font-medium ${draft.bodyRegion === r
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-border bg-surface"
                  }`}
              >
                {r.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        )}
        {stepId === "onset" && (
          <Input
            label="When did it start?"
            value={draft.onset}
            onChange={(e) => update({ onset: e.target.value })}
            hint="e.g. '3 days ago after a run'"
          />
        )}
        {stepId === "painScore" && (
          <div>
            <label className="text-sm font-medium">Pain level (0–10)</label>
            <p className="mt-2 text-5xl font-semibold text-primary-600">{draft.painScore}</p>
            <input
              type="range"
              min={0}
              max={10}
              value={draft.painScore}
              onChange={(e) => update({ painScore: Number(e.target.value) })}
              className="mt-4 w-full"
            />
          </div>
        )}
        {stepId === "history" && (
          <Input
            label="Relevant medical history (optional)"
            value={draft.history}
            onChange={(e) => update({ history: e.target.value })}
          />
        )}
        {stepId === "medications" && (
          <Input
            label="Current medications (optional)"
            value={draft.medications}
            onChange={(e) => update({ medications: e.target.value })}
          />
        )}
        {stepId === "redFlags" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              These questions help us keep you safe. Answer honestly.
            </p>
            {[
              { id: "major_trauma", label: "Major injury, fall, or suspected fracture in the last 2 weeks?" },
              { id: "neuro_progressive_weakness", label: "Weakness in arms or legs getting worse?" },
              { id: "neuro_bladder_bowel", label: "New loss of bladder or bowel control?" },
              { id: "neuro_saddle_numbness", label: "Numbness around saddle area?" },
              { id: "cardioresp", label: "Chest pain, breathlessness, or signs of a clot?" },
              { id: "systemic", label: "Unexplained weight loss, fever, or night pain?" },
              { id: "post_op_complication", label: "Wound or swelling complications after surgery?" },
              { id: "severe_worsening", label: "Severe pain getting rapidly worse?" },
              { id: "post_op_planned", label: "Recovering from surgery in the last 6 weeks?" },
              { id: "mobility_limited", label: "Mobility significantly limited?" },
            ].map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface p-3"
              >
                <span className="text-sm">{q.label}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => update({ redFlags: { ...draft.redFlags, [q.id]: false } })}
                    className={`h-9 rounded-md px-3 text-sm ${draft.redFlags[q.id] === false ? "bg-success-500 text-white" : "bg-neutral-100"
                      }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ redFlags: { ...draft.redFlags, [q.id]: true } })}
                    className={`h-9 rounded-md px-3 text-sm ${draft.redFlags[q.id] === true ? "bg-danger-500 text-white" : "bg-neutral-100"
                      }`}
                  >
                    Yes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {stepId === "review" && (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <strong>Concern:</strong>{" "}
              {draft.complaint || <em className="text-danger-700">Not provided</em>}
            </p>
            <p>
              <strong>Body area:</strong>{" "}
              {draft.bodyRegion || <em className="text-danger-700">Not provided</em>}
            </p>
            <p>
              <strong>Onset:</strong>{" "}
              {draft.onset || <em className="text-danger-700">Not provided</em>}
            </p>
            <p>
              <strong>Pain:</strong> {draft.painScore}/10
            </p>
            {error && <p className="text-danger-700">{error}</p>}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface p-4">
        <div className="mx-auto flex max-w-xl gap-3">
          {prevStep && (
            <Button variant="secondary" onClick={() => router.push(`/app/intake/${prevStep.id}`)}>
              Back
            </Button>
          )}
          {stepId === "review" ? (
            <Button onClick={onSubmit} loading={submitting} fullWidth>
              Submit intake
            </Button>
          ) : (
            <Button
              onClick={() => nextStep && router.push(`/app/intake/${nextStep.id}`)}
              fullWidth
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}