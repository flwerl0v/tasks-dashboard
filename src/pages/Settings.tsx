import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, ChevronRight, ListTodo, Settings as SettingsIcon, ShieldCheck, Users } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { AdminNavigateDialog, type NavigateDestination } from '../components/ui/AdminNavigateDialog'
import { StatusStack } from '../components/teams/StatusStack'
import { getTeamBadgeStyle } from '../lib/teamColor'
import { nameInitial } from '../lib/nameInitial'

const PREVIEW_MAX = 5

const countCardClass = 'block w-full rounded-md border border-border bg-surface px-[18px] py-3.5 text-left transition-colors hover:border-border-300'

interface CountCardProps {
  value: number
  label: string
  valueClass: string
  children: ReactNode
  onClick: () => void
}

function CountCard({ value, label, valueClass, children, onClick }: CountCardProps) {
  return (
    <button type="button" onClick={onClick} className={countCardClass}>
      <div className="flex items-baseline gap-2">
        <span className={`text-[26px] font-semibold leading-tight tabular-nums ${valueClass}`}>{value}</span>
        <span className="flex-1 text-sm text-ink-500">{label}</span>
        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary-700">
          ดูทั้งหมด <ChevronRight size={14} />
        </span>
      </div>
      <div className="mt-2.5 min-h-[22px]">{children}</div>
    </button>
  )
}

function MoreCount({ total }: { total: number }) {
  return total > PREVIEW_MAX ? <span className="ml-1.5 text-[11px] text-ink-500">+{total - PREVIEW_MAX}</span> : null
}

// Every "ดูทั้งหมด" card asks first, so leaving Settings is never an accidental click.
const DESTINATIONS = {
  admin: {
    path: '/admin',
    to: { label: 'Admin', icon: ShieldCheck, heading: 'หน้าจัดการ (Admin)', description: 'จัดการทีม สมาชิก และดูสรุปข้อมูลทั้งหมดของระบบ' },
  },
  team: {
    path: '/team?tab=members',
    to: { label: 'Team', icon: Users, heading: 'ทีมและสมาชิก', description: 'ดูทีมและสมาชิกทั้งหมด พร้อมภาระงานของแต่ละคน' },
  },
  tasks: {
    path: '/tasks',
    to: { label: 'Tasks', icon: ListTodo, heading: 'งานทั้งหมด', description: 'ดูและจัดการงานของทุกทีมในที่เดียว' },
  },
} satisfies Record<string, { path: string; to: NavigateDestination }>

type DestinationKey = keyof typeof DESTINATIONS

function CodeLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    })
  }
  return (
    <div className="mt-2 flex items-center gap-2.5 rounded-md bg-ink-900 px-3 py-2 font-mono text-xs text-ink-200">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap">{text}</code>
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center gap-1 rounded border border-ink-700 bg-ink-800 px-2 py-0.5 text-[11px] text-ink-300 transition-colors hover:text-white"
      >
        {copied && <Check size={11} className="text-success-500" />}
        {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
      </button>
    </div>
  )
}

const mono = 'rounded border border-border bg-surface-100 px-1.5 py-0.5 font-mono text-xs text-ink-700'

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol>
      {items.map((item, i) => (
        <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 && <span className="absolute bottom-0.5 left-3 top-7 w-px bg-border" aria-hidden />}
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface-100 text-xs font-semibold text-ink-600">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 pt-px text-sm leading-relaxed text-ink-600">{item}</div>
        </li>
      ))}
    </ol>
  )
}

interface Integration {
  key: string
  title: string
  ok: boolean
  okDetail: string
  noDetail: string
  steps: ReactNode[]
}

function IntegrationRow({ item, open, onToggle }: { item: Integration; open: boolean; onToggle: () => void }) {
  return (
    <div className="mb-2.5 overflow-hidden rounded-md border border-border last:mb-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 bg-surface px-4 py-3.5 text-left hover:bg-surface-50">
        <span className={`h-2 w-2 shrink-0 rounded-full ${item.ok ? 'bg-success-500' : 'bg-warning-500'}`} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink-900">{item.title}</span>
          <span className="mt-0.5 block text-xs text-ink-500">{item.ok ? item.okDetail : item.noDetail}</span>
        </span>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            item.ok ? 'border-success-500/30 bg-success-50 text-success-700' : 'border-warning-500/30 bg-warning-50 text-warning-700'
          }`}
        >
          {item.ok ? 'เชื่อมต่อแล้ว' : 'ยังไม่ตั้งค่า'}
        </span>
        <ChevronDown size={18} className={`shrink-0 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-surface-100 bg-surface px-4 pb-4 pt-4">{<Steps items={item.steps} />}</div>}
    </div>
  )
}

