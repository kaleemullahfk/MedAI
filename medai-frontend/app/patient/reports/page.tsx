"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { uploadReport } from "@/services/report";

interface ReportResult {
  summary: string;
  abnormal_values: string[];
  recommendations: string[];
}

export default function MedicalReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a report.");
      return;
    }

    try {
      setLoading(true);

      const data = await uploadReport(file);

      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Unable to analyze report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">

      <h1 className="text-3xl font-bold">
        AI Medical Report Analyzer
      </h1>

      {/* Upload Card */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <label
          htmlFor="report-upload"
          className="border-2 border-dashed border-blue-300 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition-all duration-300"
        >
          <Upload
            size={70}
            className="text-blue-600 mb-5"
          />

          <h2 className="text-2xl font-bold text-slate-800">
            Upload Medical Report
          </h2>

          <p className="text-gray-500 mt-2 text-center">
            Drag & Drop your report here
          </p>

          <p className="text-gray-400 mt-1">
            OR
          </p>

          <span className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition">
            Choose File
          </span>

          <p className="mt-5 text-sm text-gray-500">
            Supported: PDF • PNG • JPG • JPEG
          </p>

          {file && (
            <div className="mt-6 flex items-center gap-3 bg-green-100 border border-green-300 text-green-700 px-5 py-3 rounded-lg">
              <CheckCircle2 size={22} />
              <span className="font-medium">
                {file.name}
              </span>
            </div>
          )}
        </label>

        <input
          id="report-upload"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) =>
            setFile(e.target.files?.[0] || null)
          }
        />

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl text-lg font-semibold transition"
        >
          {loading
            ? "Analyzing Report..."
            : "Upload & Analyze"}
        </button>

      </div>

      {/* AI Result */}

      {result && (

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">

          {/* Summary */}

          <div>

            <div className="flex items-center gap-3 mb-3">
              <FileText className="text-blue-600" />
              <h2 className="text-2xl font-bold">
                Summary
              </h2>
            </div>

            <p className="text-gray-700 leading-8">
              {result.summary}
            </p>

          </div>

          {/* Abnormal Values */}

          <div>

            <h2 className="text-2xl font-bold mb-4">
              Abnormal Values
            </h2>

            {result.abnormal_values.length === 0 ? (

              <div className="bg-green-100 border border-green-300 text-green-700 rounded-xl p-5 flex items-center gap-3">
                <CheckCircle2 size={28} />
                <span className="font-medium">
                  No abnormal values detected.
                </span>
              </div>

            ) : (

              <ul className="list-disc ml-6 space-y-2">
                {result.abnormal_values.map((item, index) => (
                  <li key={index}>
                    {item}
                  </li>
                ))}
              </ul>

            )}

          </div>

          {/* Recommendations */}

          <div>

            <h2 className="text-2xl font-bold mb-4">
              Recommendations
            </h2>

            <ul className="list-disc ml-6 space-y-3">
              {result.recommendations.map((item, index) => (
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