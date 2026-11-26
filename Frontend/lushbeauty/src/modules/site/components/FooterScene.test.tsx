import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FooterScene } from './FooterScene'
import { ScrollThread } from './ScrollThread'

afterEach(() => vi.unstubAllGlobals())

describe('Cierre con monograma', () => {
  it('sin movimiento el monograma queda completo (--p = 1) y el contenido sigue accesible', () => {
    const { container } = render(<MemoryRouter><FooterScene><p>Contenido</p></FooterScene></MemoryRouter>)
    expect(container.querySelector<HTMLElement>('.foot-scene')?.style.getPropertyValue('--p')).toBe('1')
    expect(screen.getByText('Contenido')).toBeInTheDocument()
    expect(container.querySelector('.foot-mark')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('.lb-draw__line')).toHaveLength(2)
  })

  it('con movimiento, --p crece al entrar el bloque en pantalla', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: !query.includes('reduce'), media: query, addEventListener: () => undefined, removeEventListener: () => undefined }))
    vi.stubGlobal('innerHeight', 1000)
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 1000 - 450, height: 1000 } as DOMRect)
    const { container } = render(<MemoryRouter><FooterScene><p>x</p></FooterScene></MemoryRouter>)
    expect(container.querySelector<HTMLElement>('.foot-scene')?.style.getPropertyValue('--p')).toBe('0.5000')
    spy.mockRestore()
  })
})

describe('ScrollThread', () => {
  it('no rompe sin medidas de diseño (jsdom) y queda oculto para lectores', () => {
    const { container } = render(<div><ScrollThread /></div>)
    const svg = container.querySelector('svg.thread')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.thread__line')).toBeNull()
  })
})
