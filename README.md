# Engineering Problem Solver

An AI-powered web app that solves mechanical engineering problems step by step. Enter a problem in plain English and get back a structured solution with formulas, step-by-step workings, rendered equations, and a physical explanation.

**Live Demo:** [engineering-solver.vercel.app](https://engineering-solver.vercel.app)

---

## Supported Topics

- Heat Transfer
- Statics
- Fluid Mechanics
- Thermodynamics
- Dynamics

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Equation Rendering | KaTeX |
| Backend | Node.js + Express |
| AI | Google Gemini 2.5 Flash |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

## Project Structure

```
engineering-solver/
├── frontend/         # React app
│   └── src/
│       ├── App.jsx
│       └── App.css
└── backend/          # Express API
    └── src/
        ├── index.js
        ├── routes/
        │   └── solve.js
        └── services/
            └── gemini.js
```

## Running Locally

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```
GEMINI_API_KEY=your_api_key_here
PORT=3000
```

Get a free API key at [aistudio.google.com](https://aistudio.google.com).

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

> The frontend points to the live Render backend by default. To use your local backend instead, change `API_URL` in `frontend/src/App.jsx` to `http://localhost:3000/solve`.

## API

**POST** `/solve`

Request:
```json
{
  "problem": "A steel plate 10mm thick with thermal conductivity 50 W/mK has one side at 200°C and the other at 50°C. Find the heat flux."
}
```

Response:
```json
{
  "problem_type": "Heat Transfer",
  "given_values": { ... },
  "formulas": [ { "description": "...", "latex": "..." } ],
  "steps": [ { "step_number": 1, "description": "...", "latex": "..." } ],
  "final_answer": { "value": "750000", "units": "W/m²", "latex": "..." },
  "physical_explanation": "..."
}
```