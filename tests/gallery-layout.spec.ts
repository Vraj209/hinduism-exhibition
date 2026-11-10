import { expect, test } from "@playwright/test";
import { sectionSlugs } from "./exhibition-fixtures";

for (const [width, height] of [[1440, 900], [1024, 768], [768, 680], [390, 844], [320, 740], [844, 390]]) {
  test(`both narrative galleries remain readable at ${width} by ${height}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript(() => {
      const native = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        if (/webgl/.test(type)) return null;
        return native.apply(this, [type, ...args] as Parameters<typeof native>);
      } as typeof native;
    });
    for (const [sectionIndex, slug] of sectionSlugs.entries()) {
      if ([0, 2, 3, 4].includes(sectionIndex)) continue; // Cultural exploration, beliefs, values and festivals have separate composition checks.
      await page.goto(`/#section-${slug}`);
      const gallery = page.locator(".dome-gallery");
      await expect(gallery).toHaveAttribute("data-arrived", "true");
      await expect(page.locator(".gallery-container")).toHaveCSS("opacity", "1");
      await expect(gallery.locator(".gallery-scroll")).toHaveCSS("opacity", "1");
      const count = 5;
      for (let index = 0; index < count; index++) {
        await page.locator(".gallery-scroll").evaluate((element, target) => {
          const flow = element.closest(".dome-gallery")?.getAttribute("data-mode") === "vertical";
          const article = element.querySelector<HTMLElement>(`[data-moment="${target}"]`)!;
          element.scrollTo({ top: flow ? article.offsetTop : target * element.clientHeight * 1.15, behavior: "instant" });
        }, index);
        const article = page.locator(`.gallery-moment[data-moment="${index}"]`);
        await expect(article).toHaveAttribute("data-active", "true");
        if (index > 0 && index < count - 1) {
          await expect.poll(() => article.locator("img").evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
        }
        const bounds = await article.evaluate((element) => {
          const root = element.closest(".dome-gallery")!;
          const frame = (node: Element) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
          return {
            mode: root.getAttribute("data-mode"),
            header: frame(root.querySelector(".gallery-header")!),
            footer: frame(root.querySelector(".gallery-footer")!),
            copy: frame(element.querySelector(".gallery-copy")!),
            image: element.querySelector("img") ? frame(element.querySelector("img")!) : null,
            caption: element.querySelector("figcaption") ? frame(element.querySelector("figcaption")!) : null,
          };
        });
        const label = `${slug}, display ${index}, ${width}x${height}`;
        for (const box of [bounds.copy, bounds.image, bounds.caption].filter(Boolean)) {
          expect(box!.x, label).toBeGreaterThanOrEqual(-1);
          expect(box!.right, label).toBeLessThanOrEqual(width + 1);
        }
        if (bounds.mode === "depth") {
          for (const box of [bounds.copy, bounds.image, bounds.caption].filter(Boolean)) {
            expect(box!.y, label).toBeGreaterThanOrEqual(bounds.header.bottom - 1);
            expect(box!.bottom, label).toBeLessThanOrEqual(bounds.footer.y + 1);
          }
          if (bounds.image) {
            const a = bounds.copy, b = bounds.image;
            expect(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y, label).toBe(true);
          }
        }
        const capture = width === 1440 && ((sectionIndex === 1 && index === 0) || (sectionIndex === 5 && index === 3))
          || [1440, 390].includes(width) && index === 1;
        if (capture && process.env.UPDATE_GALLERY_CAPTURES === "1") {
          await page.screenshot({ path: `docs/design/dark-gallery/${width}-${slug}-${index}.png` });
        }
      }
    }
  });
}
