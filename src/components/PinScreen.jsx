import { useState, useRef } from 'react'

/**
 * PIN lock screen — shown when app is locked.
 * onUnlock(pin) → call checkPin from store.
 * onSetup → if setting a new PIN for first time.
 */
export default function PinScreen({ onUnlock, mode = 'unlock', onSkip }) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [shake, setShake] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(null) // first entry when setting PIN
  const refs = [useRef(), useRef(), useRef(), useRef()]

  const currentPin = digits.join('')

  function handleDigit(i, val) {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < 3) refs[i + 1].current?.focus()

    // Auto-submit when 4 digits filled
    if (val && i === 3) {
      const pin = next.join('')
      setTimeout(() => submit(pin), 80)
    }
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs[i - 1].current?.focus()
    }
  }

  function submit(pin) {
    if (pin.length < 4) return

    if (mode === 'setup') {
      if (!confirm) {
        setConfirm(pin)
        setDigits(['', '', '', ''])
        setTimeout(() => refs[0].current?.focus(), 80)
        setError('Re-enter PIN to confirm')
        return
      }
      if (pin === confirm) {
        onUnlock(pin) // passes PIN to parent to save
      } else {
        setConfirm(null)
        setDigits(['', '', '', ''])
        setError('PINs did not match — try again')
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setTimeout(() => refs[0].current?.focus(), 80)
      }
    } else {
      const ok = onUnlock(pin)
      if (!ok) {
        setDigits(['', '', '', ''])
        setError('Incorrect PIN')
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setTimeout(() => refs[0].current?.focus(), 80)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-lg">
          <span className="text-3xl">🌸</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-800">Aura Cycle</h1>
        <p className="text-gray-500 text-sm text-center">
          {mode === 'setup'
            ? confirm
              ? 'Confirm your PIN'
              : 'Choose a 4-digit PIN to protect your data'
            : 'Enter your PIN to continue'}
        </p>
      </div>

      <div className={`flex gap-3 mb-3 ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={d}
            onChange={e => handleDigit(i, e.target.value.slice(-1))}
            onKeyDown={e => handleKeyDown(i, e)}
            autoFocus={i === 0}
            className="w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 bg-white shadow
              border-rose-200 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        ))}
      </div>

      {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}

      {onSkip && (
        <button
          onClick={onSkip}
          className="mt-6 text-sm text-gray-400 underline"
        >
          Skip PIN setup
        </button>
      )}
    </div>
  )
}
