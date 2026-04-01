<template>
  <div class="page">
    <h1>だいせん整体ブログ</h1>

    <!-- 読み込み中 -->
    <div v-if="pending" class="grid">
      <div v-for="i in 9" :key="i" class="skeleton-card">
        <div class="skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton-line w60"></div>
          <div class="skeleton-line w100"></div>
          <div class="skeleton-line w80"></div>
        </div>
      </div>
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
              <span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
            </div>
          </div>
        </NuxtLink>
      </article>
    </div>

    <!-- もっと見るボタン -->
    <div class="load-more-wrap" v-if="!pending">
      <button v-if="hasMore" class="load-more-btn"
        :disabled="loadingMore" @click="loadMore">
        {{ loadingMore ? "読み込み中..." : "もっと見る" }}
      </button>
      <p v-else class="no-more">すべての記事を表示しました</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const PROJECT_ID = "daisen-seitai-blog";
const PAGE_SIZE = 9;

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

async function fetchPosts(startAfter?: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  const query: any = {
    structuredQuery: {
      from: [{ collectionId: "blogposts" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "status" },
          op: "EQUAL",
          value: { stringValue: "published" }
        }
      },
      orderBy: [{ field: { fieldPath: "publishedAt" }, direction: "DESCENDING" }],
      limit: PAGE_SIZE + 1
    }
  };

  if (startAfter) {
    query.structuredQuery.startAt = {
      values: [{ timestampValue: startAfter }],
      before: false
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query)
  });
  const data = await res.json();
  return data
    .filter((item: any) => item.document)
    .map((item: any) => {
      const f = extractFields(item.document.fields || {});
      return {
        id: item.document.name.split("/").pop(),
        title: f.title || "",
        mainImage: f.mainImage || f.mainImageUrl || "",
        tags: Array.isArray(f.tags) ? f.tags : [],
        publishedAt: f.publishedAt || "",
      };
    });
}

const posts = ref<any[]>([]);
const hasMore = ref(true);
const loadingMore = ref(false);
const lastPublishedAt = ref<string | undefined>(undefined);

const { pending } = await useAsyncData("posts", async () => {
  const result = await fetchPosts();
  hasMore.value = result.length > PAGE_SIZE;
  posts.value = result.slice(0, PAGE_SIZE);
  lastPublishedAt.value = posts.value[posts.value.length - 1]?.publishedAt;
  return true;
});

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return;
  loadingMore.value = true;
  try {
    const result = await fetchPosts(lastPublishedAt.value);
    hasMore.value = result.length > PAGE_SIZE;
    const newPosts = result.slice(0, PAGE_SIZE);
    posts.value = [...posts.value, ...newPosts];
    lastPublishedAt.value = newPosts[newPosts.length - 1]?.publishedAt;
  } finally {
    loadingMore.value = false;
  }
}

useHead({
  title: "だいせん整体ブログ",
  meta: [
    { property: "og:title", content: "だいせん整体ブログ" },
    { property: "og:url", content: "https://blog.daisen-seitai.com" },
  ]
});
</script>

<style scoped>
.page { max-width: 1100px; margin: auto; padding: 40px 20px; font-family: "Hiragino Sans", sans-serif; background: #F4F1EC; min-height: 100vh; }
h1 { font-size: 2rem; color: #1F3D23; margin-bottom: 40px; text-align: center; }
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
.tag { font-size: 11px; color: #555; border: 1px solid #ccc; border-radius: 20px; padding: 2px 8px; text-decoration: none; }
.tag:hover { background: #355E3B; color: #fff; border-color: #355E3B; }
.load-more-wrap { text-align: center; margin-top: 48px; }
.load-more-btn { background: #355E3B; color: #fff; border: none; border-radius: 24px; padding: 14px 40px; font-size: 15px; font-weight: bold; cursor: pointer; transition: opacity 0.2s; }
.load-more-btn:hover { opacity: 0.85; }
.load-more-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.no-more { color: #888; font-size: 13px; }
.skeleton-card { background: #fff; border-radius: 16px; overflow: hidden; }
.skeleton-img { aspect-ratio: 16/9; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.skeleton-body { padding: 20px; }
.skeleton-line { height: 14px; border-radius: 4px; margin-bottom: 10px; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.w60 { width: 60%; } .w80 { width: 80%; } .w100 { width: 100%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>