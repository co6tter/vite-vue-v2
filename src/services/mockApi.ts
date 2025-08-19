export type Status = "ToDo" | "In progress" | "Done";

export type TagColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "pink"
  | "indigo"
  | "gray"
  | "";

export interface Item {
  id: number;
  title: string;
  description: string;
  content: string;
  status: Status;
  tag: TagColor;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  allIds?: number[]; // 検索結果の全IDリスト（前後ナビ用）
}

export interface SearchParams {
  query?: string;
  category?: string;
  statuses?: Status[];
  tagColor?: TagColor;
}

const statuses: Status[] = ["ToDo", "In progress", "Done"];

const availableTagColors: TagColor[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "pink",
  "indigo",
  "gray",
];

const generateMockItems = (count: number): Item[] => {
  return Array.from({ length: count }, (_, index) => {
    return {
      id: index + 1,
      title: `アイテム ${index + 1}`,
      description: `これはアイテム${
        index + 1
      }の説明文です。サンプルデータとして表示されています。`,
      content: `これはアイテム${
        index + 1
      }の詳細なコンテンツです。ここに長い説明や詳細な情報が含まれます。実際のアプリケーションでは、ここにリッチなコンテンツが表示されるでしょう。`,
      status: statuses[index % 3], // ステータスをランダムに割り当て
      tag: "",
      createdAt: new Date(
        Date.now() - Math.random() * 10000000000
      ).toISOString(),
    };
  });
};

const mockItems: Item[] = generateMockItems(50);

const filterItems = (items: Item[], searchParams?: SearchParams): Item[] => {
  let filteredItems = items;

  // テキスト検索でフィルタリング
  if (searchParams?.query) {
    const query = searchParams.query.toLowerCase();
    filteredItems = filteredItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.tag.toLowerCase().includes(query)
    );
  }

  // ステータスでフィルタリング
  if (searchParams?.statuses && searchParams.statuses.length > 0) {
    filteredItems = filteredItems.filter((item) =>
      searchParams.statuses!.includes(item.status)
    );
  }

  // タグ色でフィルタリング
  if (searchParams?.tagColor) {
    filteredItems = filteredItems.filter(
      (item) => item.tag === searchParams.tagColor
    );
  }

  return filteredItems;
};

export const mockApi = {
  async getItems(
    page: number = 1,
    limit: number = 10,
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Item>> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const filteredItems = filterItems(mockItems, searchParams);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = filteredItems.slice(startIndex, endIndex);

    return {
      data,
      currentPage: page,
      totalPages: Math.ceil(filteredItems.length / limit),
      totalItems: filteredItems.length,
      itemsPerPage: limit,
      allIds: filteredItems.map((item) => item.id), // 検索結果の全IDリスト
    };
  },

  async getItemById(id: number): Promise<Item | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const item = mockItems.find((item) => item.id === id);
    return item;
  },

  async getAdjacentItems(
    currentId: number,
    filteredIds?: number[]
  ): Promise<{ prev: Item | undefined; next: Item | undefined }> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 検索結果のIDリストが提供されている場合はそれを使用
    const targetIds = filteredIds || mockItems.map((item) => item.id);
    const currentIndex = targetIds.findIndex((id) => id === currentId);

    if (currentIndex === -1) {
      return { prev: undefined, next: undefined };
    }

    const prevId = currentIndex > 0 ? targetIds[currentIndex - 1] : undefined;
    const nextId =
      currentIndex < targetIds.length - 1
        ? targetIds[currentIndex + 1]
        : undefined;

    const [prevItem, nextItem] = await Promise.all([
      prevId ? this.getItemById(prevId) : undefined,
      nextId ? this.getItemById(nextId) : undefined,
    ]);

    return {
      prev: prevItem,
      next: nextItem,
    };
  },

  async getAllTagColors(): Promise<TagColor[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return availableTagColors;
  },

  async updateItemTag(
    itemId: number,
    tagColor: TagColor
  ): Promise<Item | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const itemIndex = mockItems.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) {
      return undefined;
    }

    if (tagColor !== "" && !availableTagColors.includes(tagColor)) {
      return undefined;
    }

    mockItems[itemIndex].tag = tagColor;
    return mockItems[itemIndex];
  },

  async updateItemStatus(
    itemId: number,
    status: Status
  ): Promise<Item | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const itemIndex = mockItems.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) {
      return undefined;
    }

    if (!statuses.includes(status)) {
      return undefined;
    }

    mockItems[itemIndex].status = status;
    return mockItems[itemIndex];
  },
};
