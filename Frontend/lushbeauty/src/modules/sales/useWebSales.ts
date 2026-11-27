import { useEffect, useState } from 'react'
import { useSession } from '../identity'
import { anularVenta, listServiceNames, listSpecialistNames, listVentas, toSaleRow } from './api/ventas'
import { WEB_SALES } from './fixtures'
import type { SaleRow } from './types'

export type SalesLoad = 'loading' | 'ready' | 'error'

/**
 * Ventas de la pantalla web. Con sesión real (token) lee `/api/v1/ventas/` y anula contra el servidor;
 * sin token (pruebas, maqueta) usa las filas sintéticas y anula en memoria.
 */
export function useWebSales() {
  const { session } = useSession()
  const token = session?.token
  const [rows, setRows] = useState<SaleRow[]>(token ? [] : WEB_SALES)
  const [load, setLoad] = useState<SalesLoad>(token ? 'loading' : 'ready')

  useEffect(() => {
    if (!token) return
    let active = true
    Promise.all([listVentas(token), listServiceNames(token), listSpecialistNames(token)])
      .then(([ventas, services, specialists]) => {
        if (!active) return
        const service = new Map(services.map((s) => [s.id, s.nombre]))
        const specialist = new Map(specialists.map((s) => [s.id, s.nombre]))
        const names = { service: (id: string) => service.get(id), specialist: (id: string) => specialist.get(id) }
        setRows(ventas.filter((v) => v.lineas.length > 0).map((v) => toSaleRow(v, names)))
        setLoad('ready')
      })
      .catch(() => active && setLoad('error'))
    return () => {
      active = false
    }
  }, [token])

  /** Devuelve un mensaje de error, o null si se anuló. Nada se borra: la fila pasa a «anulada». */
  async function cancel(id: string, reason: string): Promise<string | null> {
    if (token) {
      try {
        await anularVenta(token, id, reason)
      } catch (error) {
        return error instanceof Error ? error.message : 'No se pudo anular.'
      }
    }
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: 'anulada' } : row)))
    return null
  }

  return { rows, load, cancel }
}
