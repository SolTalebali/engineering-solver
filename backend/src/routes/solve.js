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
    res.status(500).json({ error: 'Failed to solve problem. Please try again.' });
  }
});

module.exports = router;
