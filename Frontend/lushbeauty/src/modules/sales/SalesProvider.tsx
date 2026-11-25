import { useState } from 'react'
import type { ReactNode } from 'react'
import { getPolicy, listServices } from '../catalog'
import { listSpecialists } from '../identity'
import { useOfflineQueue } from '../offline'
import { DraftContext } from './draft'
import type { DraftApi } from './draft'
import { calculateSale } from './domain/sale'
import type { Discount, Draft, PaymentMethod, SavedSale } from './types'

function newDraft(services = listServices()): Draft {
  return {
    serviceId: services[0].id,
    specialistId: 'marisol',
    method: null,
    discount: null,
    clientUuid: crypto.randomUUID(),
  }
}

const dateFormat = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })

/** Estado del registro de servicio en curso. Vive en memoria; con backend (F01-T4) se envía con su UUID. */
export function SalesProvider({ children }: { children: ReactNode }) {
  const services = listServices()
  const specialists = listSpecialists()
  const policy = getPolicy()
  const offline = useOfflineQueue()
  const [draft, setDraft] = useState<Draft>(() => newDraft(services))
  const [saved, setSaved] = useState<SavedSale | null>(null)

  const service = services.find((item) => item.id === draft.serviceId) ?? services[0]
  const specialist = specialists.find((item) => item.id === draft.specialistId) ?? specialists[0]
  const result = calculateSale(
    { listCents: service.listPriceCents, discountCents: draft.discount?.cents ?? 0 },
    policy,
  )
  const needsApproval = result.exceedsLimit
  const canSave = draft.method !== null && !needsApproval

  function save(): SavedSale | null {
    if (!canSave || draft.method === null) return null
    const record: SavedSale = {
      clientUuid: draft.clientUuid,
      serviceName: service.name,
      specialistName: specialist.name,
      method: draft.method,
      listCents: result.listCents,
      discountCents: result.discountCents,
      discountReason: draft.discount?.reason ?? null,
      chargedCents: result.chargedCents,
      commissionCents: result.commissionCents,
      commissionBps: policy.commissionBps,
      savedAt: dateFormat.format(new Date()),
    }
    offline.enqueue({
      id: record.clientUuid,
      label: `${record.serviceName} · ${record.specialistName}`,
      amountCents: record.chargedCents,
    })
    setSaved(record)
    setDraft(newDraft(services))
    return record
  }

  const api: DraftApi = {
    draft,
    service,
    specialist,
    services,
    specialists,
    result,
    needsApproval,
    canSave,
    saved,
    pickService: (serviceId) => setDraft((d) => ({ ...d, serviceId, discount: null })),
    pickSpecialist: (specialistId) => setDraft((d) => ({ ...d, specialistId })),
    pickMethod: (method: PaymentMethod) => setDraft((d) => ({ ...d, method })),
    setDiscount: (discount: Discount | null) => setDraft((d) => ({ ...d, discount })),
    save,
    undoSaved: () => setSaved(null),
  }
  return <DraftContext value={api}>{children}</DraftContext>
}
