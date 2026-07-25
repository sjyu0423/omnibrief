import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Mic,
  Plus,
  X,
  Zap,
} from 'lucide-react'
import tickets from './mockData.json'

interface Ticket {
  ticketId: string
  customerName: string
  urgency: string
  sentimentScore: number
  visualBullets: string[]
  executiveSummary: string
  rawTranscript: string
  recommendedActions: string[]
}

const CRITICAL_WORDS = [
  'sue',
  'suing',
  'legal',
  'chargeback',
  'furious',
  'fraud',
  'broken',
  'lawsuit',
  'attorney',
  'counsel',
]

const MILD_WORDS = [
  'confused',
  'question',
  'help',
  'unsure',
  'unclear',
  'issue',
  'problem',
]

function randomInRange(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

function containsWord(text: string, words: string[]) {
  const lower = text.toLowerCase()
  return words.some((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, 'i')
    return pattern.test(lower)
  })
}

function extractCustomerName(rawTranscript: string): string {
  const patterns = [
    /(?:^|\n)\s*(?:Name|Customer|Contact)\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /(?:^|\n)\s*User\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,
    /(?:^|\n)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*:/,
  ]

  for (const pattern of patterns) {
    const match = rawTranscript.match(pattern)
    if (match?.[1]) {
      const candidate = match[1].trim()
      const blocked = ['Agent', 'User', 'Customer', 'Support', 'System']
      if (!blocked.includes(candidate.split(/\s+/)[0])) {
        return candidate
      }
    }
  }

  const id = 100 + Math.floor(Math.random() * 900)
  return `B2B User ID-${id}`
}

function extractBullets(rawTranscript: string): string[] {
  const lines = rawTranscript
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^(?:Agent|User|Customer|Support|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*:\s*/i, '')
        .trim(),
    )
    .filter(Boolean)

  const sentences = lines
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter((s) => s.length > 18)

  const unique: string[] = []
  for (const sentence of sentences) {
    const clipped =
      sentence.length > 110 ? `${sentence.slice(0, 107).trimEnd()}…` : sentence
    if (!unique.some((u) => u.toLowerCase() === clipped.toLowerCase())) {
      unique.push(clipped)
    }
    if (unique.length >= 4) break
  }

  if (unique.length === 0) {
    return [
      'Customer reported an unresolved account issue',
      'Requires triage and follow-up from support',
    ]
  }

  return unique
}

function buildResolutions(urgency: string, bullets: string[]): string[] {
  const primaryIssue = bullets[0] ?? 'the reported account issue'

  if (urgency === 'CRITICAL') {
    return [
      `Issue emergency refund / credit and written confirmation within 1 hour`,
      `Escalate to Tier-3 + legal liaison for: ${primaryIssue.slice(0, 60)}`,
      `Apply $500 goodwill credit and schedule executive callback today`,
    ]
  }

  if (urgency === 'MEDIUM') {
    return [
      `Open standard troubleshooting case for: ${primaryIssue.slice(0, 70)}`,
      `Send knowledge-base steps and confirm resolution within 4 hours`,
      `Offer $50 service credit if issue persists after first response`,
    ]
  }

  return [
    `Acknowledge request and log a low-priority follow-up ticket`,
    `Send proactive tips related to: ${primaryIssue.slice(0, 70)}`,
    `Mark for CSAT check-in after successful resolution`,
  ]
}

function buildSummary(
  name: string,
  urgency: string,
  sentimentLabelText: string,
  bullets: string[],
): string {
  const issues = bullets.slice(0, 2).join('; ')
  const line1 = `${name} contacted support regarding: ${issues || 'an account concern'}.`
  const line2 = `Detected tone is ${sentimentLabelText.toLowerCase()} with urgency classified as ${urgency}.`
  const line3 =
    urgency === 'CRITICAL'
      ? 'Recommend immediate containment: refund/credit, legal-aware escalation, and written confirmation before dispute risk rises.'
      : urgency === 'MEDIUM'
        ? 'Recommend a same-day guided fix, clear ownership, and a courtesy follow-up to prevent escalation.'
        : 'Recommend a standard acknowledgment, lightweight guidance, and optional CSAT follow-up.'

  return `${line1} ${line2} ${line3}`
}

