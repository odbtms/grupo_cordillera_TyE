import { authHttp } from './http'

type CredencialesLogin = {
  username: string
  password: string
}

export type LoginResponse = {
  token: string
  usuario: string
  rol: string
  sucursal: string | null
}

export async function iniciarSesion(
  credenciales: CredencialesLogin,
): Promise<LoginResponse> {
  const { data } = await authHttp.post<LoginResponse>('/login', credenciales)
  return data
}

<<<<<<< HEAD
export type RegistroInput = {
  username: string
  email: string
  password: string
  rol?: string
  sucursal?: string
}

export async function registrarUsuario(payload: RegistroInput): Promise<LoginResponse> {
  const { data } = await authHttp.post<LoginResponse>('/register', payload)
  return data
}

export async function validateToken(token: string): Promise<string> {
  const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  const { data } = await authHttp.get<string>('/validar', {
    headers: {
      Authorization: bearerToken,
=======
export async function validateToken(token: string): Promise<string> {
  const { data } = await authHttp.get<string>('/validar', {
    headers: {
      Authorization: token,
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
    },
  })
  return data
}

export async function actualizarRolUsuario(id: number, rol: string) {
  const { data } = await authHttp.put(`/usuarios/${id}/rol`, {
    rol,
  })
  return data
}

export async function actualizarRolUsuarioPorUsername(username: string, rol: string) {
  const { data } = await authHttp.put(`/usuarios/username/${username}/rol`, {
    rol,
  })
  return data
}
