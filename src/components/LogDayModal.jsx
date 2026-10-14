import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { todayStr } from '../utils.js'

const FLOW_OPTIONS = [
  { key: 'spotting', label: 'Spotting', emoji: '💧', color: 'bg-rose-100 text-rose-500 border-rose-200' },
  { key: 'light', label: 'Light', emoji: '🩸', color: 'bg-rose-200 text-rose-600 border-rose-300' },
  { key: 'medium', label: 'Medium', emoji: '🩸🩸', color: 'bg-rose-400 text-white border-rose-400' },
  { key: 'heavy', label: 'Heavy', emoji: '🩸🩸🩸', color: 'bg-rose-600 text-white border-rose-600' },
]

const SYMPTOM_OPTIONS = [
  '🤕 Cramps', '🤧 Bloating', '🎭 Mood Swings', '😫 Fatigue',
  '🤢 Nausea', '🦵 Back Pain', '🎯 Headache', '🌡️ Tender Breasts',
  '😤 Irritability', '😥 Anxiety', '🍫 Cravings', '💤 Insomnia',
  '🥲 Sadness', '🔥 Hot Flashes', '⚡ Low Energy', '✨ Clear Skin',
]

const MOOD_OPTIONS = [
  { key: 'happy', label: 'Happy', emoji: '😊' },
  { key: 'neutral', label: 'Okay', emoji: '😐' },
  { key: 'sad', label: 'Sad', emoji: '😢' },
  { key: 'anxious', label: 'Anxious', emoji: '😰' },
  { key: 'angry', label: 'Irritable', emoji: '😤' },
  { key: 'energetic', label: 'Energetic', emoji: '⚡' },
  { key: 'tired', label: 'Tired', emoji: '😴' },
  { key: 'romantic', label: 'Romantic', emoji: '🥰' },
]

const PAIN_LEVELS = [
  { key: 0, label: 'None', color: 'bg-gray-100 text-gray-500' },
  { key: 1, label: '1', color: 'bg-green-100 text-green-600' },
  { key: 2, label: '2', color: 'bg-yellow-100 text-yellow-600' },
  { key: 3, label: '3', color: 'bg-orange-100 text-orange-600' },
  { key: 4, label: '4', color: 'bg-red-200 text-red-600' },
  { key: 5, label: '5', color: 'bg-red-500 text-white' },
]

const SLEEP_OPTIONS = [
  { key: 4, label: '< 4h', emoji: '😵' },
  { key: 5, label: '5h', emoji: '😩' },
  { key: 6, label: '6h', emoji: '😪' },
  { key: 7, label: '7h', emoji: '😌' },
  { key: 8, label: '8h', emoji: '😊' },
  { key: 9, label: '9h+', emoji: '😴' },
]

/**
 * Full-screen bottom sheet modal for logging period/symptoms for a given date.
 */
export default function LogDayModal({ dateStr, existingLog, existingPeriodLog, onSave, onRemove, onClose }) {
  const isPeriodDay = !!existingPeriodLog
  const [isPeriod, setIsPeriod] = useState(isPeriodDay)
  const [flow, setFlow] = useState(existingPeriodLog?.flow || 'medium')
  const [symptoms, setSymptoms] = useState(existingPeriodLog?.symptoms || existingLog?.symptoms || [])
  const [mood, setMood] = useState(existingPeriodLog?.mood || existingLog?.mood || '')
  const [pain, setPain] = useState(existingPeriodLog?.pain ?? existingLog?.pain ?? 0)
  const [sleep, setSleep] = useState(existingLog?.sleep || 0)
  const [notes, setNotes] = useState(existingPeriodLog?.notes || existingLog?.notes || '')

  const isToday = dateStr === todayStr()

  function toggleSymptom(sym) {
    setSymptoms(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    )
  }

  function handleSave() {
    onSave({
      isPeriod,
      flow: isPeriod ? flow : null,
      symptoms,
      mood,
      pain,
      sleep,
      notes,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl safe-bottom">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Log Day</h2>
            <p className="text-xs text-gray-400">{new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">

          {/* Period toggle */}
          <section>
            <Label>Period Day?</Label>
            <div className="flex gap-2 mt-2">
              <ToggleBtn active={isPeriod} onClick={() => setIsPeriod(true)} color="rose">
                🩸 Yes, Period
              </ToggleBtn>
              <ToggleBtn active={!isPeriod} onClick={() => setIsPeriod(false)} color="gray">
                No Period
              </ToggleBtn>
            </div>
          </section>

          {/* Flow */}
          {isPeriod && (
            <section>
              <Label>Flow Intensity</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {FLOW_OPTIONS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFlow(f.key)}
                    className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                      flow === f.key ? f.color : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}
                  >
                    {f.emoji} {f.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Mood */}
          <section>
            <Label>Mood</Label>
            <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
              {MOOD_OPTIONS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMood(mood === m.key ? '' : m.key)}
                  className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl border text-xs font-medium transition-all ${
                    mood === m.key
                      ? 'bg-pink-50 border-pink-300 text-pink-600'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          {/* Symptoms */}
          <section>
            <Label>Symptoms</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SYMPTOM_OPTIONS.map(sym => (
                <button
                  key={sym}
                  onClick={() => toggleSymptom(sym)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    symptoms.includes(sym)
                      ? 'bg-rose-100 border-rose-300 text-rose-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </section>

          {/* Pain level */}
          <section>
            <Label>Pain Level</Label>
            <div className="flex gap-2 mt-2">
              {PAIN_LEVELS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPain(p.key)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                    pain === p.key ? p.color + ' border-transparent shadow' : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          {/* Sleep */}
          <section>
            <Label>Sleep</Label>
            <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
              {SLEEP_OPTIONS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSleep(sleep === s.key ? 0 : s.key)}
                  className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl border text-xs font-medium transition-all ${
                    sleep === s.key
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <span className="text-lg">{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {/* Notes */}
          <section>
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add a note…"
              rows={3}
              className="mt-2 w-full px-3 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
            />
          </section>

          {/* Remove button if already logged */}
          {(existingPeriodLog || existingLog) && (
            <button
              onClick={onRemove}
              className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-medium"
            >
              Remove Log for This Day
            </button>
          )}
        </div>

        {/* Save button */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-600 text-white text-base font-semibold shadow-md flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Save Log
          </button>
        </div>
      </div>
    </div>
  )
}

function Label({ children }) {
  return <p className="text-sm font-semibold text-gray-700">{children}</p>
}

function ToggleBtn({ children, active, onClick, color }) {
  const activeStyles = color === 'rose'
    ? 'bg-rose-500 text-white border-rose-500'
    : 'bg-gray-700 text-white border-gray-700'
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${
        active ? activeStyles : 'bg-gray-50 border-gray-200 text-gray-500'
      }`}
    >
      {children}
    </button>
  )
}
