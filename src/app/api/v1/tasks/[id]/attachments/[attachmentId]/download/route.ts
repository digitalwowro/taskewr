import { toErrorResponse } from "@/server/api/errors";
import { TaskService } from "@/server/services/task-service";

export const runtime = "nodejs";

const service = new TaskService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  try {
    const { id, attachmentId } = await params;
    const { attachment, bytes } = await service.getTaskAttachmentDownload(
      Number(id),
      Number(attachmentId),
    );
    const encodedFileName = encodeURIComponent(attachment.originalFileName);

    return new Response(bytes, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${escapeQuotedFileName(attachment.originalFileName)}"; filename*=UTF-8''${encodedFileName}`,
        "Content-Length": String(bytes.byteLength),
        "Content-Type": attachment.mimeType || "application/octet-stream",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function escapeQuotedFileName(fileName: string) {
  return fileName.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
}
