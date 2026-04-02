'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getManualLinkMatchPresentation } from '@/lib/manual-links'

export type ManualLinkItem = {
  id: string
  url: string
  portal: string
  metadataJson?: string | null
  tituloInferido?: string | null
  precioInferido?: number | null
  monedaInferida?: string | null
  zonaInferida?: string | null
  tipoOperacion?: string | null
  dormitoriosInferidos?: number | null
  tipoPropiedadInferido?: string | null
  matchScore: number
  matchNivel: 'ALTO' | 'MEDIO' | 'BAJO'
  estado: 'NUEVO' | 'SELECCIONADO' | 'DESCARTADO' | 'ENVIADO'
  fueEnviadoAntes?: boolean
  busqueda?: {
    tipoPropiedad?: string | null
    ubicacionPreferida?: string | null
    presupuestoTexto?: string | null
    presupuestoValor?: number | null
    moneda?: string | null
    dormitoriosMin?: number | null
  }
}

type Props = {
  item: ManualLinkItem
  busy?: boolean
  onSelect: () => void
  onDiscard: () => void
  onDelete: () => void
}

function formatMoney(value?: number | null, currency?: string | null) {
  if (!value) return 'Precio no inferido'
  return `${currency || 'USD'} ${value.toLocaleString('es-AR')}`
}

function getPortalAccent(portal: string) {
  if (portal === 'ZonaProp') return 'from-sky-500 via-blue-500 to-cyan-500'
  if (portal === 'ArgenProp') return 'from-emerald-500 via-teal-500 to-cyan-500'
  if (portal === 'MercadoLibre') return 'from-amber-400 via-yellow-400 to-orange-400'
  if (portal === 'Remax') return 'from-rose-500 via-red-500 to-orange-500'
  return 'from-slate-500 via-slate-600 to-slate-700'
}

function getBreakdown(item: ManualLinkItem) {
  try {
    const parsed = JSON.parse(item.metadataJson || '{}')
    return parsed?.breakdown || {}
  } catch {
    return {}
  }
}

function getCriterionBadge(active: boolean, pending: boolean) {
  if (active) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (pending) return 'border-slate-200 bg-slate-50 text-slate-500'
  return 'border-rose-200 bg-rose-50 text-rose-700'
}

