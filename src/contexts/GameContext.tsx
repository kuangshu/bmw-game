import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { DiceResult } from "../entities/Dice";
import { Game } from "../entities/Game";

interface GameContextType {
  // 刷新状态
  refresh: number;

  // 游戏核心状态（只保留gameInstance）
  gameInstance: Game | null;

  // 设备信息
  isMobile: boolean;

  // 游戏操作
  initializeGame: (playerCount: number, aiPlayerCount?: number) => void;
  restartGame: () => void;
  rollDice: () => void;
  endTurn: () => void;
  forceUpdate: () => void;

  // AI相关
  isCurrentPlayerAI: () => boolean;

  // 骰子投掷次数相关
  getDiceRollCount: () => number;
  canRollDice: () => boolean;
  getDiceResult: () => DiceResult | null;
  getIsRolling: () => boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [refresh, setRefresh] = useState(0);
  // 游戏核心状态（只保留gameInstance）
  const [gameInstance, setGameInstance] = useState<Game | null>(null);

  // 设备信息
  const [isMobile, setIsMobile] = useState(false);

  // 检测设备类型
  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // 初始化游戏（异步方法，支持角色选择）
  const initializeGame = async (
    playerCount: number,
    aiPlayerCount?: number,
  ) => {
    const game = new Game();
    setGameInstance(game);

    // 订阅UI_REFRESH事件，当游戏状态改变时刷新UI
    game.eventSystem.subscribe("UI_REFRESH", () => {
      forceUpdate();
    });

    await game.initialize(playerCount, aiPlayerCount);
  };

  // 重新开始游戏
  const restartGame = () => {
    setGameInstance(null);
  };

  // 掷骰子逻辑
  const rollDice = async () => {
    if (!gameInstance || !canRollDice()) return;

    try {
      // 使用Game实例的rollDice方法
      const result = await gameInstance.rollDice();

      // 处理骰子结果
      await gameInstance.processDiceRoll(result);

      // 增加骰子投掷次数
      gameInstance.incrementDiceRollCount();

      // 更新gameInstance以触发重新渲染
      forceUpdate();
    } catch (error) {
      console.error("处理骰子结果时出错:", error);
      alert("游戏处理出现错误");
    }
  };

  // 获取当前玩家的骰子投掷次数
  const getDiceRollCount = (): number => {
    return gameInstance ? gameInstance.getDiceRollCount() : 0;
  };

  // 检查是否可以投掷骰子（默认每回合1次，使用法术卡后可以额外增加次数）
  const canRollDice = (): boolean => {
    if (!gameInstance) return false;
    return gameInstance.canRollDice();
  };

  // 获取当前骰子结果
  const getDiceResult = (): DiceResult | null => {
    return gameInstance ? gameInstance.getDiceResult() : null;
  };

  // 获取是否正在摇骰子
  const getIsRolling = (): boolean => {
    return gameInstance ? gameInstance.dice.isRolling : false;
  };

  // 检查当前玩家是否为AI
  const isCurrentPlayerAI = (): boolean => {
    return gameInstance ? gameInstance.isCurrentPlayerAI() : false;
  };

  const endTurn = () => {
    if (gameInstance) {
      gameInstance.nextTurn();
      forceUpdate();
    }
  };

  // 强制更新组件
  const forceUpdate = () => {
    setRefresh((prev) => prev + 1);
  };

  const value: GameContextType = {
    // 游戏核心状态
    gameInstance,

    // 设备信息
    isMobile,

    // 游戏操作
    initializeGame,
    restartGame,
    rollDice,
    endTurn,
    forceUpdate,

    // AI相关
    isCurrentPlayerAI,

    // 骰子投掷次数相关
    getDiceRollCount,
    canRollDice,
    getDiceResult,
    getIsRolling,

    // 刷新状态
    refresh,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
