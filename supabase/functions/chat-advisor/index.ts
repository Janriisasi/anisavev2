// No import needed for Deno.serve in modern Supabase Edge Functions

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
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

    // Support two modes:
    // 1. Legacy quick-prompt mode: { systemContext, userText }
    // 2. Multi-turn chat mode: { systemContext, messages }
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

    // Convert to Gemini format
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
        maxOutputTokens: 2000,
        topP: 0.9,
        topK: 40,
      },
    };

    console.time("gemini");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geminiPayload),
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.timeEnd("gemini");

    // Validate Gemini response structure
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error(
        "Gemini API returned an empty response candidates array.",
      );
    }

    // DIAGNOSTIC LOGGING
    console.log("🔍 GEMINI RESPONSE DEBUG:");
    console.log("Full response data:", JSON.stringify(data, null, 2));
    console.log("Candidate count:", data.candidates.length);
    console.log(
      "First candidate:",
      JSON.stringify(data.candidates[0], null, 2),
    );

    const candidate = data.candidates[0];
    const finishReason = candidate?.finishReason;
    console.log("⚠️ FINISH REASON:", finishReason);
    if (finishReason !== "STOP") {
      console.warn(
        "⚠️ Response may be incomplete! Finish reason:",
        finishReason,
      );
    }

    console.log("📦 PARTS ARRAY DEBUG:");
    console.log("Number of parts:", candidate?.content?.parts?.length);
    candidate?.content?.parts?.forEach((part: any, index: number) => {
      console.log(`Part ${index}:`);
      console.log("  Type:", typeof part.text);
      console.log("  Length:", part.text?.length);
      console.log("  Content (first 200 chars):", part.text?.substring(0, 200));
      console.log(
        "  Content (last 100 chars):",
        part.text?.substring(Math.max(0, (part.text?.length || 1) - 100)),
      );
    });

    const generatedText = candidate?.content?.parts
      ?.map((part: any) => part.text || "")
      .join("");

    console.log("✅ Extracted text length:", generatedText?.length);
    console.log(
      "✅ Extracted text (first 500 chars):",
      generatedText?.substring(0, 500),
    );
    console.log(
      "✅ Extracted text (last 200 chars):",
      generatedText?.substring(Math.max(0, (generatedText?.length || 1) - 200)),
    );

    if (typeof generatedText !== "string" || !generatedText) {
      throw new Error("Failed to extract text from Gemini response.");
    }

    // Convert back to format expected by frontend (OpenAI-style)
    const formattedResponse = {
      choices: [
        {
          message: {
            content: generatedText,
          },
        },
      ],
    };

    console.log("✅ Final response being sent to frontend:");
    console.log(
      "Content length:",
      formattedResponse.choices[0].message.content.length,
    );
    console.log(
      "Content (first 500 chars):",
      formattedResponse.choices[0].message.content.substring(0, 500),
    );

    return new Response(JSON.stringify(formattedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
