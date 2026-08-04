"use client";

import { useState } from "react";
import { toast } from "sonner";
import { explainDisease } from "@/services/disease";
import { toApiError } from "@/services/api";

interface DiseaseResult {
  disease: string;
  overview: string;
  causes: string[];
  symptoms: string[];
  risk_factors: string[];
  prevention: string[];
  treatment: string[];
  when_to_see_doctor: string;
}

export default function DiseaseExplanation() {
  const [disease, setDisease] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);

  const handleExplain = async () => {
    if (!disease.trim()) {
      toast.error("Please enter a disease name.");
      return;
    }

    try {
      setLoading(true);

      const data = await explainDisease(disease);

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
        AI Disease Explanation
      </h1>

      <div className="rounded-xl bg-card shadow ring-1 ring-foreground/10 p-6">

        <input
          type="text"
          placeholder="Example: Flu"
          className="w-full border rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={disease}
          onChange={(e) => setDisease(e.target.value)}
        />

        <button
          onClick={handleExplain}
          disabled={loading}
          className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-60"
        >
          {loading ? "Loading..." : "Explain Disease"}
        </button>

      </div>

      {result && (

        <div className="rounded-xl bg-card shadow ring-1 ring-foreground/10 p-6 space-y-8">

          <div>
            <h2 className="text-2xl font-bold text-blue-600">
              {result.disease}
            </h2>

            <p className="mt-3 text-muted-foreground">
              {result.overview}
            </p>
          </div>

          <Section
            title="Causes"
            items={result.causes}
          />

          <Section
            title="Symptoms"
            items={result.symptoms}
          />

          <Section
            title="Risk Factors"
            items={result.risk_factors}
          />

          <Section
            title="Prevention"
            items={result.prevention}
          />

          <Section
            title="Treatment"
            items={result.treatment}
          />

          <div>

            <h2 className="text-xl font-bold mb-3 text-red-600">
              When to See a Doctor
            </h2>

            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <p className="font-semibold text-red-700">
                {result.when_to_see_doctor}
              </p>
            </div>

          </div>

        </div>

      )}

    </div>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>

      <h2 className="text-xl font-bold mb-3">
        {title}
      </h2>

      <ul className="list-disc ml-6 space-y-2">
        {items.map((item, index) => (
          <li key={index}>
            {item}
          </li>
        ))}
      </ul>

    </div>
  );
}