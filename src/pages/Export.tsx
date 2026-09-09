import { useMemo, useRef, useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { Card } from '../components/ui/Card'
import { StatusDonutChart } from '../components/charts/StatusDonutChart'
import { TeamStatusBarChart } from '../components/charts/TeamStatusBarChart'
import { WeeklyTrendChart } from '../components/charts/WeeklyTrendChart'
import { computeMemberWorkloads, computeWeeklyClosedTrend } from '../lib/workload'
import { countByStatus, countByTeamAndStatus } from '../lib/stats'
import { exportSummaryXlsx } from '../lib/exporters'
import { captureCharts } from '../lib/chartCapture'
import { toErrorMessage } from '../lib/errors'

export default function Export() {
  const { teams, members, tasks } = useAppData()
  const workloads = useMemo(() => computeMemberWorkloads(members, tasks), [members, tasks])
  const byStatus = useMemo(() => countByStatus(tasks), [tasks])
  const byTeamStatus = useMemo(() => countByTeamAndStatus(tasks, teams), [tasks, teams])
  const weeklyTrend = useMemo(() => computeWeeklyClosedTrend(tasks), [tasks])

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

  return (
    <div className="space-y-4">
      <Card title="Export Summary (Excel)">
        <p className="mb-4 text-sm text-ink-500">
          ส่งออกไฟล์ Excel แบบหลายชีท: Tasks, Workload (AI), สรุปตามทีม และกราฟ (Charts) ในไฟล์เดียว รวมทั้งหมด {tasks.length} งาน
        </p>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={tasks.length === 0 || exporting}
          className="flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 px-4 py-2.5 text-sm font-medium text-success-700 hover:bg-success-100 disabled:opacity-50"
        >
          <FileSpreadsheet size={16} />
          {exporting ? 'กำลังสร้างไฟล์...' : 'Export Summary (Excel)'}
        </button>
        {exportError && <p className="mt-2 text-xs text-danger-600">เกิดข้อผิดพลาด: {exportError}</p>}
      </Card>

      {/* Off-screen render targets — html2canvas needs real, laid-out DOM nodes to capture for the Excel export,
          but this page doesn't need to show a duplicate of the Dashboard's charts to the user. */}
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
