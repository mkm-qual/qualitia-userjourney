const express = require('express');
const { getUsers, createUser, updateUserPassword, deleteUserById, findUserById } = require('../db');
const { requireAdmin } = require('./auth');

const router = express.Router();

router.get('/', requireAdmin, (req, res) => {
  const users = getUsers().map(({ id, username, role, created_at }) => ({ id, username, role, created_at }));
  res.json({ users });
});

router.post('/', requireAdmin, (req, res) => {
  const { username, password, role = 'user' } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Role must be admin or user' });
  try {
    const user = createUser(username, password, role);
    res.status(201).json({ user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

router.put('/:id/password', requireAdmin, (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  try {
    updateUserPassword(req.params.id, password);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  try {
    deleteUserById(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
