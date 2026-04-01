<template>
  <div class="page">
    <a href="/" class="back">← ブログ一覧へ戻る</a>
    <h1>記事を検索</h1>

    <!-- 検索ボックス -->
    <div class="search-wrap">
      <input
        v-model="keyword"
        type="text"
        class="search-input"
        placeholder="キーワードを入力（タイトル・タグ）"
        @input="onInput"
      >
      <span class="search-icon">🔍</span>
    </div>

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

    <template v-else>
      <!-- 検索結果件数 -->
      <p class="result-count" v-if="keyword">
        「{{ keyword }}」の検索結果：{{ filteredPosts.length }}件
      </p>

      <!-- 記事なし -->
      <div v-if="filteredPosts.length === 0 && keyword" class="empty">
        該当する記事が見つかりませんでした。
      </div>

      <!-- 記事一覧 -->
      <div v-else class="grid">
        <article v-for="post in filteredPosts" :key="post.id" class="card">
          <NuxtLink :to="`/post/${post.id}`">
            <div class="card-img-wrap">
              <img v-if="post.mainImage" :src="post.mainImage" :alt="post.title"
                class="card-img" loading="lazy" decoding="async">
              <div v-else class="card-img-placeholder"></div>
            </div>
            <div class="card-body">
              <time class="card-date">{{ fmtDate(post.publishedAt) }}</time>
              <h2 class="card-title" v-html="highlight(post.title)"></h2>
              <div class="card-tags">
                <span v-for="tag in post.tags" :key="tag"
                  class="tag" :class="{ 'tag-match': isTagMatch(tag) }">
                  #{{ tag }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const PROJECT_ID = "daisen-seitai-blog";
const keyword = ref("");

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

// 全記事を取得
const { data: allPosts, pending } = await useAsyncData("search-posts", async () => {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  const body = {
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
      limit: 200
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
      return {
        id: item.document.name.split("/").pop(),
        title: f.title || "",
        mainImage: f.mainImage || f.mainImageUrl || "",
        tags: Array.isArray(f.tags) ? f.tags : [],
        publishedAt: f.publishedAt || "",
      };
    });
});

// キーワードでフィルタリング
const filteredPosts = computed(() => {
  if (!allPosts.value) return [];
  if (!keyword.value.trim()) return allPosts.value;
  const kw = keyword.value.trim().toLowerCase();
  return allPosts.value.filter((post: any) => {
    const titleMatch = post.title.toLowerCase().includes(kw);
    const tagMatch = post.tags.some((tag: string) => tag.toLowerCase().includes(kw));
    return titleMatch || tagMatch;
  });
});

function isTagMatch(tag: string) {
  if (!keyword.value.trim()) return false;
  return tag.toLowerCase().includes(keyword.value.trim().toLowerCase());
}

// タイトルのキーワードをハイライト
function highlight(text: string) {
  if (!keyword.value.trim()) return text;
  const kw = keyword.value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(kw, 'gi'), '<mark>$&</mark>');
}

function onInput() {
  // 入力のたびに自動フィルタリング
}

useHead({
  title: "記事を検索 | だいせん整体ブログ",
  meta: [
    { property: "og:title", content: "記事を検索 | だいせん整体ブログ" },
  ]
});
</script>

<style scoped>
.page { max-width: 1100px; margin: auto; padding: 40px 20px; font-family: "Hiragino Sans", sans-serif; background: #F4F1EC; min-height: 100vh; }
.back { display: inline-block; margin-bottom: 24px; color: #355E3B; text-decoration: none; font-size: 14px; font-weight: bold; }
.back:hover { opacity: 0.75; }
h1 { font-size: 2rem; color: #1F3D23; margin-bottom: 32px; text-align: center; }

/* 検索ボックス */
.search-wrap { position: relative; max-width: 600px; margin: 0 auto 40px; }
.search-input {
  width: 100%; padding: 16px 50px 16px 20px;
  font-size: 16px; border: 2px solid #ddd;
  border-radius: 40px; outline: none;
  transition: border-color 0.2s;
  font-family: "Hiragino Sans", sans-serif;
}
.search-input:focus { border-color: #355E3B; }
.search-icon { position: absolute; right: 18px; top: 50%; transform: translateY(-50%); font-size: 18px; }

.result-count { text-align: center; color: #666; font-size: 14px; margin-bottom: 24px; }
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
.tag-match { background: #355E3B; color: #fff; border-color: #355E3B; }

/* ハイライト */
:deep(mark) { background: #fff176; color: inherit; border-radius: 2px; }

.skeleton-card { background: #fff; border-radius: 16px; overflow: hidden; }
.skeleton-img { aspect-ratio: 16/9; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.skeleton-body { padding: 20px; }
.skeleton-line { height: 14px; border-radius: 4px; margin-bottom: 10px; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.w60 { width: 60%; } .w80 { width: 80%; } .w100 { width: 100%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>