<template>
  <div class="page">
    <a href="/" class="back">← ブログ一覧へ戻る</a>
    <h1>#{{ tag }} の記事一覧</h1>

    <!-- 読み込み中 -->
    <div v-if="pending" class="grid">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <div class="skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton-line w60"></div>
          <div class="skeleton-line w100"></div>
          <div class="skeleton-line w80"></div>
        </div>
      </div>
    </div>

    <!-- 記事なし -->
    <div v-else-if="!posts?.length" class="empty">
      「#{{ tag }}」の記事はまだありません。
    </div>

    <!-- 記事一覧 -->
    <div v-else class="grid">
      <article v-for="post in posts" :key="post.id" class="card">
        <NuxtLink :to="`/post/${post.id}`">
          <div class="card-img-wrap">
            <img v-if="post.mainImage" :src="post.mainImage" :alt="post.title"
              class="card-img" loading="lazy" decoding="async">
            <div v-else class="card-img-placeholder"></div>
          </div>
          <div class="card-body">
            <time class="card-date">{{ fmtDate(post.publishedAt) }}</time>
            <h2 class="card-title">{{ post.title }}</h2>
            <div class="card-tags">
              <span v-for="t in post.tags" :key="t" class="tag">#{{ t }}</span>
            </div>
          </div>
        </NuxtLink>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
const PROJECT_ID = "daisen-seitai-blog";
const route = useRoute();
const tag = route.params.tag as string;

function extractValue(field: any): any {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  if (field.arrayValue !== undefined) return (field.arrayValue.values || []).map(extractValue);
  if (field.mapValue !== undefined) return extractFields(field.mapValue.fields || {});
  return null;
}

function extractFields(fields: any) {
  const result: any = {};
  for (const key in fields) result[key] = extractValue(fields[key]);
  return result;
}

function fmtDate(val: string) {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  } catch { return ""; }
}

useHead({
  title: `#${tag} の記事一覧 | だいせん整体ブログ`,
  meta: [
    { property: "og:title", content: `#${tag} の記事一覧 | だいせん整体ブログ` },
    { property: "og:url", content: `https://blog.daisen-seitai.com/tag/${tag}` },
  ]
});

const { data: posts, pending } = await useAsyncData(`tag-${tag}`, async () => {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
const body = {
  structuredQuery: {
    from: [{ collectionId: "blogposts" }],
    where: {
      compositeFilter: {
        op: "AND",
        filters: [
          {
            fieldFilter: {
              field: { fieldPath: "status" },
              op: "EQUAL",
              value: { stringValue: "published" }
            }
          },
          {
            fieldFilter: {
              field: { fieldPath: "tags" },
              op: "ARRAY_CONTAINS",
              value: { stringValue: decodeURIComponent(tag) }
            }
          }
        ]
      }
    },
    orderBy: [{ field: { fieldPath: "publishedAt" }, direction: "DESCENDING" }],
    limit: 50
  }
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return data
    .filter((item: any) => item.document)
    .map((item: any) => {
      const f = extractFields(item.document.fields || {});
      const id = item.document.name.split("/").pop();
      return {
        id,
        title: f.title || "",
        mainImage: f.mainImage || f.mainImageUrl || "",
        tags: Array.isArray(f.tags) ? f.tags : [],
        publishedAt: f.publishedAt || "",
      };
    });
});
</script>

<style scoped>
.page { max-width: 1100px; margin: auto; padding: 40px 20px; font-family: "Hiragino Sans", sans-serif; }
.back { display: inline-block; margin-bottom: 24px; color: #355E3B; text-decoration: none; font-size: 14px; font-weight: bold; }
.back:hover { opacity: 0.75; }
h1 { font-size: 1.6rem; color: #1F3D23; margin-bottom: 32px; }
.empty { text-align: center; padding: 60px 20px; color: #888; font-size: 14px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
.card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); transition: transform 0.2s; }
.card:hover { transform: translateY(-4px); }
.card a { text-decoration: none; color: inherit; }
.card-img-wrap { aspect-ratio: 16/9; overflow: hidden; background: #e8e4dc; }
.card-img { width: 100%; height: 100%; object-fit: cover; }
.card-img-placeholder { width: 100%; height: 100%; background: #e8e4dc; }
.card-body { padding: 20px; }
.card-date { font-size: 12px; color: #888; }
.card-title { font-size: 1.1rem; color: #1F3D23; margin: 8px 0; line-height: 1.5; }
.card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.tag { font-size: 11px; color: #555; border: 1px solid #ccc; border-radius: 20px; padding: 2px 8px; }
.skeleton-card { background: #fff; border-radius: 16px; overflow: hidden; }
.skeleton-img { aspect-ratio: 16/9; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.skeleton-body { padding: 20px; }
.skeleton-line { height: 14px; border-radius: 4px; margin-bottom: 10px; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.w60 { width: 60%; } .w80 { width: 80%; } .w100 { width: 100%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>