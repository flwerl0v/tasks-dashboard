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
  dueSoonTasks: number
  overloadedMembers: string[]
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let stats: SummaryStats | null = null

  try {
    stats = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY secret')
    }

    const systemPrompt = `คุณเป็นผู้ช่วยสรุปภาพรวมงานให้ผู้จัดการทีม ตอบเป็นภาษาไทย 3-5 ประโยค ห้ามใช้หัวข้อย่อยหรือ markdown ให้เขียนเป็นย่อหน้าเดียวที่อ่านต่อเนื่อง
ต้องครอบคลุมประเด็นต่อไปนี้ตามลำดับ (ข้ามข้อไหนก็ได้ถ้าค่าเป็น 0):
1. ภาพรวมจำนวนงานทั้งหมด จำนวนงานที่เสร็จแล้วพร้อมเปอร์เซ็นต์ และจำนวนงานที่กำลังทำ
2. จำนวนงานที่ติดปัญหา (blocked) และจำนวนงานที่ใกล้ครบกำหนดภายในไม่กี่วัน ถ้ามี
3. จำนวนงานที่เกินกำหนดแล้ว ถ้ามี ให้เน้นย้ำว่าควรติดตามเร่งด่วน
4. เอ่ยชื่อสมาชิกที่มีภาระงานสูงกว่าปกติ (ถ้ามีในข้อมูล) ตรงๆ ไม่ต้องอ้อม
5. ปิดท้ายด้วยคำแนะนำเชิงปฏิบัติ 1 ประโยคที่ผู้จัดการทำตามได้ทันที (เช่น ควรติดตามใคร หรืองานไหนก่อน)`
    
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`

    let response: Response | null = null
    let geminiData: any = null

    // Retry Logic: หากโดน 429 ให้ลองยิงซ้ำสูงสุด 3 รอบ
    for (let attempt = 1; attempt <= 3; attempt++) {
      response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nข้อมูลสถิติภาระงาน:\n${JSON.stringify(stats)}` }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      })

      geminiData = await response.json()

      // ถ้าติด Rate Limit (429) หรือ Gemini โอเวอร์โหลดชั่วคราว (5xx) ให้เว้นระยะแล้วยิงใหม่
      if ((response.status === 429 || response.status >= 500) && attempt < 3) {
        await sleep(2000 * attempt)
        continue
      }

      break
    }

    // กรณี Gemini API มีปัญหา หรือ Quota เต็ม
    if (!response || !response.ok) {
      console.warn(`[ai-summary] Gemini API Error status ${response?.status}: ${geminiData?.error?.message}`)
      
      const fallbackSummary = buildFallbackSummary(stats)
      return new Response(JSON.stringify({ summary: fallbackSummary, is_fallback: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const finishReason = geminiData.candidates?.[0]?.finishReason
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    // ถ้าโดนตัดกลางประโยค (หมด token budget) ให้ใช้ fallback แทนข้อความที่ขาดๆ
    if (finishReason === 'MAX_TOKENS' || !rawText) {
      console.warn(`[ai-summary] Gemini response truncated or empty (finishReason=${finishReason})`)
      return new Response(JSON.stringify({ summary: buildFallbackSummary(stats), is_fallback: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const summary = rawText

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: any) {
    console.error('[ai-summary] Error:', err)
    
    // Safety Fallback ระดับ Outer Catch
    const fallbackText = stats 
      ? buildFallbackSummary(stats) 
      : 'ภาพรวมภาระงานของทีมสัปดาห์นี้อยู่ในเกณฑ์ปกติ (ระบบวิเคราะห์ชั่วคราว)'

    return new Response(JSON.stringify({ 
      summary: fallbackText, 
      error: err.message 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ฟังก์ชันสร้าง Fallback Text
function buildFallbackSummary(stats: SummaryStats | null): string {
  if (!stats) return 'ภาพรวมภาระงานของทีมสัปดาห์นี้อยู่ในเกณฑ์ปกติ'
  const donePercent = stats.totalTasks > 0 ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0
  const parts = [
    `ภาพรวมสัปดาห์นี้มีงานทั้งหมด ${stats.totalTasks} งาน เสร็จแล้ว ${stats.doneTasks} งาน (${donePercent}%) กำลังทำ ${stats.doingTasks} งาน และยังไม่เริ่ม ${stats.todoTasks} งาน`,
    stats.blockedTasks > 0 ? `มีงานติดปัญหา ${stats.blockedTasks} งานที่ควรเข้าไปช่วยปลดล็อก` : null,
    stats.dueSoonTasks > 0 ? `มีงานใกล้ครบกำหนด ${stats.dueSoonTasks} งานภายใน 3 วันข้างหน้า` : null,
    stats.overdueTasks > 0
      ? `พบงานเกินกำหนด ${stats.overdueTasks} งาน ควรติดตามอย่างใกล้ชิด`
      : 'ไม่มีงานเกินกำหนดในขณะนี้',
    stats.overloadedMembers.length > 0
      ? `ควรติดตามภาระงานของ ${stats.overloadedMembers.join(', ')} ที่มีภาระงานสูงกว่าระดับปกติ และงานที่ใกล้ครบกำหนดอย่างใกล้ชิด`
      : 'ภาระงานของทีมโดยรวมอยู่ในระดับสมดุล',
  ]
  return parts.filter(Boolean).join(' ')
}