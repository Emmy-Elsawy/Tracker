import { useState } from 'react'
import CalendarView from './CalendarView.jsx'
import LogDayModal from './LogDayModal.jsx'

/**
 * Calendar tab — full month calendar with day tap to log
 */
export default function CalendarScreen({
  cycleInfo, periodDays, dailyLogs,
  logPeriodDay, removePeriodDay, saveDailyLog
}) {
  const [modal, setModal] = useState(null) // dateStr | null

  function handleSave({ isPeriod, flow, symptoms, mood, pain, sleep, notes }) {
    const dateStr = modal
    if (isPeriod) {
      logPeriodDay(dateStr, { flow, symptoms, mood, pain, notes })
    } else {
      if (periodDays[dateStr]) removePeriodDay(dateStr)
      saveDailyLog(dateStr, { symptoms, mood, pain, sleep, notes })
    }
    setModal(null)
  }

  function handleRemove() {
    removePeriodDay(modal)
    setModal(null)
  }

  return (
    <div className="flex flex-col">
      <CalendarView
        cycleInfo={cycleInfo}
        periodDays={periodDays}
        dailyLogs={dailyLogs}
        onDayPress={setModal}
      />

      {modal && (
        <LogDayModal
          dateStr={modal}
          existingPeriodLog={periodDays[modal]}
          existingLog={dailyLogs[modal]}
          onSave={handleSave}
          onRemove={handleRemove}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
