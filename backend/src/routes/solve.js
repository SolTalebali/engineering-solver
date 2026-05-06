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
    const msg = err.message || '';
    const isOverloaded = msg.includes('503') || msg.includes('429');
    const message = isOverloaded
      ? 'The solver is experiencing high demand right now. Please wait a moment and try again.'
      : 'Failed to solve problem. Please try again.';
    res.status(500).json({ error: message, retryable: isOverloaded });
  }
});

module.exports = router;
