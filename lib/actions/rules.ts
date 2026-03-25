'use server'

import path from 'path'
import { readFile } from 'fs/promises'
import { generateText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { extractText } from 'unpdf'
import { revalidatePath } from 'next/cache'
import { getGameById, updateGameRulesSummary } from '@/lib/db/queries'

export type GenerateSummaryResult = { summary?: string; error?: string }

const MAX_CHARS = 80_000
const LLM_BASE_URL = process.env.LLM_BASE_URL ?? 'http://console.localdomain:8080/v1'

const llm = createOpenAICompatible({
  name: 'llama',
  baseURL: LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY ?? 'not-needed',
})

export async function generateRulesSummaryAction(gameId: number): Promise<GenerateSummaryResult> {
  const game = await getGameById(gameId)
  if (!game) return { error: 'Game not found.' }
  if (!game.rulebook_url) return { error: 'No rulebook uploaded for this game.' }

  // Read PDF from filesystem (rulebook_url is '/uploads/uuid.pdf')
  const pdfPath = path.join(process.cwd(), 'public', game.rulebook_url.replace(/^\//, ''))
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await readFile(pdfPath)
  } catch {
    return { error: 'Rulebook file not found on server.' }
  }

  // Extract text with unpdf
  let rawText: string
  try {
    const { text } = await extractText(new Uint8Array(pdfBuffer), { mergePages: true })
    rawText = text
  } catch {
    return { error: 'Failed to extract text from PDF. The file may be image-based or corrupted.' }
  }

  if (!rawText.trim()) {
    return { error: 'No readable text found in the PDF. It may be a scanned image.' }
  }

  const textToSend = rawText.slice(0, MAX_CHARS)
  const truncated = rawText.length > MAX_CHARS

  let summary: string
  try {
    const result = await generateText({
      model: llm(process.env.LLM_MODEL ?? 'default'),
      maxOutputTokens: 1500,
      prompt: `You are a concise board game assistant. Given rulebook text for "${game.name}", write a practical quick-start summary that covers:

## Objective
One or two sentences on how to win.

## Setup
Bullet points for key setup steps.

## On Your Turn
Numbered steps for a player's turn.

## Key Rules
Bullet points for important rules, restrictions, and edge cases.

## Scoring
How scoring works (if applicable).

Be scannable and practical — a player should be able to start playing after reading this.${truncated ? ' (Note: rulebook text was truncated)' : ''}

Rulebook text:
${textToSend}`,
    })
    summary = result.text.trim()
  } catch (err) {
    console.error('LLM generation failed:', err)
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('ECONNREFUSED') || message.includes('fetch failed') || message.includes('ENOTFOUND')) {
      return {
        error: `Could not connect to local LLM server at ${LLM_BASE_URL}. Make sure llama.cpp is running (e.g. "llama-server -m model.gguf"). Raw error: ${message}`,
      }
    }
    return { error: `LLM generation failed: ${message}` }
  }

  try {
    await updateGameRulesSummary(gameId, summary)
  } catch (err) {
    console.error('Failed to save rules summary:', err)
    return { error: 'Failed to save summary. Please try again.' }
  }

  revalidatePath('/')
  revalidatePath('/games/[id]', 'page')
  return { summary }
}
