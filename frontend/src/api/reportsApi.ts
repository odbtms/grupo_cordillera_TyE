import { reportesHttp } from './http'

export type PlantillaReporteInput = {
  titulo: string
  configuracionVisual: string
  estado: string
}

export type PlantillaReporte = {
  id: number
  titulo: string
  configuracionVisual: string
  estado: string
}

export async function fetchPlantillasReporte(): Promise<PlantillaReporte[]> {
  const { data } = await reportesHttp.get<PlantillaReporte[]>('/plantillas')
  return Array.isArray(data) ? data : []
}

export async function createPlantillaReporte(
  payload: PlantillaReporteInput,
): Promise<PlantillaReporte> {
  const { data } = await reportesHttp.post<PlantillaReporte>(
    '/plantillas',
    payload,
  )
  return data
}

export async function eliminarPlantillaReporte(id: number) {
  await reportesHttp.delete(`/plantillas/${id}`)
}
