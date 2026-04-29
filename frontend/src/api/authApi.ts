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

export async function validateToken(token: string): Promise<string> {
  const { data } = await authHttp.get<string>('/validar', {
    headers: {
      Authorization: token,
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
