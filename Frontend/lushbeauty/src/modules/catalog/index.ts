import { ILLUSTRATIVE_POLICY, SERVICES } from './fixtures'
import type { CatalogService, IllustrativePolicy } from './types'

export type { CatalogService, IllustrativePolicy } from './types'

/** Contrato público: servicios vigentes. Con backend (F01-T1) será una llamada a la API. */
export function listServices(): CatalogService[] {
  return SERVICES
}

export function getPolicy(): IllustrativePolicy {
  return ILLUSTRATIVE_POLICY
}
