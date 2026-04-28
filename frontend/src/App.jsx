import { useState, useRef, useEffect } from 'react'
import { BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import './App.css'

const API_URL = 'https://engineering-solver-backend.onrender.com/solve'

const CHIPS = [
  'Heat flux through a steel wall',
  'Beam in static equilibrium',
  'Pipe flow with Bernoulli\'s equation',
  'Carnot cycle efficiency',
]

function stripDelimiters(latex) {
  if (!latex) return ''
  return latex.replace(/^\$\$?([\s\S]*?)\$\$?$/, '$1').trim()
}

function App() {
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const textareaRef = useRef(null)
  const solutionRef = useRef(null)

  useEffect(() => {
    if (solution && solutionRef.current) {
      solutionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [solution])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!problem.trim()) return
    setLoading(true)
    setError(null)
    setSolution(null)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSolution(data)
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
                      <BlockMath math={stripDelimiters(f.latex)} />
                    </div>
                  ))}
                </div>

                <div className="section-card">
                  <h3>Step-by-Step Solution</h3>
                  {solution.steps.map((step) => (
                    <div key={step.step_number} className="step">
                      <p><span className="step-number">Step {step.step_number}:</span> {step.description}</p>
                      {step.latex && <BlockMath math={stripDelimiters(step.latex)} />}
                    </div>
                  ))}
                </div>

                <div className="section-card">
                  <h3>Final Answer</h3>
                  <BlockMath math={stripDelimiters(solution.final_answer.latex)} />
                  {solution.final_answer.value.includes(';')
                    ? solution.final_answer.value.split(';').map((val, i) => {
                        const unit = (solution.final_answer.units.split(';')[i] || '').trim()
                        return <p key={i} className="final-answer-value">{val.trim()} {unit}</p>
                      })
                    : <p className="final-answer-value">{solution.final_answer.value} {solution.final_answer.units}</p>
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
  )
}

export default App
