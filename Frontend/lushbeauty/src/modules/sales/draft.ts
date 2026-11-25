import { createContext, useContext } from 'react'
import type { Discount, Draft, PaymentMethod, SavedSale } from './types'
import type { SaleResult } from './domain/sale'
import type { CatalogService } from '../catalog'
import type { Specialist } from '../identity'

export interface DraftApi {
  draft: Draft
  service: CatalogService
  specialist: Specialist
  services: CatalogService[]
  specialists: Specialist[]
  /** Importes del registro actual, con el descuento aplicado si lo hay. */
  result: SaleResult
  /** Hay descuento sobre el límite: no se puede guardar hasta que la administradora lo apruebe. */
  needsApproval: boolean
  canSave: boolean
  saved: SavedSale | null
  pickService: (id: string) => void
  pickSpecialist: (id: string) => void
  pickMethod: (method: PaymentMethod) => void
  setDiscount: (discount: Discount | null) => void
  save: () => SavedSale | null
  undoSaved: () => void
}

export const DraftContext = createContext<DraftApi | null>(null)

export function useRegistroServicio(): DraftApi {
  const api = useContext(DraftContext)
  if (!api) throw new Error('useRegistroServicio debe usarse dentro de SalesProvider')
  return api
}
