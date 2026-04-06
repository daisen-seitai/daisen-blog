<template>
  <div class="page">

    <!-- ヘッダー（index.vueと統一） -->
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

      <!-- タグフィルタバナー（index.vueと統一） -->
      <div class="filter-banner">
        <div class="filter-banner-inner">
          <span class="filter-banner-label">タグで絞り込み中：</span>
          <span class="filter-tag">#{{ decodedTag }}</span>
          <a href="/" class="filter-clear">✕ すべての記事を見る</a>
        </div>
      </div>

      <!-- 読み込み中 -->
      <template v-if="pending">
        <div class="grid">
          <div v-for="i in 6" :key="i" class="skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-body">
              <div class="skeleton-line w60"></div>
              <div class="skeleton-line w100"></div>
              <div class="skeleton-line w80"></div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <!-- 記事なし -->
        <div v-if="!posts?.length" class="no-result">
          <p>「#{{ decodedTag }}」の記事はまだありません。</p>
          <a href="/" class="btn-back-list">← すべての記事を見る</a>
        </div>

        <!-- 記事一覧 -->
        <template v-else>
          <h3 class="section-title">
            #{{ decodedTag }} の記事（{{ posts.length }}件）
          </h3>
          <div class="grid">
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
                    <NuxtLink
                      v-for="t in post.tags" :key="t"
                      :to="`/tag/${encodeURIComponent(t)}`"
                      class="tag tag-clickable"
                      :class="{ 'tag-active': t === decodedTag }"
                    >#{{ t }}</NuxtLink>
                  </div>
                </div>
              </NuxtLink>
            </article>
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
const route = useRoute();
const tag = route.params.tag as string;
const decodedTag = decodeURIComponent(tag);

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
  title: `#${decodedTag} の記事一覧 | だいせん整体ブログ`,
  meta: [
    { property: "og:title", content: `#${decodedTag} の記事一覧 | だいせん整体ブログ` },
    { property: "og:url", content: `https://blog.daisen-seitai.com/tag/${tag}` },
    { name: "description", content: `だいせん整体ブログの「#${decodedTag}」タグの記事一覧です。` },
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
                value: { stringValue: decodedTag }
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
      return {
        id: item.document.name.split("/").pop(),
        title: f.title || "",
        mainImage: f.mainImage || f.mainImageUrl || "",
        tags: Array.isArray(f.tags) ? f.tags : [],
        publishedAt: f.publishedAt || "",
      };
    });
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
.nav-link { color: #555; text-decoration: none; font-size: 14px; font-weight: bold; transition: color 0.2s; }
.nav-link:hover { color: #355E3B; }

/* コンテナ */
.container { max-width: 1100px; margin: auto; padding: 40px 20px; }

/* タグフィルタバナー */
.filter-banner { background: #e8f0ec; border: 1px solid #b8d4be; border-radius: 12px; padding: 14px 20px; margin-bottom: 32px; }
.filter-banner-inner { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-banner-label { font-size: 13px; color: #555; }
.filter-tag { font-size: 14px; font-weight: bold; color: #1F3D23; background: #c8e0cc; padding: 3px 12px; border-radius: 20px; }
.filter-clear { font-size: 13px; color: #888; text-decoration: none; margin-left: auto; transition: color 0.2s; }
.filter-clear:hover { color: #333; }

/* セクションタイトル */
.section-title { font-size: 1.1rem; color: #1F3D23; margin-bottom: 24px; padding-left: 12px; border-left: 4px solid #355E3B; }

/* 記事なし */
.no-result { text-align: center; padding: 64px 20px; color: #888; }
.no-result p { font-size: 16px; margin-bottom: 24px; }
.btn-back-list { display: inline-block; background: #355E3B; color: #fff; padding: 12px 28px; border-radius: 24px; text-decoration: none; font-size: 14px; font-weight: bold; }

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
.card-date { font-size: 12px; color: #888; }
.card-title { font-size: 1.05rem; color: #1F3D23; margin: 8px 0; line-height: 1.6; font-weight: bold; }
.card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }

/* タグ */
.tag { font-size: 11px; color: #355E3B; background: #e8f0ec; border-radius: 20px; padding: 2px 10px; text-decoration: none; position: relative; z-index: 1; }
.tag-clickable { transition: all 0.2s; cursor: pointer; }
.tag-clickable:hover { background: #355E3B; color: #fff; }
.tag-active { background: #355E3B !important; color: #fff !important; }

/* スケルトン */
.skeleton-card { background: #fff; border-radius: 16px; overflow: hidden; }
.skeleton-img { aspect-ratio: 16/9; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.skeleton-body { padding: 20px; }
.skeleton-line { height: 14px; border-radius: 4px; margin-bottom: 10px; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.w60 { width: 60%; } .w80 { width: 80%; } .w100 { width: 100%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* フッター */
.footer { text-align: center; padding: 32px 20px; color: #aaa; font-size: 13px; border-top: 1px solid #e8e0d5; margin-top: 40px; background: #fff; }
</style>