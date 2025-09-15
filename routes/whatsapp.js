const express = require('express');
const router = express.Router();
const { handleWhatsAppMessage } = require('../controllers/whatsappController');

router.post('/', handleWhatsAppMessage);

module.exports = router;
