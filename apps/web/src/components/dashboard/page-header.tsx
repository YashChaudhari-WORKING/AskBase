"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Setter = (node: ReactNode) => void

const PageHeaderContext = createContext<{ node: ReactNode; setNode: Setter }>({
  node: null,
  setNode: () => {},
})

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<ReactNode>(null)
  return (
    <PageHeaderContext.Provider value={{ node, setNode }}>
      {children}
    </PageHeaderContext.Provider>
  )
}

/** Renders whatever the current page pushed via usePageHeader. */
export function PageHeaderSlot() {
  const { node } = useContext(PageHeaderContext)
  return <>{node}</>
}

/**
 * Render content into the bare header strip that sits above the rounded page
 * frame (on the muted background, sidebar-level). Pass `deps` so the header
 * re-renders with fresh data. Cleared automatically on unmount.
 */
export function usePageHeader(node: ReactNode, deps: React.DependencyList) {
  const { setNode } = useContext(PageHeaderContext)
  useEffect(() => {
    setNode(node)
    return () => setNode(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
