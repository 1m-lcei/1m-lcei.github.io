export const siteName = "Kei's Pinboard";
export const brandName = "@1m_lcei";
export const siteDescription = "keiのツールや文章置き場。";

export function localHref(path = ""): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  return `${base}${path.replace(/^\/+/, "")}`;
}

export function articleHref(id: string): string {
  return localHref(
    `articles/${id.split("/").map(encodeURIComponent).join("/")}/`,
  );
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}
