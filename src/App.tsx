import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Mic,
} from 'lucide-react'
import tickets from './mockData.json'

type Ticket = (typeof tickets)[number]

function urgencyStyles(urgency: string) {
  switch (urgency.toLowerCase()) {
    case 'critical':
      return 'border-red-500/40 bg-red-500/15 text-red-300'
    case 'high':
      return 'border-amber-500/40 bg-amber-500/15 text-amber-300'
    default:
      return 'border-sky-500/40 bg-sky-500/15 text-sky-300'
  }
}

function sentimentLabel(score: number) {
  if (score < 0.3) return 'Severely Negative'
  if (score < 0.5) return 'Frustrated'
  if (score < 0.7) return 'Neutral'
  return 'Positive'
}

function App() {
  const [ticketIndex, setTicketIndex] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const ticket: Ticket = tickets[ticketIndex]
  const sentimentPercent = Math.round(ticket.sentimentScore * 100)

  function handleResolution(action: string) {
    setSuccessMessage(`Resolved: ${action}`)
    setShowTranscript(false)
    window.setTimeout(() => {
      setSuccessMessage(null)
      setTicketIndex((prev) => (prev + 1) % tickets.length)
    }, 1200)
  }

  return (
    <div className="relative min-h-svh bg-black text-neutral-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.12),_transparent_55%)]" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-3xl flex-col px-5 pb-28 pt-8 sm:px-8">
        <header className="mb-8 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-sky-400/80 uppercase">
              Support Command
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              OmniBrief AI // Support Triage
            </h1>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-right">
            <p className="text-[10px] tracking-wider text-neutral-500 uppercase">
              Ticket
            </p>
            <p className="font-mono text-sm text-white">
              {ticketIndex + 1} / {tickets.length}
            </p>
            <p className="mt-0.5 font-mono text-xs text-neutral-400">
              {ticket.ticketId}
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
              {ticket.customerName}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide uppercase ${urgencyStyles(ticket.urgency)}`}
            >
              <AlertCircle className="size-3.5" />
              {ticket.urgency}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400"
                style={{ width: `${sentimentPercent}%` }}
              />
            </div>
            <p className="shrink-0 text-sm text-neutral-300">
              Sentiment{' '}
              <span className="font-mono text-white">{ticket.sentimentScore.toFixed(2)}</span>
              <span className="text-neutral-500"> · {sentimentLabel(ticket.sentimentScore)}</span>
            </p>
          </div>

          <ul className="mt-6 space-y-2.5">
            {ticket.visualBullets.map((bullet) => (
              <li
                key={bullet}
                className="flex gap-2.5 text-sm leading-relaxed text-neutral-300"
              >
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-sky-400" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wider text-neutral-500 uppercase">
              <FileText className="size-3.5" />
              Executive Summary
            </div>
            <p className="text-sm leading-relaxed text-neutral-200">
              {ticket.executiveSummary}
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
                {ticket.rawTranscript}
              </pre>
            )}
          </div>
        </article>

        <section className="mt-7">
          <h3 className="mb-3 text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">
            1-Click Resolutions
          </h3>
          <div className="flex flex-col gap-2.5">
            {ticket.recommendedActions.map((action) => (
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
    </div>
  )
}

export default App
