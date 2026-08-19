import axios from 'axios'

// Set VITE_API_URL in a .env file when the backend isn't on localhost —
// e.g. VITE_API_URL=https://your-app.onrender.com for the deployed backend.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 here means the token is missing/expired — there's no refresh
    // flow (see backend README), so the only correct move is to force
    // re-login rather than silently retry or hang on a broken request.
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
