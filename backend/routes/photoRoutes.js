const express = require('express');
const router = express.Router();
const { getPhotos } = require('../controllers/photoController');

router.get('/', getPhotos);

module.exports = router;
