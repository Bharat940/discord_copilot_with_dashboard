import { redirect } from 'next/navigation'

export default function Home() {
  // Root page redirects to dashboard
  // Middleware will handle auth check and redirect to /login if needed
  redirect('/dashboard')
}
