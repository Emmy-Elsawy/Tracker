import { useState, useEffect } from 'react'
import { useStore } from './useStore.js'
import PinScreen from './components/PinScreen.jsx'
import HomeScreen from './components/HomeScreen.jsx'
import CalendarScreen from './components/CalendarScreen.jsx'
import InsightsScreen from './components/InsightsScreen.jsx'
import SettingsScreen from './components/SettingsScreen.jsx'

// ── Nav tab definitions ───────────────────────────────────────────────────────
const TABS = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'calendar', label: 'Calendar', emoji: '📅' },
  { id: 'insights', label: 'Insights', emoji: '📊' },
  { id: 'settings', label: 'Settings', emoji: '⚙️' },
]

export default function App() {
  const store = useStore()
  const [tab, setTab] = useState('home')
  const [locked, setLocked] = useState(store.pinEnabled)

  // Re-lock when app comes back to foreground (visibility API)
  useEffect(() => {
    if (!store.pinEnabled) return
    function onVisibility() {
      if (document.hidden) setLocked(true)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [store.pinEnabled])

  // ── PIN gate ──────────────────────────────────────────────────────────────
  if (locked && store.pinEnabled) {
    return (
      <PinScreen
        mode="unlock"
        onUnlock={(pin) => {
          if (store.checkPin(pin)) { setLocked(false); return true }
          return false
        }}
      />
    )
  }

  // ── Active screen ─────────────────────────────────────────────────────────
  function renderScreen() {
    switch (tab) {
      case 'home':
        return (
          <HomeScreen
            cycleInfo={store.cycleInfo}
            periodDays={store.periodDays}
            dailyLogs={store.dailyLogs}
            settings={store.settings}
            logPeriodDay={store.logPeriodDay}
            removePeriodDay={store.removePeriodDay}
            saveDailyLog={store.saveDailyLog}
            logPeriodStart={store.logPeriodStart}
          />
        )
      case 'calendar':
        return (
          <CalendarScreen
            cycleInfo={store.cycleInfo}
            periodDays={store.periodDays}
            dailyLogs={store.dailyLogs}
            logPeriodDay={store.logPeriodDay}
            removePeriodDay={store.removePeriodDay}
            saveDailyLog={store.saveDailyLog}
          />
        )
      case 'insights':
        return (
          <InsightsScreen
            periodStarts={store.periodStarts}
            periodDays={store.periodDays}
            dailyLogs={store.dailyLogs}
            cycleInfo={store.cycleInfo}
          />
        )
      case 'settings':
        return (
          <SettingsScreen
            settings={store.settings}
            updateSettings={store.updateSettings}
            pinEnabled={store.pinEnabled}
            setPin={store.setPin}
            removePin={store.removePin}
            checkPin={store.checkPin}
            exportData={store.exportData}
            importData={store.importData}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-rose-50/40 max-w-lg mx-auto">
      {/* Top status bar spacer for iOS */}
      <div className="safe-top bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-rose-100/60">
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
              <span className="text-sm">🌸</span>
            </div>
            <span className="font-bold text-sm text-gray-800">Aura Cycle</span>
          </div>
          {store.pinEnabled && (
            <button
              onClick={() => setLocked(true)}
              className="text-[11px] text-gray-400 flex items-center gap-1"
            >
              🔒 Lock
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto">
        {renderScreen()}
      </main>

      {/* Bottom navigation */}
      <nav className="safe-bottom bg-white/95 backdrop-blur-sm border-t border-rose-100/60 sticky bottom-0 z-30">
        <div className="flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all ${
                tab === t.id ? 'text-rose-500' : 'text-gray-400'
              }`}
            >
              <span className={`text-xl transition-transform ${tab === t.id ? 'scale-110' : ''}`}>
                {t.emoji}
              </span>
              <span className={`text-[10px] font-medium ${tab === t.id ? 'font-semibold' : ''}`}>
                {t.label}
              </span>
              {tab === t.id && (
                <span className="w-1 h-1 rounded-full bg-rose-400 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
