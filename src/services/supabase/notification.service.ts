import { supabase } from "@/integrations/supabase/client";

export const NotificationService = {
  getUserNotifications: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  markAsRead: async (notificationId: string) => {
    // Try with 'read' column first
    let { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();

    // If 'read' column doesn't exist, try with 'is_read' column
    if (error && error.message.includes('column notifications.read does not exist')) {
      const result = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;
    return data;
  },

  createNotification: async (notification: any) => {
    // Ensure both read and is_read are included for compatibility
    const notificationData = {
      ...notification,
      read: notification.read !== undefined ? notification.read : false,
      is_read: notification.is_read !== undefined ? notification.is_read :
               (notification.read !== undefined ? notification.read : false)
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create multiple notifications (bulk)
  createBulkNotifications: async (notifications: any[]) => {
    // Ensure both read and is_read are included for compatibility
    const notificationsData = notifications.map(notification => ({
      ...notification,
      read: notification.read !== undefined ? notification.read : false,
      is_read: notification.is_read !== undefined ? notification.is_read :
               (notification.read !== undefined ? notification.read : false)
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationsData)
      .select();

    if (error) throw error;
    return data;
  },

  // Create event cancellation notifications
  createEventCancellationNotifications: async (
    eventName: string,
    eventDate: string,
    userIds: string[]
  ) => {
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      title: "Event Cancelled",
      message: `The event "${eventName}" scheduled for ${new Date(
        eventDate
      ).toLocaleDateString()} has been cancelled. We apologize for any inconvenience.`,
      type: "warning",
      read: false,
      is_read: false, // Include both column names for compatibility
    }));

    return await NotificationService.createBulkNotifications(notifications);
  },

  // Get unread notification count
  getUnreadCount: async (userId: string) => {
    // Try with 'read' column first
    let { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('read', false);

    // If 'read' column doesn't exist, try with 'is_read' column
    if (error && error.message.includes('column notifications.read does not exist')) {
      const result = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('is_read', false);
      data = result.data;
      error = result.error;
    }

    if (error) throw error;
    return data?.length || 0;
  }
};