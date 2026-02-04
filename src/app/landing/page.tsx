'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [nombreInmobiliaria, setNombreInmobiliaria] = useState('')

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí puedes agregar lógica para enviar el email o redirigir
    window.location.href = `/login`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🏠</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">CRM Inmobiliario</span>
            </div>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="outline">Iniciar Sesión</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Presupuesto CRM Inmobiliario con IA
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Sistema completo de gestión para inmobiliarias con Inteligencia Artificial integrada
          </p>
        </div>
      </section>

      {/* Descripción del CRM */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">¿Qué es este CRM?</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-slate-700 mb-4">
              Es una plataforma SaaS completa diseñada específicamente para inmobiliarias que necesitan 
              gestionar múltiples agentes, clientes, propiedades y comisiones de forma eficiente y automatizada.
            </p>
            <p className="text-slate-700 mb-4">
              El sistema incluye <strong>Inteligencia Artificial integrada</strong> que automatiza tareas 
              repetitivas como el análisis de mensajes de WhatsApp, la búsqueda de propiedades y la generación 
              de sugerencias inteligentes para cada cliente.
            </p>
            <p className="text-slate-700">
              Es un sistema <strong>multi-inmobiliaria y multi-agente</strong>, lo que significa que puedes 
              gestionar varias inmobiliarias desde una sola plataforma, cada una con sus propios agentes, 
              clientes y datos completamente separados.
            </p>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Funcionalidades Principales</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Funcionalidad 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>🤖</span> IA para Parseo de Mensajes WhatsApp
              </h3>
              <p className="text-slate-600">
                Pega mensajes de WhatsApp de clientes y la IA (GPT-4) extrae automáticamente: presupuesto, 
                tipo de propiedad, zona preferida, dormitorios, cochera, etc. Crea búsquedas y clientes 
                automáticamente sin trabajo manual.
              </p>
            </div>

            {/* Funcionalidad 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>🎯</span> Sugerencias Inteligentes con Scoring
              </h3>
              <p className="text-slate-600">
                El sistema analiza cada búsqueda y sugiere propiedades de tu inventario con un score de 
                coincidencia (ALTA/MEDIA/BAJA). Compara automáticamente precio, zona, tipo, dormitorios 
                y características.
              </p>
            </div>

            {/* Funcionalidad 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>🔍</span> Búsqueda Automática en MercadoLibre y Argenprop
              </h3>
              <p className="text-slate-600">
                La IA busca propiedades automáticamente en MercadoLibre y Argenprop según los criterios de 
                búsqueda del cliente. Encuentra oportunidades que no tenías en tu inventario y las agrega 
                como sugerencias.
              </p>
            </div>

            {/* Funcionalidad 4 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>👥</span> Gestión Multi-Agente y Multi-Inmobiliaria
              </h3>
              <p className="text-slate-600">
                Gestiona múltiples inmobiliarias desde una sola plataforma. Cada inmobiliaria tiene sus 
                agentes, clientes, propiedades y comisiones completamente separados. Sistema multi-tenant 
                con permisos por rol (admin, agente, supervisor).
              </p>
            </div>

            {/* Funcionalidad 5 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>📊</span> Dashboard y Pipeline de Ventas
              </h3>
              <p className="text-slate-600">
                Visualiza KPIs en tiempo real: búsquedas por estado (NUEVO, CALIFICADO, VISITA, RESERVA, 
                CERRADO), propiedades disponibles, comisiones pendientes y cerradas. Pipeline visual del 
                proceso de ventas.
              </p>
            </div>

            {/* Funcionalidad 6 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>💰</span> Cálculo Automático de Comisiones
              </h3>
              <p className="text-slate-600">
                Sistema de comisiones configurable por inmobiliaria. Calcula automáticamente comisiones 
                según tipo de punta (UNA/DOS), porcentaje de inmobiliaria y porcentaje del agente. 
                Seguimiento de cobros pendientes y realizados.
              </p>
            </div>

            {/* Funcionalidad 7 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>📥</span> Importación desde Excel
              </h3>
              <p className="text-slate-600">
                Importa clientes, búsquedas, propiedades y comisiones desde archivos Excel existentes. 
                El sistema normaliza automáticamente monedas, tipos de propiedad y valores numéricos. 
                No duplica registros existentes.
              </p>
            </div>

            {/* Funcionalidad 8 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>⚡</span> Carga Rápida de Propiedades
              </h3>
              <p className="text-slate-600">
                Herramienta de carga masiva para agregar múltiples propiedades rápidamente. Puedes pegar 
                datos desde Excel o completar formularios en línea. Genera descripciones automáticamente 
                si no las proporcionas.
              </p>
            </div>

            {/* Funcionalidad 9 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>📋</span> Gestión Completa de Clientes y Búsquedas
              </h3>
              <p className="text-slate-600">
                Registra clientes con sus datos de contacto, historial de comunicaciones (WhatsApp, llamadas, 
                emails), búsquedas activas con sus criterios, propiedades enviadas y respuestas del cliente.
              </p>
            </div>

            {/* Funcionalidad 10 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>✅</span> Control de Estados y Permisos
              </h3>
              <p className="text-slate-600">
                Estados de propiedades (BORRADOR, EN_ANALISIS, APROBADA, DESCARTADA) y búsquedas (NUEVO, 
                CALIFICADO, VISITA, RESERVA, CERRADO, PERDIDO). Permisos por rol: admin ve todo, agente 
                solo lo suyo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planes y Precios */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Planes y Precios</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
            {/* Plan Básico */}
            <div className="p-8 rounded-2xl border-2 border-slate-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Básico</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-slate-900">$29.900</span>
                  <span className="text-slate-600">/mes</span>
                </div>
                <p className="text-sm text-slate-600">Para inmobiliarias pequeñas</p>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700">Hasta 2 agentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700">Hasta 500 propiedades</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700">IA WhatsApp (100 mensajes/mes)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700">Sugerencias inteligentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700">Dashboard básico</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700">Cálculo de comisiones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700">Importación Excel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">✗</span>
                  <span className="text-slate-400 line-through">Búsqueda ML/Argenprop</span>
                </li>
              </ul>
            </div>

            {/* Plan Profesional */}
            <div className="p-8 rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  RECOMENDADO
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Profesional</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-slate-900">$120.000</span>
                  <span className="text-slate-600">/mes</span>
                </div>
                <p className="text-sm text-slate-600">Para inmobiliarias en crecimiento</p>
                <div className="mt-2">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                    🎁 Prueba 7 días gratis
                  </span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">Hasta 10 agentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">Propiedades ilimitadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">IA WhatsApp (500 mensajes/mes) - Parseo automático</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">Sugerencias inteligentes con scoring (ALTA/MEDIA/BAJA)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">Búsqueda automática en MercadoLibre y Argenprop</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">Dashboard avanzado con KPIs y pipeline visual</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">Multi-inmobiliaria y multi-agente completo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">Cálculo automático de comisiones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">Importación desde Excel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">Carga rápida de propiedades</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">Gestión completa de clientes y búsquedas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">Control de estados y permisos por rol</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 font-medium">Soporte prioritario</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Opción de Pago Único */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-500 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  PAGO ÚNICO
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-slate-900 mb-2">Sistema Completo</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-purple-600">$300.000</span>
                  <span className="text-slate-600 text-xl"> (pago único)</span>
                </div>
                <p className="text-lg text-slate-700 font-medium">Licencia perpetua del sistema completo</p>
              </div>
              <ul className="space-y-3 mb-6 text-sm text-left max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 font-bold">✓</span>
                  <span className="text-slate-700"><strong>Todas las funcionalidades del plan Profesional</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 font-bold">✓</span>
                  <span className="text-slate-700">Agentes y propiedades ilimitados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 font-bold">✓</span>
                  <span className="text-slate-700">IA ilimitada sin restricciones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 font-bold">✓</span>
                  <span className="text-slate-700">Sin pagos mensuales recurrentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 font-bold">✓</span>
                  <span className="text-slate-700">Soporte técnico incluido (1 año)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 font-bold">✓</span>
                  <span className="text-slate-700">Actualizaciones y mejoras incluidas (1 año)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 font-bold">✓</span>
                  <span className="text-slate-700">Instalación y configuración inicial</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 font-bold">✓</span>
                  <span className="text-slate-700">Capacitación del equipo incluida</span>
                </li>
              </ul>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-xs text-slate-600 mb-2">Comparación con plan mensual:</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Plan Profesional mensual:</span>
                    <span className="font-semibold">$120.000/mes</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">En 3 meses pagarías:</span>
                    <span className="font-semibold text-red-600">$360.000</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-green-600 font-semibold">Pago único en efectivo:</span>
                    <span className="font-bold text-green-600 text-lg">$300.000</span>
                  </div>
                  <div className="pt-2 border-t bg-green-50 rounded p-2">
                    <p className="text-sm font-bold text-green-700">
                      💰 Descuento del 16.7% pagando de una vez
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Ahorras $60.000 en solo 3 meses
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Opciones de Pago */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Opciones de Pago</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Pago Mensual */}
              <div className="bg-white p-6 rounded-xl">
                <h4 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span>💳</span> Pago Mensual
                </h4>
                <ul className="space-y-2 text-slate-700 mb-4 text-sm">
                  <li>• Facturación mensual recurrente</li>
                  <li>• Cancelación en cualquier momento</li>
                  <li>• Sin compromiso a largo plazo</li>
                  <li>• Pago por transferencia bancaria o Mercado Pago</li>
                </ul>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-2">Ejemplo Plan Profesional:</p>
                  <p className="text-2xl font-bold text-slate-900">$120.000/mes</p>
                  <p className="text-sm text-slate-600">Facturado mensualmente</p>
                  <p className="text-xs text-green-600 mt-1 font-semibold">🎁 Prueba 7 días gratis</p>
                </div>
              </div>

              {/* Pago Anual */}
              <div className="bg-white p-6 rounded-xl border-2 border-green-500 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    AHORRA 20%
                  </span>
                </div>
                <h4 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span>💰</span> Pago Anual
                </h4>
                <ul className="space-y-2 text-slate-700 mb-4 text-sm">
                  <li>• Pago único por todo el año</li>
                  <li>• <strong>Descuento del 20%</strong> (2 meses gratis)</li>
                  <li>• Facturación anual</li>
                  <li>• Pago por transferencia bancaria</li>
                </ul>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-2">Ejemplo Plan Profesional:</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-lg text-slate-400 line-through">$120.000/mes</span>
                    <span className="text-2xl font-bold text-green-600">$96.000/mes</span>
                  </div>
                  <p className="text-sm text-slate-600">Total anual: $1.152.000 (ahorro de $288.000)</p>
                </div>
              </div>
            </div>

            {/* Pago Único - Sistema Completo */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-500">
              <h4 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2 text-center justify-center">
                <span>🎁</span> Pago Único - Sistema Completo
              </h4>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-purple-600 mb-2">$300.000</p>
                <p className="text-sm text-slate-600">Pago único • Licencia perpetua</p>
              </div>
              
              {/* Comparación de ahorro */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-xs text-slate-600 mb-3 text-center">💰 Comparación con plan mensual ($120.000/mes):</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">3 meses de plan mensual:</span>
                    <span className="font-semibold text-red-600">$360.000</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-semibold">Pago único en efectivo:</span>
                      <span className="font-bold text-green-600 text-lg">$300.000</span>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded p-2 mt-2">
                    <p className="text-xs text-green-700 text-center">
                      <strong>💵 Descuento del 16.7% pagando de una vez</strong>
                    </p>
                    <p className="text-xs text-green-700 text-center mt-1">
                      En 3 meses pagas <strong>$360.000</strong>, con pago único ahorras <strong>$60.000</strong>
                    </p>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-slate-700 text-sm max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Todas las funcionalidades sin límites</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Sin pagos mensuales recurrentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Soporte y actualizaciones (1 año incluido)</span>
                </li>
              </ul>
            </div>

            {/* Métodos de Pago */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-3 text-center">Métodos de Pago Aceptados</h4>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
                <span>✓ Transferencia bancaria</span>
                <span>✓ Mercado Pago</span>
                <span>✓ Factura A / Factura B</span>
                <span>✓ Tarjeta de crédito/débito</span>
              </div>
            </div>
          </div>

          {/* Notas importantes */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-semibold text-slate-900 mb-3">📋 Notas Importantes</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• <strong>🎁 Prueba gratuita:</strong> 7 días completos para probar todas las funcionalidades, sin tarjeta de crédito requerida</li>
                <li>• <strong>💵 Pago único en efectivo:</strong> $300.000 (descuento del 16.7% vs pagar 3 meses mensual)</li>
                <li>• <strong>Precios en pesos argentinos (ARS):</strong> Los precios pueden ajustarse según inflación</li>
                <li>• <strong>Facturación:</strong> Emitimos factura A o B según corresponda</li>
                <li>• <strong>Implementación:</strong> Incluye configuración inicial y capacitación básica</li>
                <li>• <strong>Soporte:</strong> Email y WhatsApp durante horario laboral (Lun-Vie 9-18hs)</li>
                <li>• <strong>Actualizaciones:</strong> Todas las mejoras y nuevas funcionalidades incluidas sin costo adicional</li>
                <li>• <strong>Todas las funcionalidades incluidas:</strong> IA, multi-agente, multi-inmobiliaria, sugerencias inteligentes, búsqueda automática ML/Argenprop, dashboard, comisiones, importación Excel, y más</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Solicita tu presupuesto personalizado o inicia tu prueba gratuita de 14 días
          </p>
          <form onSubmit={handleContact} className="max-w-md mx-auto space-y-4">
            <input
              type="text"
              value={nombreInmobiliaria}
              onChange={(e) => setNombreInmobiliaria(e.target.value)}
              placeholder="Nombre de tu inmobiliaria"
              className="w-full px-4 py-3 rounded-lg text-slate-900"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-lg text-slate-900"
              required
            />
            <Link href="/login">
              <Button type="submit" size="lg" className="w-full bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg">
                Solicitar Presupuesto
              </Button>
            </Link>
          </form>
          <p className="text-blue-100 text-sm mt-4">
            🎁 Prueba gratuita de 7 días • Sin compromiso • Respuesta en 24hs
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🏠</span>
                </div>
                <span className="text-white font-bold">CRM Inmobiliario</span>
              </div>
              <p className="text-sm">
                Sistema de gestión con IA para inmobiliarias
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li>Email: contacto@crminmobiliario.com</li>
                <li>WhatsApp: +54 11 1234-5678</li>
                <li>Horario: Lun-Vie 9-18hs</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Información</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Términos y Condiciones</a></li>
                <li><a href="#" className="hover:text-white">Política de Privacidad</a></li>
                <li><a href="#" className="hover:text-white">Preguntas Frecuentes</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>© 2026 CRM Inmobiliario. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
