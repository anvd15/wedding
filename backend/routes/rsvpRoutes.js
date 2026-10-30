const express = require('express');
const router = express.Router();
const { getRsvps, createRsvp } = require('../controllers/rsvpController');

router.get('/', getRsvps);
router.post('/', createRsvp);

module.exports = router;
