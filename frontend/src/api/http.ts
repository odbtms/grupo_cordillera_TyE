import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://34.193.206.58:8080'

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
