const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDB } = require('./db');
const { router: authRouter } = require('./routes/auth');
const journeyRouter = require('./routes/journey');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRouter);
app.use('/api/journey', journeyRouter);
app.use('/api/users', usersRouter);

const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

initDB();
app.listen(PORT, () => {
  console.log(`Qualitia Journey Map server running on port ${PORT}`);
});
