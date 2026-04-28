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
    "value": "numeric value as string",
    "units": "string — SI or stated units",
    "latex": "string — final result in LaTeX"
  },
  "physical_explanation": "string — 2-3 sentences explaining the physical meaning of the result"
}

Do not include any text outside the JSON object.`;

async function solveEngineeringProblem(problem) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nProblem: ${problem}`);
  const text = result.response.text();
  return JSON.parse(text);
}

module.exports = { solveEngineeringProblem };
