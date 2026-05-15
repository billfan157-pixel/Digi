import React from 'react';
import { useCalendarSync } from '../hooks/useCalendarSync';

/**
 * Component này không hiển thị gì cả.
 * Mục đích duy nhất là để kích hoạt useCalendarSync ở cấp độ toàn cục (Global).
 * Khi App được mở và user đã login, component này sẽ mount và trigger sync ngầm.
 */
const CalendarSyncActivator: React.FC = () => {
  // Hook này đã có sẵn logic useEffect để tự động sync khi mount
  useCalendarSync();
  
  return null;
};

export default CalendarSyncActivator;
