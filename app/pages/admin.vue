<template>
  <div>
    <!-- ログイン画面 -->
    <div v-if="!user" class="login-screen">
      <div class="login-card">
        <h1>だいせん整体<br>ブログ管理画面</h1>
        <p>管理者アカウントでログインしてください</p>
        <button class="btn-google" @click="login">
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Googleでログイン
        </button>
      </div>
    </div>

    <!-- 管理画面 -->
    <div v-else class="admin">
      <!-- ヘッダー -->
      <header class="header">
        <div class="logo">だいせん整体 / 管理画面</div>
        <div class="header-right">
          <span class="user-email">{{ user.email }}</span>
          <button class="btn-ghost" @click="logout">ログアウト</button>
        </div>
      </header>

      <!-- ステータスバー -->
      <div class="status-bar" :class="{ error: statusError }">
        <div class="dot"></div>
        <span>{{ statusMsg }}</span>
      </div>

      <!-- メインレイアウト -->
      <div class="layout">
        <!-- サイドバー -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <h2>記事一覧</h2>
            <button class="btn-icon" @click="loadPosts">↺</button>
          </div>
          <div class="post-list">
            <div v-if="posts.length === 0" class="empty">記事がありません</div>
            <div
              v-for="post in posts" :key="post.id"
              class="post-item" :class="{ active: selectedId === post.id }"
              @click="loadPost(post.id)"
            >
              <div class="post-item-title">{{ post.title || "無題" }}</div>
              <div class="post-item-meta">
                <span class="badge" :class="post.status === 'published' ? 'badge-pub' : 'badge-draft'">
                  {{ post.status === 'published' ? '公開中' : '下書き' }}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <!-- エディター -->
        <main class="editor">
          <!-- ツールバー（1本のみ） -->
          <div class="editor-toolbar">
            <button class="btn-primary" @click="publish">公開する</button>
            <button class="btn-ghost" @click="save">下書き保存</button>
            <button class="btn-ghost" @click="viewPost">表示確認 ↗</button>
            <button class="btn-sns" @click="openSnsModal">📲 SNS・短縮URL生成</button>
            <button class="btn-danger" @click="unpublish">非公開に戻す</button>
          </div>

          <!-- エディター本体 -->
          <div class="editor-body" v-if="selectedId">
            <div class="editor-left">
              <div class="field">
                <label>タイトル</label>
                <input type="text" v-model="form.title" placeholder="記事のタイトル">
              </div>
              <div class="field">
                <label>本文</label>
                <textarea v-model="form.content" style="min-height:320px; resize:vertical;"></textarea>
              </div>
              <div class="field">
                <label>タグ（カンマ区切り）</label>
                <input type="text" v-model="form.tags" placeholder="例: 腰痛, セルフケア">
                <div class="tag-preview" v-if="form.tags">
                  <span
                    v-for="tag in form.tags.split(',').map(t => t.trim()).filter(Boolean)"
                    :key="tag"
                    class="tag-chip"
                  >#{{ tag }}</span>
                </div>
              </div>

              <!-- 関連ページ選択 -->
              <div class="field">
                <label>関連ページ CTA（記事末尾に表示）</label>
                <select v-model="form.relatedPage" class="select-field">
                  <option value="">表示しない</option>
                  <optgroup label="こんな方へ（LP）">
                    <option value="/morning-pain/">朝、起き上がるのがつらい方へ</option>
                    <option value="/desk-pain/">座り続けると体がしんどい方へ</option>
                    <option value="/chronic-fatigue/">疲れが翌日に残る方へ</option>
                    <option value="/unknown-symptoms/">病院で「異常なし」と言われた方へ</option>
                    <option value="/postnatal-care/">産後から体が変わった方へ</option>
                  </optgroup>
                  <optgroup label="サイト内ページ">
                    <option value="/about.html">ファシアとは</option>
                    <option value="/pricing.html">料金案内・初回体験</option>
                    <option value="/process.html">施術の流れ</option>
                    <option value="/staff.html">院長紹介</option>
                    <option value="/access.html">アクセス・営業時間</option>
                  </optgroup>
                </select>
                <!-- CTAプレビュー -->
                <div class="cta-preview" v-if="form.relatedPage">
                  <p class="cta-preview-label">▼ 記事末尾に表示されるCTA</p>
                  <div class="cta-preview-box">
                    <p class="cta-preview-text">{{ relatedPageLabel }}</p>
                    <div class="cta-preview-btns">
                      <span class="cta-preview-btn-primary">詳しく見る →</span>
                      <span class="cta-preview-btn-line">💬 LINEで相談する</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="editor-right">
              <div class="field" style="flex:1; display:flex; flex-direction:column;">
                <label>本文プレビュー</label>
                <div class="preview-box">{{ form.content }}</div>
              </div>
              <div class="field">
                <label>メイン画像</label>
                <input type="file" accept="image/*" @change="onImageChange">
                <img v-if="imagePreviewUrl" :src="imagePreviewUrl" class="img-preview">
              </div>
            </div>
          </div>

          <div v-else class="no-selection">← 左の一覧から記事を選択してください</div>
        </main>
      </div>

      <!-- SNSモーダル（adminルート直下・layoutの外） -->
      <div v-if="showSnsModal" class="modal-overlay" @click.self="showSnsModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>SNS・集客用コンテンツ生成</h3>
            <button class="btn-close" @click="showSnsModal = false">×</button>
          </div>
          <div class="modal-body">
            <div class="sns-field">
              <label>短縮URL（SNS用）</label>
              <div class="url-input-group">
                <input type="text" :value="shortUrl" readonly>
                <button class="btn-ghost" @click="copyToClipboard(shortUrl)">コピー</button>
              </div>
            </div>

            <hr class="divider">

            <div class="sns-tabs">
              <button
                v-for="t in ['Instagram', 'X (Twitter)', 'GBP (Google)']"
                :key="t"
                :class="{ active: activeSnsTab === t }"
                @click="activeSnsTab = t"
              >
                {{ t }}
              </button>
            </div>

            <div class="sns-content-area">
              <textarea v-model="snsPosts[activeSnsTab]" rows="8"></textarea>
              <div class="sns-footer">
                <span>文字数: {{ snsPosts[activeSnsTab].length }}文字</span>
                <button class="btn-primary" @click="copyToClipboard(snsPosts[activeSnsTab])">この投稿文をコピー</button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, getDocs, doc, getDoc, updateDoc, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "../plugins/firebase.client";

