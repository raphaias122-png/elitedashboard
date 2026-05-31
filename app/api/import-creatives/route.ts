import { listDriveFolder } from "../../../lib/google-imports";
const folders = { pronto: "1ik_S2JepbqR-MdNVbtytF0SPV8POtbGh", "para modelar": "1oJ5Dgs63qLlCUjYvxq-sg0-_YUOA6i9c" };
export async function GET(request: Request) {
  const configured = Boolean(process.env.GOOGLE_DRIVE_API_KEY);
  if (new URL(request.url).searchParams.has("status")) return Response.json({ configured, items: [] });
  if (!configured) return Response.json({ configured, items: [] });
  try {
    const groups = await Promise.all(Object.entries(folders).map(async ([status, id]) => (await listDriveFolder(id)).map((file: Record<string, string>) => ({
      drive_file_id: file.id, file_name: file.name, file_type: file.mimeType, drive_url: file.webViewLink,
      preview_url: file.webContentLink, thumbnail_url: file.thumbnailLink, status: status.replaceAll(" ", "_"), niche: "iGaming", country: "Chile",
    }))));
    return Response.json({ configured, items: groups.flat() });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha na importação." }, { status: 500 }); }
}
