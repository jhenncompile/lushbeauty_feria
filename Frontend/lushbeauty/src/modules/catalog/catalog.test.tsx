import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../app/routes'
import { SessionProvider } from '../identity'
import { SalesProvider } from '../sales'

function renderCatalog(role: 'administradora' | 'especialista') {
  return render(
    <MemoryRouter initialEntries={['/web/catalogo']}>
      <SessionProvider initial={{ userName: 'x', role }}>
        <SalesProvider>
          <AppRoutes />
        </SalesProvider>
      </SessionProvider>
    </MemoryRouter>,
  )
}

describe('Catálogo y reglas', () => {
  it('lista los 6 servicios con precio de lista y las reglas ilustrativas', () => {
    renderCatalog('administradora')
    expect(screen.getByRole('heading', { name: 'Catálogo y reglas' })).toBeInTheDocument()
    expect(screen.getByText('Lush Little Princess')).toBeInTheDocument()
    expect(screen.getByText('Bs 180')).toBeInTheDocument()
    expect(screen.getByText(/35\s*% sobre lista/)).toBeInTheDocument()
    expect(screen.getByText(/10\s*%/, { selector: '.t-headline' })).toBeInTheDocument()
    expect(screen.getAllByText(/ilustrativo/i).length).toBeGreaterThan(0)
  })

  it('una especialista no ve la configuración', () => {
    renderCatalog('especialista')
    expect(screen.queryByRole('heading', { name: 'Catálogo y reglas' })).not.toBeInTheDocument()
  })
})
