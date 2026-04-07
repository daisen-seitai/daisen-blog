<template>
  <div class="page">

    <!-- ヘッダー -->
    <header class="header">
      <div class="header-inner">
        <a href="/" class="site-title">
          <span class="site-icon">🌿</span>
          だいせん整体ブログ
        </a>
        <nav class="nav">
          <a href="https://daisen-seitai.com/" class="nav-link" target="_blank">ホームページ</a>
          <a href="/" class="nav-link">ブログ一覧</a>
          <a href="/search" class="nav-link">検索</a>
        </nav>
      </div>
    </header>

    <div class="container">

      <!-- タグフィルタ中のバナー -->
      <div v-if="activeTag" class="filter-banner">
        <div class="filter-banner-inner">
          <span class="filter-banner-label">タグで絞り込み中：</span>
          <span class="filter-tag">#{{ activeTag }}</span>
          <a href="/" class="filter-clear">✕ 解除する</a>
        </div>
      </div>

      <!-- 読み込み中 -->
      <template v-if="pending">
        <div class="skeleton-featured"></div>
      </template>

      <template v-else>

        <!-- フィルタ結果なし -->
        <div v-if="displayPosts.length === 0" class="no-result">
          <p>「#{{ activeTag }}」の記事が見つかりませんでした。</p>
          <a href="/" class="btn-back-list">← すべての記事を見る</a>
        </div>

        <template v-else>
          <!-- 注目記事（最新1件）※タグフィルタ時は非表示 -->
          <section v-if="!activeTag && displayPosts.length > 0" class="featured">
            <NuxtLink :to="`/post/${displayPosts[0].id}`" class="featured-link">
              <div class="featured-img-wrap">
                <img v-if="displayPosts[0].mainImage"
                  :src="displayPosts[0].mainImage"
                  :alt="displayPosts[0].title"
                  class="featured-img"
                  fetchpriority="high">
                <div v-else class="featured-img-placeholder"></div>
                <div class="featured-badge">最新記事</div>
              </div>
              <div class="featured-body">
                <time class="featured-date">{{ fmtDate(displayPosts[0].publishedAt) }}</time>
                <h2 class="featured-title">{{ displayPosts[0].title }}</h2>
                <div class="featured-tags">
                  <span
                    v-for="tag in displayPosts[0].tags" :key="tag"
                    class="tag tag-clickable"
                    @click.prevent="filterByTag(tag)"
                  >#{{ tag }}</span>
                </div>
                <span class="featured-read">続きを読む →</span>
              </div>
            </NuxtLink>
          </section>

          <!-- タグフィルタ時のヘッダー -->
          <h3 v-if="activeTag" class="section-title">
            #{{ activeTag }} の記事（{{ displayPosts.length }}件）
          </h3>

          <!-- 記事一覧 -->
          <template v-if="showAll || activeTag">
            <h3 v-if="!activeTag" class="section-title">すべての記事</h3>
            <div class="grid">
              <article
                v-for="post in activeTag ? displayPosts : displayPosts.slice(1)"
                :key="post.id"
                class="card"
              >
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
                      <span
                        v-for="tag in post.tags" :key="tag"
                        class="tag tag-clickable"
                        @click.prevent="filterByTag(tag)"
                      >#{{ tag }}</span>
                    </div>
                  </div>
                </NuxtLink>
              </article>
            </div>

            <!-- もっと見るボタン（タグフィルタ時は非表示） -->
            <div v-if="!activeTag" class="load-more-wrap">
              <button v-if="hasMore" class="load-more-btn"
                :disabled="loadingMore" @click="loadMore">
                {{ loadingMore ? "読み込み中..." : "もっと見る" }}
              </button>
              <p v-else class="no-more">すべての記事を表示しました</p>
            </div>
          </template>

          <!-- 最初のもっと見るボタン（通常表示・フィルタなし） -->
          <div class="load-more-wrap" v-else-if="!activeTag">
            <button class="load-more-btn" @click="showAll = true">
              記事をもっと見る
            </button>
          </div>
        </template>

      </template>
    </div>

    <!-- フッター -->
    <footer class="footer">
      <p>© 2024 だいせん整体 All rights reserved.</p>
    </footer>

  </div>
</template>

<script setup lang="ts">
const PROJECT_ID = "daisen-seitai-blog";
const PAGE_SIZE = 9;

// URLのtagクエリを取得
const route = useRoute();
const router = useRouter();
const activeTag = computed(() => route.query.tag as string || "");

// タグフィルタ関数
function filterByTag(tag: string) {
  if (activeTag.value === tag) {
    router.push("/");
  } else {
    router.push(`/?tag=${encodeURIComponent(tag)}`);
  }
}

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

const showAll = ref(false);
const hasMore = ref(true);
const loadingMore = ref(false);
const lastPublishedAt = ref<string | undefined>(undefined);
const extraPosts = ref<any[]>([]);

const { data: initialPosts, pending } = await useAsyncData("posts", async () => {
  const result = await fetchPosts();
  hasMore.value = result.length > PAGE_SIZE;
  const sliced = result.slice(0, PAGE_SIZE);
  lastPublishedAt.value = sliced[sliced.length - 1]?.publishedAt;
  return sliced;
});

// タグフィルタ：全記事からクライアントサイドでフィルタ
const allPosts = computed(() => [
  ...(initialPosts.value || []),
  ...extraPosts.value
]);

const displayPosts = computed(() => {
  if (!activeTag.value) return allPosts.value;
  return allPosts.value.filter(p =>
    p.tags.some((t: string) => t === activeTag.value)
  );
});