const auth = getAuth();
const storage = getStorage();

const user = ref<any>(null);
const posts = ref<any[]>([]);
const selectedId = ref<string | null>(null);
const statusMsg = ref("準備中...");
const statusError = ref(false);
const imagePreviewUrl = ref("");
const imageBlob = ref<Blob | null>(null);

const form = reactive({
  title: "",
  content: "",
  tags: "",
  relatedPage: "",
});

// SNS関連
const showSnsModal = ref(false);
const activeSnsTab = ref("Instagram");
const shortUrl = ref("");
const snsPosts = reactive<Record<string, string>>({
  "Instagram": "",
  "X (Twitter)": "",
  "GBP (Google)": "",
});

// 関連ページのラベルマップ
const relatedPageMap: Record<string, string> = {
  "/morning-pain/": "朝、起き上がるのがつらい方へ",
  "/desk-pain/": "座り続けると体がしんどい方へ",
  "/chronic-fatigue/": "疲れが翌日に残る方へ",
  "/unknown-symptoms/": '病院で「異常なし」と言われた方へ',
  "/postnatal-care/": "産後から体が変わった方へ",
  "/about.html": "ファシアとは",
  "/pricing.html": "料金案内・初回体験",
  "/process.html": "施術の流れ",
  "/staff.html": "院長紹介",
  "/access.html": "アクセス・営業時間",
};

const relatedPageLabel = computed(() => relatedPageMap[form.relatedPage] || "");

function setStatus(msg: string, isError = false) {
  statusMsg.value = msg;
  statusError.value = isError;
}

// 認証
onMounted(() => {
  onAuthStateChanged(auth, async (u) => {
    user.value = u;
    if (u) {
      setStatus("ログイン中 — " + u.email);
      await loadPosts();
      const savedId = sessionStorage.getItem("selectedPostId");
      if (savedId) await loadPost(savedId);
    }
  });
});

