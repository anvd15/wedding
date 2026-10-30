const express = require('express');
const router = express.Router();
const { getWishes, createWish } = require('../controllers/wishController');

router.get('/', getWishes);
router.post('/', createWish);

module.exports = router;