// タグフィルタ時に記事が足りなければ自動的にもっと読み込む
watch(activeTag, async (tag) => {
  if (!tag) return;
  // フィルタ結果が少ない場合は全件読み込む
  while (hasMore.value && displayPosts.value.length < 3) {
    await loadMore();
  }
});

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return;
  loadingMore.value = true;
  try {
    const result = await fetchPosts(lastPublishedAt.value);
    hasMore.value = result.length > PAGE_SIZE;
    const newPosts = result.slice(0, PAGE_SIZE);
    extraPosts.value = [...extraPosts.value, ...newPosts];
    lastPublishedAt.value = newPosts[newPosts.length - 1]?.publishedAt;
  } finally {
    loadingMore.value = false;
  }
}

useHead({
  title: activeTag.value
    ? `#${activeTag.value} の記事 | だいせん整体ブログ`
    : "だいせん整体ブログ",
  meta: [
    { property: "og:title", content: "だいせん整体ブログ" },
    { property: "og:url", content: "https://blog.daisen-seitai.com" },
  ]
});
</script>

<style scoped>
* { box-sizing: border-box; }
.page { min-height: 100vh; background: #faf7f2; font-family: "Hiragino Sans", sans-serif; }

/* ヘッダー */
.header { background: #fff; border-bottom: 1px solid #e8e0d5; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.header-inner { max-width: 1100px; margin: auto; padding: 0 20px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
.site-title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: bold; color: #1F3D23; text-decoration: none; }
.site-icon { font-size: 22px; }
.nav { display: flex; gap: 24px; }
.nav-link { color: #444; text-decoration: none; font-size: 14px; font-weight: bold; transition: color 0.2s; }
.nav-link:hover { color: #355E3B; }

/* タグフィルタバナー */
.filter-banner {
  background: #e8f0ec;
  border: 1px solid #b8d4be;
  border-radius: 12px;
  padding: 14px 20px;
  margin-bottom: 32px;
}
.filter-banner-inner { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-banner-label { font-size: 13px; color: #444; }
.filter-tag {
  font-size: 14px;
  font-weight: bold;
  color: #1F3D23;
  background: #c8e0cc;
  padding: 3px 12px;
  border-radius: 20px;
}
.filter-clear {
  font-size: 13px;
  color: #666;
  text-decoration: none;
  margin-left: auto;
  transition: color 0.2s;
}
.filter-clear:hover { color: #222; }

/* フィルタ結果なし */
.no-result {
  text-align: center;
  padding: 64px 20px;
  color: #666;
}
.no-result p { font-size: 16px; margin-bottom: 24px; }
.btn-back-list {
  display: inline-block;
  background: #355E3B;
  color: #fff;
  padding: 12px 28px;
  border-radius: 24px;
  text-decoration: none;
  font-size: 14px;
  font-weight: bold;
}

/* コンテナ */
.container { max-width: 1100px; margin: auto; padding: 40px 20px; }

/* 注目記事 */
.featured { margin-bottom: 48px; border-radius: 20px; overflow: hidden; background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
.featured-link { display: grid; grid-template-columns: 1fr 1fr; text-decoration: none; color: inherit; }
@media (max-width: 700px) { .featured-link { grid-template-columns: 1fr; } }
.featured-img-wrap { position: relative; aspect-ratio: 16/9; overflow: hidden; background: #e8e4dc; }
.featured-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.featured-link:hover .featured-img { transform: scale(1.03); }
.featured-img-placeholder { width: 100%; height: 100%; background: #e8e4dc; }
.featured-badge { position: absolute; top: 16px; left: 16px; background: #355E3B; color: #fff; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 20px; }
.featured-body { padding: 32px; display: flex; flex-direction: column; justify-content: center; gap: 12px; }
.featured-date { font-size: 13px; color: #666; }
.featured-title { font-size: 1.4rem; color: #1F3D23; line-height: 1.6; font-weight: bold; }
.featured-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.featured-read { font-size: 14px; color: #355E3B; font-weight: bold; margin-top: 8px; }

/* セクションタイトル */
.section-title { font-size: 1.1rem; color: #1F3D23; margin-bottom: 24px; padding-left: 12px; border-left: 4px solid #355E3B; }

/* カード */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
.card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); transition: transform 0.2s, box-shadow 0.2s; }
.card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.card a { text-decoration: none; color: inherit; }
.card-img-wrap { aspect-ratio: 16/9; overflow: hidden; background: #e8e4dc; }
.card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.card:hover .card-img { transform: scale(1.03); }
.card-img-placeholder { width: 100%; height: 100%; background: #e8e4dc; }
.card-body { padding: 20px; }
.card-date { font-size: 12px; color: #666; }
.card-title { font-size: 1.05rem; color: #1F3D23; margin: 8px 0; line-height: 1.6; font-weight: bold; }
.card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }

/* タグ共通 */
.tag { font-size: 11px; color: #355E3B; background: #e8f0ec; border-radius: 20px; padding: 2px 10px; }
.tag-clickable {
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  z-index: 1; /* カードリンクより前面に */
}
.tag-clickable:hover { background: #355E3B; color: #fff; }

/* もっと見る */
.load-more-wrap { text-align: center; margin-top: 48px; }
.load-more-btn { background: #355E3B; color: #fff; border: none; border-radius: 24px; padding: 14px 48px; font-size: 15px; font-weight: bold; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(53,94,59,0.3); }
.load-more-btn:hover { opacity: 0.88; transform: translateY(-2px); }
.load-more-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.no-more { color: #666; font-size: 13px; }

/* フッター */
.footer { text-align: center; padding: 32px 20px; color: #aaa; font-size: 13px; border-top: 1px solid #e8e0d5; margin-top: 40px; background: #fff; }

/* スケルトン */
.skeleton-featured { height: 300px; border-radius: 20px; margin-bottom: 48px; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>
