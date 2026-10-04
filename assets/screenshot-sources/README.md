# Tool screenshots

The user supplied exactly these four BMP files. ImageMagick 7.1.2-30 converted them to full-size PNG and AVIF without resizing or cropping. Original BMPs remain untouched in the user's specified folder. Served assets are in `public/tools/screenshots/`; ordinary `picture`/`source`/`img` elements retain the requested formats without Astro image transformation.

| Tool | Full size | PNG bytes | AVIF bytes | Visible region in source pixels: x, y, width, height |
| --- | --- | ---: | ---: | --- |
| kuto-measure | 1390 × 873 | 730561 | 96649 | 170, 260, 670, 335 |
| image-rect-picker | 1105 × 895 | 346960 | 55835 | 25, 350, 760, 380 |
| kuto-ladder | 996 × 911 | 53772 | 12620 | 250, 230, 560, 315 |
| kuto-nanidasu | 1107 × 897 | 718888 | 100995 | 150, 0, 800, 450 |

PNG conversion uses `-strip -define png:compression-level=9`. AVIF uses `-strip -define heic:chroma=444 -define heic:speed=6 -quality 70`. Both formats keep the full source dimensions. CSS crops only the displayed viewport; `src/data/tools.ts` records those reversible coordinates. The image element remains proportional, without stretching or enlargement beyond source pixels at the current normal viewport sizes.

The measure crop emphasizes the reference circle, pins and distance line; the rectangle picker emphasizes the selected blue border and adjustment handles; the ladder shows the first five ranks; Nanidasu retains the enemy formation, question and selected answer. Browser verification checks all four AVIF selections, an unsupported-source PNG fallback, dimensions, alt text, lazy loading, exact copied build bytes and desktop/mobile layouts. Individual crop screenshots and `tool-image-results.json` are in `.cache/qa/`.
