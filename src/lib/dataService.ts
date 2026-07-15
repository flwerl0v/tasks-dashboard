import { supabase, isSupabaseConfigured } from './supabaseClient'
import type { Member, Task, TaskPriority, TaskStatus, Team } from '../types'

const NOT_CONFIGURED_MESSAGE = 'ยังไม่ได้ตั้งค่า Supabase — กรุณาตั้งค่าที่หน้า Settings ก่อนใช้งาน'

function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE)
}

export async function fetchAllData(): Promise<{ teams: Team[]; members: Member[]; tasks: Task[] }> {
  assertSupabaseConfigured()

  const [teamsRes, membersRes, tasksRes] = await Promise.all([
    supabase.from('teams').select('*').order('name'),
    supabase.from('members').select('*').order('name'),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
  ])
  if (teamsRes.error) throw teamsRes.error
  if (membersRes.error) throw membersRes.error
  if (tasksRes.error) throw tasksRes.error

  return {
    teams: teamsRes.data ?? [],
    members: membersRes.data ?? [],
    tasks: tasksRes.data ?? [],
  }
}

export interface NewTeamInput {
  name: string
  category?: string | null
}

export async function createTeam(input: NewTeamInput): Promise<Team> {
  assertSupabaseConfigured()
  const { data, error } = await supabase
    .from('teams')
    .insert({ name: input.name, category: input.category ?? null })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateTeam(id: string, patch: Partial<Pick<Team, 'name' | 'category'>>): Promise<Team> {
  assertSupabaseConfigured()
  const { data, error } = await supabase.from('teams').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function deleteTeam(id: string): Promise<void> {
  assertSupabaseConfigured()
  const { error } = await supabase.from('teams').delete().eq('id', id)
  if (error) throw error
}

export interface NewMemberInput {
  name: string
  email?: string | null
  team_id?: string | null
}

export async function createMember(input: NewMemberInput): Promise<Member> {
  assertSupabaseConfigured()
  const { data, error } = await supabase
    .from('members')
    .insert({ name: input.name, email: input.email ?? null, team_id: input.team_id ?? null })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateMember(
  id: string,
  patch: Partial<Pick<Member, 'name' | 'email' | 'team_id'>>,
): Promise<Member> {
  assertSupabaseConfigured()
  const { data, error } = await supabase.from('members').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function deleteMember(id: string): Promise<void> {
  assertSupabaseConfigured()
  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) throw error
}

export interface NewTaskInput {
  title: string
  team_id: string | null
  owner_id: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  progress: number
  effort_days: number
}

export async function createTask(input: NewTaskInput): Promise<Task> {
  assertSupabaseConfigured()
  const { data, error } = await supabase.from('tasks').insert(input).select('*').single()
  if (error) throw error
  return data
}

export async function updateTask(id: string, patch: Partial<NewTaskInput>): Promise<Task> {
  assertSupabaseConfigured()
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function deleteTask(id: string): Promise<void> {
  assertSupabaseConfigured()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  assertSupabaseConfigured()
  const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
  if (error) throw error
}
