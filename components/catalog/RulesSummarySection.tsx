'use client'

import { useState, useTransition } from 'react'
import { FileText, BookOpen, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import ReactMarkdown from 'react-markdown'
import { generateRulesSummaryAction } from '@/lib/actions/rules'

interface RulesSummarySectionProps {
  gameId: number
  gameName: string
  rulebookUrl: string | null
  initialSummary: string | null
}

function RulesSummaryDisplay({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm">
    <ReactMarkdown
      components={{
        h2: ({ children }) => (
          <h3 className="font-semibold border-b pb-1 text-foreground mt-5 first:mt-0">{children}</h3>
        ),
        h3: ({ children }) => (
          <h4 className="font-medium text-foreground mt-3 first:mt-0">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="text-muted-foreground">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <div className="flex gap-2 text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
            <span>{children}</span>
          </div>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{children}</code>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
    </div>
  )
}

export function RulesSummarySection({
  gameId,
  gameName,
  rulebookUrl,
  initialSummary,
}: RulesSummarySectionProps) {
  const [summary, setSummary] = useState<string | null>(initialSummary)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!rulebookUrl) return null

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await generateRulesSummaryAction(gameId)
      if (result.error) {
        setError(result.error)
      } else if (result.summary) {
        setSummary(result.summary)
        setSheetOpen(true)
      }
    })
  }

  return (
    <>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            asChild
          >
            <a href={rulebookUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              View Rulebook
            </a>
          </Button>
          {summary ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setSheetOpen(true)}
              >
                <BookOpen className="h-3.5 w-3.5" />
                View Rules Summary
              </Button>
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
                onClick={handleGenerate}
                disabled={isPending}
              >
                {isPending ? 'Regenerating…' : 'Regenerate'}
              </button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleGenerate}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  Generate Rules Summary
                </>
              )}
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pr-8">
            <SheetTitle>{gameName}</SheetTitle>
            <SheetDescription>AI-generated quick-start guide</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {summary && <RulesSummaryDisplay text={summary} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
