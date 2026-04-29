import axios from 'axios'

const api = axios.create({
  baseURL: 'https://airflow-backend-oyff.onrender.com/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('airflow_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('airflow_token')
      localStorage.removeItem('airflow_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
