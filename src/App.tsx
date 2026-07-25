import { useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Mic,
  PieChart,
  Plus,
  Terminal,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import seedTickets from './mockData.json'

interface Resolution {
  title: string
  evImpact: number
  churnReduction: string
  riskProfile: 'Low' | 'Medium' | 'High'
}

interface Ticket {
  ticketId: string
  customerName: string
  urgency: string
  sentimentScore: number
  visualBullets: string[]
  executiveSummary: string
  rawTranscript: string
  recommendedActions: Resolution[]
  auditLog: string[]
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

const URGENCY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function randomInRange(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

function containsWord(text: string, words: string[]) {
  return words.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text))
}

function findMatchedKeywords(text: string, words: string[]): string[] {
  return words.filter((word) => new RegExp(`\\b${word}\\b`, 'i').test(text))
}

function sortTicketsByUrgency(list: Ticket[]): Ticket[] {
  return [...list].sort((a, b) => {
    const rankA = URGENCY_RANK[a.urgency.toLowerCase()] ?? 99
    const rankB = URGENCY_RANK[b.urgency.toLowerCase()] ?? 99
    if (rankA !== rankB) return rankA - rankB
    return a.ticketId.localeCompare(b.ticketId)
  })
}

function buildAuditLog(
  rawTranscript: string,
  urgency: string,
  sentimentScore: number,
): string[] {
  const matched = [
    ...findMatchedKeywords(rawTranscript, CRITICAL_WORDS),
    ...findMatchedKeywords(rawTranscript, MILD_WORDS),
  ]
  const uniqueMatched = [...new Set(matched)]
  const keywordLine =
    uniqueMatched.length > 0
      ? uniqueMatched.join(', ')
      : 'none (neutral lexicon)'

  return [
    '> [Sys] Initializing semantic parser...',
    `> [Lex] Keyword matches detected: ${keywordLine}`,
    `> [Model] Sentiment classification score: ${sentimentScore.toFixed(2)}`,
    `> [Logic] Applying urgency weights -> ${urgency}`,
    '> [EV_Engine] Computing retention probabilities and resolution value...',
    `> [Done] Audit trail sealed · ${rawTranscript.trim().length} chars ingested`,
  ]
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
        .replace(
          /^(?:Agent|User|Customer|Support|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*:\s*/i,
          '',
        )
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

function buildResolutions(urgency: string, bullets: string[]): Resolution[] {
  const primaryIssue = bullets[0] ?? 'the reported account issue'
  const shortIssue =
    primaryIssue.length > 56 ? `${primaryIssue.slice(0, 53)}…` : primaryIssue

  if (urgency === 'CRITICAL') {
    return [
      {
        title:
          'Issue full refund / credit with written confirmation within 1 hour',
        evImpact: 12500 + Math.floor(Math.random() * 3500),
        churnReduction: `${78 + Math.floor(Math.random() * 8)}%`,
        riskProfile: 'Low',
      },
      {
        title: `Escalate to Tier-3 + legal liaison for: ${shortIssue}`,
        evImpact: 8400 + Math.floor(Math.random() * 2200),
        churnReduction: `${58 + Math.floor(Math.random() * 10)}%`,
        riskProfile: 'Medium',
      },
      {
        title: 'Standard apology only — defer remediation to next billing cycle',
        evImpact: -240000,
        churnReduction: '0%',
        riskProfile: 'High',
      },
    ]
  }

  if (urgency === 'MEDIUM') {
    return [
      {
        title: `Apply $500 service credit and own: ${shortIssue}`,
        evImpact: 4200 + Math.floor(Math.random() * 1800),
        churnReduction: `${42 + Math.floor(Math.random() * 12)}%`,
        riskProfile: 'Low',
      },
      {
        title: 'Send guided troubleshooting steps and confirm within 4 hours',
        evImpact: 2100 + Math.floor(Math.random() * 900),
        churnReduction: `${28 + Math.floor(Math.random() * 10)}%`,
        riskProfile: 'Medium',
      },
      {
        title: 'Close ticket with template reply — no proactive outreach',
        evImpact: -18500 - Math.floor(Math.random() * 4000),
        churnReduction: '5%',
        riskProfile: 'High',
      },
    ]
  }

  return [
    {
      title: 'Acknowledge request and log a low-priority follow-up ticket',
      evImpact: 900 + Math.floor(Math.random() * 400),
      churnReduction: `${12 + Math.floor(Math.random() * 8)}%`,
      riskProfile: 'Low',
    },
    {
      title: `Send proactive tips related to: ${shortIssue}`,
      evImpact: 650 + Math.floor(Math.random() * 250),
      churnReduction: `${8 + Math.floor(Math.random() * 6)}%`,
      riskProfile: 'Low',
    },
    {
      title: 'Mark for CSAT check-in after successful resolution',
      evImpact: 320 + Math.floor(Math.random() * 180),
      churnReduction: `${4 + Math.floor(Math.random() * 5)}%`,
      riskProfile: 'Medium',
    },
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

  const ticketId = `ESC-${Date.now().toString().slice(-6)}`
  return {
    ticketId,
    customerName: name,
    urgency,
    sentimentScore,
    visualBullets: bullets,
    executiveSummary: buildSummary(name, urgency, sentimentLabelText, bullets),
    rawTranscript: rawTranscript.trim(),
    recommendedActions: buildResolutions(urgency, bullets),
    auditLog: buildAuditLog(rawTranscript, urgency, sentimentScore),
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

function urgencyDot(urgency: string) {
  switch (urgency.toLowerCase()) {
    case 'critical':
      return 'bg-red-500'
    case 'high':
      return 'bg-orange-400'
    case 'medium':
      return 'bg-amber-400'
    case 'low':
      return 'bg-emerald-400'
    default:
      return 'bg-zinc-500'
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

function formatEvImpact(value: number): string {
  const abs = Math.abs(value)
  const formatted =
    abs >= 100000
      ? `$${Math.round(abs / 1000).toLocaleString()}K`
      : `$${abs.toLocaleString()}`
  return `${value >= 0 ? '+' : '-'}${formatted} EV`
}

function riskBadgeStyles(risk: Resolution['riskProfile']) {
  switch (risk) {
    case 'Low':
      return 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
    case 'Medium':
      return 'border-amber-500/35 bg-amber-500/15 text-amber-300'
    case 'High':
      return 'border-red-500/35 bg-red-500/15 text-red-300'
  }
}

const initialQueue = sortTicketsByUrgency(seedTickets as Ticket[])

function App() {
  const [tickets, setTickets] = useState<Ticket[]>(initialQueue)
  const [activeTicketId, setActiveTicketId] = useState<string>(
    initialQueue[0]?.ticketId ?? '',
  )
  const [showTranscript, setShowTranscript] = useState(false)
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [rawInput, setRawInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const sortedTickets = useMemo(() => sortTicketsByUrgency(tickets), [tickets])
  const activeTicket =
    sortedTickets.find((t) => t.ticketId === activeTicketId) ??
    sortedTickets[0] ??
    null
  const sentimentPercent = activeTicket
    ? Math.round(activeTicket.sentimentScore * 100)
    : 0

  function selectTicket(ticketId: string) {
    setActiveTicketId(ticketId)
    setShowTranscript(false)
    setShowAuditLog(false)
  }

  function handleResolution(action: Resolution) {
    if (!activeTicket) return

    const resolvedId = activeTicket.ticketId
    setSuccessMessage(`Resolved: ${action.title}`)
    setShowTranscript(false)
    setShowAuditLog(false)

    const remaining = sortTicketsByUrgency(
      tickets.filter((t) => t.ticketId !== resolvedId),
    )
    setTickets(remaining)
    setActiveTicketId(remaining[0]?.ticketId ?? '')

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
      setTickets((prev) => sortTicketsByUrgency([...prev, analyzed]))
      setActiveTicketId(analyzed.ticketId)
      setShowTranscript(false)
      setShowAuditLog(false)
      setSuccessMessage(null)
      setIsAnalyzing(false)
      setModalOpen(false)
      setRawInput('')
    }, 900)
  }

  return (
    <div className="relative flex h-svh overflow-hidden bg-black text-neutral-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.12),_transparent_55%)]" />

      {/* Live Triage Queue Sidebar */}
      <aside className="relative z-10 flex h-svh w-80 shrink-0 flex-col border-r border-zinc-800 bg-black lg:w-96">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-4">
          <h2 className="text-sm font-semibold tracking-wide text-white">
            Live Triage Queue
          </h2>
          <span className="rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 font-mono text-xs text-sky-300">
            {sortedTickets.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {sortedTickets.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-zinc-600">
              Queue clear — parse a new transcript to enqueue.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {sortedTickets.map((ticket) => {
                const isActive = ticket.ticketId === activeTicket?.ticketId
                return (
                  <li key={ticket.ticketId}>
                    <button
                      type="button"
                      onClick={() => selectTicket(ticket.ticketId)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                        isActive
                          ? 'border-zinc-600 bg-zinc-900 text-white'
                          : 'border-transparent bg-transparent text-zinc-500 hover:border-zinc-800 hover:bg-zinc-950 hover:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-400'}`}
                        >
                          {ticket.customerName}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1.5">
                          <span
                            className={`size-1.5 rounded-full ${urgencyDot(ticket.urgency)}`}
                          />
                          <span className="text-[10px] font-semibold tracking-wide uppercase">
                            {ticket.urgency}
                          </span>
                        </span>
                      </div>
                      <p
                        className={`mt-1.5 truncate text-xs ${isActive ? 'text-zinc-400' : 'text-zinc-600'}`}
                      >
                        {ticket.executiveSummary}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-zinc-600">
                        {ticket.ticketId}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Main Workstation */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-28 pt-8 sm:px-8">
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
            {activeTicket && (
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-right">
                <p className="text-[10px] tracking-wider text-neutral-500 uppercase">
                  Active Ticket
                </p>
                <p className="mt-0.5 font-mono text-sm text-white">
                  {activeTicket.ticketId}
                </p>
              </div>
            )}
          </header>

          {successMessage && (
            <div className="toast-enter mb-5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {!activeTicket ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center">
              <p className="text-sm text-zinc-500">
                No tickets in queue. Use + Test New Ticket to parse a transcript.
              </p>
            </div>
          ) : (
            <>
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
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-medium tracking-wider text-neutral-500 uppercase">
                      <FileText className="size-3.5" />
                      Executive Summary
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAuditLog((open) => !open)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                        showAuditLog
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      <Terminal className="size-3" />
                      {showAuditLog ? 'View Summary' : 'View AI Audit Trail'}
                    </button>
                  </div>
                  <div className="min-h-[5.5rem]">
                    {showAuditLog ? (
                      <div className="h-full overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-emerald-400">
                        {(activeTicket.auditLog ?? []).map((line) => (
                          <p key={line} className="whitespace-pre-wrap">
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-neutral-200">
                        {activeTicket.executiveSummary}
                      </p>
                    )}
                  </div>
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
                  1-Click Resolutions · Decision EV Engine
                </h3>
                <div className="flex flex-col gap-2.5">
                  {activeTicket.recommendedActions.map((action) => {
                    const EvIcon =
                      action.evImpact >= 0 ? TrendingUp : TrendingDown
                    return (
                      <button
                        key={action.title}
                        type="button"
                        onClick={() => handleResolution(action)}
                        className="group rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-4 text-left transition hover:border-sky-400/50 hover:bg-sky-500/20"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sky-400 transition group-hover:text-sky-300" />
                          <span className="flex-1 text-sm leading-snug text-sky-50">
                            {action.title}
                          </span>
                          <ChevronRight className="mt-0.5 size-4 shrink-0 text-sky-500/60 transition group-hover:translate-x-0.5 group-hover:text-sky-300" />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 pl-7">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[11px] ${
                              action.evImpact >= 0
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : 'border-red-500/30 bg-red-500/10 text-red-300'
                            }`}
                          >
                            <EvIcon className="size-3" />
                            {formatEvImpact(action.evImpact)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1 text-[11px] text-zinc-400">
                            <TrendingDown className="size-3" />↓{' '}
                            {action.churnReduction} Churn Risk
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${riskBadgeStyles(action.riskProfile)}`}
                          >
                            <PieChart className="size-3" />
                            {action.riskProfile} Risk
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="pointer-events-none sticky bottom-0 flex justify-center pb-8 pt-4">
          <button
            type="button"
            aria-label="Voice command microphone"
            className="mic-orb pointer-events-auto flex size-16 items-center justify-center rounded-full border border-sky-400/40 bg-gradient-to-b from-sky-400/30 to-sky-600/20 text-sky-200 backdrop-blur-sm transition hover:scale-105 hover:text-white active:scale-95"
          >
            <Mic className="size-7" strokeWidth={1.75} />
          </button>
        </div>
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
