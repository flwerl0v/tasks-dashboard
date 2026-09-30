import { useState } from 'react'
import { Plus, ListPlus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'
import { Modal } from '../ui/Modal'
import { DropdownSelect } from '../ui/DropdownSelect'
import { cancelBtnClass, fieldLabelClass, primaryBtnClass } from '../ui/formStyles'

/** Topbar shortcut: tasks are created inside a team, so this asks which team first, then opens that team's create-task form. */
export function CreateTaskButton() {
  const { teams } = useAppData()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [teamId, setTeamId] = useState('')

  // The team page has its own "เพิ่มงาน" button, and re-navigating to the same ?newTask=1 URL wouldn't reopen its form.
  if (pathname.startsWith('/admin/teams/')) return null

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name))
  const selected = teamId || sortedTeams[0]?.id || ''

  const confirm = () => {
    if (!selected) return
    setOpen(false)
    navigate(`/admin/teams/${selected}?newTask=1`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={teams.length === 0}
        title={teams.length === 0 ? 'สร้างทีมที่หน้า Admin ก่อน' : undefined}
        className={`${primaryBtnClass} inline-flex items-center gap-1.5`}
      >
        <Plus size={15} />
        สร้างงาน
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="สร้างงานใหม่"
        description="เลือกทีมที่จะเพิ่มงาน แล้วกรอกรายละเอียดในหน้าถัดไป"
        icon={ListPlus}
        widthClassName="max-w-sm"
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className={cancelBtnClass}>
              ยกเลิก
            </button>
            <button type="button" onClick={confirm} disabled={!selected} className={primaryBtnClass}>
              ต่อไป
            </button>
          </>
        }
      >
        <label className={fieldLabelClass}>ทีม</label>
        <DropdownSelect
          label="ทีม"
          fullWidth
          value={selected}
          options={sortedTeams.map((tm) => ({ value: tm.id, label: tm.name }))}
          onChange={setTeamId}
        />
      </Modal>
    </>
  )
}
