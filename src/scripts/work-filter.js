for (const root of document.querySelectorAll("[data-work-filter]")) {
  const items = Array.from(
    root.querySelectorAll("[data-work-item]"),
    (node, index) => ({
      node,
      card: node.querySelector("[data-work-card]"),
      index,
      tags: JSON.parse(node.dataset.workTags),
      timestamp: node.dataset.workPublishedAt
        ? Date.parse(node.dataset.workPublishedAt)
        : null,
    }),
  );
  const buttons = root.querySelectorAll("[data-work-tag]");
  const status = root.querySelector("[data-work-filter-status]");
  const label = root.querySelector("[data-work-filter-label]");
  const announcement = root.querySelector("[data-work-announcement]");
  const clear = root.querySelector("[data-clear-work-filter]");
  const list = root.querySelector("#work-list");
  const controls = root.querySelector("[data-work-controls]");
  const sort = root.querySelector("[data-work-sort]");
  const sortLabel = root.querySelector("[data-work-sort-label]");
  const oldestItems = [...items].sort((left, right) => {
    if (left.timestamp === null) {
      return right.timestamp === null ? left.index - right.index : 1;
    }
    if (right.timestamp === null) return -1;
    return left.timestamp - right.timestamp || left.index - right.index;
  });
  let oldest = false;
  let selected = "";
  let trigger;
  let swingFrame = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function resetSwing() {
    cancelAnimationFrame(swingFrame);
    swingFrame = 0;
    for (const { card } of items) {
      card.classList.remove("work-swing", "work-swing-start");
    }
  }

  function swingCards() {
    resetSwing();
    if (reducedMotion.matches) return;
    // Set the starting tilt before the next paint, while changes still coalesce.
    for (const { node, card } of items) {
      if (!node.hidden) card.classList.add("work-swing-start");
    }
    swingFrame = requestAnimationFrame(() => {
      swingFrame = 0;
      if (reducedMotion.matches) return;
      // Flush the removed animation once; rapid changes share one final frame.
      list.getBoundingClientRect();
      for (const { node, card } of items) {
        if (!node.hidden)
          card.classList.replace("work-swing-start", "work-swing");
      }
    });
  }
  reducedMotion.addEventListener("change", resetSwing);

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
        String(Boolean(tag && button.dataset.workTag === tag)),
      );
    }
    const message = tag ? `「${tag}」 ${count}件` : `すべての成果物 ${count}件`;
    label.textContent = message;
    announcement.textContent = `${message}、${oldest ? "古い順" : "新しい順"}`;
    status.hidden = !tag;
    if (
      items.some(
        ({ node }) => node.hidden && node.contains(document.activeElement),
      )
    ) {
      clear.focus();
    }
    swingCards();
  }

  controls.hidden = false;
  sort.disabled = false;
  sort.addEventListener("click", () => {
    oldest = !oldest;
    list.append(...(oldest ? oldestItems : items).map(({ node }) => node));
    sort.setAttribute("aria-pressed", String(oldest));
    sortLabel.textContent = oldest ? "古い順" : "新しい順";
    select(selected);
  });

  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener("click", () => {
      trigger = button;
      select(selected === button.dataset.workTag ? "" : button.dataset.workTag);
    });
  }
  clear.addEventListener("click", () => {
    select("");
    trigger?.focus();
  });
}
