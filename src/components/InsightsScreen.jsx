import { useMemo } from 'react'
import { todayStr, daysBetween, shortDate, parseDate } from '../utils.js'

/**
 * Cycle insights & statistics screen
 */
export default function InsightsScreen({ periodStarts, periodDays, dailyLogs, cycleInfo }) {
  const today = todayStr()

  // ── Cycle statistics ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const sorted = [...periodStarts].sort()
    if (sorted.length < 2) return null

    const gaps = []
    for (let i = 1; i < sorted.length; i++) {
      const g = daysBetween(sorted[i - 1], sorted[i])
      if (g >= 14 && g <= 60) gaps.push(g)
    }
    if (gaps.length === 0) return null

    const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
    const min = Math.min(...gaps)
    const max = Math.max(...gaps)
    const irregular = max - min > 7

    return { avg, min, max, irregular, cycleCount: sorted.length, gaps }
  }, [periodStarts])

  // ── Symptom frequency ────────────────────────────────────────────────────
  const topSymptoms = useMemo(() => {
    const freq = {}
    const allLogs = { ...periodDays, ...dailyLogs }
    for (const log of Object.values(allLogs)) {
      for (const sym of (log.symptoms || [])) {
        freq[sym] = (freq[sym] || 0) + 1
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [periodDays, dailyLogs])

  // ── Mood distribution ────────────────────────────────────────────────────
  const moodDist = useMemo(() => {
    const freq = {}
    const allLogs = { ...periodDays, ...dailyLogs }
    for (const log of Object.values(allLogs)) {
      if (log.mood) freq[log.mood] = (freq[log.mood] || 0) + 1
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [periodDays, dailyLogs])

  const moodEmojis = {
    happy: '😊', neutral: '😐', sad: '😢', anxious: '😰',
    angry: '😤', energetic: '⚡', tired: '😴', romantic: '🥰'
  }

  // ── Cycle history list ───────────────────────────────────────────────────
  const cycleHistory = useMemo(() => {
    const sorted = [...periodStarts].sort().reverse()
    return sorted.slice(0, 8).map((start, i) => {
      const next = sorted[i - 1] // next period (since reversed)
      const length = next ? daysBetween(start, next) : null
      return { start, length }
    })
  }, [periodStarts])

  const totalLogged = Object.keys(periodDays).length + Object.keys(dailyLogs).length

  if (periodStarts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
        <span className="text-6xl">📊</span>
        <h3 className="text-lg font-semibold text-gray-700">No data yet</h3>
        <p className="text-sm text-gray-400">
          Log at least one period to see cycle insights and statistics here.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 space-y-5 pb-10">

      {/* Cycle Stats Cards */}
      {stats ? (
        <section>
          <SectionTitle>Cycle Statistics</SectionTitle>
          {stats.irregular && (
            <div className="mb-3 px-3 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
              ⚠️ Your cycles vary by more than 7 days — this is common and can be normal.
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon="📅" label="Avg Cycle" value={`${stats.avg} days`} color="rose" />
            <StatCard icon="🔄" label="Cycles Tracked" value={`${stats.cycleCount}`} color="pink" />
            <StatCard icon="⬇️" label="Shortest" value={`${stats.min} days`} color="teal" />
            <StatCard icon="⬆️" label="Longest" value={`${stats.max} days`} color="purple" />
          </div>
        </section>
      ) : (
        <div className="px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 text-xs">
          📈 Log at least 2 period start dates to calculate cycle statistics.
        </div>
      )}

      {/* Next predictions */}
      {cycleInfo.lastPeriodStart && (
        <section>
          <SectionTitle>Upcoming Predictions</SectionTitle>
          <div className="space-y-2">
            <PredictionRow emoji="🩸" label="Next Period" date={cycleInfo.nextPeriodStart} today={today} />
            <PredictionRow emoji="✨" label="Ovulation" date={cycleInfo.ovulationDate} today={today} />
            <PredictionRow emoji="🌿" label="Fertile Window Starts" date={cycleInfo.fertileWindowStart} today={today} />
            <PredictionRow emoji="🌿" label="Fertile Window Ends" date={cycleInfo.fertileWindowEnd} today={today} />
          </div>
        </section>
      )}

      {/* Top symptoms */}
      {topSymptoms.length > 0 && (
        <section>
          <SectionTitle>Most Common Symptoms</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {topSymptoms.map(([sym, count]) => (
              <div key={sym} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-sm">{sym}</span>
                <span className="text-[11px] font-bold text-rose-400 bg-rose-100 rounded-full px-1.5">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mood distribution */}
      {moodDist.length > 0 && (
        <section>
          <SectionTitle>Mood Log</SectionTitle>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {moodDist.map(([mood, count]) => (
              <div key={mood} className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <span className="text-2xl">{moodEmojis[mood] || '😐'}</span>
                <span className="text-xs font-medium text-gray-600 capitalize">{mood}</span>
                <span className="text-[11px] text-gray-400">{count}×</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cycle history */}
      {cycleHistory.length > 0 && (
        <section>
          <SectionTitle>Cycle History</SectionTitle>
          <div className="space-y-2">
            {cycleHistory.map(({ start, length }) => (
              <div key={start} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base">🩸</span>
                  <span className="text-sm text-gray-700">{shortDate(start)}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {length ? `${length}-day cycle` : 'Current'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-[11px] text-gray-300 pt-2">
        {totalLogged} days logged total
      </p>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{children}</h3>
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    rose: 'bg-rose-50 border-rose-100',
    pink: 'bg-pink-50 border-pink-100',
    teal: 'bg-teal-50 border-teal-100',
    purple: 'bg-purple-50 border-purple-100',
  }
  return (
    <div className={`flex flex-col gap-1 px-4 py-4 rounded-2xl border ${colors[color] || colors.rose}`}>
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="text-xl font-bold text-gray-800">{value}</span>
    </div>
  )
}

function PredictionRow({ emoji, label, date, today }) {
  const days = daysBetween(today, date)
  const past = days < 0
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2">
        <span>{emoji}</span>
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-gray-700">{shortDate(date)}</div>
        <div className={`text-[11px] ${past ? 'text-gray-300' : 'text-rose-400'}`}>
          {past ? `${Math.abs(days)}d ago` : days === 0 ? 'Today' : `in ${days}d`}
        </div>
      </div>
    </div>
  )
}
