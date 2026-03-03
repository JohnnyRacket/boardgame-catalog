'use client'

interface BackButtonProps {
  fallbackHref: string
  className?: string
  children: React.ReactNode
}

export function BackButton({ fallbackHref, className, children }: BackButtonProps) {
  function handleClick() {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = fallbackHref
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
