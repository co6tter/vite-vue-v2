<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">アイテム一覧</h1>

    <div class="mb-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex gap-4 mb-4">
          <input
            v-model="searchQuery"
            @input="handleSearchInput"
            type="text"
            placeholder="検索キーワードを入力..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            @click="performSearch"
            class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            検索
          </button>
          <button
            v-if="route.query.search || route.query.statuses || route.query.tag"
            @click="clearSearch"
            class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            クリア
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ステータスで絞り込み
            </label>
            <div class="flex gap-4">
              <label
                v-for="status in allStatuses"
                :key="status"
                class="flex items-center cursor-pointer"
              >
                <input
                  v-model="selectedStatuses"
                  :value="status"
                  type="checkbox"
                  class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  @change="performSearch"
                />
                <span class="text-sm text-gray-700">{{ status }}</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              タグで絞り込み
            </label>
            <select
              v-model="selectedTag"
              @change="performSearch"
              class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-24"
            >
              <option value="">—</option>
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
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
      ></div>
    </div>

    <div v-else-if="error" class="text-red-600 text-center py-8">
      {{ error }}
    </div>

    <div v-else>
      <div class="grid gap-6 mb-8">
        <div
          v-for="item in items"
          :key="item.id"
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          @click="goToDetail(item.id)"
        >
          <div class="flex justify-between items-start mb-2">
            <h2 class="text-xl font-semibold text-gray-900">
              {{ item.title }}
            </h2>
            <span
              :class="[
                'px-2 py-1 text-xs font-medium rounded-full',
                getStatusColor(item.status),
              ]"
            >
              {{ item.status }}
            </span>
          </div>
          <p class="text-gray-600 mb-4">{{ item.description }}</p>

          <div class="flex items-center gap-2 mb-3">
            <div class="relative">
              <div
                :class="[
                  'w-6 h-6 rounded-full border-2 border-gray-200 shadow-sm',
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
                @click.stop
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
        </div>
      </div>

      <div class="flex justify-center items-center space-x-2">
        <button
          :disabled="currentPage <= 1"
          @click="changePage(currentPage - 1)"
          class="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
        >
          前へ
        </button>

        <div class="flex space-x-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="changePage(page)"
            :class="[
              'px-3 py-2 rounded-md',
              page === currentPage
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
            ]"
          >
            {{ page }}
          </button>
        </div>

        <button
          :disabled="currentPage >= totalPages"
          @click="changePage(currentPage + 1)"
          class="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
        >
          次へ
        </button>
      </div>

      <div class="text-center text-gray-600 mt-4">
        {{ totalItems }}件中 {{ startItem }} - {{ endItem }}件を表示
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  mockApi,
  type Item,
  type PaginatedResponse,
  type SearchParams,
  type Status,
  type TagColor,
} from "@/services/mockApi";

const route = useRoute();
const router = useRouter();

const items = ref<Item[]>([]);
const loading = ref(false);
const error = ref<string | undefined>(undefined);
const currentPage = ref(1);
const totalPages = ref(0);
const totalItems = ref(0);
const itemsPerPage = ref(10);
const searchQuery = ref("");
const selectedStatuses = ref<Status[]>([]);
const selectedTag = ref<TagColor | "">("");
const searchResultIds = ref<number[]>([]);

const allStatuses: Status[] = ["ToDo", "In progress", "Done"];
const allTagColors = ref<TagColor[]>([]);

const startItem = computed(
  () => (currentPage.value - 1) * itemsPerPage.value + 1
);
const endItem = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, totalItems.value)
);

