import { Router, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { sdk } from "./_core/sdk";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB for receipts/PDFs
});

export function createReceiptUploadRouter(): Router {
  const r = Router();

  r.post(
    "/api/upload/receipt",
    async (req: Request, res: Response, next) => {
      try {
        const user = await sdk.authenticateRequest(req as any);
        (req as any).user = user;
        next();
      } catch {
        res.status(401).json({ error: "Unauthorized" });
      }
    },
    upload.single("receipt"),
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const file = (req as any).file as Express.Multer.File | undefined;

        if (!file) {
          res.status(400).json({ error: "Missing file" });
          return;
        }

        const ext = file.originalname.split(".").pop() ?? "jpg";
        const key = `receipts/${user.id}/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, file.buffer, file.mimetype);

        res.json({ success: true, url, key, filename: file.originalname, mimeType: file.mimetype });
      } catch (err) {
        console.error("[ReceiptUpload] Error:", err);
        res.status(500).json({ error: "Upload failed" });
      }
    }
  );

  return r;
}
