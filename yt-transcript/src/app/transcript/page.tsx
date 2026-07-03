"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TranscriptEntry {
  start: number;
  duration: number;
  text: string;
  startTime: string;
}

interface TranscriptData {
  videoId: string;
  transcript: TranscriptEntry[];
  fullText: string;
  summary?: string;
}

function getInitialData(): TranscriptData | null {
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("yt-transcript");
    if (stored) return JSON.parse(stored) as TranscriptData;
  }
  return null;
}

export default function TranscriptPage() {
  const router = useRouter();
  const [data] = useState<TranscriptData | null>(getInitialData);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"segmented" | "full" | "summary">("segmented");

  useEffect(() => {
    if (!getInitialData()) {
      router.push("/");
    }
  }, [router]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setViewMode("segmented")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "segmented"
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Segments
              </button>
              <button
                onClick={() => setViewMode("full")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "full"
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Full Text
              </button>
              {data.summary && (
                <button
                  onClick={() => setViewMode("summary")}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === "summary"
                      ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Summary
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const textToCopy =
                    viewMode === "full"
                      ? data.fullText
                      : viewMode === "summary"
                        ? data.summary || ""
                        : data.transcript
                            .map((e) => `[${e.startTime}] ${e.text}`)
                            .join("\\n");
                  copyToClipboard(textToCopy);
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <img
            src={`https://img.youtube.com/vi/${data.videoId}/mqdefault.jpg`}
            alt="Video thumbnail"
            className="w-40 rounded-lg"
          />
          <div>
            <h1 className="text-lg font-semibold">Transcript</h1>
            <a
              href={`https://www.youtube.com/watch?v=${data.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-red-500 hover:underline"
            >
              youtube.com/watch?v={data.videoId}
            </a>
          </div>
        </div>

        {viewMode === "segmented" ? (
          <div className="space-y-1">
            {data.transcript.map((entry, i) => (
              <div
                key={i}
                className="flex gap-3 py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 group transition-colors"
              >
                <span className="text-xs text-gray-400 font-mono mt-0.5 w-12 shrink-0 select-all">
                  {entry.startTime}
                </span>
                <span className="text-sm leading-relaxed">{entry.text}</span>
              </div>
            ))}
          </div>
        ) : viewMode === "full" ? (
          <div className="text-base leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {data.fullText}
          </div>
        ) : (
          <div className="text-base leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            <h2 className="text-xl font-bold mb-4">AI-Generated Summary</h2>
            <p className="mb-6">{data.summary || ""}</p>
            {data.summary && (
              <div className="text-sm text-gray-500">
                <em>Summary generated using Blackbox AI</em>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
