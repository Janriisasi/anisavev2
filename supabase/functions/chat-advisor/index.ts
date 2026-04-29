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
    const { systemContext, userText } = body;
    const hfToken = Deno.env.get('HF_TOKEN');

    if (!hfToken) {
      throw new Error('HF_TOKEN is not set in environment variables')
    }

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions", // Updated: main HF router (not featherless-ai)
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemma-4-31B-it:together", // Updated: larger model via Together provider
          messages: [
            { role: "system", content: systemContext },
            { role: "user", content: userText },
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