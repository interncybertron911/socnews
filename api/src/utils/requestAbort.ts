import type { Request, Response } from "express";

/**
 * Creates an AbortController and links it to the Express request/response "close" event.
 * If the client cancels the request or disconnects, the controller will be aborted.
 */
export function makeRequestAbortController(req: Request, res: Response) {
    const controller = new AbortController();

    const abort = () => {
        if (!controller.signal.aborted) controller.abort();
    };

    // ✅ ใช้ "aborted" สำหรับ client ยกเลิก request ชัดๆ
    req.on("aborted", abort);

    // ✅ ใช้ close เฉพาะเคสที่ response ยังไม่จบจริงๆ
    res.on("close", () => {
        if (!res.writableEnded) abort();
    });

    return controller;
}
