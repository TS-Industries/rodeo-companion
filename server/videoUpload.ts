import { Router, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { createVideo } from "./db";
import { sdk } from "./_core/sdk";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

export function createVideoUploadRouter(): Router {
  const r = Router();

  r.post(
    "/api/upload/video",
    async (req: Request, res: Response, next) => {
      try {
        const user = await sdk.authenticateRequest(req as any);
        (req as any).user = user;
        next();
      } catch {
        res.status(401).json({ error: "Unauthorized" });
      }
    },
    upload.single("video"),
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const file = (req as any).file as Express.Multer.File | undefined;
        const performanceId = parseInt((req.body as any).performanceId ?? "0", 10);

        if (!file || !performanceId) {
          res.status(400).json({ error: "Missing file or performanceId" });
          return;
        }

        const ext = file.originalname.split(".").pop() ?? "mp4";
        const key = `videos/${user.id}/${performanceId}/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, file.buffer, file.mimetype);

        await createVideo({
          userId: user.id,
          performanceId,
          s3Key: key,
          url,
          filename: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          thumbnailUrl: null,
          durationSeconds: null,
        });

        res.json({ success: true, url, key });
      } catch (err) {
        console.error("[VideoUpload] Error:", err);
        res.status(500).json({ error: "Upload failed" });
      }
    }
  );

  return r;
}
