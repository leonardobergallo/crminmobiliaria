'use client'

import { Suspense } from 'react'
import { ManualFlowWorkspace } from '@/components/manual-links/ManualFlowWorkspace'

export default function FlujoManualPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Cargando flujo manual...</div>}>
      <ManualFlowWorkspace />
    </Suspense>
  )
}
