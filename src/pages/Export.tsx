import { useMemo } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { Card } from '../components/ui/Card'
import { computeMemberWorkloads } from '../lib/workload'
import { exportSummaryXlsx } from '../lib/exporters'

export default function Export() {
  const { teams, members, tasks } = useAppData()
  const workloads = useMemo(() => computeMemberWorkloads(members, tasks), [members, tasks])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title="Export Summary (Excel)">
        <p className="mb-4 text-sm text-slate-500">
          ส่งออกไฟล์ Excel แบบหลายชีท: Tasks, Workload (AI), และสรุปตามทีม ในไฟล์เดียว รวมทั้งหมด {tasks.length} งาน
        </p>
        <button
          type="button"
          onClick={() => exportSummaryXlsx(tasks, teams, members, workloads)}
          disabled={tasks.length === 0}
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          <FileSpreadsheet size={16} />
          Export Summary (Excel)
        </button>
      </Card>
    </div>
  )
}
