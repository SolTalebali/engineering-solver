import { useState, useRef, useEffect } from 'react'
import { BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import './App.css'

const API_URL = 'https://engineering-solver-backend.onrender.com/solve'
const HISTORY_KEY = 'eng_solver_history'
const MAX_HISTORY = 50

const CHIPS = [
  'Heat flux through a steel wall',
  'Beam in static equilibrium',
  "Pipe flow with Bernoulli's equation",
  'Carnot cycle efficiency',
]

function stripDelimiters(latex) {
  if (!latex) return ''
  return latex.replace(/^\$\$?([\s\S]*?)\$\$?$/, '$1').trim()
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str
}

function roundNumbers(str) {
  if (!str) return str
  return str.replace(/-?\d+\.\d+/g, n => parseFloat(n).toFixed(2))
}

function formatTime(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString()
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

const RETRY_COUNTDOWN_SECONDS = 20

function App() {
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [history, setHistory] = useState(loadHistory)
  const [activeId, setActiveId] = useState(null)
  const [retryCountdown, setRetryCountdown] = useState(null)
  const [autoRetryFired, setAutoRetryFired] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const textareaRef = useRef(null)
  const solutionRef = useRef(null)
  const submitRef = useRef(null)

  useEffect(() => {
    if (solution && solutionRef.current) {
      solutionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [solution])

  useEffect(() => {
    if (retryCountdown === null) return
    if (retryCountdown === 0) {
      setRetryCountdown(null)
      setAutoRetryFired(true)
      submitRef.current?.(true)
      return
    }
    const t = setTimeout(() => setRetryCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [retryCountdown])

  function saveToHistory(prob, sol) {
    const entry = {
      id: Date.now().toString(),
      problem: prob,
      solution: sol,
      timestamp: Date.now(),
    }
    const updated = [entry, ...history].slice(0, MAX_HISTORY)
    setHistory(updated)
    setActiveId(entry.id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  }

  function handleHistoryClick(entry) {
    setProblem(entry.problem)
    setSolution(entry.solution)
    setError(null)
    setActiveId(entry.id)
  }

  function handleDeleteEntry(e, id) {
    e.stopPropagation()
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    if (activeId === id) {
      setActiveId(null)
      setSolution(null)
      setProblem('')
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  }

  function handleClearHistory() {
    setHistory([])
    setActiveId(null)
    localStorage.removeItem(HISTORY_KEY)
  }

  async function submitProblem(isRetry = false) {
    if (!problem.trim()) return
    setLoading(true)
    setError(null)
    setSolution(null)
    setActiveId(null)
    setRetryCountdown(null)
    if (!isRetry) setAutoRetryFired(false)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to solve problem.')
        if (data.retryable && !isRetry && !autoRetryFired) {
          setRetryCountdown(RETRY_COUNTDOWN_SECONDS)
        }
        return
      }
      setSolution(data)
      saveToHistory(problem.trim(), data)
    } catch (err) {
      setError(err.message || 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  submitRef.current = submitProblem

  function handleSubmit(e) {
    e.preventDefault()
    submitProblem(false)
  }

  function handleCancelRetry() {
    setRetryCountdown(null)
    setAutoRetryFired(true)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function handleTextareaChange(e) {
    setProblem(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  function handleChip(text) {
    setProblem(text)
    textareaRef.current?.focus()
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1500)
    }).catch(() => {})
  }

  function handleHome() {
    setProblem('')
    setSolution(null)
    setError(null)
    setLoading(false)
    setActiveId(null)
    setRetryCountdown(null)
    setAutoRetryFired(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const isActive = !!(solution || loading || error)

  return (
    <div className="app">
      <button
        className="rho-logo rho-logo-top"
        onClick={handleHome}
        aria-label="Home"
        title="Home"
      >
        ρ
      </button>
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <span>History</span>
          {history.length > 0 && (
            <button className="clear-btn" onClick={handleClearHistory}>Clear</button>
          )}
        </div>
        <div className="sidebar-list">
          {history.length === 0 ? (
            <p className="sidebar-empty">No history yet.</p>
          ) : (
            history.map(entry => (
              <div
                key={entry.id}
                className={`history-entry ${activeId === entry.id ? 'history-entry-active' : ''}`}
                onClick={() => handleHistoryClick(entry)}
              >
                <span className="entry-problem">{truncate(entry.problem, 45)}</span>
                <div className="entry-footer">
                  <span className="entry-time">{formatTime(entry.timestamp)}</span>
                  <button className="delete-entry-btn" onClick={(e) => handleDeleteEntry(e, entry.id)} aria-label="Delete">×</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main-wrapper">
        <div className="topbar topbar-active">
          <button
            className="history-toggle-btn"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle history"
          >
            ☰ History
          </button>
          <button
            className="history-toggle-btn share-btn"
            onClick={handleShare}
            aria-label="Copy share link"
          >
            {shareCopied ? '✓ Copied' : '🔗 Share'}
          </button>
        </div>

        <div className="main">
          {!solution && !loading && !error && (
            <div className="hero">
              <p className="hero-tagline">Engineering Problem Solver</p>
              <p className="hero-subtitle">Ask any heat transfer, statics, fluid mechanics, or thermodynamics problem.</p>
            </div>
          )}

          {error && (
            <div className="error-block">
              <p className="error">{error}</p>
              {retryCountdown !== null && (
                <div className="retry-info">
                  <span>Retrying in {retryCountdown}s…</span>
                  <button className="retry-cancel-btn" onClick={handleCancelRetry}>Cancel</button>
                </div>
              )}
            </div>
          )}

          {(solution || loading) && (
            <div className="solution" ref={solutionRef}>
              {loading && <p className="loading-text">Solving your problem...</p>}

              {solution && (() => {
                const hasGiven = solution.given_values && Object.keys(solution.given_values).length > 0
                const hasFormulas = solution.formulas && solution.formulas.length > 0
                const hasSteps = solution.steps && solution.steps.length > 0
                const answerValue = solution.final_answer?.value?.trim()
                const hasFinalAnswer = answerValue && answerValue.toLowerCase() !== 'n/a'
                return (
                  <>
                    <h2>{solution.problem_type}</h2>

                    {hasGiven && (
                      <div className="section-card">
                        <h3>Given Values</h3>
                        <ul>
                          {Object.entries(solution.given_values).map(([key, value]) => (
                            <li key={key}><strong>{key}:</strong> {value}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {hasFormulas && (
                      <div className="section-card">
                        <h3>Formulas</h3>
                        {solution.formulas.map((f, i) => (
                          <div key={i} className="formula">
                            <p>{f.description}</p>
                            <BlockMath math={stripDelimiters(f.latex)} renderError={() => null} />
                          </div>
                        ))}
                      </div>
                    )}

                    {hasSteps && (
                      <div className="section-card">
                        <h3>Step-by-Step Solution</h3>
                        {solution.steps.map((step) => (
                          <div key={step.step_number} className="step">
                            <p><span className="step-number">Step {step.step_number}:</span> {step.description}</p>
                            {step.latex && <BlockMath math={stripDelimiters(step.latex)} renderError={() => null} />}
                          </div>
                        ))}
                      </div>
                    )}

                    {hasFinalAnswer && (
                      <div className="section-card">
                        <h3>Final Answer</h3>
                        <BlockMath math={stripDelimiters(solution.final_answer.latex)} renderError={() => null} />
                        {solution.final_answer.value.includes(';')
                          ? solution.final_answer.value.split(';').map((val, i) => {
                              const unit = (solution.final_answer.units.split(';')[i] || '').trim()
                              return <p key={i} className="final-answer-value">{roundNumbers(val.trim())} {unit}</p>
                            })
                          : <p className="final-answer-value">{roundNumbers(solution.final_answer.value)} {solution.final_answer.units}</p>
                        }
                      </div>
                    )}

                    <div className="section-card">
                      <h3>Physical Explanation</h3>
                      <p className="physical-explanation">{solution.physical_explanation}</p>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>

        <div className={`input-area ${!isActive ? 'input-area-hero' : ''}`}>
          <form className="input-bar" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={problem}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe your engineering problem..."
              rows={1}
            />
            <button type="submit" disabled={loading || !problem.trim()} className="send-btn">
              {loading ? '...' : '↑'}
            </button>
          </form>
          {!solution && !loading && (
            <div className="chips">
              {CHIPS.map((chip) => (
                <button key={chip} className="chip" onClick={() => handleChip(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
