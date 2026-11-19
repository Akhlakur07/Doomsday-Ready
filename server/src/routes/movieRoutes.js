const express = require('express');
const {
  listMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  getRewatchOrder,
} = require('../controllers/movieController');

const router = express.Router();

router.get('/', listMovies);
router.post('/', createMovie);
router.patch('/:id', updateMovie);
router.delete('/:id', deleteMovie);
router.get('/:id/rewatch-order', getRewatchOrder);

module.exports = router;
