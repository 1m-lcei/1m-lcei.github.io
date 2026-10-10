for (const root of document.querySelectorAll("[data-work-filter]")) {
  const items = Array.from(
    root.querySelectorAll("[data-work-item]"),
    (node) => ({
      node,
      card: node.querySelector("[data-work-card]"),
      index: Number(node.dataset.workIndex),
      recommended: node.dataset.workRecommended === "true",
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
  const sortLabel = sort.querySelector("[data-work-sort-label]");
  const sortLabels = JSON.parse(sort.dataset.workSortLabels);
  const orderModes = ["recommended", "newest", "oldest"];
  let orderIndex = 0;
  function byPublication(direction) {
    return (left, right) => {
      if (left.timestamp === null) {
        return right.timestamp === null ? left.index - right.index : 1;
      }
      if (right.timestamp === null) return -1;
      return (
        direction * (left.timestamp - right.timestamp) ||
        left.index - right.index
      );
    };
  }
  const newestItems = [...items].sort(byPublication(-1));
  const orders = {
    recommended: [
      ...newestItems.filter((item) => item.recommended),
      ...newestItems.filter((item) => !item.recommended),
    ],
    newest: newestItems,
    oldest: [...items].sort(byPublication(1)),
  };
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
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) resetSwing();
  });

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
    announcement.textContent = `${message}、${sortLabel.textContent}`;
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
  sort.dataset.workSortOrder = orderModes[orderIndex];
  sortLabel.textContent = sortLabels[orderModes[orderIndex]];
  sort.addEventListener("click", () => {
    orderIndex = (orderIndex + 1) % orderModes.length;
    const mode = orderModes[orderIndex];
    sort.dataset.workSortOrder = mode;
    sortLabel.textContent = sortLabels[mode];
    list.append(...orders[mode].map(({ node }) => node));
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
