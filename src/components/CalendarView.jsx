import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  todayStr, daysInMonth, firstWeekdayOfMonth, monthLabel,
  toDateStr, getPhaseForDate, addDays
} from '../utils.js'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/**
 * Full calendar grid with phase coloring and day tap to log.
 */
export default function CalendarView({ cycleInfo, periodDays, dailyLogs, onDayPress }) {
  const today = todayStr()
  const todayDate = new Date(today + 'T12:00:00')

  const [year, setYear] = useState(todayDate.getFullYear())
  const [month, setMonth] = useState(todayDate.getMonth())

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const totalDays = daysInMonth(year, month)
  const firstDay = firstWeekdayOfMonth(year, month)
  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: totalDays }, (_, i) => i + 1)
  )
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  function getDayStyle(day) {
    if (!day) return {}
    const dateStr = toDateStr(new Date(year, month, day, 12))
    const isToday = dateStr === today
    const isFuture = dateStr > today

    const hasPeriodLog = !!periodDays[dateStr]
    const hasDailyLog = !!dailyLogs[dateStr]

    const phase = getPhaseForDate(
      dateStr,
      Object.keys(periodDays),
      periodDays,
      cycleInfo.avgPeriodLength,
      cycleInfo
    )

    let bg = ''
    let textColor = isFuture ? 'text-gray-300' : 'text-gray-700'
    let ring = ''

    if (phase === 'period') { bg = 'bg-rose-500'; textColor = 'text-white' }
    else if (phase === 'future-period') { bg = 'bg-rose-100'; textColor = 'text-rose-400' }
    else if (phase === 'ovulation') { bg = 'bg-amber-400'; textColor = 'text-white' }
    else if (phase === 'fertile') { bg = 'bg-teal-100'; textColor = 'text-teal-600' }

    if (isToday) ring = 'ring-2 ring-rose-400 ring-offset-1'

    return { dateStr, bg, textColor, ring, hasPeriodLog, hasDailyLog, phase }
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={prevMonth} className="p-2 rounded-full bg-gray-100">
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-800">{monthLabel(year, month)}</h2>
        <button onClick={nextMonth} className="p-2 rounded-full bg-gray-100">
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center px-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-1 text-[11px] font-semibold text-gray-400">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 text-center px-2 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const { dateStr, bg, textColor, ring, hasDailyLog, phase } = getDayStyle(day)

          return (
            <button
              key={dateStr}
              onClick={() => onDayPress(dateStr)}
              className={`relative flex flex-col items-center justify-center aspect-square rounded-full text-sm font-medium transition-all mx-0.5
                ${bg} ${textColor} ${ring}`}
            >
              {day}
              {/* Dot indicator for any log */}
              {(hasDailyLog || phase === 'period') && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${
                  phase === 'period' ? 'bg-white/70' : 'bg-rose-400'
                }`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 pt-4 pb-2">
        {[
          { color: 'bg-rose-500', label: 'Period' },
          { color: 'bg-teal-100 border border-teal-200', label: 'Fertile' },
          { color: 'bg-amber-400', label: 'Ovulation' },
          { color: 'bg-rose-100', label: 'Predicted' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-[11px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
