import { useMemo } from 'react'
import { todayStr, addDays, shortDate, daysBetween } from '../utils.js'

// Phase colors and labels
const PHASE_CONFIG = {
  period: { ring: 'border-rose-500', fill: 'bg-rose-500', text: 'text-rose-500', label: 'Period', emoji: '🌺', color: '#f43f5e' },
  fertile: { ring: 'border-teal-400', fill: 'bg-teal-400', text: 'text-teal-500', label: 'Fertile Window', emoji: '🌿', color: '#2dd4bf' },
  ovulation: { ring: 'border-amber-400', fill: 'bg-amber-400', text: 'text-amber-500', label: 'Ovulation', emoji: '✨', color: '#fbbf24' },
  luteal: { ring: 'border-purple-400', fill: 'bg-purple-300', text: 'text-purple-500', label: 'Luteal Phase', emoji: '🌙', color: '#a78bfa' },
  follicular: { ring: 'border-sky-300', fill: 'bg-sky-300', text: 'text-sky-500', label: 'Follicular Phase', emoji: '🌱', color: '#7dd3fc' },
  unknown: { ring: 'border-gray-200', fill: 'bg-gray-100', text: 'text-gray-400', label: 'Log a period to start', emoji: '🌸', color: '#f9a8d4' },
}

function getCurrentPhase(cycleInfo, periodDays) {
  const today = todayStr()
  if (periodDays[today]) return 'period'
  if (!cycleInfo.lastPeriodStart) return 'unknown'

  const { ovulationDate, fertileWindowStart, fertileWindowEnd, nextPeriodStart, lastPeriodStart, avgPeriodLength } = cycleInfo

  if (today === ovulationDate) return 'ovulation'
  if (today >= fertileWindowStart && today <= fertileWindowEnd) return 'fertile'

  // Luteal: from day after fertile end to period
  const dayAfterFertile = addDays(fertileWindowEnd, 1)
  if (today > dayAfterFertile && today < nextPeriodStart) return 'luteal'

  // Follicular: from end of period to fertile start
  const periodEnd = addDays(lastPeriodStart, avgPeriodLength - 1)
  if (today > periodEnd && today < fertileWindowStart) return 'follicular'

  return 'unknown'
}

/**
 * The big cycle ring on the home screen.
 * Shows current phase, days until next period, and quick insights.
 */
export default function CycleRing({ cycleInfo, periodDays }) {
  const today = todayStr()
  const phase = getCurrentPhase(cycleInfo, periodDays)
  const cfg = PHASE_CONFIG[phase] || PHASE_CONFIG.unknown

  const ringPercent = useMemo(() => {
    if (!cycleInfo.lastPeriodStart || !cycleInfo.avgCycleLength) return 0
    const elapsed = daysBetween(cycleInfo.lastPeriodStart, today)
    return Math.min(100, Math.max(0, (elapsed / cycleInfo.avgCycleLength) * 100))
  }, [cycleInfo, today])

  // SVG ring params
  const size = 240
  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (circumference * ringPercent) / 100

  const isLoggedToday = !!periodDays[today]

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background track */}
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#f3e8ee" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={cfg.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-4xl leading-none">{cfg.emoji}</span>
          {cycleInfo.lastPeriodStart ? (
            <>
              <span className="text-3xl font-bold text-gray-800 leading-none">
                {cycleInfo.daysUntilNext > 0
                  ? cycleInfo.daysUntilNext
                  : cycleInfo.daysUntilNext === 0
                  ? '🩸'
                  : Math.abs(cycleInfo.daysUntilNext)}
              </span>
              <span className="text-xs text-gray-500 font-medium text-center px-4 leading-tight">
                {cycleInfo.daysUntilNext > 0
                  ? 'days until\nnext period'
                  : cycleInfo.daysUntilNext === 0
                  ? 'Period expected\ntoday'
                  : `day ${Math.abs(cycleInfo.daysUntilNext)}\nof cycle`}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-400 text-center px-6">Log your period to begin</span>
          )}
        </div>
      </div>

      {/* Phase badge */}
      <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${cfg.text} bg-white shadow-sm border ${cfg.ring}`}>
        {cfg.label}
      </div>

      {/* Key dates row */}
      {cycleInfo.lastPeriodStart && (
        <div className="flex gap-3 w-full max-w-xs">
          <InfoChip
            icon="🩸"
            label="Next Period"
            value={shortDate(cycleInfo.nextPeriodStart)}
            color="rose"
          />
          <InfoChip
            icon="✨"
            label="Ovulation"
            value={shortDate(cycleInfo.ovulationDate)}
            color="amber"
          />
        </div>
      )}
    </div>
  )
}

function InfoChip({ icon, label, value, color }) {
  const colorMap = {
    rose: 'bg-rose-50 border-rose-100 text-rose-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
    teal: 'bg-teal-50 border-teal-100 text-teal-600',
  }
  return (
    <div className={`flex-1 flex flex-col items-center py-2.5 px-2 rounded-2xl border ${colorMap[color] || colorMap.rose}`}>
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</span>
      <span className="text-xs font-bold mt-0.5">{value}</span>
    </div>
  )
}
