import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http', () => ({
  authHttp: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { authHttp } from './http'
import {
  iniciarSesion,
  validarToken,
  obtenerUsuarios,
  actualizarRolUsuario,
} from './authApi'

const httpMock = authHttp as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('iniciarSesion hace POST a /login y devuelve los datos', async () => {
    httpMock.post.mockResolvedValue({ data: { token: 't', usuario: 'ana', rol: 'ADMIN', sucursal: null } })
    const resp = await iniciarSesion({ username: 'ana', password: 'x' })
    expect(resp.token).toBe('t')
    expect(httpMock.post).toHaveBeenCalledWith('/login', { username: 'ana', password: 'x' })
  })

  it('validarToken agrega el prefijo Bearer si falta', async () => {
    httpMock.get.mockResolvedValue({ data: {} })
    await validarToken('abc123')
    expect(httpMock.get).toHaveBeenCalledWith('/validar', {
      headers: { Authorization: 'Bearer abc123' },
    })
  })

  it('validarToken no duplica el prefijo Bearer', async () => {
    httpMock.get.mockResolvedValue({ data: {} })
    await validarToken('Bearer ya-tiene')
    expect(httpMock.get).toHaveBeenCalledWith('/validar', {
      headers: { Authorization: 'Bearer ya-tiene' },
    })
  })

  it('obtenerUsuarios retorna [] si la respuesta no es arreglo', async () => {
    httpMock.get.mockResolvedValue({ data: undefined })
    expect(await obtenerUsuarios()).toEqual([])
  })

  it('actualizarRolUsuario hace PUT con el rol', async () => {
    httpMock.put.mockResolvedValue({ data: { id: 1, rol: 'ADMIN' } })
    await actualizarRolUsuario(1, 'ADMIN')
    expect(httpMock.put).toHaveBeenCalledWith('/usuarios/1/rol', { rol: 'ADMIN' })
  })
})
