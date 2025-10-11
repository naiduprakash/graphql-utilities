'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/redux';
import { removeNotification } from '@/lib/store/slices/uiSlice';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function NotificationContainer() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.ui.notifications);

  useEffect(() => {
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        dispatch(removeNotification(notification.id));
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map((notification) => {
        const Icon = icons[notification.type];
        return (
          <div
            key={notification.id}
            className={`max-w-sm w-full border rounded-lg p-4 shadow-lg ${colors[notification.type]}`}
          >
            <div className="flex items-start space-x-3">
              <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => dispatch(removeNotification(notification.id))}
                className="flex-shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
