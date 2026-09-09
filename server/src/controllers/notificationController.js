const notificationService = require('../services/notificationService');

class NotificationController {
  async listNotifications(req, res, next) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user.id);
      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const updated = await notificationService.markAsRead(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
