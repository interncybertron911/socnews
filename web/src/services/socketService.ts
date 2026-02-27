import { io, Socket } from "socket.io-client";
import { authService } from "./authService";

import { config } from "../config";
const SOCKET_URL = config.apiBaseUrl;

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket?.connected) return;

        const user = authService.getCurrentUser();
        const username = user?.username || "anonymous";

        this.socket = io(SOCKET_URL, {
            query: { username }
        });

        this.socket.on("connect", () => {
            console.log("[Socket] Connected to SOC Backend");
        });

        this.socket.on("disconnect", () => {
            console.log("[Socket] Disconnected from SOC Backend");
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emitJoinNews(articleId: string, username: string) {
        this.socket?.emit("join-news", { articleId, username });
    }

    emitLeaveNews(articleId: string, username: string) {
        this.socket?.emit("leave-news", { articleId, username });
    }

    emitStatusUpdated(articleId: string, status: string, username: string) {
        this.socket?.emit("status-updated", { articleId, status, username });
    }

    emitNewsDeleted(articleId: string) {
        this.socket?.emit("news-deleted", { articleId });
    }

    onNewsLocked(callback: (data: { articleId: string, username: string }) => void) {
        this.socket?.on("news-locked", callback);
    }

    onNewsUnlocked(callback: (data: { articleId: string }) => void) {
        this.socket?.on("news-unlocked", callback);
    }

    onNewsStatusChanged(callback: (data: { articleId: string, status: string, username: string }) => void) {
        this.socket?.on("news-status-changed", callback);
    }

    onNewsRemoved(callback: (data: { articleId: string }) => void) {
        this.socket?.on("news-removed", callback);
    }

    offAll() {
        this.socket?.off("news-locked");
        this.socket?.off("news-unlocked");
        this.socket?.off("news-status-changed");
        this.socket?.off("news-removed");
    }
}

export const socketService = new SocketService();
