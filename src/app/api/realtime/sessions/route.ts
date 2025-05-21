import { RealtimeSession } from "@/app/realtime/types";
export async function GET() {
  try {
    const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
    if (!OPEN_AI_API_KEY) throw new Error("OPEN_AI_API_KEY is not set");
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPEN_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "verse",
        instructions: "",
      }),
    });
    const data = (await r.json()) as RealtimeSession;
    return Response.json(data, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "[API] - Internal Server Error",
      },
      { status: 500 }
    );
  }
}
