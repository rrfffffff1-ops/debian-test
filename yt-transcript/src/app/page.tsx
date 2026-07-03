"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const router = useRouter();

  const handleTranscriptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ url: url.trim() });
      const res = await fetch(`/api/transcript?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch transcript");
        return;
      }

      // Store in sessionStorage for the transcript page
      sessionStorage.setItem("yt-transcript", JSON.stringify(data));
      router.push("/transcript");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setSummaryLoading(true);
    setError("");

    try {
      // First get the transcript
      const params = new URLSearchParams({ url: url.trim() });
      const transcriptRes = await fetch(`/api/transcript?${params}`);
      const transcriptData = await transcriptRes.json();

      if (!transcriptRes.ok) {
        setError(transcriptData.error || "Failed to fetch transcript");
        return;
      }

      // Then get the summary
      const summaryRes = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: transcriptData.videoId,
          transcript: transcriptData.transcript,
        }),
      });
      const summaryData = await summaryRes.json();

      if (!summaryRes.ok) {
        setError(summaryData.error || "Failed to generate summary");
        return;
      }

      // Store both transcript and summary in sessionStorage
      const enhancedData = {
        ...transcriptData,
        summary: summaryData.summary,
      };
      sessionStorage.setItem("yt-transcript", JSON.stringify(enhancedData));
      router.push("/transcript");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            YT Transcript
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Extract transcripts from any YouTube video (AI summarization requires Blackbox API configuration)
          </p>
        </div>

        <form onSubmit={handleTranscriptSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              placeholder="Paste YouTube URL or video ID..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
              disabled={loading || summaryLoading}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="px-6 py-3 rounded-xl bg-red-600 text-white font-medium text-base hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Fetching
                  </span>
                ) : (
                  "Get Transcript"
                )}
              </button>
              
              <button
                type="button"
                onClick={handleSummarySubmit}
                disabled={summaryLoading || !url.trim()}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {summaryLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Summarizing
                  </span>
                ) : (
                  "Get Summary"
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </form>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
            <div className="text-2xl mb-1">Paste</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Any YouTube video URL
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
            <div className="text-2xl mb-1">Extract</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Full transcript with timestamps
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
            <div className="text-2xl mb-1">Summarize</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI-powered video summaries (requires Blackbox API)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
