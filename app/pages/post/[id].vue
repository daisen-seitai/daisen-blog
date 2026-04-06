<template>
  <div class="page">
    <a href="/" class="back">← ブログ一覧へ戻る</a>

    <div v-if="pending">
      <div class="skeleton-line w60" style="height:2em; margin-bottom:12px;"></div>
      <div class="skeleton-line w30" style="height:1em; margin-bottom:24px;"></div>
      <div class="skeleton-img"></div>
      <div class="skeleton-line w100"></div>
      <div class="skeleton-line w95"></div>
      <div class="skeleton-line w80"></div>
    </div>

    <div v-else-if="error" class="error-box">記事の読み込みに失敗しました。</div>

    <template v-else-if="post">
      <h1>{{ post.title }}</h1>
      <div class="meta"><time>{{ fmtDate(post.publishedAt) }}</time></div>

      <!-- タグ：クリックでブログ一覧にフィルタ -->
      <div class="tags">
        <a
          v-for="tag in post.tags" :key="tag"
          :href="`/?tag=${encodeURIComponent(tag)}`"
          class="tag"
        >#{{ tag }}</a>
      </div>

      <div v-if="post.mainImage" class="post-img-wrap">
        <img :src="post.mainImage" :alt="post.title" class="post-img"
          width="1200" height="630" fetchpriority="high">
      </div>

      <article class="body" v-html="bodyHtml"></article>

      <!-- 関連ページCTAブロック -->
      <div v-if="post.relatedPage" class="related-cta">
        <div class="related-cta-inner">
          <div class="related-cta-text">
            <p class="related-cta-label">この記事を読んで気になった方へ</p>
            <p class="related-cta-title">{{ relatedPageLabel }}</p>
          </div>
          <div class="related-cta-btns">
            <a
              :href="`https://daisen-seitai.com${post.relatedPage}`"
              class="cta-btn-primary"
              target="_blank" rel="noopener"
            >詳しく見る →</a>
            <a
              href="https://lin.ee/gH7Qqhs"
              class="cta-btn-line"
              target="_blank" rel="noopener"
            >💬 LINEで相談する</a>
          </div>
        </div>
      </div>

      <!-- 関連ページなしでもLINE・予約CTAは常時表示 -->
      <div class="bottom-cta">
        <p class="bottom-cta-lead">だいせん整体では、初回カウンセリング＋施術60分・3,000円でお試しいただけます。</p>
        <div class="bottom-cta-btns">
          <a href="https://select-type.com/rsv/?id=sCQcxhofNys&c_id=282644" class="cta-btn-reserve" target="_blank" rel="noopener">
            📅 初回予約（3,000円）
          </a>
          <a href="https://lin.ee/gH7Qqhs" class="cta-btn-line" target="_blank" rel="noopener">
            💬 LINEで相談する
          </a>
        </div>
        <p class="bottom-cta-note">完全予約制 ／ 大山院：火〜金 ／ 米子院：土〜月</p>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
const PROJECT_ID = "daisen-seitai-blog";
const SITE_URL = "https://daisen-seitai.com";

// 関連ページラベルマップ
const relatedPageMap: Record<string, string> = {
  "/morning-pain/": "朝、起き上がるのがつらい方へ",
  "/desk-pain/": "座り続けると体がしんどい方へ",
  "/chronic-fatigue/": "疲れが翌日に残る方へ",
  "/unknown-symptoms/": "病院で「異常なし」と言われた方へ",
  "/postnatal-care/": "産後から体が変わった方へ",
  "/about.html": "ファシアとは",
  "/pricing.html": "料金案内・初回3,000円体験",
  "/process.html": "施術の流れ",
  "/staff.html": "院長紹介",
  "/access.html": "アクセス・営業時間",
};

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

const route = useRoute();
const id = route.params.id as string;
const error = ref(false);

const { data: post, pending } = await useAsyncData(`post-${id}`, async () => {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/blogposts/${id}`;
  const res = await fetch(url);
  if (!res.ok) { error.value = true; return null; }
  const data = await res.json();
  if (!data.fields) { error.value = true; return null; }
  const f = extractFields(data.fields);
  return {
    id,
    title: f.title || "",
    content: f.content || "",
    mainImage: f.mainImage || f.mainImageUrl || "",
    tags: Array.isArray(f.tags) ? f.tags : [],
    publishedAt: f.publishedAt || "",
    relatedPage: f.relatedPage || "",  // 追加
  };
});

const relatedPageLabel = computed(() =>
  post.value?.relatedPage ? (relatedPageMap[post.value.relatedPage] || "") : ""
);

function fmtDate(val: string) {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  } catch { return ""; }
}

const bodyHtml = computed(() => {
  const raw = post.value?.content || "";
  if (raw.includes("<")) return raw;
  return raw.split(/\n\n+/).map((s: string) => `<p>${s.trim()}</p>`).join("");
});

useHead(() => ({
  title: post.value ? `${post.value.title} | だいせん整体ブログ` : "だいせん整体ブログ",
  meta: [
    { property: "og:title", content: post.value?.title || "" },
    { property: "og:image", content: post.value?.mainImage || "" },
    { property: "og:description", content: (post.value?.content || "").replace(/<[^>]+>/g, "").slice(0, 120) },
    { property: "og:url", content: `https://blog.daisen-seitai.com/post/${id}` },
  ]
}));
</script>

