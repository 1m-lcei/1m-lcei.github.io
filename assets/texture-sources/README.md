# Material textures

These two original PNGs were generated with the built-in image generation tool on 2026-10-04. No CLI, API key, external stock asset, or additional project dependency was used. The exact prompts, including the rejected first cork prompt, are in `prompts.json`.

- `cork-original.png`: selected second cork candidate, 1254 × 1254.
- `paper-original.png`: selected ivory paper candidate, 1254 × 1254.
- Served copies: `src/assets/textures/cork.webp` (1024 × 1024, WebP quality 60, 220376 bytes) and `paper.webp` (512 × 512, quality 90, 14400 bytes). Compression used the project's existing Astro dependency `sharp` 0.35.5. Originals are outside `public/` and are not copied to the deployed site.

Both candidates were inspected as 3 × 3 repeats at a 512px tile size. The first cork had stronger edge discontinuities and was replaced. The selected source is visually suitable at the site's low-contrast display treatment, but is not claimed to have mathematically identical opposite edges. Adjacent RGB differences on its raw 512px preview were 16.76/17.06 inside versus 21.85/24.26 across the horizontal/vertical joins. Paper was 1.94/2.46 versus 3.07/3.30. These numbers are diagnostics, not perceptual pass thresholds.

The final compressed tiles and page screenshots are checked for visible lines, large repeated motifs, grain size and readable text. Cork repeats at 512 CSS pixels. Paper is a separate noninteractive decorative layer at 384 CSS pixels; text, links, icons and notebook rules remain HTML/CSS. The site stays light regardless of the system color scheme; forced-color displays have a separate accessibility treatment. Tape uses a translucent matte color, paper grain and irregular ends without highlight gradients.

Paper and pins were revised using the parent agent's pixel inspection of the supplied reference, `BlueArchive 2026-10-04 143135_1.png` (Library ID `libfile_1b6bb456e0588191878b09911eb310dd`, file ID `file_00000000e69c81fdb521c6e983251a02`). The Windows environment could resolve that image in Library, but could not run the required Python transfer helper, so the implementing agent did not directly inspect the reference pixels. The parent's observed features guided the implementation: off-white photo-mount paper, very small edge irregularities and nicks, subtle grain, shallow shadows and slight rotation; circular flat pins with muted colors, a fine rim and short downward shadow. These details use CSS only. Characters, game interface, newspaper lettering and the reference's green background are not included.

Local visual evidence is saved in `.cache/qa/`. Run `bun run verify` for type checks, lint, static build, local material asset checks and keyboard/mobile/accessibility checks. No texture processing runs in the browser.
