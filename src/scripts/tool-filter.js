for (const root of document.querySelectorAll("[data-tool-filter]")) {
  const items = Array.from(
    root.querySelectorAll("[data-tool-item]"),
    (node) => ({
      node,
      tags: JSON.parse(node.dataset.toolTags),
    }),
  );
  const buttons = root.querySelectorAll("[data-tool-tag]");
  const status = root.querySelector("[data-tool-filter-status]");
  const label = root.querySelector("[data-tool-filter-label]");
  const announcement = root.querySelector("[data-tool-announcement]");
  const clear = root.querySelector("[data-clear-tool-filter]");
  let selected = "";
  let trigger;

  function select(tag) {
    selected = tag;
    let count = 0;
    for (const { node, tags } of items) {
      node.hidden = Boolean(tag && !tags.includes(tag));
      if (!node.hidden) count += 1;
    }
    for (const button of buttons) {
      button.setAttribute(
        "aria-pressed",
        String(Boolean(tag && button.dataset.toolTag === tag)),
      );
    }
    const message = tag ? `「${tag}」 ${count}件` : `すべてのツール ${count}件`;
    label.textContent = message;
    announcement.textContent = message;
    status.hidden = !tag;
  }

  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener("click", () => {
      trigger = button;
      select(selected === button.dataset.toolTag ? "" : button.dataset.toolTag);
    });
  }
  clear.addEventListener("click", () => {
    select("");
    trigger?.focus();
  });
}
