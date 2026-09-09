const Notification = require('../models/Notification');
const { emitNotification } = require('../config/socket');

class NotificationService {
  async createNotification({ owner, workflowId = null, executionId = null, type = 'info', title, message, metadata = {} }) {
    const notification = await Notification.create({
      owner,
      workflowId,
      executionId,
      type,
      title,
      message,
      metadata,
      isRead: false,
    });

    // Broadcast via Socket.IO
    emitNotification(owner, notification);

    return notification;
  }

  async getUserNotifications(userId, limit = 50) {
    return await Notification.find({ owner: userId }, { createdAt: -1 }, limit);
  }

  async markAsRead(userId, notificationId) {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    await Notification.updateMany({ owner: userId, isRead: false }, { isRead: true });
    return { success: true };
  }
}

module.exports = new NotificationService();
