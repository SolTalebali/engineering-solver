const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are an expert engineering problem solver specializing in mechanical engineering topics such as heat transfer, statics, fluid mechanics, thermodynamics, and dynamics.

When given an engineering problem, respond ONLY with a valid JSON object matching this exact structure:
{
  "problem_type": "string — e.g. Heat Transfer, Statics, Fluid Mechanics",
  "given_values": {
    "key": "value with units"
  },
  "formulas": [
    {
      "description": "string — what this formula represents",
      "latex": "string — formula in LaTeX notation"
    }
  ],
  "steps": [
    {
      "step_number": 1,
      "description": "string — explanation of this step",
      "latex": "string — calculation in LaTeX notation, or empty string if none"
    }
  ],
  "final_answer": {
    "value": "numeric value as string — if multiple answers, separate with semicolons",
    "units": "string — abbreviated unit symbols only (m, kg, N, Pa, W, J, K, °C, etc.), never full words like 'meters' or 'kilograms' — if multiple answers, separate with semicolons",
    "latex": "string — a single LaTeX expression for the primary result only, e.g. W_{net} = 33.33 \\text{ MW}. Never use \\begin{enumerate}, \\item, or any list environments here."
  },
  "physical_explanation": "string — 2-3 sentences explaining the physical meaning of the result"
}

Important rules:
- Do not include $ delimiters inside any latex string value — write raw LaTeX only.
- The final_answer.latex must be a single equation, never a list.
- Step description strings must be plain text only — no inline $ math.
- Round all final numerical answers to 2 decimal places. Do not report more precision than this.
- When the problem has multiple final answers, label each value clearly in final_answer.value using the format "Label: value" separated by semicolons, e.g. "Net power output: 32.75; Thermal efficiency: 39.10; Heat input: 89.83". Do the same for units.
- Do not include any text outside the JSON object.`;

const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'];
const RETRY_DELAYS = [2000, 5000, 10000]; // backoff between full-chain retries
const RECOVERABLE_CODES = ['404', '429', '503'];

async function tryModel(modelName, problem) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nProblem: ${problem}`);
  return JSON.parse(result.response.text());
}

function isRecoverable(err) {
  const msg = err.message || '';
  return RECOVERABLE_CODES.some(code => msg.includes(code));
}

async function solveEngineeringProblem(problem) {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    for (const modelName of MODEL_CHAIN) {
      try {
        const solution = await tryModel(modelName, problem);
        if (modelName !== MODEL_CHAIN[0]) {
          console.log(`Served via fallback model: ${modelName}`);
        }
        return solution;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed: ${err.message}`);
        if (!isRecoverable(err)) throw err;
      }
    }
    if (attempt < RETRY_DELAYS.length) {
      await new Promise(res => setTimeout(res, RETRY_DELAYS[attempt]));
    }
  }
  throw lastError;
}

module.exports = { solveEngineeringProblem };