function simulateAIAnalysis(rawTranscript: string): Ticket {
  const name = extractCustomerName(rawTranscript)
  const bullets = extractBullets(rawTranscript)

  let urgency: 'CRITICAL' | 'MEDIUM' | 'LOW'
  let sentimentScore: number
  let sentimentLabelText: string

  if (containsWord(rawTranscript, CRITICAL_WORDS)) {
    urgency = 'CRITICAL'
    sentimentScore = randomInRange(0.1, 0.2)
    sentimentLabelText = 'Severely Negative'
  } else if (containsWord(rawTranscript, MILD_WORDS)) {
    urgency = 'MEDIUM'
    sentimentScore = randomInRange(0.5, 0.6)
    sentimentLabelText = 'Moderately Annoyed'
  } else {
    urgency = 'LOW'
    sentimentScore = randomInRange(0.8, 0.9)
    sentimentLabelText = 'Positive'
  }

  const ticketNum = 48000 + Math.floor(Math.random() * 999)
  return {
    ticketId: `ESC-${ticketNum}`,
    customerName: name,
    urgency,
    sentimentScore,
    visualBullets: bullets,
    executiveSummary: buildSummary(name, urgency, sentimentLabelText, bullets),
    rawTranscript: rawTranscript.trim(),
    recommendedActions: buildResolutions(urgency, bullets),
  }
}

function urgencyStyles(urgency: string) {
  switch (urgency.toLowerCase()) {
    case 'critical':
      return 'border-red-500/40 bg-red-500/15 text-red-300'
    case 'medium':
    case 'high':
      return 'border-amber-500/40 bg-amber-500/15 text-amber-300'
    case 'low':
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
    default:
      return 'border-sky-500/40 bg-sky-500/15 text-sky-300'
  }
}

function sentimentLabel(score: number) {
  if (score < 0.3) return 'Severely Negative'
  if (score < 0.45) return 'Frustrated'
  if (score < 0.65) return 'Moderately Annoyed'
  if (score < 0.75) return 'Neutral'
  return 'Positive'
}

function sentimentBarColor(urgency: string) {
  switch (urgency.toLowerCase()) {
    case 'critical':
      return 'bg-red-500'
    case 'medium':
    case 'high':
      return 'bg-amber-400'
    case 'low':
      return 'bg-emerald-400'
    default:
      return 'bg-sky-400'
  }
}

