import { useState } from 'react'
import { BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import './App.css'

const API_URL = 'https://engineering-solver-backend.onrender.com/solve'

function stripDelimiters(latex) {
  if (!latex) return ''
  return latex.replace(/^\$\$?([\s\S]*?)\$\$?$/, '$1').trim()
}

function App() {
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
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

  return (
    <>
      <div className="header">
        <div className="title-box">
          <h1>Engineering Problem Solver</h1>
        </div>
        <p className="subtitle">Heat Transfer · Statics · Fluid Mechanics · Thermodynamics</p>
      </div>

      <div className="main">
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Type your engineering problem here..."
              rows={4}
            />
            <p className="instructions">
              Describe your problem in plain English — include any <span>known values and units</span>.
              The solver will identify the problem type, apply the relevant formulas, and walk you through
              a full step-by-step solution with rendered equations.
            </p>
            <button type="submit" disabled={loading || !problem.trim()}>
              {loading ? 'Solving...' : 'Solve Problem'}
            </button>
          </form>
        </div>

        {error && <p className="error">{error}</p>}

        {solution && (
          <div className="solution">
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
                    return (
                      <p key={i} className="final-answer-value">
                        {val.trim()} {unit}
                      </p>
                    )
                  })
                : <p className="final-answer-value">{solution.final_answer.value} {solution.final_answer.units}</p>
              }
            </div>

            <div className="section-card">
              <h3>Physical Explanation</h3>
              <p className="physical-explanation">{solution.physical_explanation}</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default App