import { useState } from 'react'
import CycleRing from './CycleRing.jsx'
import LogDayModal from './LogDayModal.jsx'
import { todayStr, shortDate } from '../utils.js'

/**
 * Home screen — hero cycle ring + quick "Log Today" button + recent log strip
 */
export default function HomeScreen({
  cycleInfo, periodDays, dailyLogs, settings,
  logPeriodDay, removePeriodDay, saveDailyLog, logPeriodStart
}) {
  const today = todayStr()
  const [modal, setModal] = useState(null) // dateStr | null

  function openModal(dateStr) { setModal(dateStr) }
  function closeModal() { setModal(null) }

  function handleSave({ isPeriod, flow, symptoms, mood, pain, sleep, notes }) {
    const dateStr = modal
    if (isPeriod) {
      logPeriodDay(dateStr, { flow, symptoms, mood, pain, notes })
    } else {
      // Remove period flag if it was previously period
      if (periodDays[dateStr]) removePeriodDay(dateStr)
      saveDailyLog(dateStr, { symptoms, mood, pain, sleep, notes })
    }
    closeModal()
  }

  function handleRemove() {
    const dateStr = modal
    removePeriodDay(dateStr)
    closeModal()
  }

  const hasTodayLog = !!periodDays[today] || !!dailyLogs[today]
  const todayPeriodLog = periodDays[today]

  // Recent 7 days strip
  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Greeting */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-800">
          {settings.name ? `Hi, ${settings.name} 👋` : 'Hello 👋'}
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Cycle ring */}
      <div className="flex justify-center">
        <CycleRing cycleInfo={cycleInfo} periodDays={periodDays} />
      </div>

      {/* Log today CTA */}
      <button
        onClick={() => openModal(today)}
        className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
          hasTodayLog
            ? 'bg-white border-2 border-rose-300 text-rose-500'
            : 'bg-gradient-to-r from-rose-400 to-pink-600 text-white'
        }`}
      >
        {hasTodayLog ? (
          <><span>✓</span> Update Today's Log</>
        ) : (
          <><span>🩸</span> Log Today</>
        )}
      </button>

      {/* 7-day mini strip */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Last 7 Days</p>
        <div className="flex gap-1.5">
          {recentDays.map(dateStr => {
            const isPeriod = !!periodDays[dateStr]
            const hasLog = !!dailyLogs[dateStr]
            const isToday = dateStr === today
            const dayNum = new Date(dateStr + 'T12:00:00').getDate()
            const dayName = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)

            return (
              <button
                key={dateStr}
                onClick={() => openModal(dateStr)}
                className={`flex-1 flex flex-col items-center py-2 rounded-2xl border transition-all text-xs font-medium gap-0.5 ${
                  isToday ? 'border-rose-300 shadow' : 'border-gray-100'
                } ${
                  isPeriod ? 'bg-rose-500 text-white border-rose-500' :
                  hasLog ? 'bg-pink-50 text-pink-500 border-pink-100' :
                  'bg-white text-gray-400'
                }`}
              >
                <span className="text-[9px] opacity-70">{dayName}</span>
                <span>{dayNum}</span>
                <span className="h-1.5 w-1.5 rounded-full mt-0.5">
                  {isPeriod ? '🩸' : hasLog ? '·' : ''}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Phase tips */}
      <PhaseTip cycleInfo={cycleInfo} periodDays={periodDays} />

      {/* Log modal */}
      {modal && (
        <LogDayModal
          dateStr={modal}
          existingPeriodLog={periodDays[modal]}
          existingLog={dailyLogs[modal]}
          onSave={handleSave}
          onRemove={handleRemove}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

const PHASE_TIPS = {
  period: {
    title: 'You\'re on your period 🌺',
    tips: ['Rest more than usual today', 'Stay hydrated and warm', 'Gentle walks can ease cramps'],
    color: 'bg-rose-50 border-rose-100',
    titleColor: 'text-rose-600',
  },
  fertile: {
    title: 'Fertile Window 🌿',
    tips: ['Peak energy — great for social plans', 'Estrogen is rising', 'Best time for creative work'],
    color: 'bg-teal-50 border-teal-100',
    titleColor: 'text-teal-600',
  },
  ovulation: {
    title: 'Ovulation Day ✨',
    tips: ['Your most energetic day of the cycle', 'Confidence and charisma are high', 'Great day to tackle challenges'],
    color: 'bg-amber-50 border-amber-100',
    titleColor: 'text-amber-600',
  },
  luteal: {
    title: 'Luteal Phase 🌙',
    tips: ['You may feel more introspective', 'PMS symptoms may start in the 2nd half', 'Prioritise sleep and self-care'],
    color: 'bg-purple-50 border-purple-100',
    titleColor: 'text-purple-600',
  },
  follicular: {
    title: 'Follicular Phase 🌱',
    tips: ['Energy is building again', 'Great time to start new projects', 'Mood is generally more upbeat'],
    color: 'bg-sky-50 border-sky-100',
    titleColor: 'text-sky-600',
  },
}

function getCurrentPhaseKey(cycleInfo, periodDays) {
  const today = todayStr()
  if (periodDays[today]) return 'period'
  if (!cycleInfo.lastPeriodStart) return null
  const { ovulationDate, fertileWindowStart, fertileWindowEnd, nextPeriodStart } = cycleInfo
  if (today === ovulationDate) return 'ovulation'
  if (today >= fertileWindowStart && today <= fertileWindowEnd) return 'fertile'
  if (today > fertileWindowEnd && today < nextPeriodStart) return 'luteal'
  return 'follicular'
}

function PhaseTip({ cycleInfo, periodDays }) {
  const key = getCurrentPhaseKey(cycleInfo, periodDays)
  const tip = PHASE_TIPS[key]
  if (!tip) return null

  return (
    <div className={`rounded-2xl border px-4 py-4 ${tip.color}`}>
      <p className={`font-semibold text-sm mb-2 ${tip.titleColor}`}>{tip.title}</p>
      <ul className="space-y-1">
        {tip.tips.map((t, i) => (
          <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
            <span className="mt-0.5 text-[10px]">•</span>{t}
          </li>
        ))}
      </ul>
    </div>
  )
}
