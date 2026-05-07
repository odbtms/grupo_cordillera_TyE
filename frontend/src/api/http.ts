import axios from 'axios'

export const authHttp = axios.create({
  baseURL: 'http://34.193.206.58:8084/api/auth',
  timeout: 8000,
})

export const ventasHttp = axios.create({
  baseURL: 'http://34.193.206.58:8081/api/ventas',
  timeout: 8000,
})

export const kpisHttp = axios.create({
  baseURL: 'http://34.193.206.58:9082/api/kpis',
  timeout: 8000,
})

export const reportesHttp = axios.create({
  baseURL: 'http://34.193.206.58:8083/api/reportes',
  timeout: 8000,
})
