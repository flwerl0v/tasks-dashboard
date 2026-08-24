import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Supabase Secrets')
    }

    const body = await req.json()
    const payloadData = body.payload || body

    const promptText = `วิเคราะห์ภาระงานนี้อย่างละเอียดสั้นๆ (ภาษาไทย): ${JSON.stringify(payloadData)}
ตอบในรูปแบบ JSON ดังนี้เท่านั้น:
{
  "summary": "สรุปวิเคราะห์ภาระงานโดยละเอียด",
  "risk_reason": "เหตุผล/ความเสี่ยงที่วิเคราะห์ได้",
  "suggested_action": "คำแนะนำเฉพาะบุคคล"
}`

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`

    let response: Response | null = null
    let resText = ''

    // Retry สูงสุด 3 รอบเมื่อโดน Rate Limit (429) หรือ Gemini โอเวอร์โหลดชั่วคราว (5xx) ก่อนจะยอมแพ้
    for (let attempt = 1; attempt <= 3; attempt++) {
      response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingBudget: 0 }
          }
        }),
      })
      resText = await response.text()

      const isTransientError = response.status === 429 || response.status >= 500
      if (isTransientError && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt))
        continue
      }
      break
    }

    if (!response || !response.ok) {
      console.warn(`[workload-insight] Gemini API Error ${response?.status}: ${resText}`)
      // สำคัญ: ส่ง status ที่ไม่ใช่ 200 กลับไป เพื่อให้ฝั่ง client รู้ว่า AI ล้มเหลวจริง
      // และ fallback ไปใช้ผลลัพธ์แบบ rule-based (source: 'fallback') แทนการปลอมเป็นผลจาก AI
      return new Response(
        JSON.stringify({ error: `Gemini API Error ${response?.status}`, detail: resText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response?.status || 502 }
      )
    }

    const result = JSON.parse(resText)
    const rawContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const parsedData = JSON.parse(rawContent)

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('[workload-insight] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})