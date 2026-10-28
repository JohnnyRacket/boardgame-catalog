import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

export const LLM_BASE_URL = process.env.LLM_BASE_URL ?? 'http://console.localdomain:8080/v1'

/** Text model (rules summaries). llama-swap routes by model id, so the old llama-server placeholder "default" no longer resolves */
export const LLM_MODEL =
  process.env.LLM_MODEL && process.env.LLM_MODEL !== 'default' ? process.env.LLM_MODEL : 'gemma-4-26b-ik-g4'
/** Must accept images (llama.cpp with an mmproj) */
export const LLM_VISION_MODEL = process.env.LLM_VISION_MODEL ?? 'gemma-4-26b-ik-g4'

export const llm = createOpenAICompatible({
  name: 'llama',
  baseURL: LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY ?? 'not-needed',
})

/** Human-readable error for a failed LLM call */
export function describeLlmError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  if (message.includes('ECONNREFUSED') || message.includes('fetch failed') || message.includes('ENOTFOUND')) {
    return `Could not connect to local LLM server at ${LLM_BASE_URL}. Make sure llama-swap is running on the AI box. Raw error: ${message}`
  }
  return `LLM generation failed: ${message}`
}
