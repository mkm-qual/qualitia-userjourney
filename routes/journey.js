const express = require('express');
const { getJourney, saveJourney, getJourneyMeta } = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const j = getJourney();
  if (!j) return res.status(404).json({ error: 'Journey not found' });
  res.json({ data: j.data, updatedAt: j.updated_at, updatedBy: j.updated_by });
});

router.get('/version', requireAuth, (req, res) => {
  const meta = getJourneyMeta();
  if (!meta) return res.status(404).json({ error: 'Journey not found' });
  res.json(meta);
});

router.put('/', requireAuth, (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'Data required' });
  saveJourney(data, req.user.username);
  const meta = getJourneyMeta();
  res.json({ success: true, updatedAt: meta.updated_at, updatedBy: meta.updated_by });
});

module.exports = router;
