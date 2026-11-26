import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HeroScene, InkLine } from './HeroScene'

function stubMotion(allowed: boolean, wide = true) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce') ? !allowed : wide,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
}

afterEach(() => vi.unstubAllGlobals())

describe('HeroScene', () => {
  it('sin movimiento deja el trazo y el título completos (--p = 1)', () => {
    stubMotion(false)
    const { container } = render(<HeroScene><h1 aria-label="Título"><InkLine start={0.2} end={0.4} tone="var(--ink)">Hola</InkLine></h1></HeroScene>)
    expect(container.querySelector<HTMLElement>('.hero-pin')?.style.getPropertyValue('--p')).toBe('1')
    expect(screen.getByRole('heading', { level: 1, name: 'Título' })).toBeInTheDocument()
  })

  it('con movimiento, --p sigue el scroll: 0 al inicio y 1 al final de la pista', () => {
    stubMotion(true)
    vi.stubGlobal('innerHeight', 1000)
    const rect = (top: number) => ({ top, height: 3000 }) as DOMRect
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    spy.mockReturnValue(rect(0))
    const { container } = render(<HeroScene><span /></HeroScene>)
    const scene = container.querySelector<HTMLElement>('.hero-pin')!
    expect(scene.style.getPropertyValue('--p')).toBe('0.0000')
    spy.mockReturnValue(rect(-1000))
    window.dispatchEvent(new Event('scroll'))
    return new Promise<void>((done) =>
      requestAnimationFrame(() => {
        expect(scene.style.getPropertyValue('--p')).toBe('0.5000')
        spy.mockRestore()
        done()
      }),
    )
  })

  it('el texto de lectores no se duplica: las líneas visuales van ocultas', () => {
    stubMotion(false)
    render(<HeroScene><h1 aria-label="Frase completa"><InkLine start={0} end={1} tone="var(--ink)">Frase</InkLine></h1></HeroScene>)
    expect(screen.getByRole('heading', { name: 'Frase completa' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Frase' })).not.toBeInTheDocument()
  })
})
