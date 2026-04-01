<template>
  <div class="page">
    <h1>だいせん整体ブログ</h1>

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

    <!-- 記事一覧 -->
    <div v-else class="grid">
      <article v-for="post in posts" :key="post.id" class="card">
        <NuxtLink :to="`/post/${post.id}`">
          <div class="card-img-wrap">
            <img
              v-if="post.mainImage"
              :src="post.mainImage"
              :alt="post.title"
              class="card-img"
              loading="lazy"
              decoding="async"
            >
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
  </div>
</template>

<script setup lang="ts">
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "../plugins/firebase.client";

function fmtDate(val: any) {
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  } catch { return ""; }
}

const { data: posts, pending } = await useAsyncData("posts", async () => {
  const q = query(
    collection(db, "blogposts"),
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title || "",
      mainImage: data.mainImage || data.mainImageUrl || "",
      tags: data.tags || [],
      publishedAt: data.publishedAt?.toDate?.().toISOString() || "",
    };
  });
});
</script>

<style scoped>
.page {
  max-width: 1100px;
  margin: auto;
  padding: 40px 20px;
  font-family: "Hiragino Sans", sans-serif;
}
h1 {
  font-size: 2rem;
  color: #1F3D23;
  margin-bottom: 40px;
  text-align: center;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}
.card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: transform 0.2s;
}
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

/* スケルトン */
.skeleton-card { background: #fff; border-radius: 16px; overflow: hidden; }
.skeleton-img { aspect-ratio: 16/9; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.skeleton-body { padding: 20px; }
.skeleton-line { height: 14px; border-radius: 4px; margin-bottom: 10px; background: linear-gradient(90deg, #e8e4dc 25%, #f0ece4 50%, #e8e4dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.w60 { width: 60%; }
.w80 { width: 80%; }
.w100 { width: 100%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>