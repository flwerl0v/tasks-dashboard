import { CheckCircle2, XCircle } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { Card } from '../components/ui/Card'

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border-50 py-3 last:border-0">
      {ok ? <CheckCircle2 className="mt-0.5 shrink-0 text-success-500" size={18} /> : <XCircle className="mt-0.5 shrink-0 text-warning-500" size={18} />}
      <div>
        <p className="text-sm font-medium text-ink-700">{label}</p>
        <p className="text-xs text-ink-400">{detail}</p>
      </div>
    </div>
  )
}

export default function Settings() {
  const { isSupabaseConfigured, teams, members, tasks } = useAppData()
  const aiEndpointConfigured = Boolean(import.meta.env.VITE_AI_SUMMARY_ENDPOINT)
  const workloadInsightConfigured = Boolean(import.meta.env.VITE_WORKLOAD_INSIGHT_ENDPOINT)

  return (
    <div className="space-y-4">
      <Card title="สถานะการเชื่อมต่อ">
        <StatusRow
          ok={isSupabaseConfigured}
          label="Supabase Database"
          detail={
            isSupabaseConfigured
              ? 'เชื่อมต่อแล้ว — ข้อมูลทั้งหมดอ่าน/เขียนผ่าน Supabase'
              : 'ยังไม่ได้ตั้งค่า — ระบบต้องเชื่อมต่อ Supabase จึงจะใช้งานได้ กรุณาตั้งค่าตามขั้นตอนด้านล่าง'
          }
        />
        <StatusRow
          ok={aiEndpointConfigured}
          label="AI Summary Endpoint"
          detail={
            aiEndpointConfigured
              ? 'เชื่อมต่อแล้ว — เรียกใช้ Supabase Edge Function สำหรับสรุปภาพรวมด้วย AI'
              : 'ยังไม่ได้ตั้งค่า — ระบบจะใช้สรุปแบบคำนวณจากสถิติ (heuristic) แทนการเรียก AI'
          }
        />
        <StatusRow
          ok={workloadInsightConfigured}
          label="Workload Insight Endpoint"
          detail={
            workloadInsightConfigured
              ? 'เชื่อมต่อแล้ว — หน้า Workload (AI) จะเรียก AI มาอธิบายภาระงานรายคน/รายทีม'
              : 'ยังไม่ได้ตั้งค่า — หน้า Workload (AI) จะแสดงผลจากกฎการคำนวณ (rule-based) แทนการเรียก AI'
          }
        />
      </Card>

      <Card title="วิธีตั้งค่า Supabase">
        <ol className="list-inside list-decimal space-y-2 text-sm text-ink-600">
          <li>
            สร้างโปรเจกต์ใหม่ที่{' '}
            <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
              supabase.com/dashboard
            </a>
          </li>
          <li>
            เปิด <span className="font-mono text-xs">SQL Editor</span> แล้วรันไฟล์ <span className="font-mono text-xs">supabase/schema.sql</span> ในโปรเจกต์นี้
            เพื่อสร้างตาราง teams, members, tasks
          </li>
          <li>
            คัดลอก <span className="font-mono text-xs">.env.example</span> เป็น <span className="font-mono text-xs">.env</span> แล้วใส่ค่า
            <span className="font-mono text-xs"> VITE_SUPABASE_URL</span> และ <span className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</span> จากหน้า
            Project Settings → API
          </li>
          <li>รีสตาร์ท dev server (<span className="font-mono text-xs">npm run dev</span>)</li>
        </ol>
      </Card>

      <Card title="วิธีตั้งค่า AI Summary (ปลอดภัย — ไม่เปิดเผย API key ฝั่ง client)">
        <ol className="list-inside list-decimal space-y-2 text-sm text-ink-600">
          <li>
            Deploy Edge Function <span className="font-mono text-xs">supabase/functions/ai-summary</span> ด้วยคำสั่ง{' '}
            <span className="font-mono text-xs">supabase functions deploy ai-summary</span>
          </li>
          <li>
            ตั้งค่า secret: <span className="font-mono text-xs">supabase secrets set OPENAI_API_KEY=sk-...</span>
          </li>
          <li>
            ใส่ URL ของ Function ลงใน <span className="font-mono text-xs">VITE_AI_SUMMARY_ENDPOINT</span> ในไฟล์ .env
          </li>
        </ol>
      </Card>

      <Card title="วิธีตั้งค่า Workload Insight (AI อธิบายภาระงานรายคน/รายทีม)">
        <ol className="list-inside list-decimal space-y-2 text-sm text-ink-600">
          <li>
            Deploy Edge Function <span className="font-mono text-xs">supabase/functions/workload-insight</span> ด้วยคำสั่ง{' '}
            <span className="font-mono text-xs">supabase functions deploy workload-insight</span>
          </li>
          <li>
            ใช้ secret เดียวกับ AI Summary: <span className="font-mono text-xs">supabase secrets set OPENAI_API_KEY=sk-...</span>
          </li>
          <li>
            ใส่ URL ของ Function ลงใน <span className="font-mono text-xs">VITE_WORKLOAD_INSIGHT_ENDPOINT</span> ในไฟล์ .env
          </li>
        </ol>
      </Card>

      <Card title="สรุปข้อมูลปัจจุบัน">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-ink-900">{teams.length}</p>
            <p className="text-xs text-ink-400">ทีม</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-ink-900">{members.length}</p>
            <p className="text-xs text-ink-400">สมาชิก</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-ink-900">{tasks.length}</p>
            <p className="text-xs text-ink-400">งาน</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
