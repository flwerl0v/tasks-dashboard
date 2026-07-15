// Supabase Edge Function: ai-summary
// Deploy with: supabase functions deploy ai-summary
// Set the secret once with: supabase secrets set OPENAI_API_KEY=sk-...
//
// The OpenAI key must live here, server-side — never ship it in the Vite client bundle.
// The frontend calls this function's URL via VITE_AI_SUMMARY_ENDPOINT (see src/lib/aiSummary.ts).

import OpenAI from 'npm:openai@6'

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SummaryStats {
  totalTasks: number
  doneTasks: number
  doingTasks: number
  todoTasks: number
  blockedTasks: number
  overdueTasks: number
  overloadedMembers: string[]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const stats: SummaryStats = await req.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'คุณเป็นผู้ช่วยสรุปภาพรวมงานให้ผู้จัดการทีม ตอบเป็นภาษาไทย กระชับ 2-4 ประโยค เน้นสิ่งที่ต้องติดตามเร่งด่วน',
        },
        { role: 'user', content: JSON.stringify(stats) },
      ],
      max_tokens: 300,
    })

    const summary = completion.choices[0]?.message?.content ?? 'ไม่สามารถสร้างสรุปได้ในขณะนี้'

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
