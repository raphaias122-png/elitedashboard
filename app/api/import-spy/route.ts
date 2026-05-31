import { fetchSpyDocument, parseSpyDocument } from "../../../lib/google-imports";
const documentId = "1rWTk54TMAvXxBmtcX19LYx_Vcoe-FP2voB_Y9Riisns";
const source = `https://docs.google.com/document/d/${documentId}/edit?tab=t.0`;
export async function GET() {
  try { return Response.json({ source, items: parseSpyDocument(await fetchSpyDocument(documentId), source) }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha na importação." }, { status: 500 }); }
}