async function login() {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e: any) {
    setStatus("ログインエラー: " + e.message, true);
  }
}

async function logout() {
  await signOut(auth);
}

// 記事一覧
async function loadPosts() {
  setStatus("記事一覧を読み込み中...");
  const q = query(collection(db, "blogposts"), orderBy("updatedAt", "desc"), limit(50));
  const snap = await getDocs(q);
  posts.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  setStatus("記事一覧を更新しました");
}

// 記事読み込み
async function loadPost(id: string) {
  selectedId.value = id;
  sessionStorage.setItem("selectedPostId", id);
  setStatus("記事を読み込み中...");
  const snap = await getDoc(doc(db, "blogposts", id));
  if (!snap.exists()) { setStatus("記事が見つかりません", true); return; }
  const p = snap.data();
  form.title = p.title || "";
  form.content = p.content || "";
  form.tags = (p.tags || []).join(", ");
  form.relatedPage = p.relatedPage || "";
  imagePreviewUrl.value = p.mainImage || p.mainImageUrl || "";
  imageBlob.value = null;
  setStatus(`「${p.title || "無題"}」を編集中`);
}

// 画像選択・WebP変換
function onImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  compressToWebP(file).then(blob => {
    imageBlob.value = blob;
    imagePreviewUrl.value = URL.createObjectURL(blob);
    const kb = Math.round(blob.size / 1024);
    const origKb = Math.round(file.size / 1024);
    setStatus(`画像を最適化しました（${origKb}KB → ${kb}KB・WebP）`);
  });
}

function compressToWebP(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("変換失敗")), "image/webp", quality);
    };
    img.onerror = () => reject(new Error("読み込み失敗"));
    img.src = url;
  });
}

// 保存処理
async function saveData(statusToSet?: string) {
  if (!selectedId.value) throw new Error("記事を選択してください");
  const updateData: any = {
    title: form.title,
    content: form.content,
    tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
    relatedPage: form.relatedPage || null,
    updatedAt: serverTimestamp(),
  };
  if (statusToSet) {
    updateData.status = statusToSet;
    if (statusToSet === "published") updateData.publishedAt = serverTimestamp();
  }
  if (imageBlob.value) {
    setStatus("画像をアップロード中...");
    const ref = storageRef(storage, `blog-images/${selectedId.value}/main.webp`);
    const snapshot = await uploadBytes(ref, imageBlob.value, { contentType: "image/webp", cacheControl: "public, max-age=31536000" });
    updateData.mainImage = await getDownloadURL(snapshot.ref);
    imageBlob.value = null;
  }
  await updateDoc(doc(db, "blogposts", selectedId.value), updateData);
}

async function save() {
  if (!selectedId.value) { setStatus("記事を選択してください", true); return; }
  try { await saveData(); setStatus("下書きを保存しました"); await loadPosts(); }
  catch (e: any) { setStatus("保存エラー: " + e.message, true); }
}

async function publish() {
  if (!selectedId.value) { setStatus("記事を選択してください", true); return; }
  try { await saveData("published"); setStatus("公開しました ✓"); await loadPosts(); }
  catch (e: any) { setStatus("公開エラー: " + e.message, true); }
}

async function unpublish() {
  if (!selectedId.value) { setStatus("記事を選択してください", true); return; }
  try {
    await updateDoc(doc(db, "blogposts", selectedId.value), { status: "draft", updatedAt: serverTimestamp() });
    setStatus("非公開にしました");
    await loadPosts();
  } catch (e: any) { setStatus("エラー: " + e.message, true); }
}

function viewPost() {
  if (!selectedId.value) { setStatus("記事を選択してください", true); return; }
  window.open(`/post/${selectedId.value}`, "_blank");
}

