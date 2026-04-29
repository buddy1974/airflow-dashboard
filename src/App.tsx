import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import PdlOnboardingPage from './pages/PdlOnboardingPage'
import PdlOfficePage from './pages/PdlOfficePage'
import DashboardPage from './pages/DashboardPage'
import PatientsPage from './pages/PatientsPage'
import MonitoringPage from './pages/MonitoringPage'
import MonitoringDetailPage from './pages/MonitoringDetailPage'
import DevicesPage from './pages/DevicesPage'
import HandoverPage from './pages/HandoverPage'
import IncidentsPage from './pages/IncidentsPage'
import CarePlansPage from './pages/CarePlansPage'
import MedicationsPage from './pages/MedicationsPage'
import RotasPage from './pages/RotasPage'
import FinancePage from './pages/FinancePage'
import PayrollPage from './pages/PayrollPage'
import TrainingPage from './pages/TrainingPage'
import RecruitmentPage from './pages/RecruitmentPage'
import CompliancePage from './pages/CompliancePage'
import StaffDocsPage from './pages/StaffDocsPage'
import HrPage from './pages/HrPage'
import UsersPage from './pages/UsersPage'

function RootRedirect() {
  const { user, token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role === 'ADMIN') return <Navigate to="/pdl-onboarding" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RootRedirect />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/pdl-onboarding" element={<ProtectedRoute adminOnly><PdlOnboardingPage /></ProtectedRoute>} />
          <Route path="/pdl-office"     element={<ProtectedRoute adminOnly><PdlOfficePage /></ProtectedRoute>} />
          <Route path="/dashboard"      element={<DashboardPage />} />
          <Route path="/patients"       element={<PatientsPage />} />
          <Route path="/monitoring"     element={<MonitoringPage />} />
          <Route path="/monitoring/:id" element={<MonitoringDetailPage />} />
          <Route path="/devices"        element={<DevicesPage />} />
          <Route path="/handover"       element={<HandoverPage />} />
          <Route path="/incidents"      element={<IncidentsPage />} />
          <Route path="/care-plans"     element={<CarePlansPage />} />
          <Route path="/medications"    element={<MedicationsPage />} />
          <Route path="/rotas"          element={<RotasPage />} />
          <Route path="/finance"        element={<FinancePage />} />
          <Route path="/payroll"        element={<PayrollPage />} />
          <Route path="/training"       element={<TrainingPage />} />
          <Route path="/recruitment"    element={<RecruitmentPage />} />
          <Route path="/compliance"     element={<CompliancePage />} />
          <Route path="/staff-docs"     element={<StaffDocsPage />} />
          <Route path="/hr"             element={<HrPage />} />
          <Route path="/users"          element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
