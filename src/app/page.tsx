import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function Home() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  
  // Si está autenticado, redirigir al dashboard
  if (token) {
    redirect('/dashboard')
  }
  
  // Si no está autenticado, mostrar la landing
  redirect('/landing')
}
