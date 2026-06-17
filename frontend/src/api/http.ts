import axios from 'axios'

// La IP del backend ahora se lee estrictamente de las variables de entorno (.env)
// Al usar una IP Elástica de AWS, esto se mantiene fijo.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://13.222.83.213:8080'

export const authHttp = axios.create({
  baseURL: `${API_BASE}/api/auth`,
  timeout: 8000,
})

export const ventasHttp = axios.create({
  baseURL: `${API_BASE}/api/ventas`,
  timeout: 8000,
})

export const kpisHttp = axios.create({
  baseURL: `${API_BASE}/api/kpis`,
  timeout: 8000,
})

export const reportesHttp = axios.create({
  baseURL: `${API_BASE}/api/reportes`,
  timeout: 8000,
})
