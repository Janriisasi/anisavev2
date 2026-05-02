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
    const hfToken = Deno.env.get('HF_TOKEN');

    if (!hfToken) {
      throw new Error('HF_TOKEN is not set in environment variables')
    }

    // Build the messages array for the HuggingFace API.
    // Supports two modes:
    //   1. Legacy quick-prompt mode: { systemContext, userText }
    //      → single user message
    //   2. Multi-turn chat mode: { systemContext, messages }
    //      → full conversation history [{ role, content }, ...]
    let chatMessages: { role: string; content: string }[] = [];

    if (messages && Array.isArray(messages) && messages.length > 0) {
      // Multi-turn chat — pass history as-is (already role/content pairs)
      chatMessages = messages;
    } else if (userText) {
      // Legacy single-question mode
      chatMessages = [{ role: 'user', content: userText }];
    } else {
      throw new Error('Either "userText" or "messages" must be provided in the request body.')
    }

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemma-4-31B-it:together",
          messages: [
            { role: "system", content: systemContext },
            ...chatMessages,
          ],
          max_tokens: 1000,
          temperature: 0.7,
          stream: false,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})