<style scoped>
.page { max-width: 900px; margin: auto; padding: 24px 20px 60px; font-family: "Hiragino Sans", sans-serif; color: #333; }
.back { display: inline-block; margin-bottom: 24px; color: #355E3B; text-decoration: none; font-size: 14px; font-weight: bold; }
.back:hover { opacity: 0.75; }
h1 { font-size: clamp(1.4rem, 4vw, 1.9rem); color: #1F3D23; line-height: 1.5; margin-bottom: 12px; }
.meta { color: #666; font-size: 13px; margin-bottom: 8px; }

/* タグ：クリック可能なリンク */
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 24px; }
.tag { font-size: 12px; color: #555; border: 1px solid #ccc; border-radius: 20px; padding: 2px 10px; text-decoration: none; transition: all 0.2s; cursor: pointer; }
.tag:hover { background: #355E3B; color: #fff; border-color: #355E3B; }

.post-img-wrap { margin: 0 0 32px; border-radius: 12px; overflow: hidden; aspect-ratio: 1200/630; background: #e8e4dc; }
.post-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.body { font-size: 16px; line-height: 2; margin-bottom: 48px; }
.body :deep(h2) { font-size: 1.3rem; color: #1F3D23; margin: 2em 0 0.8em; padding-left: 12px; border-left: 4px solid #355E3B; }
.body :deep(h3) { font-size: 1.1rem; color: #1F3D23; margin: 1.6em 0 0.6em; }
.body :deep(p)  { margin-bottom: 1.4em; }
.body :deep(img) { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 1.5em auto; }
.body :deep(ul), .body :deep(ol) { padding-left: 1.6em; margin-bottom: 1.4em; }
.body :deep(li) { margin-bottom: 0.4em; }
.body :deep(a)  { color: #355E3B; }

/* 関連ページCTAブロック */
.related-cta {
  background: #1F3D23;
  border-radius: 16px;
  padding: 32px 36px;
  margin-bottom: 32px;
}
.related-cta-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.related-cta-label { font-size: 12px; color: rgba(255,255,255,0.6); letter-spacing: 0.05em; margin-bottom: 8px; }
.related-cta-title { font-size: 18px; color: #fff; font-weight: bold; line-height: 1.5; }
.related-cta-btns { display: flex; gap: 10px; flex-wrap: wrap; flex-shrink: 0; }

/* 常時表示CTAブロック */
.bottom-cta {
  background: #f5f2ed;
  border: 1px solid #e2ddd6;
  border-radius: 16px;
  padding: 32px 36px;
  text-align: center;
  margin-top: 16px;
}
.bottom-cta-lead { font-size: 14px; color: #5a5550; margin-bottom: 20px; line-height: 1.8; }
.bottom-cta-btns { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.bottom-cta-note { font-size: 12px; color: #9a9590; }

/* 共通ボタン */
.cta-btn-primary {
  display: inline-block;
  background: #3d6b5a;
  color: #fff !important;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  font-weight: bold;
  transition: opacity 0.2s;
}
.cta-btn-primary:hover { opacity: 0.88; }

.cta-btn-line {
  display: inline-block;
  background: #06C755;
  color: #fff !important;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  font-weight: bold;
  transition: opacity 0.2s;
}
.cta-btn-line:hover { opacity: 0.88; }

.cta-btn-reserve {
  display: inline-block;
  background: #3d6b5a;
  color: #fff !important;
  padding: 14px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 15px;
  font-weight: bold;
  transition: opacity 0.2s;
}
.cta-btn-reserve:hover { opacity: 0.88; }

/* スケルトン */
.skeleton-img { aspect-ratio: 1200/630; border-radius: 12px; margin-bottom: 32px; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.skeleton-line { height: 14px; border-radius: 4px; margin-bottom: 10px; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.w30 { width: 30%; } .w60 { width: 60%; } .w80 { width: 80%; } .w95 { width: 95%; } .w100 { width: 100%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.error-box { padding: 24px; background: #fff0f0; border-radius: 8px; color: #900; text-align: center; }

@media (max-width: 600px) {
  .related-cta-inner { flex-direction: column; align-items: flex-start; }
  .related-cta, .bottom-cta { padding: 24px 20px; }
}
</style>