import { fetchMetaInsights } from "../../../../lib/meta-read-only";
export async function POST(request: Request) {
  try {
    const { access_token = "", ad_account_id = "", date_from, date_to } = await request.json();
    if (!access_token || !ad_account_id || !date_from || !date_to) return Response.json({ error: "Token, conta de anúncio e período são obrigatórios." }, { status: 400 });
    const response = await fetchMetaInsights(access_token, ad_account_id, date_from, date_to);
    const metrics = response.data || [];
    return Response.json({ provider: "meta_ads_read_only", mode: "READ_ONLY", metrics, imported_ads: new Set(metrics.map((x: { ad_id: string }) => x.ad_id)).size, imported_campaigns: new Set(metrics.map((x: { campaign_id: string }) => x.campaign_id)).size });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha ao sincronizar métricas." }, { status: 400 }); }
}
