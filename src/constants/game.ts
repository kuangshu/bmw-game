// 游戏常量配置
export const PLAYER_ROLES = [
  "destiny",
  "sister_four",
  "pigsy",
  "big_bird",
  "thief",
  "milkshake",
] as const;

export type PlayerRole = (typeof PLAYER_ROLES)[number];

// 角色信息配置
export const ROLE_INFO = {
  destiny: {
    name: "天命人",
    description: "拥有天命之力，每次掷骰子时有一定概率获得额外点数",
    color: "bg-blue-100 border-blue-300",
  },
  sister_four: {
    name: "四妹",
    description: "擅长策略，可以查看前方一定距离的格子信息",
    color: "bg-pink-100 border-pink-300",
  },
  pigsy: {
    name: "猪八戒",
    description: "力量强大，可以破坏前方的障碍物",
    color: "bg-orange-100 border-orange-300",
  },
  big_bird: {
    name: "大鸟姐姐",
    description: "飞行能力，可以跳过一定数量的格子",
    color: "bg-purple-100 border-purple-300",
  },
  thief: {
    name: "神偷大盗",
    description: "偷窃技巧，可以从其他玩家手中获取资源",
    color: "bg-gray-100 border-gray-300",
  },
  milkshake: {
    name: "奶昔大哥",
    description: "恢复能力，可以治疗自己和其他玩家",
    color: "bg-green-100 border-green-300",
  },
} as const;

// 游戏配置常量
export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  STARTING_CARDS: 4,
} as const;
