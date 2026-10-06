export type WorkTag =
  | "ツール"
  | "診断"
  | "画像"
  | "戦術対抗戦"
  | "記事"
  | "ブルーアーカイブ"
  | "ダメージ計算";

export interface PublicationSource {
  url: string;
  precision: "second" | "millisecond";
  basis:
    | "pages-success"
    | "pages-deploy-completed"
    | "zenn-published"
    | "gist-created-user-approved";
}

export interface Work {
  id: string;
  name: string;
  description: string;
  note?: string;
  publishedAt: string | null;
  publicationSource: PublicationSource | null;
  tags: WorkTag[];
  href: string;
  icon: string;
  preview: {
    png: string;
    avif: string;
    width: number;
    height: number;
    alt: string;
    crop: { x: number; y: number; width: number; height: number };
  };
  tone: "blue" | "green" | "rose" | "amber";
}

export const works: Work[] = [
  {
    id: "kuto-measure",
    publishedAt: "2026-09-26T11:06:47Z",
    publicationSource: {
      url: "https://api.github.com/repos/1m-lcei/kuto-measure/deployments/6678046805/statuses",
      precision: "second",
      basis: "pages-success",
    },
    name: "Kuto Measure (仮)",
    description: "戦術対抗戦の対戦中画像を下敷きに、距離を図ります。",
    note: "（確認シーズン：S11）",
    tags: ["ツール", "ブルーアーカイブ", "戦術対抗戦"],
    href: "https://1m-lcei.github.io/kuto-measure/",
    icon: "tools/kuto-measure.svg",
    preview: {
      png: "tools/screenshots/kuto-measure.png",
      avif: "tools/screenshots/kuto-measure.avif",
      width: 1390,
      height: 873,
      alt: "戦闘画像に重ねたピンクの基準円、ピンと水色の距離線の拡大画面",
      crop: { x: 170, y: 260, width: 670, height: 335 },
    },
    tone: "blue",
  },
  {
    id: "image-rect-picker",
    publishedAt: "2026-09-23T15:05:57Z",
    publicationSource: {
      url: "https://api.github.com/repos/1m-lcei/image-rect-picker/deployments/6617276739/statuses",
      precision: "second",
      basis: "pages-success",
    },
    name: "画像領域ピッカー",
    description:
      "画像を下敷きに矩形領域を指定し、設定された書式でピクセル座標をコピーします。",
    tags: ["ツール", "画像"],
    href: "https://1m-lcei.github.io/image-rect-picker/",
    icon: "tools/image-rect-picker.svg",
    preview: {
      png: "tools/screenshots/image-rect-picker.png",
      avif: "tools/screenshots/image-rect-picker.avif",
      width: 1105,
      height: 895,
      alt: "顔アイコンの並びを青い矩形で選択し、上下の調整ハンドルを表示した拡大画面",
      crop: { x: 25, y: 350, width: 760, height: 380 },
    },
    tone: "green",
  },
  {
    id: "kuto-ladder",
    publishedAt: "2025-10-02T11:26:07Z",
    publicationSource: {
      url: "https://github.com/1m-lcei/kuto-ladder/actions/runs/18191601970/job/51787718394",
      precision: "second",
      basis: "pages-deploy-completed",
    },
    name: "戦術対抗戦経路ツール",
    description: "戦術対抗戦順位の効率的経路を、開始順位を入力して表示します。",
    tags: ["ツール", "ブルーアーカイブ", "戦術対抗戦"],
    href: "https://1m-lcei.github.io/kuto-ladder/",
    icon: "tools/kuto-ladder.svg",
    preview: {
      png: "tools/screenshots/kuto-ladder.png",
      avif: "tools/screenshots/kuto-ladder.avif",
      width: 996,
      height: 911,
      alt: "123位から86位、60位、42位、29位へ進む経路を水色の線と丸で示した画面",
      crop: { x: 250, y: 230, width: 560, height: 315 },
    },
    tone: "amber",
  },
  {
    id: "kuto-nanidasu",
    publishedAt: "2025-10-10T10:39:51Z",
    publicationSource: {
      url: "https://github.com/1m-lcei/kuto-nanidasu/actions/runs/18404077506/job/52439846694",
      precision: "second",
      basis: "pages-deploy-completed",
    },
    name: "何出す超会議",
    description: "戦術対抗戦の「何出す」に答えて、タイプ診断できます。",
    note: "（対象シーズン：S9）",
    tags: ["診断", "ブルーアーカイブ", "戦術対抗戦"],
    href: "https://1m-lcei.github.io/kuto-nanidasu/",
    icon: "tools/kuto-nanidasu.svg",
    preview: {
      png: "tools/screenshots/kuto-nanidasu.png",
      avif: "tools/screenshots/kuto-nanidasu.avif",
      width: 1107,
      height: 897,
      alt: "1問目の敵編成と「何出す？」の問い、ラジオボタンで選択した回答編成の画面",
      crop: { x: 150, y: 0, width: 800, height: 450 },
    },
    tone: "rose",
  },
  {
    id: "blue-archive-damage",
    publishedAt: "2025-05-11T19:14:04.139+09:00",
    publicationSource: {
      url: "https://zenn.dev/1m_lcei/books/b380b976c908d9",
      precision: "millisecond",
      basis: "zenn-published",
    },
    name: "ブルーアーカイブ ダメージ計算の仕組み",
    description:
      "ダメージ計算の仕組みを、実際の検証を紹介しつつ整理した本形式の解説です。",
    note: "（申し訳ありませんが、更新は行っていません）",
    tags: ["記事", "ブルーアーカイブ", "ダメージ計算"],
    href: "https://zenn.dev/1m_lcei/books/b380b976c908d9",
    icon: "article-icons.svg#zenn",
    preview: {
      png: "articles/screenshots/blue-archive-damage.png",
      avif: "articles/screenshots/blue-archive-damage.avif",
      width: 500,
      height: 700,
      alt: "淡い多色背景に書名を記した『ブルーアーカイブ ダメージ計算の仕組み』の表紙のタイトル部分",
      crop: { x: 0, y: 360, width: 500, height: 340 },
    },
    tone: "blue",
  },
  {
    id: "kuto-glossary",
    // The user approved adopting this official creation time as publication time.
    publishedAt: "2024-11-09T09:33:49Z",
    publicationSource: {
      url: "https://api.github.com/gists/651ba5bca28fe41011424302b476c770",
      precision: "second",
      basis: "gist-created-user-approved",
    },
    name: "戦術対抗戦トーク 用語・概念集",
    description:
      "戦術対抗戦で使われる用語や考え方を、いきいきとした例文とともにまとめています。",
    note: "（申し訳ありませんが、更新は行っていません）",
    tags: ["記事", "ブルーアーカイブ", "戦術対抗戦"],
    href: "https://gist.github.com/1m-lcei/651ba5bca28fe41011424302b476c770",
    icon: "article-icons.svg#gist",
    preview: {
      png: "articles/screenshots/kuto-glossary.png",
      avif: "articles/screenshots/kuto-glossary.avif",
      width: 800,
      height: 418,
      alt: "戦術対抗戦の用語を背景に、疑問符を浮かべたキャラクターを描いた用語集のキャッチ画像",
      crop: { x: 0, y: 0, width: 800, height: 418 },
    },
    tone: "green",
  },
];

/** Unknown dates stay last; equal instants retain the supplied order. */
export function sortWorksByPublishedAt<
  T extends { publishedAt: string | null },
>(items: readonly T[]): T[] {
  return items
    .map((work, index) => {
      const timestamp =
        work.publishedAt === null ? null : Date.parse(work.publishedAt);
      if (timestamp !== null && !Number.isFinite(timestamp)) {
        throw new TypeError("Invalid work publication timestamp");
      }
      return { work, index, timestamp };
    })
    .sort((left, right) => {
      if (left.timestamp === null) {
        return right.timestamp === null ? left.index - right.index : 1;
      }
      if (right.timestamp === null) return -1;
      return right.timestamp - left.timestamp || left.index - right.index;
    })
    .map(({ work }) => work);
}
