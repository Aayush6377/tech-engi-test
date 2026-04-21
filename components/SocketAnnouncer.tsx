"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";

export const globalSocket = io();

export default function SocketAnnouncer({ userId }: { userId?: string }) {
  useEffect(() => {
    if (userId) {
      globalSocket.emit("user_connected", userId);
    }

    return () => {
      globalSocket.off("user_connected");
    };
  }, [userId]);

  return null;
}