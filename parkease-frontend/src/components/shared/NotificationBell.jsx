import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Check, CheckCheck, Trash2, 
  Calendar, CreditCard, XCircle, 
  CheckCircle2, AlertTriangle, Info,
  Clock, LogIn, LogOut, Zap
} from 'lucide-react';
import notificationApi from '../../api/notificationApi';
import { formatDateTime } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const NotificationBell = () => {
  const { isLoggedIn }              = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const dropdownRef                 = useRef(null);
  
  const getNotificationConfig = (type) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return { icon: <Calendar className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-100' };
      case 'BOOKING_CANCELLED':
      case 'BOOKING_EXPIRED':
        return { icon: <XCircle className="w-4 h-4 text-red-600" />, bg: 'bg-red-50', border: 'border-red-100' };
      case 'BOOKING_EXTENDED':
        return { icon: <Clock className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50', border: 'border-amber-100' };
      case 'CHECK_IN_ALERT':
        return { icon: <LogIn className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50', border: 'border-blue-100' };
      case 'CHECK_OUT_SUMMARY':
        return { icon: <LogOut className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50', border: 'border-indigo-100' };
      case 'PAYMENT_SUCCESS':
        return { icon: <CreditCard className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-100' };
      case 'PAYMENT_FAILED':
        return { icon: <AlertTriangle className="w-4 h-4 text-red-600" />, bg: 'bg-red-50', border: 'border-red-100' };
      case 'PLATFORM_BROADCAST':
        return { icon: <Zap className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50', border: 'border-purple-100' };
      default:
        return { icon: <Info className="w-4 h-4 text-slate-500" />, bg: 'bg-slate-50', border: 'border-slate-100' };
    }
  };

  // Fetch unread count every 30 seconds
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchCount = async () => {
      try {
        const res = await notificationApi.getUnreadCount();
        setUnreadCount(res.data.unreadCount || 0);
      } catch {}
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current &&
          !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setLoading(true);
      try {
        const res = await notificationApi.getMyNotifications();
        setNotifications(res.data || []);
      } catch {}
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  if (!isLoggedIn) return null;

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-slate-500
                   hover:bg-slate-100 hover:text-slate-700
                   transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5
                           min-w-[18px] h-[18px] px-1
                           bg-red-500 text-white
                           text-[10px] font-bold rounded-full
                           flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80
                        bg-white rounded-xl shadow-modal
                        border border-slate-100 z-50
                        max-h-[480px] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between
                          px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs
                           text-blue-600 hover:text-blue-700
                           font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => {
                const config = getNotificationConfig(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={`
                      px-4 py-3 flex gap-3 border-b
                      border-slate-50 hover:bg-slate-50
                      transition-colors group relative
                      ${!notif.isRead ? 'bg-blue-50/30' : ''}
                    `}
                  >
                    {/* Icon Container */}
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-lg border
                      flex items-center justify-center mt-0.5
                      ${config.bg} ${config.border}
                    `}>
                      {config.icon}
                    </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatDateTime(notif.sentAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 opacity-0
                                  group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="p-1 hover:text-blue-600
                                   text-slate-400 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-1 hover:text-red-500
                                 text-slate-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;