// SNSモーダル
function openSnsModal() {
  if (!selectedId.value) { setStatus("記事を選択してください", true); return; }

  shortUrl.value = `https://blog.daisen-seitai.com/post/${selectedId.value}`;

  const tagList = form.tags.split(",").map(t => t.trim()).filter(Boolean);
  const hashTags = tagList.map(t => `#${t}`).join(" ");
  const commonTags = "#だいせん整体 #鳥取整体 #大山 #ファシア";
  const summary = form.content.substring(0, 100).replace(/\n/g, " ") + "...";

  snsPosts["Instagram"] =
    `【新着ブログ更新✨】\n\n${form.title}\n\n${summary}\n\n続きはプロフィールのリンク、またはこちらから👇\n${shortUrl.value}\n\n${hashTags}\n${commonTags}`;

  snsPosts["X (Twitter)"] =
    `だいせん整体ブログを更新しました！\n\n「${form.title}」\n\n${summary}\n\n詳しくはこちらからチェックしてください👇\n${shortUrl.value}\n\n${hashTags}`;

  snsPosts["GBP (Google)"] =
    `【ブログ公開のお知らせ】\n\nこんにちは、だいせん整体です。\n新しい記事「${form.title}」を公開しました。\n\n${form.content.substring(0, 150)}...\n\n詳細は公式HPのブログをご覧ください。\n皆様のご来院を心よりお待ちしております。\n\n記事を読む：${shortUrl.value}`;

  showSnsModal.value = true;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  setStatus("クリップボードにコピーしました！");
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.login-screen { position: fixed; inset: 0; background: #f5f2ed; display: flex; align-items: center; justify-content: center; }
.login-card { background: #fdfbf8; border: 1px solid #e2ddd6; border-radius: 16px; padding: 48px; text-align: center; max-width: 360px; width: 100%; }
.login-card h1 { font-size: 20px; margin-bottom: 8px; color: #1F3D23; }
.login-card p { font-size: 13px; color: #7a7570; margin-bottom: 28px; line-height: 1.7; }
.btn-google { display: flex; align-items: center; justify-content: center; gap: 10px; background: #fff; color: #3c4043; border: 1px solid #dadce0; border-radius: 8px; padding: 11px 20px; font-size: 14px; font-weight: bold; cursor: pointer; width: 100%; }
.btn-google:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.12); }

.header { background: #fdfbf8; border-bottom: 1px solid #e2ddd6; padding: 0 32px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
.logo { font-size: 15px; font-weight: bold; color: #3d6b5a; }
.header-right { display: flex; align-items: center; gap: 12px; }
.user-email { font-size: 12px; color: #7a7570; }

.status-bar { height: 36px; background: #e8f0ec; border-bottom: 1px solid #e2ddd6; display: flex; align-items: center; padding: 0 32px; font-size: 12px; color: #3d6b5a; gap: 8px; }
.status-bar.error { background: #fce8eb; color: #9b2335; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.layout { display: grid; grid-template-columns: 280px 1fr; height: calc(100vh - 97px); }

.sidebar { background: #fdfbf8; border-right: 1px solid #e2ddd6; display: flex; flex-direction: column; overflow: hidden; }
.sidebar-header { padding: 16px 20px; border-bottom: 1px solid #e2ddd6; display: flex; align-items: center; justify-content: space-between; }
.sidebar-header h2 { font-size: 12px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: #7a7570; }
.post-list { flex: 1; overflow-y: auto; padding: 8px; }
.post-item { padding: 12px 14px; border-radius: 10px; cursor: pointer; border: 1px solid transparent; margin-bottom: 4px; }
.post-item:hover { background: #f5f2ed; }
.post-item.active { background: #e8f0ec; border-color: #3d6b5a; }
.post-item-title { font-size: 13px; font-weight: bold; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.post-item-meta { font-size: 11px; color: #7a7570; }
.badge { display: inline-block; padding: 1px 7px; border-radius: 20px; font-size: 10px; }
.badge-pub { background: #d4edda; color: #1a6632; }
.badge-draft { background: #f3f4f6; color: #6b7280; }
.empty { text-align: center; padding: 40px 20px; color: #7a7570; font-size: 12px; }

.editor { display: flex; flex-direction: column; overflow: hidden; }
.editor-toolbar { padding: 12px 28px; border-bottom: 1px solid #e2ddd6; display: flex; gap: 8px; background: #fdfbf8; flex-wrap: wrap; align-items: center; }
.editor-body { flex: 1; overflow-y: auto; padding: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
.editor-left, .editor-right { display: flex; flex-direction: column; gap: 20px; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 11px; font-weight: bold; letter-spacing: 0.08em; text-transform: uppercase; color: #7a7570; }
input[type="text"], textarea { font-size: 14px; padding: 10px 14px; border: 1px solid #e2ddd6; border-radius: 10px; background: #fdfbf8; color: #2c2c2c; width: 100%; }
input[type="text"]:focus, textarea:focus { outline: none; border-color: #3d6b5a; box-shadow: 0 0 0 3px rgba(61,107,90,0.12); }
textarea { resize: vertical; min-height: 200px; line-height: 1.8; }

.tag-preview { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.tag-chip { font-size: 12px; color: #355E3B; border: 1px solid #b8d4be; border-radius: 20px; padding: 2px 10px; background: #edf7ef; }

.select-field { font-size: 14px; padding: 10px 14px; border: 1px solid #e2ddd6; border-radius: 10px; background: #fdfbf8; color: #2c2c2c; width: 100%; cursor: pointer; }
.select-field:focus { outline: none; border-color: #3d6b5a; box-shadow: 0 0 0 3px rgba(61,107,90,0.12); }

.cta-preview { margin-top: 12px; }
.cta-preview-label { font-size: 11px; color: #7a7570; margin-bottom: 8px; }
.cta-preview-box { background: #1F3D23; border-radius: 10px; padding: 20px 24px; }
.cta-preview-text { font-size: 13px; color: rgba(255,255,255,0.8); margin-bottom: 12px; }
.cta-preview-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.cta-preview-btn-primary { font-size: 12px; background: #fff; color: #3d6b5a; padding: 7px 16px; border-radius: 6px; font-weight: bold; }
.cta-preview-btn-line { font-size: 12px; background: #06C755; color: #fff; padding: 7px 16px; border-radius: 6px; font-weight: bold; }

.preview-box { border: 1px solid #e2ddd6; border-radius: 10px; padding: 14px 16px; min-height: 100px; background: #f5f2ed; white-space: pre-wrap; line-height: 1.9; font-size: 13px; color: #4b5563; flex: 1; overflow-y: auto; }
.img-preview { max-width: 100%; border-radius: 10px; border: 1px solid #e2ddd6; margin-top: 8px; }
.no-selection { flex: 1; display: flex; align-items: center; justify-content: center; color: #7a7570; font-size: 14px; }

button { font-size: 13px; font-weight: bold; padding: 9px 18px; border: none; border-radius: 10px; cursor: pointer; }
.btn-primary { background: #3d6b5a; color: #fff; }
.btn-primary:hover { opacity: 0.88; }
.btn-ghost { background: #fdfbf8; color: #2c2c2c; border: 1px solid #e2ddd6; }
.btn-ghost:hover { background: #f5f2ed; }
.btn-danger { background: #9b2335; color: #fff; margin-left: auto; }
.btn-sns { background: #4a6fa5; color: #fff; }
.btn-sns:hover { background: #3b5984; }
.btn-icon { background: none; border: none; padding: 6px 8px; color: #7a7570; font-size: 16px; border-radius: 6px; cursor: pointer; }

/* モーダル */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-card { background: #fdfbf8; width: 90%; max-width: 600px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
.modal-header { padding: 20px; border-bottom: 1px solid #e2ddd6; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { font-size: 16px; color: #3d6b5a; }
.btn-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #7a7570; padding: 0; }
.modal-body { padding: 24px; }
.sns-field { display: flex; flex-direction: column; gap: 6px; }
.url-input-group { display: flex; gap: 8px; margin-top: 4px; }
.url-input-group input { flex: 1; background: #f5f2ed; }
.divider { border: none; border-top: 1px solid #e2ddd6; margin: 24px 0; }
.sns-tabs { display: flex; gap: 4px; margin-bottom: 0; }
.sns-tabs button { flex: 1; padding: 10px; background: #f0ede8; border-radius: 8px 8px 0 0; font-size: 12px; color: #2c2c2c; border: 1px solid #e2ddd6; border-bottom: none; }
.sns-tabs button.active { background: #3d6b5a; color: #fff; border-color: #3d6b5a; }
.sns-content-area textarea { width: 100%; border-radius: 0 0 8px 8px; padding: 16px; font-size: 14px; line-height: 1.6; border: 1px solid #e2ddd6; border-top: none; }
.sns-footer { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #7a7570; }
</style>
