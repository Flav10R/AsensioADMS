const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');

// Admin Panel REST API
router.get('/devices', adminController.getDevices);
router.put('/devices/:sn/authorize', adminController.authorizeDevice);
router.get('/attendances', adminController.getAttendances);
router.post('/devices/:sn/commands', adminController.queueCommand);

module.exports = router;
