import QRCode from "qrcode";

export interface QRRenderOptions {
  scale?: number;
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

const DEFAULT_OPTS: Required<QRRenderOptions> = {
  scale: 10,
  margin: 4,
  errorCorrectionLevel: "M",
};

/** Generates a scannable PNG data URL for the exact string provided (no transformation of the input). */
export async function generateQRDataURL(value: string, opts: QRRenderOptions = {}): Promise<string> {
  const merged = { ...DEFAULT_OPTS, ...opts };
  return QRCode.toDataURL(value, {
    type: "image/png",
    errorCorrectionLevel: merged.errorCorrectionLevel,
    margin: merged.margin,
    scale: merged.scale,
  });
}

export function downloadDataURL(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function sanitizeFilename(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 80) || "qr-code";
}

export function printQRCode(dataUrl: string, title: string, subtitle: string) {
  const printWindow = window.open("", "_blank", "width=480,height=640");
  if (!printWindow) return;

  printWindow.document.write(`<!doctype html>
<html>
<head>
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-align: center; padding: 40px; }
  img { width: 320px; height: 320px; image-rendering: pixelated; }
  h1 { font-size: 22px; margin-top: 24px; }
  p { font-size: 13px; color: #555; word-break: break-all; padding: 0 20px; }
</style>
</head>
<body>
  <img src="${dataUrl}" alt="QR Code" />
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(subtitle)}</p>
  <script>
    window.onload = () => { window.focus(); window.print(); };
  </script>
</body>
</html>`);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
