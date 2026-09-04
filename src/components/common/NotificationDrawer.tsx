import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon, Trash2 } from 'lucide-react';
import { useProcurementStore } from '../../store/useProcurementStore';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, clearNotifications } = useProcurementStore();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'ALERT':
        return <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-600 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-up sm:animate-none">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-soil-50">
          <div>
            <h3 className="font-bold text-base text-slate-900">Live Notification Center</h3>
            <p className="text-xs text-slate-500">Real-time alerts for procurement & queues</p>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                title="Clear all notifications"
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No new notifications</p>
              <p className="text-xs">Alerts will appear here in real-time</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  n.read
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : 'bg-white border-forest-accent/40 shadow-sm ring-1 ring-forest-accent/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(n.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    {n.roleTarget && (
                      <span className="mt-2 inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {n.roleTarget}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
          Sync active via <span className="font-semibold text-forest">Krishi Mitra WebSocket / Channel</span>
        </div>

      </div>
    </div>
  );
};
