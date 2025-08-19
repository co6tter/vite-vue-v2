<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="loading" class="flex justify-center py-8">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
      ></div>
    </div>

    <div v-else-if="error" class="text-red-600 text-center py-8">
      {{ error }}
      <div class="mt-4">
        <button
          @click="goBack"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          一覧に戻る
        </button>
      </div>
    </div>

    <div v-else-if="item">
      <nav class="mb-6">
        <button
          @click="goBack"
          class="text-blue-500 hover:text-blue-700 flex items-center"
        >
          ← 一覧に戻る
        </button>
      </nav>

      <article class="bg-white rounded-lg shadow-md p-8">
        <header class="mb-6">
          <div class="flex justify-between items-start mb-4">
            <h1 class="text-3xl font-bold text-gray-900">
              {{ item.title }}
            </h1>
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'px-3 py-1 text-sm font-medium rounded-full',
                  getStatusColor(item.status),
                ]"
              >
                {{ item.status }}
              </span>
              <button
                v-if="item.status !== 'Done'"
                @click="approveItem"
                :disabled="isUpdatingStatus"
                class="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ isUpdatingStatus ? "処理中..." : "承認" }}
              </button>
            </div>
          </div>
          <p class="text-lg text-gray-600 mb-4">{{ item.description }}</p>

          <div class="flex items-center gap-3 mb-4">
            <div class="relative">
              <div
                :class="[
                  'w-8 h-8 rounded-full border-2 border-gray-200 shadow-md',
                ]"
                :style="{ backgroundColor: getTagColorHex(item.tag) }"
              ></div>
              <select
                :value="item.tag"
                @change="
                  updateItemTag(
                    item.id,
                    ($event.target as HTMLSelectElement).value as TagColor
                  )
                "
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option
                  v-for="tagColor in allTagColors"
                  :key="tagColor"
                  :value="tagColor"
                >
                  {{ getColorName(tagColor) }}
                </option>
              </select>
            </div>
          </div>

          <div class="text-sm text-gray-500">
            作成日: {{ formatDate(item.createdAt) }}
          </div>
        </header>

        <main class="prose max-w-none">
          <div class="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {{ item.content }}
          </div>
        </main>
      </article>

      <nav class="mt-8 flex justify-between items-center">
        <div class="flex-1">
          <button
            v-if="prevItem"
            @click="goToPrevious"
            class="group flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <span class="text-gray-500">←</span>
            <div class="text-left">
              <div class="text-xs text-gray-500">前の記事</div>
            </div>
          </button>
        </div>

        <div class="flex-1 flex justify-end">
          <button
            v-if="nextItem"
            @click="goToNext"
            class="group flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <div class="text-right">
              <div class="text-xs text-gray-500">次の記事</div>
            </div>
            <span class="text-gray-500">→</span>
          </button>
        </div>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  mockApi,
  type Item,
  type Status,
  type TagColor,
} from "@/services/mockApi";

const route = useRoute();
const router = useRouter();

const item = ref<Item | undefined>(undefined);
const prevItem = ref<Item | undefined>(undefined);
const nextItem = ref<Item | undefined>(undefined);
const loading = ref(false);
const error = ref<string | undefined>(undefined);
const searchResultIds = ref<number[]>([]);
const allTagColors = ref<TagColor[]>([]);
const isUpdatingStatus = ref(false);

const fetchItem = async (id: number) => {
  loading.value = true;
  error.value = undefined;

  try {
    const [itemData] = await Promise.all([mockApi.getItemById(id)]);

    if (!itemData) {
      error.value = "アイテムが見つかりませんでした";
      return;
    }

    item.value = itemData;

    // 現在の検索条件でフィルタリングされた結果を再取得
    await refreshSearchResults();

    // 前後のアイテムを取得
    const filteredIds =
      searchResultIds.value.length > 0 ? searchResultIds.value : undefined;
    const adjacentItems = await mockApi.getAdjacentItems(id, filteredIds);
    prevItem.value = adjacentItems.prev;
    nextItem.value = adjacentItems.next;
  } catch (err) {
    error.value = "データの取得に失敗しました";
    console.error("Error fetching item:", err);
  } finally {
    loading.value = false;
  }
};

const fetchTagColors = async () => {
  try {
    allTagColors.value = await mockApi.getAllTagColors();
  } catch (err) {
    console.error("Error fetching tag colors:", err);
  }
};

