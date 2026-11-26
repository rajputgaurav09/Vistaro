import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Bell, Check, ExternalLink, X, Info, AlertTriangle, FileText } from 'lucide-react';

export const NotificationsDrawer = ({ isOpen, onClose, onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchNotifs();
  }, [isOpen]);

  const markAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#1F1F1F] shadow-2xl flex flex-col border-l border-[#333333]">
      <div className="p-4 border-b border-[#2E2E2E] flex items-center justify-between bg-[#242424] text-white">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#D8FF45]" />
          <h3 className="font-semibold text-xs tracking-wider uppercase font-mono">Notifications</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="text-[11px] font-mono text-[#D8FF45] hover:underline cursor-pointer"
          >
            Mark all read
          </button>
          <button onClick={onClose} className="p-1 text-[#71717A] hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {loading ? (
          <div className="text-center py-8 text-xs text-[#71717A] font-mono">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#71717A] font-mono">No notifications yet.</div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-lg border transition-all text-xs ${
                notif.read ? 'bg-[#242424] border-[#333333]' : 'bg-[#1D1D1D] border-[#444444]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-white flex items-center gap-1.5">
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-[#D8FF45] shrink-0" />}
                  <span>{notif.title}</span>
                </div>
                <span className="text-[10px] text-[#71717A] font-mono shrink-0">
                  {new Date(notif.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-[#A1A1AA] mt-1 leading-relaxed text-[11px]">{notif.message}</p>

              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#2E2E2E]">
                {notif.link ? (
                  <button
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate(notif.link);
                        onClose();
                      }
                    }}
                    className="text-[11px] font-mono text-[#D8FF45] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Record</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                ) : <span />}

                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="text-[10px] text-[#71717A] hover:text-white flex items-center gap-1 font-mono cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Mark read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
