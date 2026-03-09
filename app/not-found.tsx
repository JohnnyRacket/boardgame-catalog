export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
      <a href="/games" className="underline text-sm">
        Back to catalog
      </a>
    </div>
  )
}
