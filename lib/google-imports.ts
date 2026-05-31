const sectionMap: Record<string, string> = {
  "Cassinos / marcas": "Marcas/Cassinos", "Jogos / produtos": "Jogos/Produtos", "Funil Telegram": "Funis Telegram",
  "Funil WhatsApp": "Funis WhatsApp", "PWA / redirects": "PWA / Redirects / Domínios", "Landing pages": "Landing Pages",
  "TikTok - contas": "TikTok / Contas Relevantes", "Padroes de criativo": "Hooks e Padrões Criativos",
  "Termos de busca": "Termos de Busca", "Prioridade para analise": "Prioridades de Análise",
};
const urlPattern = /https?:\/\/[^\s|]+|(?:[A-Z0-9-]+\.)+[A-Z]{2,}(?:\/[^\s,]*)?/i;

export function parseSpyDocument(content: string, source_document_url: string) {
  let category = "Outros";
  return content.split(/\r?\n/).flatMap((line, index) => {
    const heading = Object.entries(sectionMap).find(([prefix]) => line.toLowerCase().startsWith(prefix.toLowerCase()));
    if (heading) { category = heading[1]; return []; }
    const clean = line.replace(/^[?✅\s-]+/, "").trim();
    if (!clean || !clean.includes(" - ")) return [];
    const [name, ...rest] = clean.split(" - ");
    const description = rest.join(" - ");
    const url = description.match(urlPattern)?.[0] || "";
    return [{ id: `spy-import-${index}`, category, name, platform: category.includes("TikTok") ? "TikTok" : "Meta Ads",
      country: "Chile", main_url: url && !url.startsWith("http") ? `https://${url}` : url, description,
      notes: "Importado automaticamente do Google Docs", status: "novo", priority: "média", tags: [], source_document_url }];
  });
}
export async function fetchSpyDocument(documentId: string) {
  const response = await fetch(`https://docs.google.com/document/d/${documentId}/export?format=txt`, { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível ler o documento público.");
  return response.text();
}
export async function listDriveFolder(folderId: string) {
  const key = process.env.GOOGLE_DRIVE_API_KEY;
  if (!key) throw new Error("Configure GOOGLE_DRIVE_API_KEY.");
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,createdTime)&key=${key}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível listar a pasta do Drive.");
  return (await response.json()).files;
}
