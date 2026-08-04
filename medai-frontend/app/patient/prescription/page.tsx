"use client";

import { useState } from "react";
import { analyzePrescription } from "@/services/prescription";

interface PrescriptionResult {
  medicines: string[];
  purpose: string[];
  dosage: string[];
  precautions: string[];
  doctor_advice: string;
}

export default function PrescriptionAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrescriptionResult | null>(null);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a prescription.");
      return;
    }

    try {
      setLoading(true);

      const data = await analyzePrescription(file);

      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Unable to analyze prescription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">
        AI Prescription Analyzer
      </h1>

      <div className="bg-white rounded-xl shadow p-8">

        <div className="flex flex-col md:flex-row gap-4 items-center">

          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-blue-400 rounded-lg px-6 py-4 font-medium text-gray-700 transition">
            📄 Choose Prescription

            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
            />
          </label>

          {file && (
            <span className="text-gray-600 font-medium">
              {file.name}
            </span>
          )}

          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Upload & Analyze"}
          </button>

        </div>

      </div>

      {result && (
        <div className="space-y-8">

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold mb-6">
              Medicines
            </h2>

            <div className="overflow-x-auto">

              <table className="w-full border">

                <thead className="bg-blue-600 text-white">

                  <tr>
                    <th className="p-3 text-left">Medicine</th>
                    <th className="p-3 text-left">Purpose</th>
                    <th className="p-3 text-left">Dosage</th>
                  </tr>

                </thead>

                <tbody>

                  {result.medicines.map((medicine, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-3 font-semibold">
                        {medicine}
                      </td>

                      <td className="p-3">
                        {result.purpose[index]}
                      </td>

                      <td className="p-3">
                        {result.dosage[index]}
                      </td>
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">

            <h2 className="text-2xl font-bold mb-4">
              Precautions
            </h2>

            <ul className="list-disc ml-6 space-y-2">

              {result.precautions.map((item, index) => (
                <li key={index}>
                  {item}
                </li>
              ))}

            </ul>

          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">

            <h2 className="text-2xl font-bold text-blue-700 mb-3">
              Doctor&apos;s Advice
            </h2>

            <p className="text-gray-700 leading-7">
              {result.doctor_advice}
            </p>

          </div>

        </div>
      )}
    </div>
  );
}