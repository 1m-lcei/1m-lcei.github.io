import { getCollection } from "astro:content";

export async function getPublishedPosts() {
  const posts = await getCollection(
    "posts",
    ({ data }) => data.draft === false,
  );
  return posts.sort(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id),
  );
}
