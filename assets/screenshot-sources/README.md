# Work screenshots

The user supplied these BMP files. ImageMagick 7.1.2-30 converted them to full-size PNG and AVIF without resizing or cropping. Original BMPs remain untouched in the user's specified folder. Served assets are in `public/tools/screenshots/`; ordinary `picture`/`source`/`img` elements retain the requested formats without Astro image transformation.

| Tool | Full size | PNG bytes | AVIF bytes | Visible region in source pixels: x, y, width, height |
| --- | --- | ---: | ---: | --- |
| BoringAvatarsSharp | 636 × 700 | 79038 | 20250 | 0, 50, 636, 318 |
| kuto-measure | 1390 × 873 | 730561 | 96649 | 170, 260, 670, 335 |
| image-rect-picker | 1105 × 895 | 346960 | 55835 | 25, 350, 760, 380 |
| kuto-ladder | 996 × 911 | 53772 | 12620 | 250, 230, 560, 315 |
| kuto-nanidasu | 1107 × 897 | 718888 | 100995 | 150, 0, 800, 450 |

PNG conversion uses `-strip -define png:compression-level=9`. AVIF uses `-strip -define heic:chroma=444 -define heic:speed=6 -quality 70`. Both formats keep the full source dimensions. CSS crops only the displayed viewport; `src/data/works.ts` records those reversible coordinates. The image element remains proportional, without stretching or enlargement beyond source pixels at the current normal viewport sizes.

The measure crop emphasizes the reference circle, pins and distance line; the rectangle picker emphasizes the selected blue border and adjustment handles; the ladder shows the first five ranks; Nanidasu retains the enemy formation, question and selected answer. Browser verification checks all four AVIF selections, an unsupported-source PNG fallback, dimensions, alt text, lazy loading, exact copied build bytes and desktop/mobile layouts. Individual crop screenshots and `tool-image-results.json` are in `.cache/qa/`.

## External article artwork

The user authorized reuse of the actual cover and catch artwork from the original articles. These replace the earlier formula and lane-diagram screenshots. No illustration or article content was invented, and none of the four tool assets changed.

| Article | Destination | Original artwork | Full source size | Display |
| --- | --- | --- | --- | --- |
| ブルーアーカイブ ダメージ計算の仕組み | https://zenn.dev/1m_lcei/books/b380b976c908d9 | [Book cover](https://static.zenn.studio/user-upload/book_cover/3d58820d46.jpeg), linked by the original page's cover metadata | 500 × 700 | Title panel and lower cover: display crop x=0, y=360, width=500, height=340, proportionally fitted in the common 2:1 frame. All title text remains visible |
| 戦術対抗戦トーク 用語・概念集 | https://gist.github.com/1m-lcei/651ba5bca28fe41011424302b476c770 | [Embedded 用語集カード](https://gist.github.com/user-attachments/assets/9b64575b-0ca5-402d-9024-d932497cd7f2) | 800 × 418 | Entire catch image, at its original aspect ratio |

The original Zenn JPEG is converted to a full-size PNG; the Gist PNG is copied byte-for-byte. AVIF conversions retain each original size. Served paths remain `public/articles/screenshots/*.png` and `*.avif`. The common `WorkCard` uses AVIF first and PNG fallback. Service icon sources and published use guidance are recorded in [brand-sources](../brand-sources/README.md).

All image frames use the same 2:1 aspect ratio. Each existing source crop is proportionally fitted and centered inside that frame, so the four tool compositions and the full Gist catch are retained. The original PNG/AVIF bytes remain unchanged.

The full-cover contain option was reviewed first at 1440px, 390px and 320px. Its title was too small at 320px. With the user's approval to crop vertically, the final CSS crop retains the complete book title panel and bottom artwork while omitting the upper circle. The original 500 × 700 PNG/AVIF files remain intact.

BoringAvatarsSharp was added on 2026-10-10 from the user-specified `boring-avatars-sharp.bmp` screenshot. Its full 636 × 700 image is retained; the reversible viewport shows the complete Marble, Beam and Pixel rows in the same 2:1 frame. The card icon is an independent copy of the gallery's default Beam sample (Ada Lovelace), not an official project logo. Original paths are unchanged; the generator's own and upstream MIT notices are included in the SVG comment.
