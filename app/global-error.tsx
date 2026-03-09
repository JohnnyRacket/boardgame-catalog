'use client'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-gray-500">A critical error occurred. Please try refreshing.</p>
          <button onClick={reset} className="px-4 py-2 border rounded">
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
