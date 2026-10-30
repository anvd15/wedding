const express = require('express');
const router = express.Router();
const { getWeddingInfo, updateWeddingInfo } = require('../controllers/infoController');

router.get('/', getWeddingInfo);
router.put('/', updateWeddingInfo);

module.exports = router;
