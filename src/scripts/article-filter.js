(() => {
  for (const root of document.querySelectorAll("[data-article-filter]")) {
    const controls = root.querySelector("[data-article-filters]");
    const status = root.querySelector("[data-filter-status]");
    const empty = root.querySelector("[data-filter-empty]");
    if (!controls || !status || !empty) continue;
    const buttons = [...root.querySelectorAll("[data-article-tag]")];
    const articles = [...root.querySelectorAll("[data-article-tags]")].map(
      (node) => ({
        node,
        tags: JSON.parse(node.dataset.articleTags),
      }),
    );
    const limit = Number(root.dataset.limit) || Infinity;
    function select(tag, updateUrl = true) {
      let count = 0;
      for (const article of articles) {
        const matches = tag ? article.tags.includes(tag) : count < limit;
        article.node.hidden = !matches;
        if (matches) count++;
      }
      for (const button of buttons) {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.articleTag === tag),
        );
      }
      const label = tag
        ? `「${tag}」の読みもの`
        : limit < articles.length
          ? "最新の読みもの"
          : "すべての読みもの";
      status.textContent = `${label}：${count}件`;
      empty.hidden = count > 0;
      if (updateUrl) {
        const url = new URL(window.location.href);
        if (tag) url.searchParams.set("tag", tag);
        else url.searchParams.delete("tag");
        window.history.replaceState(null, "", url);
      }
    }
    for (const button of buttons) {
      button.addEventListener("click", () => select(button.dataset.articleTag));
    }
    root.querySelector("[data-clear-filter]")?.addEventListener("click", () => {
      select("");
      buttons[0]?.focus();
    });
    select(new URL(window.location.href).searchParams.get("tag") || "", false);
    controls.hidden = false;
    status.hidden = false;
  }
})();
