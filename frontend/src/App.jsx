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

function App() {
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [history, setHistory] = useState(loadHistory)
  const [activeId, setActiveId] = useState(null)
  const textareaRef = useRef(null)
  const solutionRef = useRef(null)

  useEffect(() => {
    if (solution && solutionRef.current) {
      solutionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [solution])

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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!problem.trim()) return
    setLoading(true)
    setError(null)
    setSolution(null)
    setActiveId(null)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSolution(data)
      saveToHistory(problem.trim(), data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="app">
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
        <div className="topbar">
          <button
            className="history-toggle-btn"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle history"
          >
            ☰ History
          </button>
        </div>

        <div className="main">
          {!solution && !loading && !error && (
            <div className="hero">
              <div className="hero-icon">⚙</div>
              <h1>Engineering Problem Solver</h1>
              <p className="hero-subtitle">Ask any heat transfer, statics, fluid mechanics, or thermodynamics problem.</p>
            </div>
          )}

          {error && <p className="error">{error}</p>}

          {(solution || loading) && (
            <div className="solution" ref={solutionRef}>
              {loading && <p className="loading-text">Solving your problem...</p>}

              {solution && (
                <>
                  <h2>{solution.problem_type}</h2>

                  <div className="section-card">
                    <h3>Given Values</h3>
                    <ul>
                      {Object.entries(solution.given_values).map(([key, value]) => (
                        <li key={key}><strong>{key}:</strong> {value}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="section-card">
                    <h3>Formulas</h3>
                    {solution.formulas.map((f, i) => (
                      <div key={i} className="formula">
                        <p>{f.description}</p>
                        <BlockMath math={stripDelimiters(f.latex)} renderError={() => null} />
                      </div>
                    ))}
                  </div>

                  <div className="section-card">
                    <h3>Step-by-Step Solution</h3>
                    {solution.steps.map((step) => (
                      <div key={step.step_number} className="step">
                        <p><span className="step-number">Step {step.step_number}:</span> {step.description}</p>
                        {step.latex && <BlockMath math={stripDelimiters(step.latex)} renderError={() => null} />}
                      </div>
                    ))}
                  </div>

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

                  <div className="section-card">
                    <h3>Physical Explanation</h3>
                    <p className="physical-explanation">{solution.physical_explanation}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="input-area">
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
          <div className="chips">
            {CHIPS.map((chip) => (
              <button key={chip} className="chip" onClick={() => handleChip(chip)}>
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
