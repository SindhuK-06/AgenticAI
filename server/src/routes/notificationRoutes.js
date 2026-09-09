const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware');

const router = express.Router();

router.use(protect);

router.get('/', notificationController.listNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
