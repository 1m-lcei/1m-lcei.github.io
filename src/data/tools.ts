export type ToolTag = "ツール" | "診断" | "画像" | "戦術対抗戦";

export interface Tool {
  id: string;
  name: string;
  description: string;
  tags: ToolTag[];
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

export const tools: Tool[] = [
  {
    id: "kuto-measure",
    name: "Kuto Measure (仮)",
    description:
      "戦術対抗戦の対戦中画像を下敷きに、距離を図ります（対応シーズン：S11）。",
    tags: ["ツール", "戦術対抗戦"],
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
    name: "戦術対抗戦経路ツール",
    description: "戦術対抗戦順位の効率的経路を、開始順位を入力して表示します。",
    tags: ["ツール", "戦術対抗戦"],
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
    name: "何出す超会議",
    description: "戦術対抗戦S9の「何出す」に答えて、タイプ診断できます。",
    tags: ["診断", "戦術対抗戦"],
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
];
