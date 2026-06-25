// No import needed for Deno.serve in modern Supabase Edge Functions

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { systemContext, userText, messages } = body;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    if (!systemContext || typeof systemContext !== "string") {
      throw new Error("Invalid systemContext");
    }

    let rawMessages: { role: string; content: string }[] = [];

    if (messages && Array.isArray(messages) && messages.length > 0) {
      rawMessages = messages;
    } else if (userText) {
      rawMessages = [{ role: "user", content: userText }];
    } else {
      throw new Error(
        'Either "userText" or "messages" must be provided in the request body.',
      );
    }

    const contents = rawMessages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemContext || "" }],
      },
      contents,
      generationConfig: {
        temperature: 0.5,
        // ✅ FIX 1: Raised from 2000 — 2.5 Flash uses tokens for thinking
        // on top of output, so 2000 was too low and caused truncation/500s
        maxOutputTokens: 8192,
        topP: 0.9,
        topK: 40,
        // ✅ FIX 2: Disable thinking entirely for this use case.
        // Gemini 2.5 Flash thinks by default; for short farming advice
        // responses, thinking adds latency and token cost with no benefit.
        // Set thinkingBudget: -1 to re-enable if you want thinking back.
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    };

    console.time("gemini");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      },
    );

    if (!response.ok) {
      // ✅ FIX 3: Log the full Gemini error body so you can debug future issues
      const errorText = await response.text();
      console.error(`Gemini HTTP ${response.status}:`, errorText);
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.timeEnd("gemini");

    if (!data.candidates || data.candidates.length === 0) {
      // ✅ FIX 4: Check for promptFeedback block — Gemini returns this
      // instead of candidates when the prompt is blocked by safety filters
      const blocked = data.promptFeedback?.blockReason;
      throw new Error(
        blocked
          ? `Gemini blocked the prompt: ${blocked}`
          : "Gemini API returned an empty candidates array.",
      );
    }

    const candidate = data.candidates[0];
    const finishReason = candidate?.finishReason;

    // ✅ FIX 5: Treat MAX_TOKENS as a hard error, not a warning.
    // Before this fix, a truncated response was silently returned to the
    // frontend, causing broken/cut-off Tagalog text.
    if (finishReason === "MAX_TOKENS") {
      throw new Error(
        "Gemini response was cut off (MAX_TOKENS). Increase maxOutputTokens or shorten the system context.",
      );
    }

    if (finishReason !== "STOP") {
      console.warn("Unexpected finishReason:", finishReason);
    }

    const generatedText = candidate?.content?.parts
      ?.map((part: any) => part.text || "")
      .join("");

    if (typeof generatedText !== "string" || !generatedText) {
      throw new Error("Failed to extract text from Gemini response.");
    }

    const formattedResponse = {
      choices: [
        {
          message: {
            content: generatedText,
          },
        },
      ],
    };

    return new Response(JSON.stringify(formattedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("chat-advisor error:", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
