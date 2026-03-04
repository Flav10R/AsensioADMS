import { redirect } from 'next/navigation'

export default function Home() {
  // Redirige siempre al dashboard protegido. 
  // Si no está logueado, el middleware saltará a /login.
  redirect('/dashboard')
}
