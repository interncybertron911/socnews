import { Server, Socket } from "socket.io";
import { ThreatArticleModel } from "./models/ThreatArticle";

export function setupSocket(io: Server) {
    io.on("connection", (socket: Socket) => {
        const username = socket.handshake.query.username as string;
        console.log(`[Socket] Operative connected: ${username} (${socket.id})`);

        // 1. Join News (Locking)
        socket.on("join-news", async ({ articleId, username }: { articleId: string, username: string }) => {
            console.log(`[Socket] ${username} joining news: ${articleId}`);

            try {
                // Set lock in DB
                await ThreatArticleModel.updateOne(
                    { externalId: articleId },
                    {
                        $set: {
                            lockedBy: username,
                            lockedAt: new Date()
                        }
                    }
                );

                // Track this articleId on the socket for auto-unlock on disconnect
                (socket as any).currentArticleId = articleId;
                (socket as any).username = username;

                // Broadcast to everyone else
                socket.broadcast.emit("news-locked", { articleId, username });
            } catch (e) {
                console.error("[Socket] join-news error:", e);
            }
        });

        // 2. Leave News (Unlocking)
        socket.on("leave-news", async ({ articleId, username }: { articleId: string, username: string }) => {
            console.log(`[Socket] ${username} leaving news: ${articleId}`);

            try {
                await ThreatArticleModel.updateOne(
                    { externalId: articleId, lockedBy: username },
                    { $set: { lockedBy: null, lockedAt: null } }
                );

                delete (socket as any).currentArticleId;

                socket.broadcast.emit("news-unlocked", { articleId });
            } catch (e) {
                console.error("[Socket] leave-news error:", e);
            }
        });

        // 3. Status Change Broadcast
        socket.on("status-updated", ({ articleId, status, username }: { articleId: string, status: string, username: string }) => {
            // Backend routes already update DB, we just broadcast the UI change
            io.emit("news-status-changed", { articleId, status, username });
        });

        // 4. Soft Delete Broadcast
        socket.on("news-deleted", ({ articleId }: { articleId: string }) => {
            io.emit("news-removed", { articleId });
        });

        // 5. Auto-unlock on Disconnect
        socket.on("disconnect", async () => {
            const articleId = (socket as any).currentArticleId;
            const user = (socket as any).username || username;

            console.log(`[Socket] Operative disconnected: ${user}`);

            if (articleId && user) {
                try {
                    await ThreatArticleModel.updateOne(
                        { externalId: articleId, lockedBy: user },
                        { $set: { lockedBy: null, lockedAt: null } }
                    );
                    io.emit("news-unlocked", { articleId });
                } catch (e) {
                    console.error("[Socket] Disconnect unlock error:", e);
                }
            }
        });
    });
}
