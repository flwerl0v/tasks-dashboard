import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AppDataProvider } from './context/AppDataContext'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Team from './pages/Team'
import WorkloadAI from './pages/WorkloadAI'
import Reports from './pages/Reports'
import Export from './pages/Export'
import Admin from './pages/Admin'
import TeamDetail from './pages/TeamDetail'
import Settings from './pages/Settings'

function App() {
  return (
    <AppDataProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="team" element={<Team />} />
          <Route path="workload" element={<WorkloadAI />} />
          <Route path="reports" element={<Reports />} />
          <Route path="export" element={<Export />} />
          <Route path="admin" element={<Admin />} />
          <Route path="admin/teams/:teamId" element={<TeamDetail />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AppDataProvider>
  )
}

export default App
