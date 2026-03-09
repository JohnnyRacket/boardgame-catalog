import { LoginForm } from '@/components/auth/LoginForm'

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const from = typeof params.from === 'string' && params.from.startsWith('/') ? params.from : '/games'

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoginForm redirectTo={from} />
    </div>
  )
}
