import { useState, useRef } from 'react'
import { ChevronRight, Download, Upload, Lock, Unlock, Trash2, Bell, User } from 'lucide-react'
import PinScreen from './PinScreen.jsx'

/**
 * Settings screen — name, cycle defaults, PIN, export/import, reminders
 */
export default function SettingsScreen({
  settings, updateSettings, pinEnabled,
  setPin, removePin, checkPin, exportData, importData
}) {
  const [pinMode, setPinMode] = useState(null) // null | 'setup' | 'remove'
  const [message, setMessage] = useState(null)
  const fileRef = useRef()

  function flash(msg, type = 'success') {
    setMessage({ msg, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // ── Export ───────────────────────────────────────────────────────────────
  function handleExport() {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aura-cycle-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    flash('Backup file downloaded ✓')
  }

  // ── Import ───────────────────────────────────────────────────────────────
  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = importData(ev.target.result)
      if (result.ok) flash('Data restored successfully ✓')
      else flash('Import failed: ' + result.error, 'error')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── PIN ───────────────────────────────────────────────────────────────────
  if (pinMode === 'setup') {
    return (
      <PinScreen
        mode="setup"
        onUnlock={(pin) => { setPin(pin); setPinMode(null); flash('PIN set ✓') }}
        onSkip={() => setPinMode(null)}
      />
    )
  }
  if (pinMode === 'remove') {
    return (
      <PinScreen
        mode="unlock"
        onUnlock={(pin) => {
          if (checkPin(pin)) { removePin(); setPinMode(null); flash('PIN removed ✓'); return true }
          return false
        }}
        onSkip={() => setPinMode(null)}
      />
    )
  }

  return (
    <div className="px-4 py-5 space-y-5 pb-16">
      {/* Flash message */}
      {message && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-medium text-center ${
          message.type === 'error'
            ? 'bg-red-50 text-red-600 border border-red-100'
            : 'bg-green-50 text-green-600 border border-green-100'
        }`}>
          {message.msg}
        </div>
      )}

      {/* Profile */}
      <Section title="My Profile" icon={<User size={15} />}>
        <SettingInput
          label="Your Name (optional)"
          value={settings.name}
          onChange={val => updateSettings({ name: val })}
          placeholder="e.g. Emma"
        />
      </Section>

      {/* Cycle Defaults */}
      <Section title="Cycle Defaults" icon="📅">
        <SettingNumberRow
          label="Average Cycle Length"
          value={settings.avgCycleLength}
          min={18} max={60}
          onChange={v => updateSettings({ avgCycleLength: v })}
          unit="days"
        />
        <div className="border-t border-gray-100" />
        <SettingNumberRow
          label="Average Period Length"
          value={settings.avgPeriodLength}
          min={1} max={14}
          onChange={v => updateSettings({ avgPeriodLength: v })}
          unit="days"
        />
      </Section>

      {/* Privacy */}
      <Section title="Privacy & Security" icon={<Lock size={15} />}>
        <button
          onClick={() => setPinMode(pinEnabled ? 'remove' : 'setup')}
          className="w-full flex items-center justify-between py-3.5"
        >
          <div className="flex items-center gap-2.5">
            {pinEnabled ? <Lock size={18} className="text-rose-500" /> : <Unlock size={18} className="text-gray-400" />}
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">
                {pinEnabled ? 'PIN Lock Enabled' : 'Set PIN Lock'}
              </p>
              <p className="text-[11px] text-gray-400">
                {pinEnabled ? 'Tap to change or remove PIN' : 'Protect your data with a 4-digit PIN'}
              </p>
            </div>
          </div>
          <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            pinEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {pinEnabled ? 'ON' : 'OFF'}
          </div>
        </button>
      </Section>

      {/* Data */}
      <Section title="Data" icon={<Download size={15} />}>
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-between py-3.5"
        >
          <div className="flex items-center gap-2.5">
            <Download size={18} className="text-blue-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">Export Backup</p>
              <p className="text-[11px] text-gray-400">Download all your data as a JSON file</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        <div className="border-t border-gray-100" />

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-between py-3.5"
        >
          <div className="flex items-center gap-2.5">
            <Upload size={18} className="text-purple-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">Import Backup</p>
              <p className="text-[11px] text-gray-400">Restore data from a previous JSON backup</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </Section>

      {/* Privacy notice */}
      <div className="px-4 py-4 rounded-2xl bg-rose-50 border border-rose-100 text-center space-y-1">
        <p className="text-xs font-semibold text-rose-600">🔒 100% Private by Design</p>
        <p className="text-[11px] text-gray-500">
          All data is stored only on this device. No account, no cloud, no ads — ever.
        </p>
      </div>

      {/* App version */}
      <p className="text-center text-[10px] text-gray-300 pb-2">Aura Cycle v1.0.0</p>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 pt-3.5 pb-1">
        <span className="text-gray-400 text-xs">{icon}</span>
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-4 pb-2 divide-y divide-gray-100">
        {children}
      </div>
    </div>
  )
}

function SettingInput({ label, value, onChange, placeholder }) {
  return (
    <div className="py-3">
      <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-200"
      />
    </div>
  )
}

function SettingNumberRow({ label, value, min, max, onChange, unit }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <p className="text-sm text-gray-700">{label}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-lg font-bold flex items-center justify-center"
        >−</button>
        <span className="text-sm font-semibold text-gray-800 min-w-[40px] text-center">
          {value} <span className="text-[11px] font-normal text-gray-400">{unit}</span>
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-lg font-bold flex items-center justify-center"
        >+</button>
      </div>
    </div>
  )
}
