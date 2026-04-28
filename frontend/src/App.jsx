import { useState } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import './App.css'

const API_URL = 'https://engineering-solver-backend.onrender.com/solve'

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
    <div className="container">
      <h1>Engineering Problem Solver</h1>
      <p className="subtitle">Heat Transfer · Statics · Fluid Mechanics</p>

      <form onSubmit={handleSubmit}>
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Describe your engineering problem..."
          rows={4}
        />
        <button type="submit" disabled={loading || !problem.trim()}>
          {loading ? 'Solving...' : 'Solve'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {solution && (
        <div className="solution">
          <h2>{solution.problem_type}</h2>

          <section>
            <h3>Given Values</h3>
            <ul>
              {Object.entries(solution.given_values).map(([key, value]) => (
                <li key={key}><strong>{key}:</strong> {value}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Formulas</h3>
            {solution.formulas.map((f, i) => (
              <div key={i} className="formula">
                <p>{f.description}</p>
                <BlockMath math={f.latex} />
              </div>
            ))}
          </section>

          <section>
            <h3>Step-by-Step Solution</h3>
            {solution.steps.map((step) => (
              <div key={step.step_number} className="step">
                <p><strong>Step {step.step_number}:</strong> {step.description}</p>
                {step.latex && <BlockMath math={step.latex} />}
              </div>
            ))}
          </section>

          <section>
            <h3>Final Answer</h3>
            <BlockMath math={solution.final_answer.latex} />
            <p>{solution.final_answer.value} {solution.final_answer.units}</p>
          </section>

          <section>
            <h3>Physical Explanation</h3>
            <p>{solution.physical_explanation}</p>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
