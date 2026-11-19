const express = require('express');
const { searchTmdb, getTmdbDetails } = require('../controllers/tmdbController');

const router = express.Router();

router.get('/search', searchTmdb);
router.get('/details/:type/:tmdbId', getTmdbDetails);

module.exports = router;
