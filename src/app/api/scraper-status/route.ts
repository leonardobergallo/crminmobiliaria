import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const proxyUrl = process.env.SCRAPER_PROXY_URL
    const isProd = process.env.VERCEL === '1'

    const proxyConfigurado = !!proxyUrl?.trim()
    const apiKeyPresente = proxyConfigurado && proxyUrl ? /api_key=[^&]+/.test(proxyUrl) : false
    const apiKeyOculta = apiKeyPresente && proxyUrl
      ? proxyUrl.replace(/api_key=[^&]+/, 'api_key=***')
      : null

    return NextResponse.json({
      entorno: isProd ? 'produccion (Vercel)' : 'desarrollo (localhost)',
      proxy: {
        configurado: proxyConfigurado,
        apiKeyPresente: apiKeyPresente,
        urlOculta: apiKeyOculta,
        recomendacion: isProd && !proxyConfigurado
          ? 'Configura SCRAPER_PROXY_URL en Vercel (Settings > Environment Variables) para que el scraping funcione en produccion.'
          : proxyConfigurado && !apiKeyPresente
            ? 'La URL del proxy no incluye api_key. Agrega ?api_key=TU_KEY a la URL.'
            : null,
      },
      variables: {
        SCRAPER_DELAY_BETWEEN_PORTALS_MIN: process.env.SCRAPER_DELAY_BETWEEN_PORTALS_MIN || '2500 (default)',
        SCRAPER_DELAY_BETWEEN_PORTALS_MAX: process.env.SCRAPER_DELAY_BETWEEN_PORTALS_MAX || '4500 (default)',
      },
    })
  } catch (error) {
    console.error('[scraper-status] Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
