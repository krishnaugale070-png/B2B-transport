import React from 'react';
import { Notification } from '../types';
import { Bell, Check, Calendar, AlertCircle, MessageSquare } from 'lucide-react';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAllAsRead: () => void;
}

export default function NotificationCenter({ notifications, onMarkAllAsRead }: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">Alerts & System Notifications</h3>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline focus:outline-none"
          >
            <Check className="w-3.5 h-3.5" /> Mark read
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No active notification alerts. Real-time logging of freight requests appears here.
          </div>
        ) : (
          notifications.map(n => {
            const getIcon = () => {
              switch (n.type) {
                case 'booking_request':
                  return <Calendar className="w-4 h-4 text-blue-600" />;
                case 'booking_status':
                  return <Check className="w-4 h-4 text-blue-700" />;
                case 'review':
                  return <MessageSquare className="w-4 h-4 text-indigo-600" />;
                default:
                  return <AlertCircle className="w-4 h-4 text-slate-600" />;
              }
            };

            const getBg = () => {
              switch (n.type) {
                case 'booking_request':
                  return 'bg-blue-50/50 border-blue-100';
                case 'booking_status':
                  return 'bg-blue-50 border-blue-200';
                case 'review':
                  return 'bg-indigo-50 border-indigo-200';
                default:
                  return 'bg-slate-50 border-slate-200';
              }
            };

            return (
              <div 
                key={n.id} 
                id={`notification-${n.id}`}
                className={`p-4 transition-all hover:bg-slate-50/50 ${!n.read ? 'bg-slate-50 font-medium' : ''}`}
              >
                <div className="flex gap-3 items-start">
                  <div className={`p-1.5 rounded-lg border flex-shrink-0 ${getBg()}`}>
                    {getIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">{n.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