export function ManualLinkCard({ item, busy, onSelect, onDiscard, onDelete }: Props) {
  const matchPresentation = getManualLinkMatchPresentation(item.matchScore)
  const accent = getPortalAccent(item.portal)
  const breakdown = getBreakdown(item)
  const statusLabel =
    item.estado === 'SELECCIONADO'
      ? 'Seleccionado'
      : item.estado === 'DESCARTADO'
        ? 'Descartado'
        : item.estado === 'ENVIADO'
          ? 'Enviado a gestión'
          : 'Nuevo'

  return (
    <Card className="overflow-hidden border-slate-200/90 shadow-md shadow-slate-200/60">
      <CardContent className="p-0">
        <div className={`bg-gradient-to-r ${accent} px-5 py-4 text-white`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {item.portal}
                </span>
                <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {statusLabel}
                </span>
                {item.fueEnviadoAntes && (
                  <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    Ya enviado antes
                  </span>
                )}
              </div>
              <div>
                <h3 className="max-w-3xl text-xl font-semibold leading-tight text-white">
                  {item.tituloInferido || 'Propiedad detectada desde link manual'}
                </h3>
                <p className="mt-2 break-all text-xs text-white/80">{item.url}</p>
              </div>
            </div>

            <div className="min-w-[200px] rounded-3xl border border-white/20 bg-slate-950/20 p-4 text-right backdrop-blur">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">Match inteligente</div>
              <div className="mt-2 text-4xl font-semibold leading-none text-white">{item.matchScore}%</div>
              <div className="mt-2 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                <span className={`mr-2 inline-block h-2 w-2 rounded-full ${matchPresentation.dotClassName}`} />
                {matchPresentation.label}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f8fafc)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Coincidencia con la búsqueda</div>
                <div className="mt-1 text-sm font-medium text-slate-600">
                  Te marca qué partes del link coinciden con lo que pidió el cliente.
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className={`rounded-2xl border px-4 py-3 ${getCriterionBadge(Boolean(breakdown.zona), !item.zonaInferida || !item.busqueda?.ubicacionPreferida)}`}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Zona</div>
                <div className="mt-1 text-sm font-semibold">
                  {breakdown.zona
                    ? 'Coincide con la búsqueda'
                    : !item.zonaInferida || !item.busqueda?.ubicacionPreferida
                      ? 'No se pudo validar'
                      : 'No coincide'}
                </div>
                <div className="mt-1 text-xs opacity-80">
                  Buscada: {item.busqueda?.ubicacionPreferida || 'sin dato'} | Link: {item.zonaInferida || 'sin dato'}
                </div>
              </div>

              <div className={`rounded-2xl border px-4 py-3 ${getCriterionBadge(Boolean(breakdown.precio), !item.precioInferido || !item.busqueda?.presupuestoValor)}`}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Precio</div>
                <div className="mt-1 text-sm font-semibold">
                  {breakdown.precio
                    ? 'Dentro del rango'
                    : !item.precioInferido || !item.busqueda?.presupuestoValor
                      ? 'No se pudo validar'
                      : 'Fuera del rango'}
                </div>
                <div className="mt-1 text-xs opacity-80">
                  Búsqueda: {item.busqueda?.moneda || 'USD'} {item.busqueda?.presupuestoValor?.toLocaleString('es-AR') || item.busqueda?.presupuestoTexto || 'sin dato'} | Link: {formatMoney(item.precioInferido, item.monedaInferida)}
                </div>
              </div>

              <div className={`rounded-2xl border px-4 py-3 ${getCriterionBadge(Boolean(breakdown.tipo), !item.tipoPropiedadInferido || !item.busqueda?.tipoPropiedad)}`}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Tipo</div>
                <div className="mt-1 text-sm font-semibold">
                  {breakdown.tipo
                    ? 'Coincide el tipo'
                    : !item.tipoPropiedadInferido || !item.busqueda?.tipoPropiedad
                      ? 'No se pudo validar'
                      : 'Tipo distinto'}
                </div>
                <div className="mt-1 text-xs opacity-80">
                  Buscado: {item.busqueda?.tipoPropiedad || 'sin dato'} | Link: {item.tipoPropiedadInferido || 'sin dato'}
                </div>
              </div>

              <div className={`rounded-2xl border px-4 py-3 ${getCriterionBadge(Boolean(breakdown.dormitorios), item.dormitoriosInferidos === null || item.dormitoriosInferidos === undefined || item.busqueda?.dormitoriosMin === null || item.busqueda?.dormitoriosMin === undefined)}`}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Dormitorios</div>
                <div className="mt-1 text-sm font-semibold">
                  {breakdown.dormitorios
                    ? 'Cumple dormitorios'
                    : item.dormitoriosInferidos === null || item.dormitoriosInferidos === undefined || item.busqueda?.dormitoriosMin === null || item.busqueda?.dormitoriosMin === undefined
                      ? 'No se pudo validar'
                      : 'No cumple'}
                </div>
                <div className="mt-1 text-xs opacity-80">
                  Búsqueda: {item.busqueda?.dormitoriosMin ?? 'sin dato'} | Link: {item.dormitoriosInferidos ?? 'sin dato'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Precio</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{formatMoney(item.precioInferido, item.monedaInferida)}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Zona</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{item.zonaInferida || 'No inferida'}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Operación</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{item.tipoOperacion || 'No inferida'}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Dormitorios</div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {item.dormitoriosInferidos === null || item.dormitoriosInferidos === undefined
                  ? 'No inferidos'
                  : item.dormitoriosInferidos === 0
                    ? 'Monoambiente'
                    : `${item.dormitoriosInferidos} dorm`}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tipo</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{item.tipoPropiedadInferido || 'No inferido'}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  Portal: {item.portal}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${matchPresentation.badgeClassName}`}>
                  Score {item.matchScore}%
                </span>
                {item.zonaInferida && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    Zona {item.zonaInferida}
                  </span>
                )}
                {item.tipoPropiedadInferido && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {item.tipoPropiedadInferido}
                  </span>
                )}
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-sky-700 hover:text-sky-900"
              >
                Abrir link original
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onSelect} disabled={busy || item.estado === 'ENVIADO'} variant="success">
              Seleccionar
            </Button>
            <Button onClick={onDiscard} disabled={busy || item.estado === 'ENVIADO'} variant="outline">
              Descartar
            </Button>
            <Button onClick={onDelete} disabled={busy} variant="ghost">
              Eliminar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
