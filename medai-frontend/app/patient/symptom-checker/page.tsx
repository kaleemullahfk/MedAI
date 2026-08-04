"use client";

import { useState } from "react";
import { toast } from "sonner";
import { checkSymptoms } from "@/services/symptom";
import { toApiError } from "@/services/api";

interface AIResult {
  possible_conditions: string[];
  urgency: string;
  recommended_specialist: string;
  advice: string[];
}

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  const handleCheck = async () => {
    if (!symptoms.trim()) {
      toast.error("Please enter your symptoms.");
      return;
    }

    try {
      setLoading(true);

      const data = await checkSymptoms(symptoms);

      setResult(data);
    } catch (error) {
      console.error(error);
      toast.error(toApiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">
        AI Symptom Checker
      </h1>

      <div className="rounded-xl bg-card shadow ring-1 ring-foreground/10 p-6">
        <textarea
          rows={6}
          className="w-full border rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Example: Fever, headache, sore throat..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
        />

        <button
          onClick={handleCheck}
          disabled={loading}
          className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Analyze Symptoms"}
        </button>
      </div>

      {result && (
        <div className="rounded-xl bg-card shadow ring-1 ring-foreground/10 p-6 space-y-8">

          <h2 className="text-2xl font-bold">
            AI Analysis Result
          </h2>

          {/* Possible Conditions */}

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Possible Conditions
            </h3>

            <ul className="list-disc ml-6 space-y-1">
              {result.possible_conditions.map((condition, index) => (
                <li key={index}>
                  {condition}
                </li>
              ))}
            </ul>
          </div>

          {/* Urgency */}

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Urgency Level
            </h3>

            <span
              className={`px-4 py-2 rounded-lg text-white font-semibold ${
                result.urgency === "High"
                  ? "bg-red-600"
                  : result.urgency === "Medium"
                  ? "bg-yellow-500"
                  : "bg-green-600"
              }`}
            >
              {result.urgency}
            </span>
          </div>

          {/* Specialist */}

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Recommended Specialist
            </h3>

            <p className="text-muted-foreground">
              {result.recommended_specialist}
            </p>
          </div>

          {/* Advice */}

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Medical Advice
            </h3>

            <ul className="list-disc ml-6 space-y-1">
              {result.advice.map((item, index) => (
                <li key={index}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}
    </div>
  );
}