const visiblePages = computed(() => {
  const range = 5;
  const start = Math.max(1, currentPage.value - Math.floor(range / 2));
  const end = Math.min(totalPages.value, start + range - 1);

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

const fetchItems = async (
  page: number,
  search?: string,
  statuses?: Status[],
  tagColor?: TagColor
) => {
  loading.value = true;
  error.value = undefined;

  try {
    const searchParams: SearchParams | undefined =
      search || statuses || tagColor
        ? { query: search, statuses, tagColor }
        : undefined;
    const response: PaginatedResponse<Item> = await mockApi.getItems(
      page,
      itemsPerPage.value,
      searchParams
    );
    items.value = response.data;
    currentPage.value = response.currentPage;
    totalPages.value = response.totalPages;
    totalItems.value = response.totalItems;
    itemsPerPage.value = response.itemsPerPage;
    searchResultIds.value = response.allIds || [];
  } catch (err) {
    error.value = "データの取得に失敗しました";
    console.error("Error fetching items:", err);
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

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    router.push({ query: { ...route.query, page: page.toString() } });
  }
};

const goToDetail = (id: number) => {
  const query: any = { ...route.query };
  if (searchResultIds.value.length > 0) {
    query.searchIds = searchResultIds.value.join(",");
  }
  router.push({
    name: "ItemDetail",
    params: { id: id.toString() },
    query,
  });
};

const handleSearchInput = () => {
  // 検索入力時の処理（デバウンス等を実装する場合）
};

const performSearch = () => {
  const query: any = {
    ...route.query,
    search: searchQuery.value || undefined,
    statuses:
      selectedStatuses.value.length > 0
        ? selectedStatuses.value.join(",")
        : undefined,
    tag: selectedTag.value || undefined,
    page: "1",
  };
  if (!searchQuery.value) {
    delete query.search;
  }
  if (!selectedStatuses.value.length) {
    delete query.statuses;
  }
  if (!selectedTag.value) {
    delete query.tag;
  }
  router.push({ query });
};

const clearSearch = () => {
  searchQuery.value = "";
  selectedStatuses.value = [];
  selectedTag.value = "";
  const query = { ...route.query };
  delete query.search;
  delete query.statuses;
  delete query.tag;
  delete query.page;
  router.push({ query });
};

const updateItemTag = async (itemId: number, tagColor: TagColor) => {
  try {
    // リアルタイムでUIを更新
    const itemIndex = items.value.findIndex((item) => item.id === itemId);
    if (itemIndex !== -1) {
      items.value[itemIndex].tag = tagColor;
    }

    // バックグラウンデでAPI更新
    const updatedItem = await mockApi.updateItemTag(itemId, tagColor);
    if (!updatedItem) {
      // APIエラーの場合は元に戻す
      if (itemIndex !== -1) {
        const originalItem = await mockApi.getItemById(itemId);
        if (originalItem) {
          items.value[itemIndex] = originalItem;
        }
      }
    }
  } catch (err) {
    console.error("タグの更新に失敗しました:", err);
    // エラー時は元の状態に戻す
    const itemIndex = items.value.findIndex((item) => item.id === itemId);
    if (itemIndex !== -1) {
      const originalItem = await mockApi.getItemById(itemId);
      if (originalItem) {
        items.value[itemIndex] = originalItem;
      }
    }
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
  () => [
    route.query.page,
    route.query.search,
    route.query.statuses,
    route.query.tag,
  ],
  ([newPage, newSearch, newStatuses, newTag]) => {
    const page = newPage ? parseInt(newPage as string, 10) : 1;
    const search = (newSearch as string) || "";
    const statuses = newStatuses
      ? ((newStatuses as string).split(",") as Status[])
      : [];
    const tag = (newTag as TagColor) || "";

    searchQuery.value = search;
    selectedStatuses.value = statuses;
    selectedTag.value = tag;
    fetchItems(page, search, statuses, tag || undefined);
  },
  { immediate: true }
);

onMounted(async () => {
  const page = route.query.page ? parseInt(route.query.page as string, 10) : 1;
  const search = (route.query.search as string) || "";
  const statuses = route.query.statuses
    ? ((route.query.statuses as string).split(",") as Status[])
    : [];
  const tag = (route.query.tag as TagColor) || "";

  searchQuery.value = search;
  selectedStatuses.value = statuses;
  selectedTag.value = tag;

  await fetchTagColors();
  fetchItems(page, search, statuses, tag || undefined);
});
</script>
