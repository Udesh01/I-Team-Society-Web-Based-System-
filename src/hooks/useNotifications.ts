import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationService } from '@/services/supabase/notification.service';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const notificationsData = await NotificationService.getUserNotifications(user.id);
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.is_read).length);
      } catch (err: any) {
        console.error('Error loading notifications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => prev - 1);
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  return { notifications, unreadCount, loading, error, markAsRead };
};