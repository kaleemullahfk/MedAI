"use client";

import { useState } from "react";
import { toast } from "sonner";
import { recommendMedicine } from "@/services/medicine";
import { toApiError } from "@/services/api";

interface MedicineResult {
  possible_conditions: string[];
  otc_medicines: string[];
  home_remedies: string[];
  precautions: string[];
  doctor_visit: string;
}

export default function MedicineRecommendation() {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedicineResult | null>(null);

  const handleRecommend = async () => {
    if (!symptoms.trim()) {
      toast.error("Please enter your symptoms.");
      return;
    }

    try {
      setLoading(true);

      const data = await recommendMedicine(symptoms);

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
        AI Medicine Recommendation
      </h1>

      <div className="rounded-xl bg-card shadow ring-1 ring-foreground/10 p-6">

        <textarea
          rows={6}
          className="w-full border rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Example: Fever, headache, sore throat..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
        />

        <button
          onClick={handleRecommend}
          disabled={loading}
          className="mt-5 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Recommend Medicine"}
        </button>

      </div>

      {result && (
        <div className="rounded-xl bg-card shadow ring-1 ring-foreground/10 p-6 space-y-8">

          {/* Possible Conditions */}

          <div>
            <h2 className="text-xl font-bold mb-3">
              Possible Conditions
            </h2>

            <ul className="list-disc ml-6 space-y-1">
              {result.possible_conditions.map((condition, index) => (
                <li key={index}>
                  {condition}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Medicines */}

          <div>
            <h2 className="text-xl font-bold mb-3">
              Recommended OTC Medicines
            </h2>

            <ul className="list-disc ml-6 space-y-1">
              {result.otc_medicines.map((medicine, index) => (
                <li key={index}>
                  {medicine}
                </li>
              ))}
            </ul>
          </div>

          {/* Home Remedies */}

          <div>
            <h2 className="text-xl font-bold mb-3">
              Home Remedies
            </h2>

            <ul className="list-disc ml-6 space-y-1">
              {result.home_remedies.map((item, index) => (
                <li key={index}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Precautions */}

          <div>
            <h2 className="text-xl font-bold mb-3">
              Precautions
            </h2>

            <ul className="list-disc ml-6 space-y-1">
              {result.precautions.map((item, index) => (
                <li key={index}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Doctor Visit */}

          <div>
            <h2 className="text-xl font-bold mb-3">
              When to Visit a Doctor
            </h2>

            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <p className="text-red-700 font-semibold">
                {result.doctor_visit}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}