import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  createMember,
  createTask,
  createTeam,
  deleteMember,
  deleteTask,
  deleteTeam,
  fetchAllData,
  updateMember,
  updateTask,
  updateTaskStatus,
  updateTeam,
  type NewMemberInput,
  type NewTaskInput,
  type NewTeamInput,
} from '../lib/dataService'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import type { Member, Task, TaskStatus, Team } from '../types'

interface AppDataContextValue {
  teams: Team[]
  members: Member[]
  tasks: Task[]
  loading: boolean
  error: string | null
  isSupabaseConfigured: boolean
  refresh: () => Promise<void>
  setTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>
  createTeam: (input: NewTeamInput) => Promise<Team>
  updateTeam: (id: string, patch: Partial<Pick<Team, 'name' | 'category'>>) => Promise<Team>
  deleteTeam: (id: string) => Promise<void>
  createMember: (input: NewMemberInput) => Promise<Member>
  updateMember: (id: string, patch: Partial<Pick<Member, 'name' | 'email' | 'team_id'>>) => Promise<Member>
  deleteMember: (id: string) => Promise<void>
  createTask: (input: NewTaskInput) => Promise<Task>
  updateTask: (id: string, patch: Partial<NewTaskInput>) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllData()
      setTeams(data.teams)
      setMembers(data.members)
      setTasks(data.tasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Load-on-mount: the one intended use of setState-in-effect (synchronizing with the DB).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const setTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((tsk) => (tsk.id === taskId ? { ...tsk, status } : tsk)))
    await updateTaskStatus(taskId, status)
  }, [])

  const handleCreateTeam = useCallback(async (input: NewTeamInput) => {
    const team = await createTeam(input)
    setTeams((prev) => [...prev, team].sort((a, b) => a.name.localeCompare(b.name)))
    return team
  }, [])

  const handleUpdateTeam = useCallback(async (id: string, patch: Partial<Pick<Team, 'name' | 'category'>>) => {
    const team = await updateTeam(id, patch)
    setTeams((prev) => prev.map((tm) => (tm.id === id ? team : tm)).sort((a, b) => a.name.localeCompare(b.name)))
    return team
  }, [])

  const handleDeleteTeam = useCallback(async (id: string) => {
    await deleteTeam(id)
    // mirrors the DB's ON DELETE SET NULL on members.team_id / tasks.team_id
    setTeams((prev) => prev.filter((tm) => tm.id !== id))
    setMembers((prev) => prev.map((m) => (m.team_id === id ? { ...m, team_id: null } : m)))
    setTasks((prev) => prev.map((tsk) => (tsk.team_id === id ? { ...tsk, team_id: null } : tsk)))
  }, [])

  const handleCreateMember = useCallback(async (input: NewMemberInput) => {
    const member = await createMember(input)
    setMembers((prev) => [...prev, member].sort((a, b) => a.name.localeCompare(b.name)))
    return member
  }, [])

  const handleUpdateMember = useCallback(
    async (id: string, patch: Partial<Pick<Member, 'name' | 'email' | 'team_id'>>) => {
      const member = await updateMember(id, patch)
      setMembers((prev) => prev.map((m) => (m.id === id ? member : m)).sort((a, b) => a.name.localeCompare(b.name)))
      return member
    },
    [],
  )

  const handleDeleteMember = useCallback(async (id: string) => {
    await deleteMember(id)
    // mirrors the DB's ON DELETE SET NULL on tasks.owner_id
    setMembers((prev) => prev.filter((m) => m.id !== id))
    setTasks((prev) => prev.map((tsk) => (tsk.owner_id === id ? { ...tsk, owner_id: null } : tsk)))
  }, [])

  const handleCreateTask = useCallback(async (input: NewTaskInput) => {
    const task = await createTask(input)
    setTasks((prev) => [task, ...prev])
    return task
  }, [])

  const handleUpdateTask = useCallback(async (id: string, patch: Partial<NewTaskInput>) => {
    const task = await updateTask(id, patch)
    setTasks((prev) => prev.map((tsk) => (tsk.id === id ? task : tsk)))
    return task
  }, [])

  const handleDeleteTask = useCallback(async (id: string) => {
    await deleteTask(id)
    setTasks((prev) => prev.filter((tsk) => tsk.id !== id))
  }, [])

  const value = useMemo<AppDataContextValue>(
    () => ({
      teams,
      members,
      tasks,
      loading,
      error,
      isSupabaseConfigured,
      refresh,
      setTaskStatus,
      createTeam: handleCreateTeam,
      updateTeam: handleUpdateTeam,
      deleteTeam: handleDeleteTeam,
      createMember: handleCreateMember,
      updateMember: handleUpdateMember,
      deleteMember: handleDeleteMember,
      createTask: handleCreateTask,
      updateTask: handleUpdateTask,
      deleteTask: handleDeleteTask,
    }),
    [
      teams,
      members,
      tasks,
      loading,
      error,
      refresh,
      setTaskStatus,
      handleCreateTeam,
      handleUpdateTeam,
      handleDeleteTeam,
      handleCreateMember,
      handleUpdateMember,
      handleDeleteMember,
      handleCreateTask,
      handleUpdateTask,
      handleDeleteTask,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- provider + its hook are colocated by convention
export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
