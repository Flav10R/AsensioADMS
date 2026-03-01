const express = require('express');
const router = express.Router();
const iclockController = require('../controllers/iclock');

// Asensio ADMS Push SDK HTTP Endpoints
router.get('/cdata', iclockController.handshake);
router.post('/cdata', iclockController.receiveData);
router.get('/getrequest', iclockController.getRequest);
router.post('/devicecmd', iclockController.deviceCmd);

module.exports = router;
