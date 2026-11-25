import { useEffect } from 'react'

/** Título de pestaña por pantalla (WCAG 2.4.2): quien navega distingue la landing del ingreso. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}