const refreshSearchResults = async () => {
  // 現在のクエリパラメータから検索条件を取得
  const searchQuery = (route.query.search as string) || "";
  const statuses = route.query.statuses
    ? ((route.query.statuses as string).split(",") as any[])
    : [];
  const tag = (route.query.tag as TagColor) || "";

  // 検索条件がある場合のみ検索結果を更新
  if (searchQuery || statuses.length > 0 || tag) {
    try {
      const searchParams = {
        query: searchQuery || undefined,
        statuses: statuses.length > 0 ? statuses : undefined,
        tagColor: tag || undefined,
      };

      const response = await mockApi.getItems(1, 1000, searchParams);
      searchResultIds.value = response.allIds || [];
    } catch (err) {
      console.error("Error refreshing search results:", err);
    }
  }
};

const updateItemTag = async (itemId: number, tagColor: TagColor) => {
  if (!item.value) return;

  try {
    // リアルタイムでUIを更新
    const originalTag = item.value.tag;
    item.value.tag = tagColor;

    // バックグラウンデでAPI更新
    const updatedItem = await mockApi.updateItemTag(itemId, tagColor);
    if (!updatedItem) {
      // APIエラーの場合は元に戻す
      item.value.tag = originalTag;
    }
  } catch (err) {
    console.error("タグの更新に失敗しました:", err);
    // エラー時は元の状態に戻す
    const originalItem = await mockApi.getItemById(itemId);
    if (originalItem) {
      item.value = originalItem;
    }
  }
};

const approveItem = async () => {
  if (!item.value || isUpdatingStatus.value) return;

  isUpdatingStatus.value = true;

  try {
    // リアルタイムでUIを更新
    const originalStatus = item.value.status;
    item.value.status = "Done";

    // バックグラウンドでAPI更新
    const updatedItem = await mockApi.updateItemStatus(item.value.id, "Done");
    if (!updatedItem) {
      // APIエラーの場合は元に戻す
      item.value.status = originalStatus;
    }
  } catch (err) {
    console.error("ステータスの更新に失敗しました:", err);
    // エラー時は元の状態に戻す
    const originalItem = await mockApi.getItemById(item.value.id);
    if (originalItem) {
      item.value = originalItem;
    }
  } finally {
    isUpdatingStatus.value = false;
  }
};

const goBack = () => {
  const query = { ...route.query };
  delete query.searchIds;
  router.push({ name: "ItemList", query });
};

const goToPrevious = () => {
  if (prevItem.value) {
    router.push({
      name: "ItemDetail",
      params: { id: prevItem.value.id.toString() },
      query: route.query,
    });
  }
};

const goToNext = () => {
  if (nextItem.value) {
    router.push({
      name: "ItemDetail",
      params: { id: nextItem.value.id.toString() },
      query: route.query,
    });
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ja-JP");
};

const getStatusColor = (status: Status) => {
  switch (status) {
    case "ToDo":
      return "bg-gray-100 text-gray-800";
    case "In progress":
      return "bg-blue-100 text-blue-800";
    case "Done":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTagColorHex = (tagColor: TagColor) => {
  switch (tagColor) {
    case "red":
      return "#ef4444";
    case "blue":
      return "#3b82f6";
    case "green":
      return "#10b981";
    case "yellow":
      return "#f59e0b";
    case "purple":
      return "#8b5cf6";
    case "pink":
      return "#ec4899";
    case "indigo":
      return "#6366f1";
    case "gray":
      return "#6b7280";
    default:
      return "#6b7280";
  }
};

const getColorName = (tagColor: TagColor) => {
  switch (tagColor) {
    case "red":
      return "赤";
    case "blue":
      return "青";
    case "green":
      return "緑";
    case "yellow":
      return "黄";
    case "purple":
      return "紫";
    case "pink":
      return "ピンク";
    case "indigo":
      return "藍";
    case "gray":
      return "グレー";
    default:
      return "グレー";
  }
};

watch(
  () => [route.params.id, route.query.searchIds],
  ([newId, newSearchIds]) => {
    if (newSearchIds && typeof newSearchIds === "string") {
      searchResultIds.value = newSearchIds
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n));
    } else {
      searchResultIds.value = [];
    }

    if (newId) {
      const id = parseInt(newId as string, 10);
      if (!isNaN(id)) {
        fetchItem(id);
      } else {
        error.value = "無効なIDです";
      }
    }
  },
  { immediate: true }
);

onMounted(async () => {
  if (route.query.searchIds && typeof route.query.searchIds === "string") {
    searchResultIds.value = route.query.searchIds
      .split(",")
      .map(Number)
      .filter((n) => !isNaN(n));
  }

  await fetchTagColors();

  const id = parseInt(route.params.id as string, 10);
  if (!isNaN(id)) {
    fetchItem(id);
  } else {
    error.value = "無効なIDです";
  }
});
</script>
