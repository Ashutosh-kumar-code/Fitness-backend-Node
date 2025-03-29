const express = require('express');
const router = express.Router();
const { startCall } = require('../controllers/callController');

router.post('/start', startCall);

module.exports = router;
