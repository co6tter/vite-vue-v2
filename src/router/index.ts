import { createWebHistory, createRouter } from "vue-router";

import ItemList from "@/views/ItemList.vue";
import ItemDetail from "@/views/ItemDetail.vue";

const routes = [
  {
    path: "/",
    name: "ItemList",
    component: ItemList,
  },
  {
    path: "/item/:id",
    name: "ItemDetail",
    component: ItemDetail,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