export default function Settings() {
  const { isSupabaseConfigured, teams, members, tasks } = useAppData()
  const navigate = useNavigate()
  const [confirmTarget, setConfirmTarget] = useState<DestinationKey | null>(null)
  const destination = confirmTarget ? DESTINATIONS[confirmTarget] : null
  const aiEndpointConfigured = Boolean(import.meta.env.VITE_AI_SUMMARY_ENDPOINT)
  const workloadInsightConfigured = Boolean(import.meta.env.VITE_WORKLOAD_INSIGHT_ENDPOINT)

  const integrations: Integration[] = [
    {
      key: 'supabase',
      title: 'Supabase Database',
      ok: isSupabaseConfigured,
      okDetail: 'เชื่อมต่อแล้ว — ข้อมูลทั้งหมดอ่าน/เขียนผ่าน Supabase',
      noDetail: 'ยังไม่ได้ตั้งค่า — ระบบต้องเชื่อมต่อ Supabase จึงจะใช้งานได้',
      steps: [
        <>
          สร้างโปรเจกต์ใหม่ที่{' '}
          <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
            supabase.com/dashboard
          </a>
        </>,
        <>
          เปิด <b className="font-semibold text-ink-900">SQL Editor</b> แล้วรันไฟล์ <span className={mono}>supabase/schema.sql</span> เพื่อสร้างตาราง teams, members, tasks
        </>,
        <>
          คัดลอก <span className={mono}>.env.example</span> เป็น <span className={mono}>.env</span> แล้วใส่ค่าจาก Project Settings → API
          <CodeLine text="VITE_SUPABASE_URL=https://xxxx.supabase.co" />
          <CodeLine text="VITE_SUPABASE_ANON_KEY=eyJ..." />
        </>,
        <>
          รีสตาร์ท dev server
          <CodeLine text="npm run dev" />
        </>,
      ],
    },
    {
      key: 'ai-summary',
      title: 'AI Summary Endpoint',
      ok: aiEndpointConfigured,
      okDetail: 'เชื่อมต่อแล้ว — เรียกใช้ Supabase Edge Function สำหรับสรุปภาพรวมด้วย AI',
      noDetail: 'ยังไม่ได้ตั้งค่า — ระบบจะใช้สรุปแบบคำนวณจากสถิติ (heuristic) แทนการเรียก AI',
      steps: [
        <>
          Deploy Edge Function <span className={mono}>supabase/functions/ai-summary</span>
          <CodeLine text="supabase functions deploy ai-summary" />
        </>,
        <>
          ตั้งค่า secret ของ Gemini (API key อยู่ฝั่ง server ไม่เปิดเผยที่ client)
          <CodeLine text="supabase secrets set GEMINI_API_KEY=..." />
        </>,
        <>
          ใส่ URL ของ Function ลงในไฟล์ <span className={mono}>.env</span>
          <CodeLine text="VITE_AI_SUMMARY_ENDPOINT=https://xxxx.supabase.co/functions/v1/ai-summary" />
        </>,
      ],
    },
    {
      key: 'workload-insight',
      title: 'Workload Insight Endpoint',
      ok: workloadInsightConfigured,
      okDetail: 'เชื่อมต่อแล้ว — หน้า Workload (AI) จะเรียก AI มาอธิบายภาระงานรายคน/รายทีม',
      noDetail: 'ยังไม่ได้ตั้งค่า — หน้า Workload (AI) จะแสดงผลจากกฎการคำนวณ (rule-based) แทนการเรียก AI',
      steps: [
        <>
          Deploy Edge Function <span className={mono}>supabase/functions/workload-insight</span>
          <CodeLine text="supabase functions deploy workload-insight" />
        </>,
        <>
          ใช้ secret <span className={mono}>GEMINI_API_KEY</span> ตัวเดียวกับ AI Summary (ถ้าตั้งไว้แล้วไม่ต้องทำซ้ำ)
        </>,
        <>
          ใส่ URL ของ Function ลงในไฟล์ <span className={mono}>.env</span>
          <CodeLine text="VITE_WORKLOAD_INSIGHT_ENDPOINT=https://xxxx.supabase.co/functions/v1/workload-insight" />
        </>,
      ],
    },
  ]

  const doneCount = integrations.filter((i) => i.ok).length
  // Rows that still need setup start expanded (the first one only, to keep the page short); finished rows start collapsed.
  const firstPending = integrations.find((i) => !i.ok)?.key
  const [openMap, setOpenMap] = useState<Record<string, boolean | undefined>>({})
  const isOpen = (key: string) => openMap[key] ?? key === firstPending

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CountCard value={teams.length} label="ทีม" onClick={() => setConfirmTarget('admin')} valueClass="text-primary-700">
          <div className="flex items-center gap-1">
            {teams.slice(0, PREVIEW_MAX).map((team) => (
              <span
                key={team.id}
                title={team.name}
                className={`flex h-[22px] w-[22px] items-center justify-center rounded-[5px] text-[11px] font-bold text-white ${getTeamBadgeStyle(team.id).solid}`}
              >
                {nameInitial(team.name)}
              </span>
            ))}
            <MoreCount total={teams.length} />
          </div>
        </CountCard>
        <CountCard value={members.length} label="สมาชิก" onClick={() => setConfirmTarget('team')} valueClass="text-success-700">
          <div className="flex items-center">
            {members.slice(0, PREVIEW_MAX).map((member, i) => (
              <span key={member.id} title={member.name} className={i > 0 ? '-ml-1.5' : ''}>
                <Avatar id={member.id} name={member.name} size={22} />
              </span>
            ))}
            <MoreCount total={members.length} />
          </div>
        </CountCard>
        <CountCard value={tasks.length} label="งาน" onClick={() => setConfirmTarget('tasks')} valueClass="text-ink-700">
          <StatusStack tasks={tasks} />
        </CountCard>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-4">
          <p className="shrink-0 text-sm font-semibold text-ink-900">
            ตั้งค่าแล้ว {doneCount} จาก {integrations.length} รายการ
          </p>
          <div className="flex h-1.5 flex-1 gap-1" aria-hidden>
            {integrations.map((i) => (
              <span key={i.key} className={`flex-1 rounded-full ${i.ok ? 'bg-success-500' : 'bg-surface-100'}`} />
            ))}
          </div>
        </div>
        {integrations.map((item) => (
          <IntegrationRow
            key={item.key}
            item={item}
            open={isOpen(item.key)}
            onToggle={() => setOpenMap((prev) => ({ ...prev, [item.key]: !isOpen(item.key) }))}
          />
        ))}
      </Card>

      <AdminNavigateDialog
        open={destination !== null}
        from={{ label: 'Settings', icon: SettingsIcon }}
        to={destination?.to}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => destination && navigate(destination.path)}
      />
    </div>
  )
}
