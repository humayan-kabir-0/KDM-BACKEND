// preloadRoute.js
import { lazy } from "react";

export const ROUTES_CONFIG = [
  {
    path: "/project",
    component: lazy(() => import("../pages/Project")),
    label: "Project",
    preload: () => import("../pages/Project"),
  },

  {
    path: "/project-detail/:id",
    component: lazy(() => import("../pages/ProjectDetail")),
    label: "Project Detail",
    preload: () => import("../pages/ProjectDetail"),
  },

  {
    path: "/admin",
    component: lazy(() => import("../pages/Admin")),
    label: "Admin",
    preload: () => import("../pages/Admin"),
  },
  {
    path: "/contact",
    component: lazy(() => import("../sections/Contact")),
    label: "Contact",
    preload: () => import("../sections/Contact"),
  },
];





const preloaded = new Set();

export function preloadRoute(path) {
  if (preloaded.has(path)) return;
  const route = ROUTES_CONFIG.find((r) => r.path === path);
  if (route?.preload) {
    preloaded.add(path);
    route.preload().catch(() => {
      preloaded.delete(path);
    });
  }
}

export function preloadAllRoutes() {
  ROUTES_CONFIG.forEach((r) => preloadRoute(r.path));
}
