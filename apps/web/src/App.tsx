import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Rules from './pages/Rules'
import Users from './pages/Users'
import Roles from './pages/Roles'
import Logs from './pages/Logs'

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="rules" element={<Rules />} />
        <Route path="users" element={<Users />} />
        <Route path="roles" element={<Roles />} />
        <Route path="logs" element={<Logs />} />
      </Route>
    </Routes>
  )
}

export default App
