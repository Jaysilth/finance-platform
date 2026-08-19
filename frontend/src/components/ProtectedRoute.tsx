import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { user } = useAuth()
  // Checks for the token directly too: on a hard refresh, useState's
  // initializer already reads localStorage synchronously, so `user` is
  // correct immediately — no loading flicker/redirect-then-back.
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
