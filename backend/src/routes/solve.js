const express = require('express');
const { solveEngineeringProblem } = require('../services/gemini');

const router = express.Router();

router.post('/', async (req, res) => {
  const { problem } = req.body;

  if (!problem || problem.trim() === '') {
    return res.status(400).json({ error: 'Problem text is required.' });
  }

  try {
    const solution = await solveEngineeringProblem(problem);
    res.json(solution);
  } catch (err) {
    console.error(err);
    const is503 = err.message && err.message.includes('503');
    const message = is503
      ? 'The solver is experiencing high demand right now. Please wait a moment and try again.'
      : 'Failed to solve problem. Please try again.';
    res.status(500).json({ error: message });
  }
});

module.exports = router;
