// No import needed for Deno.serve in modern Supabase Edge Functions

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { systemContext, userText, messages } = body;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
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
      rawMessages = [{ role: 'user', content: userText }];
    } else {
      throw new Error('Either "userText" or "messages" must be provided in the request body.');
    }

    // Convert to Gemini format
    const contents = rawMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemContext || "" }]
      },
      contents,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 400,
        topP: 0.9,
        topK: 40,
      }
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
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.timeEnd("gemini");

    // Validate Gemini response structure
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini API returned an empty response candidates array.');
    }

    const generatedText = data.candidates[0]?.content?.parts
      ?.map((part: any) => part.text || "")
      .join("");

    if (typeof generatedText !== 'string' || !generatedText) {
      throw new Error('Failed to extract text from Gemini response.');
    }

    // Convert back to format expected by frontend (OpenAI-style)
    const formattedResponse = {
      choices: [
        {
          message: {
            content: generatedText
          }
        }
      ]
    };

    return new Response(JSON.stringify(formattedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});