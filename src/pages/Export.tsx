import { useMemo, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { StatusDonutChart } from '../components/charts/StatusDonutChart'
import { TeamStatusBarChart } from '../components/charts/TeamStatusBarChart'
import { WeeklyTrendChart } from '../components/charts/WeeklyTrendChart'
import { computeMemberWorkloads, computeWeeklyClosedTrend } from '../lib/workload'
import { countByStatus, countByTeamAndStatus } from '../lib/stats'
import { buildTaskRows, buildTeamSummaryRows, buildWorkloadRows, exportSummaryXlsx } from '../lib/exporters'
import { captureCharts } from '../lib/chartCapture'
import { toErrorMessage } from '../lib/errors'

const PREVIEW_ROWS = 8
// Text longer than this wraps onto up to 2 lines (full text on hover) instead of being cut to one line.
const LONG_TEXT = 40
const FILE_NAME = 'task_dashboard_summary.xlsx'

type SheetId = 'tasks' | 'workload' | 'team' | 'charts'
type Cell = string | number
type Row = Record<string, Cell>

// Cells whose value is a status/level get a small colored tag in the preview (the Excel file itself keeps plain text).
const TAG_CLASS: Record<string, string> = {
  todo: 'bg-surface-100 text-ink-600',
  doing: 'bg-warning-50 text-warning-700',
  done: 'bg-success-50 text-success-700',
  blocked: 'bg-danger-50 text-danger-700',
  overload: 'bg-danger-50 text-danger-700',
  balanced: 'bg-success-50 text-success-700',
  underload: 'bg-warning-50 text-warning-700',
}
const TAG_COLUMNS = new Set(['status', 'ai_level'])

function PreviewTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <p className="px-6 py-14 text-center text-sm text-ink-400">ยังไม่มีข้อมูลในชีทนี้</p>
  const columns = Object.keys(rows[0])
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="w-10 border-b border-border bg-surface-50" />
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap border-b border-border bg-surface-50 px-3.5 py-2 text-left font-mono text-[11.5px] font-semibold text-ink-500">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, PREVIEW_ROWS).map((row, i) => (
            <tr key={i}>
              <td className="border-b border-border-100 bg-surface-50 text-center text-[11.5px] text-ink-400">{i + 2}</td>
              {columns.map((c) => {
                const v = row[c]
                const tag = TAG_COLUMNS.has(c) ? TAG_CLASS[String(v)] : undefined
                const long = typeof v === 'string' && v.length > LONG_TEXT
                return (
                  <td
                    key={c}
                    className={`border-b border-border-100 px-3.5 py-2.5 align-top text-ink-800 ${
                      long ? 'min-w-[22rem] max-w-[34rem] whitespace-normal' : 'max-w-[22rem] truncate whitespace-nowrap'
                    }`}
                    title={String(v)}
                  >
                    {tag ? <span className={`rounded px-2 py-0.5 text-xs ${tag}`}>{v}</span> : long ? <span className="line-clamp-2 leading-snug">{v}</span> : v}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Export() {
  const { teams, members, tasks } = useAppData()
  const workloads = useMemo(() => computeMemberWorkloads(members, tasks), [members, tasks])
  const byStatus = useMemo(() => countByStatus(tasks), [tasks])
  const byTeamStatus = useMemo(() => countByTeamAndStatus(tasks, teams), [tasks, teams])
  const weeklyTrend = useMemo(() => computeWeeklyClosedTrend(tasks), [tasks])

  // Same row builders the Excel export uses, so the preview always matches the file.
  const sheetRows = useMemo<Record<Exclude<SheetId, 'charts'>, Row[]>>(
    () => ({
      tasks: buildTaskRows(tasks, teams, members),
      workload: buildWorkloadRows(workloads),
      team: buildTeamSummaryRows(tasks, teams, members),
    }),
    [tasks, teams, members, workloads],
  )

  const [tab, setTab] = useState<SheetId>('tasks')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const donutChartRef = useRef<HTMLDivElement>(null)
  const teamChartRef = useRef<HTMLDivElement>(null)
  const trendChartRef = useRef<HTMLDivElement>(null)

  const handleExport = async () => {
    setExporting(true)
    setExportError(null)
    try {
      const charts = await captureCharts([
        { title: 'สัดส่วนงานตามสถานะ', ref: donutChartRef },
        { title: 'งานตามทีม', ref: teamChartRef },
        { title: 'แนวโน้มการปิดงาน (รายสัปดาห์)', ref: trendChartRef },
      ])
      await exportSummaryXlsx(tasks, teams, members, workloads, charts)
    } catch (err) {
      console.error('[export] failed', err)
      setExportError(toErrorMessage(err, 'Export ไม่สำเร็จ'))
    } finally {
      setExporting(false)
    }
  }

  const tabs: Array<{ id: SheetId; name: string; count: string }> = [
    { id: 'tasks', name: 'Tasks', count: String(sheetRows.tasks.length) },
    { id: 'workload', name: 'Workload (AI)', count: String(sheetRows.workload.length) },
    { id: 'team', name: 'Team Summary', count: String(sheetRows.team.length) },
    { id: 'charts', name: 'Charts', count: '3' },
  ]
  const rows = tab === 'charts' ? [] : sheetRows[tab]
  const firstColumn = rows.length > 0 ? Object.keys(rows[0])[0] : ''

  return (
    <div className="space-y-0">
      <div className="flex flex-wrap items-center gap-3.5 rounded-t-md border border-b-0 border-border bg-surface px-6 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#107c41] text-[15px] font-bold text-white">X</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-ink-900">สรุปงานทั้งหมด (Excel)</h2>
          <p className="mt-0.5 text-[13px] text-ink-500">
            ด้านล่างคือ <b className="font-semibold text-ink-700">ตัวอย่าง (Preview)</b> ของไฟล์ Excel · ไฟล์จริงจะถูกสร้างเมื่อกดดาวน์โหลด
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={tasks.length === 0 || exporting}
          className="inline-flex items-center gap-2 rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink-700 disabled:opacity-50"
        >
          <Download size={16} />
          {exporting ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลด Excel'}
        </button>
      </div>
      {exportError && <p className="border-x border-border bg-surface px-6 pb-3 text-xs text-danger-600">เกิดข้อผิดพลาด: {exportError}</p>}

      <div className="overflow-hidden rounded-b-lg border border-border bg-surface shadow-md">
        <div className="flex h-[34px] items-center gap-1.5 bg-[#107c41] px-3.5 text-[12.5px] text-white">
          <span className="h-2 w-2 rounded-full bg-white/55" />
          <span className="h-2 w-2 rounded-full bg-white/55" />
          <span className="h-2 w-2 rounded-full bg-white/55" />
          <span className="ml-2">{FILE_NAME}</span>
          <span className="ml-auto rounded bg-white/20 px-2 py-px text-[11px] font-semibold tracking-wide">PREVIEW · ตัวอย่างไฟล์</span>
        </div>

        {tab === 'charts' ? (
          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
            {[
              { title: 'สัดส่วนงานตามสถานะ', body: <StatusDonutChart byStatus={byStatus} total={tasks.length} /> },
              { title: 'งานตามทีม', body: <TeamStatusBarChart data={byTeamStatus} /> },
              { title: 'แนวโน้มการปิดงาน (รายสัปดาห์)', body: <WeeklyTrendChart data={weeklyTrend} /> },
            ].map((c) => (
              <div key={c.title} className="min-w-0 rounded-md border border-border p-4">
                <h3 className="mb-3 text-[13px] font-semibold text-ink-800">{c.title}</h3>
                {c.body}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 border-b border-border bg-surface-50 px-3.5 py-1.5 text-xs text-ink-500">
              <b className="rounded border border-border bg-white px-2.5 py-px font-mono font-normal text-ink-700">A1</b>
              <span>{firstColumn}</span>
            </div>
            <PreviewTable rows={rows} />
            <div className="flex justify-between border-t border-border bg-surface-50 px-6 py-2.5 text-[12.5px] text-ink-500">
              <span>
                แสดง {Math.min(PREVIEW_ROWS, rows.length)} จาก {rows.length} แถว
              </span>
              <span>นี่เป็นเพียงตัวอย่าง · ไฟล์จริงมีครบทุกแถว</span>
            </div>
          </>
        )}

        <div className="flex border-t border-border bg-surface-100 px-2.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`border-b-[3px] px-4 py-2 text-[13px] transition-colors ${
                tab === t.id ? 'border-[#107c41] bg-white font-semibold text-[#0b5d31]' : 'border-transparent text-ink-500 hover:text-ink-900'
              }`}
            >
              {t.name}
              <span className="ml-1.5 text-[11.5px] font-normal text-ink-400">{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Off-screen render targets — html2canvas needs real, laid-out DOM nodes to capture for the Excel export,
          independent of which preview tab is showing. */}
      <div aria-hidden="true" style={{ position: 'fixed', top: 0, left: -9999, pointerEvents: 'none' }}>
        <div style={{ width: 420 }}>
          <StatusDonutChart byStatus={byStatus} total={tasks.length} chartRef={donutChartRef} />
        </div>
        <div style={{ width: 420 }}>
          <TeamStatusBarChart data={byTeamStatus} chartRef={teamChartRef} />
        </div>
        <div style={{ width: 420 }}>
          <WeeklyTrendChart data={weeklyTrend} chartRef={trendChartRef} />
        </div>
      </div>
    </div>
  )
}
