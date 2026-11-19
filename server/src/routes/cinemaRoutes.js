const express = require('express');
const {
  listCinemas,
  createCinema,
  deleteCinema,
  getBookingQuote,
} = require('../controllers/cinemaController');

const router = express.Router();

router.get('/', listCinemas);
router.post('/', createCinema);
router.delete('/:id', deleteCinema);
router.get('/:id/booking', getBookingQuote);

module.exports = router;
