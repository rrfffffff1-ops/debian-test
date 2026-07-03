import { type NextRequest } from "next/server";

interface TranscriptEntry {
  text: string;
  duration: number;
  start: number;
}

export async function POST(request: NextRequest) {
  try {
    const { videoId, transcript } = await request.json();

    if (!videoId) {
      return Response.json(
        { error: "Missing videoId" },
        { status: 400 }
      );
    }

    if (!transcript || transcript.length === 0) {
      return Response.json(
        { error: "Missing transcript data" },
        { status: 400 }
      );
    }

    // Check if Blackbox API key is configured
    const apiKey = process.env.BLACKBOX_API_KEY;
    if (!apiKey || apiKey === "your_blackbox_api_key_here") {
      // Return a mock summary when no API key is provided
      const fullText = (transcript as TranscriptEntry[]).map((entry) => entry.text).join(" ");

      // Generate a simple extractive summary as fallback
      const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
      const summaryLength = Math.min(3, sentences.length);
      const summary = sentences.slice(0, summaryLength).join(" ").trim();

      return Response.json({
        videoId,
        summary: `${summary}[Note: This is a fallback summary. To use AI-powered summarization, please configure your Blackbox API key in the .env file.]`,
      });
    }

    // Import OpenAI only when needed (to avoid issues if not installed)
    const { OpenAI } = await import("openai");

    // Initialize OpenAI client for Blackbox
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.BLACKBOX_API_URL || "https://api.blackbox.ai/v1",
    });

    // Prepare the transcript text for summarization
    const fullText = (transcript as TranscriptEntry[]).map((entry) => entry.text).join(" ");

    // Create a prompt for summarization
    const prompt = `
Please provide a concise and informative summary of the following YouTube video transcript:

${fullText}

Summary:
`;

    // Call Blackbox LLM for summarization
    const completion = await openai.chat.completions.create({
      model: "blackboxai", // Using Blackbox model
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates clear, concise summaries of video transcripts.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message.content || "Failed to generate summary";

    return Response.json({
      videoId,
      summary,
    });
  } catch (error) {
    console.error("Error in summarize route:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    
    // Return a helpful error message
    return Response.json(
      { error: `Summarization failed: ${message}. Please check your Blackbox API configuration.` },
      { status: 500 }
    );
  }
}
