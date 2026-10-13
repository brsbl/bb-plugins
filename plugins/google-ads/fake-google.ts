// Entirely synthetic fixtures; never record a live Google Ads response here.
export const fakeCredentials = { developerToken: "fake-developer-token", clientId: "fake-client", clientSecret: "fake-secret", refreshToken: "fake-refresh", customerId: "0000000001", loginCustomerId: "0000000002", downloadConversionActions: "customers/0000000001/conversionActions/3" };
export function fakeResponse(path: string, body: Record<string, any>) {
  if (path === "/token") return { access_token: "fake-access", refresh_token: "fake-refresh", expires_in: 3600 };
  if (path.endsWith(":listAccessibleCustomers")) return { resourceNames: ["customers/0000000001"] };
  if (!/^\/v25\/customers\/\d{10}\/googleAds:search$/.test(path)) throw new Error("Mock refuses non-read endpoints");
  const q = String(body.query);
  if (q.includes(" FROM customer_client")) return { results: [{ customerClient: { id: "0000000001", descriptiveName: "Example account", manager: false, level: 1 } }] };
  if (q.includes(" FROM customer ") || q.endsWith(" FROM customer")) return { results: [{ customer: { id: "0000000001", descriptiveName: "Example account", currencyCode: "USD", timeZone: "America/Los_Angeles", manager: false } }] };
  if (q.includes(" FROM conversion_action")) return { results: [{ conversionAction: { resourceName: fakeCredentials.downloadConversionActions, name: "Example download click", category: "DOWNLOAD", primaryForGoal: false, clickThroughLookbackWindowDays: 30 } }] };
  const entity: Record<string, unknown> = { campaign: { id: "10", name: "Example campaign", status: "ENABLED" } };
  if (!q.includes(" FROM campaign ") && !q.endsWith(" FROM campaign")) entity.adGroup = { id: "20", name: "Example intent", status: "ENABLED" };
  if (q.includes(" FROM ad_group_ad")) entity.adGroupAd = { status: "ENABLED", ad: { id: "30", type: "RESPONSIVE_SEARCH_AD", finalUrls: ["https://example.com/"], responsiveSearchAd: { headlines: [{ text: "Example promise", pinnedField: "HEADLINE_1" }], descriptions: [{ text: "An illustrative explanation.", pinnedField: "DESCRIPTION_1" }] } } };
  if (q.includes(" FROM keyword_view")) entity.adGroupCriterion = { criterionId: "40", keyword: { text: "example tool", matchType: "PHRASE" } };
  if (q.includes(" FROM search_term_view")) entity.searchTermView = { searchTerm: "example search", status: "NONE" };
  if (q.includes("metrics.all_conversions")) return { results: [{ ...entity, segments: { conversionAction: fakeCredentials.downloadConversionActions }, metrics: { allConversions: 4 } }] };
  return { results: [{ ...entity, ...(q.includes("metrics.impressions") ? { metrics: { impressions: "1000", clicks: "40", costMicros: "20000000" } } : {}) }] };
}
export const fakeFetch: typeof fetch = async (url, init) => {
  const path = new URL(String(url)).pathname;
  const body = path === "/token" ? {} : JSON.parse(String(init?.body ?? "{}"));
  return Response.json(fakeResponse(path, body));
};