function App() {
  const [activeTicket, setActiveTicket] = useState<Ticket>(tickets[0] as Ticket)
  const [showTranscript, setShowTranscript] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [rawInput, setRawInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const sentimentPercent = Math.round(activeTicket.sentimentScore * 100)

  function handleResolution(action: string) {
    setSuccessMessage(`Resolved: ${action}`)
    setShowTranscript(false)
    window.setTimeout(() => {
      setSuccessMessage(null)
    }, 1600)
  }

  function closeModal() {
    if (isAnalyzing) return
    setModalOpen(false)
    setRawInput('')
  }

  function handleGenerate() {
    const transcript = rawInput.trim()
    if (!transcript || isAnalyzing) return

    setIsAnalyzing(true)
    window.setTimeout(() => {
      const analyzed = simulateAIAnalysis(transcript)
      setActiveTicket(analyzed)
      setShowTranscript(false)
      setSuccessMessage(null)
      setIsAnalyzing(false)
      setModalOpen(false)
      setRawInput('')
    }, 900)
  }

  return (
    <div className="relative min-h-svh bg-black text-neutral-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.12),_transparent_55%)]" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-3xl flex-col px-5 pb-28 pt-8 sm:px-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-sky-400/80 uppercase">
                Support Command
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                OmniBrief AI // Support Triage
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/60 bg-transparent px-3 py-2 text-sm font-medium text-sky-300 transition hover:border-sky-400 hover:bg-sky-500/10 hover:text-sky-200"
            >
              <Plus className="size-4" strokeWidth={2.25} />
              Test New Ticket
            </button>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-right">
            <p className="text-[10px] tracking-wider text-neutral-500 uppercase">
              Active Ticket
            </p>
            <p className="mt-0.5 font-mono text-sm text-white">
              {activeTicket.ticketId}
            </p>
          </div>
        </header>

        {successMessage && (
          <div className="toast-enter mb-5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <article className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 shadow-[0_0_40px_rgba(0,0,0,0.6)] sm:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-white">
              {activeTicket.customerName}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide uppercase ${urgencyStyles(activeTicket.urgency)}`}
            >
              <AlertCircle className="size-3.5" />
              {activeTicket.urgency}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${sentimentBarColor(activeTicket.urgency)}`}
                style={{ width: `${Math.max(sentimentPercent, 8)}%` }}
              />
            </div>
            <p className="shrink-0 text-sm text-neutral-300">
              Sentiment{' '}
              <span className="font-mono text-white">
                {activeTicket.sentimentScore.toFixed(2)}
              </span>
              <span className="text-neutral-500">
                {' '}
                · {sentimentLabel(activeTicket.sentimentScore)}
              </span>
            </p>
          </div>

          <ul className="mt-6 space-y-2.5">
            {activeTicket.visualBullets.map((bullet) => (
              <li
                key={bullet}
                className="flex gap-2.5 text-sm leading-relaxed text-neutral-300"
              >
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-sky-400" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wider text-neutral-500 uppercase">
              <FileText className="size-3.5" />
              Executive Summary
            </div>
            <p className="text-sm leading-relaxed text-neutral-200">
              {activeTicket.executiveSummary}
            </p>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowTranscript((open) => !open)}
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm text-neutral-200 transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <span className="flex items-center gap-2">
                <FileText className="size-4 text-neutral-400" />
                View Raw Customer Transcript
              </span>
              <ChevronRight
                className={`size-4 text-neutral-500 transition-transform ${showTranscript ? 'rotate-90' : ''}`}
              />
            </button>
            {showTranscript && (
              <pre className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-black/60 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-neutral-400">
                {activeTicket.rawTranscript}
              </pre>
            )}
          </div>
        </article>

        <section className="mt-7">
          <h3 className="mb-3 text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">
            1-Click Resolutions
          </h3>
          <div className="flex flex-col gap-2.5">
            {activeTicket.recommendedActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => handleResolution(action)}
                className="group flex items-start gap-3 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3.5 text-left text-sm text-sky-100 transition hover:border-sky-400/50 hover:bg-sky-500/20"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sky-400 transition group-hover:text-sky-300" />
                <span className="flex-1 leading-snug">{action}</span>
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-sky-500/60 transition group-hover:translate-x-0.5 group-hover:text-sky-300" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 flex justify-center pb-8 pt-4">
        <button
          type="button"
          aria-label="Voice command microphone"
          className="mic-orb flex size-16 items-center justify-center rounded-full border border-sky-400/40 bg-gradient-to-b from-sky-400/30 to-sky-600/20 text-sky-200 backdrop-blur-sm transition hover:scale-105 hover:text-white active:scale-95"
        >
          <Mic className="size-7" strokeWidth={1.75} />
        </button>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="parser-modal-title"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-black p-5 shadow-[0_0_60px_rgba(0,0,0,0.85)] sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="size-5 shrink-0 text-sky-400" />
                <h2
                  id="parser-modal-title"
                  className="text-lg font-semibold text-white"
                >
                  Paste Raw Customer Transcript to Analyze
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isAnalyzing}
                className="rounded-md p-1 text-neutral-500 transition hover:bg-white/5 hover:text-neutral-300 disabled:opacity-40"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              disabled={isAnalyzing}
              rows={10}
              placeholder='User: I am furious. Your billing glitched and charged me twice. I need this fixed or I am suing.'
              className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm leading-relaxed text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-sky-500/50 disabled:opacity-60"
            />

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeModal}
                disabled={isAnalyzing}
                className="rounded-lg border border-zinc-700 bg-transparent px-4 py-2.5 text-sm text-neutral-300 transition hover:border-zinc-500 hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isAnalyzing || !rawInput.trim()}
                className="inline-flex items-center gap-2 rounded-lg border border-sky-500/50 bg-sky-500/15 px-4 py-2.5 text-sm font-medium text-sky-200 transition hover:border-sky-400 hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing Transcript…
                  </>
                ) : (
                  <>
                    <Zap className="size-4" />
                    Generate B2B Dashboard
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
