import React from "react";
import NotificationCenter from "@/components/notifications/NotificationCenter";

const Notifications = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      <NotificationCenter />
    </div>
  );
};

export default Notifications;
