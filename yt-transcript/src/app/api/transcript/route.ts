import { type NextRequest } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const videoUrl = request.nextUrl.searchParams.get("url");

  if (!videoUrl) {
    return Response.json(
      { error: "Missing 'url' query parameter" },
      { status: 400 }
    );
  }

  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    return Response.json(
      { error: "Invalid YouTube URL or video ID" },
      { status: 400 }
    );
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    const entries = transcript.map((item) => ({
      start: item.offset / 1000,
      duration: item.duration / 1000,
      text: item.text,
      startTime: formatTime(item.offset / 1000),
    }));

    const fullText = entries.map((e) => e.text).join(" ");

    return Response.json({
      videoId,
      transcript: entries,
      fullText,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (message.includes("Could not get the transcript")) {
      return Response.json(
        {
          error:
            "No captions available for this video. The video may not have subtitles enabled.",
        },
        { status: 404 }
      );
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
