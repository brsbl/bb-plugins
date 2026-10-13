import { AdsError, customerId, type Credentials, type GoogleClient, type Row } from "./google.js";

const campaign = ["campaign.id", "campaign.name", "campaign.status"];
const group = [...campaign, "ad_group.id", "ad_group.name", "ad_group.status"];
const dimensions = {
  campaign: { from: "campaign", fields: campaign, key: (r: Row) => String(r.campaign.id) },
  "ad-group": { from: "ad_group", fields: group, key: (r: Row) => String(r.adGroup.id) },
  ad: { from: "ad_group_ad", fields: [...group, "ad_group_ad.ad.id", "ad_group_ad.status"], key: (r: Row) => `${r.adGroup.id}/${r.adGroupAd.ad.id}` },
  keyword: { from: "keyword_view", fields: [...group, "ad_group_criterion.criterion_id", "ad_group_criterion.keyword.text", "ad_group_criterion.keyword.match_type"], key: (r: Row) => `${r.adGroup.id}/${r.adGroupCriterion.criterionId}` },
  "search-term": { from: "search_term_view", fields: [...group, "search_term_view.search_term", "search_term_view.status"], key: (r: Row) => JSON.stringify([r.adGroup.id, r.searchTermView.searchTerm]) },
} as const;
export type Level = keyof typeof dimensions;
export const inventories = {
  campaigns: `SELECT ${campaign.join(", ")}, campaign.advertising_channel_type, campaign.ad_serving_optimization_status FROM campaign`,
  "ad-groups": `SELECT ${group.join(", ")}, ad_group.ad_rotation_mode FROM ad_group`,
  ads: `SELECT ${group.join(", ")}, ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.ad.type, ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions FROM ad_group_ad`,
  "conversion-actions": "SELECT conversion_action.resource_name, conversion_action.name, conversion_action.category, conversion_action.status, conversion_action.primary_for_goal, conversion_action.click_through_lookback_window_days FROM conversion_action",
  accounts: "SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.level, customer_client.status FROM customer_client",
};
export function conversionActions(value?: string): string[] {
  const list = [...new Set((value ?? "").split(",").map(s => s.trim()).filter(Boolean))];
  if (list.length > 30 || list.some(s => !/^customers\/\d{10}\/conversionActions\/\d+$/.test(s))) throw new AdsError("configuration", "Download conversion actions must be comma-separated customers/…/conversionActions/… resource names (up to 30).");
  return list;
}
export function range(input: { from?: string; to?: string; last7Days?: boolean }, timeZone: string, now = new Date()) {
  if (input.last7Days && (input.from || input.to)) throw new AdsError("dates", "Use --last-7-days or --from and --to.");
  if (input.last7Days) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const part = (type: string) => parts.find(p => p.type === type)!.value;
    const today = new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00Z`);
    const date = (days: number) => new Date(today.getTime() - days * 86_400_000).toISOString().slice(0, 10);
    return { from: date(7), to: date(1) };
  }
  const valid = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
  if (!valid(input.from) || !valid(input.to) || input.from > input.to) throw new AdsError("dates", "Use --last-7-days or a valid inclusive --from YYYY-MM-DD --to YYYY-MM-DD range.");
  return { from: input.from, to: input.to };
}
export function numeric(value: unknown): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || Math.abs(n) > Number.MAX_SAFE_INTEGER) throw new AdsError("response", "A metric exceeds safe numeric precision.");
  return n;
}
export async function report(client: GoogleClient, c: Credentials, input: { level: Level; from?: string; to?: string; last7Days?: boolean; campaignId?: string; actions?: string; limit: number }, signal?: AbortSignal) {
  const id = customerId(c.customerId);
  const meta = await client.search(id, "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.manager FROM customer", signal);
  const account = meta[0]?.customer;
  if (!account?.timeZone || !account?.currencyCode) throw new AdsError("response", "Google did not return the account currency and time zone.");
  if (account.manager) throw new AdsError("configuration", "Select an advertising customer, not a manager, for reports.");
  const dates = range(input, account.timeZone);
  const d = dimensions[input.level];
  if (input.campaignId && !/^\d+$/.test(input.campaignId)) throw new AdsError("input", "Campaign ID must contain digits only.");
  const where = `segments.date BETWEEN '${dates.from}' AND '${dates.to}'${input.campaignId ? ` AND campaign.id = ${input.campaignId}` : ""}`;
  const actions = conversionActions(input.actions ?? c.downloadConversionActions);
  const traffic = await client.search(id, `SELECT ${d.fields.join(", ")}, metrics.impressions, metrics.clicks, metrics.cost_micros FROM ${d.from} WHERE ${where}`, signal);
  const conversions = actions.length ? await client.search(id, `SELECT ${d.fields.join(", ")}, segments.conversion_action, metrics.all_conversions FROM ${d.from} WHERE ${where} AND segments.conversion_action IN (${actions.map(a => `'${a}'`).join(", ")})`, signal) : [];
  const byKey = new Map<string, number>();
  for (const row of conversions) byKey.set(d.key(row), (byKey.get(d.key(row)) ?? 0) + numeric(row.metrics?.allConversions));
  const allRows = new Map(traffic.map(r => [d.key(r), r]));
  // Late attribution can create a conversion-only row; keep it instead of losing it in an inner join.
  for (const row of conversions) if (!allRows.has(d.key(row))) allRows.set(d.key(row), { ...row, metrics: {} });
  const rows = [...allRows.values()].map(row => {
    const { metrics, segments: _segments, ...entity } = row;
    const impressions = numeric(metrics?.impressions), clicks = numeric(metrics?.clicks), costMicros = numeric(metrics?.costMicros);
    const count = actions.length ? byKey.get(d.key(row)) ?? 0 : null;
    return { ...entity, metrics: { impressions, clicks, ctr: impressions ? clicks / impressions : null, averageCpc: clicks ? costMicros / 1_000_000 / clicks : null,
      costMicros: String(metrics?.costMicros ?? "0"), cost: costMicros / 1_000_000, conversions: count,
      downloadsPerClick: count !== null && clicks ? count / clicks : null, downloadsPerCurrencyUnit: count !== null && costMicros ? count / (costMicros / 1_000_000) : null } };
  }).sort((a, b) => b.metrics.cost - a.metrics.cost);
  return { account, dateRange: dates, level: input.level, conversionActions: actions, conversionMetric: "metrics.all_conversions", attribution: "Interaction date; configured Google Ads attribution windows. Recent conversions may lag.",
    warnings: [...(actions.length ? [] : ["Download actions are not configured: conversions are unknown (null). Read conversion-actions and select the download-button actions."]), ...(input.level === "search-term" ? ["Google omits some low-volume search terms; this is not a complete query log."] : [])],
    totalRows: rows.length, truncated: rows.length > input.limit, rows: rows.slice(0, input.limit) };
}
