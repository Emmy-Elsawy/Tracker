import { useState, useEffect, useCallback } from 'react'
import {
  loadData, saveData, todayStr, computeCycle, hashPin
} from './utils.js'

// ── Storage keys ──────────────────────────────────────────────────────────────
const KEYS = {
  SETTINGS: 'ac_settings',
  PERIOD_STARTS: 'ac_period_starts',   // string[] of "YYYY-MM-DD" start dates
  PERIOD_DAYS: 'ac_period_days',       // { "YYYY-MM-DD": { flow, notes, symptoms, mood } }
  DAILY_LOGS: 'ac_daily_logs',         // { "YYYY-MM-DD": { mood, symptoms, sleep, pain, notes } }
  PIN_HASH: 'ac_pin_hash',
  PIN_ENABLED: 'ac_pin_enabled',
}

const DEFAULT_SETTINGS = {
  name: '',
  avgCycleLength: 28,
  avgPeriodLength: 5,
  reminders: false,
}

export function useStore() {
  const [settings, _setSettings] = useState(() => loadData(KEYS.SETTINGS, DEFAULT_SETTINGS))
  const [periodStarts, _setPeriodStarts] = useState(() => loadData(KEYS.PERIOD_STARTS, []))
  const [periodDays, _setPeriodDays] = useState(() => loadData(KEYS.PERIOD_DAYS, {}))
  const [dailyLogs, _setDailyLogs] = useState(() => loadData(KEYS.DAILY_LOGS, {}))
  const [pinEnabled, _setPinEnabled] = useState(() => loadData(KEYS.PIN_ENABLED, false))
  const [pinHash, _setPinHash] = useState(() => loadData(KEYS.PIN_HASH, ''))

  // Auto-sync to localStorage whenever state changes
  useEffect(() => { saveData(KEYS.SETTINGS, settings) }, [settings])
  useEffect(() => { saveData(KEYS.PERIOD_STARTS, periodStarts) }, [periodStarts])
  useEffect(() => { saveData(KEYS.PERIOD_DAYS, periodDays) }, [periodDays])
  useEffect(() => { saveData(KEYS.DAILY_LOGS, dailyLogs) }, [dailyLogs])
  useEffect(() => { saveData(KEYS.PIN_ENABLED, pinEnabled) }, [pinEnabled])
  useEffect(() => { saveData(KEYS.PIN_HASH, pinHash) }, [pinHash])

  // Computed cycle info
  const cycleInfo = computeCycle(
    periodStarts,
    settings.avgCycleLength,
    settings.avgPeriodLength
  )

  // ── Period Actions ────────────────────────────────────────────────────────
  const logPeriodDay = useCallback((dateStr, data = {}) => {
    _setPeriodDays(prev => {
      const updated = { ...prev, [dateStr]: { flow: 'medium', ...prev[dateStr], ...data } }
      return updated
    })
    // If this date is a new cycle start (>14 days after last known start), add it
    _setPeriodStarts(prev => {
      const sorted = [...prev].sort()
      const last = sorted[sorted.length - 1]
      const daysSinceLast = last
        ? Math.round((new Date(dateStr) - new Date(last)) / 86400000)
        : 999
      // It's a new period start if no period within last 14 days, or is earliest
      const isAlreadyLogged = prev.includes(dateStr)
      if (!isAlreadyLogged && daysSinceLast > 14) {
        return [...prev, dateStr].sort()
      }
      return prev
    })
  }, [])

  const removePeriodDay = useCallback((dateStr) => {
    _setPeriodDays(prev => {
      const next = { ...prev }
      delete next[dateStr]
      return next
    })
    // Remove from period starts if it was a start
    _setPeriodStarts(prev => prev.filter(d => d !== dateStr))
  }, [])

  const logPeriodStart = useCallback((dateStr) => {
    _setPeriodStarts(prev => {
      if (prev.includes(dateStr)) return prev
      return [...prev, dateStr].sort()
    })
    _setPeriodDays(prev => ({
      ...prev,
      [dateStr]: prev[dateStr] || { flow: 'medium', symptoms: [], mood: '', notes: '' }
    }))
  }, [])

  const removePeriodStart = useCallback((dateStr) => {
    _setPeriodStarts(prev => prev.filter(d => d !== dateStr))
    _setPeriodDays(prev => {
      const next = { ...prev }
      delete next[dateStr]
      return next
    })
  }, [])

  // ── Daily Log Actions ─────────────────────────────────────────────────────
  const saveDailyLog = useCallback((dateStr, data) => {
    _setDailyLogs(prev => ({
      ...prev,
      [dateStr]: { ...prev[dateStr], ...data }
    }))
  }, [])

  // ── Settings Actions ──────────────────────────────────────────────────────
  const updateSettings = useCallback((patch) => {
    _setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  // ── PIN Actions ───────────────────────────────────────────────────────────
  const setPin = useCallback((pin) => {
    _setPinHash(hashPin(pin))
    _setPinEnabled(true)
  }, [])

  const removePin = useCallback(() => {
    _setPinEnabled(false)
    _setPinHash('')
  }, [])

  const checkPin = useCallback((pin) => {
    return hashPin(pin) === pinHash
  }, [pinHash])

  // ── Export / Import ───────────────────────────────────────────────────────
  const exportData = useCallback(() => {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      periodStarts,
      periodDays,
      dailyLogs,
    }
  }, [settings, periodStarts, periodDays, dailyLogs])

  const importData = useCallback((json) => {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json
      if (data.settings) _setSettings(s => ({ ...s, ...data.settings }))
      if (data.periodStarts) _setPeriodStarts(data.periodStarts)
      if (data.periodDays) _setPeriodDays(data.periodDays)
      if (data.dailyLogs) _setDailyLogs(data.dailyLogs)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }, [])

  return {
    // State
    settings,
    periodStarts,
    periodDays,
    dailyLogs,
    cycleInfo,
    pinEnabled,
    // Actions
    logPeriodDay,
    removePeriodDay,
    logPeriodStart,
    removePeriodStart,
    saveDailyLog,
    updateSettings,
    setPin,
    removePin,
    checkPin,
    exportData,
    importData,
  }
}
