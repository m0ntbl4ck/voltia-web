import { createContext, useContext } from 'react'

interface AnalysisControl {
  running: boolean
  run: () => void
}

export const AnalysisContext = createContext<AnalysisControl | null>(null)

export function useAnalysis() {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis needs AnalysisProvider')
  return ctx
}
