import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/game", "routes/api.game.ts"),
  route("api/game/events", "routes/api.game.events.ts"),
  route("api/ranking", "routes/api.ranking.ts")
] satisfies RouteConfig;
