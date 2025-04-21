const express = require('express');
const router = express.Router();
const {
    createOrder,
    verifyPayment,
    getWalletBalance
} = require('../controllers/walletController');

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.get('/balance', getWalletBalance);

module.exports = router;
