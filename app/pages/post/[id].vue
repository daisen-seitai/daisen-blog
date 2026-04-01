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
      <div class="tags">
        <NuxtLink
          v-for="tag in post.tags" :key="tag"
          :to="`/tag/${encodeURIComponent(tag)}`"
          class="tag"
        >#{{ tag }}</NuxtLink>
      </div>
      <div v-if="post.mainImage" class="post-img-wrap">
        <img :src="post.mainImage" :alt="post.title" class="post-img"
          width="1200" height="630" fetchpriority="high">
      </div>
      <article class="body" v-html="bodyHtml"></article>
    </template>
  </div>
</template>

<script setup lang="ts">
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../plugins/firebase.client";

const route = useRoute();
const id = route.params.id as string;
const post = ref<any>(null);
const pending = ref(true);
const error = ref(false);

function fmtDate(val: any) {
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    if (isNaN(d)) return "";
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
    { property: "og:title",       content: post.value?.title || "" },
    { property: "og:image",       content: post.value?.mainImage || "" },
    { property: "og:description", content: (post.value?.content || "").replace(/<[^>]+>/g, "").slice(0, 120) },
    { property: "og:url",         content: `https://blog.daisen-seitai.com/post/${id}` },
  ]
}));

onMounted(async () => {
  try {
    const snap = await getDoc(doc(db, "blogposts", id));
    if (!snap.exists()) { error.value = true; return; }
    post.value = { id: snap.id, ...snap.data() };
  } catch (e) {
    error.value = true;
  } finally {
    pending.value = false;
  }
});
</script>

<style scoped>
.page { max-width: 900px; margin: auto; padding: 24px 20px 60px; font-family: "Hiragino Sans", sans-serif; color: #333; }
.back { display: inline-block; margin-bottom: 24px; color: #355E3B; text-decoration: none; font-size: 14px; font-weight: bold; }
.back:hover { opacity: 0.75; }
h1 { font-size: clamp(1.4rem, 4vw, 1.9rem); color: #1F3D23; line-height: 1.5; margin-bottom: 12px; }
.meta { color: #666; font-size: 13px; margin-bottom: 8px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 24px; }
.tag { font-size: 12px; color: #555; border: 1px solid #ccc; border-radius: 20px; padding: 2px 10px; text-decoration: none; }
.tag:hover { background: #355E3B; color: #fff; border-color: #355E3B; }
.post-img-wrap { margin: 0 0 32px; border-radius: 12px; overflow: hidden; aspect-ratio: 1200/630; background: #e8e4dc; }
.post-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.body { font-size: 16px; line-height: 2; }
.body :deep(h2) { font-size: 1.3rem; color: #1F3D23; margin: 2em 0 0.8em; padding-left: 12px; border-left: 4px solid #355E3B; }
.body :deep(h3) { font-size: 1.1rem; color: #1F3D23; margin: 1.6em 0 0.6em; }
.body :deep(p)  { margin-bottom: 1.4em; }
.body :deep(img) { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 1.5em auto; }
.body :deep(ul), .body :deep(ol) { padding-left: 1.6em; margin-bottom: 1.4em; }
.body :deep(li) { margin-bottom: 0.4em; }
.body :deep(a)  { color: #355E3B; }
.skeleton-img { aspect-ratio: 1200/630; border-radius: 12px; margin-bottom: 32px; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.skeleton-line { height: 14px; border-radius: 4px; margin-bottom: 10px; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.w30 { width: 30%; } .w60 { width: 60%; } .w80 { width: 80%; } .w95 { width: 95%; } .w100 { width: 100%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.error-box { padding: 24px; background: #fff0f0; border-radius: 8px; color: #900; text-align: center; }
</style>