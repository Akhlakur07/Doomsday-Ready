const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const movieRoutes = require('./routes/movieRoutes');
const cinemaRoutes = require('./routes/cinemaRoutes');
const tmdbRoutes = require('./routes/tmdbRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors(
    allowedOrigins.length > 0
      ? { origin: allowedOrigins }
      : undefined
  )
);
app.use(express.json());

async function ensureDbConnected(req, res, next) {
  await connectDB();
  next();
}

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Doomsday Ready API',
    health: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Doomsday Ready API' });
});

app.use('/api/movies', ensureDbConnected, movieRoutes);
app.use('/api/cinemas', ensureDbConnected, cinemaRoutes);
app.use('/api/tmdb', tmdbRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

app.use(errorHandler);

module.exports = app;
