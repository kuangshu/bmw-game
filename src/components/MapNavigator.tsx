import React, { useRef, useEffect, useState } from "react";
import { useGameContext } from "../contexts/GameContext";
import { TileType } from "../entities/Tile";

interface MapNavigatorProps {
  className?: string;
}

const MapNavigator: React.FC<MapNavigatorProps> = ({ className = "" }) => {
  const { gameInstance } = useGameContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  // 从gameInstance获取游戏状态
  const gameState = gameInstance
    ? gameInstance.toJSON()
    : {
        players: [],
        currentPlayerIndex: 0,
        gameStarted: false,
        gameOver: false,
        winner: null,
      };

  // 从gameInstance获取tiles
  const tiles = gameInstance ? gameInstance.gameBoard.tiles : [];

  // 检查是否需要滚动
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setIsScrollable(scrollWidth > clientWidth);
      }
    };

    checkScrollable();
    window.addEventListener("resize", checkScrollable);
    return () => window.removeEventListener("resize", checkScrollable);
  }, [tiles]);

  // 自动滚动到当前玩家位置
  useEffect(() => {
    if (scrollContainerRef.current && gameState.players.length > 0) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const tileElements =
        scrollContainerRef.current.querySelectorAll(".map-tile");

      if (tileElements[currentPlayer.position]) {
        const targetElement = tileElements[
          currentPlayer.position
        ] as HTMLElement;
        const containerRect =
          scrollContainerRef.current.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        // 计算需要滚动的距离，使当前玩家位置居中
        const scrollLeft =
          targetRect.left -
          containerRect.left -
          containerRect.width / 2 +
          targetRect.width / 2;

        scrollContainerRef.current.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [gameState.currentPlayerIndex, gameState.players]);

  // 获取格子类型的颜色
  const getTileColor = (type: TileType): string => {
    switch (type) {
      case "empty":
        return "bg-gray-300";
      case "treasure":
        return "bg-yellow-400";
      case "reverse":
        return "bg-purple-400";
      case "supply":
        return "bg-green-400";
      case "boss":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  // 获取格子类型的图标
  const getTileIcon = (type: TileType): string => {
    switch (type) {
      case "empty":
        return "";
      case "treasure":
        return "💎";
      case "reverse":
        return "🔄";
      case "supply":
        return "📦";
      case "boss":
        return "👹";
      default:
        return "";
    }
  };

  // 获取玩家颜色
  const getPlayerColor = (playerIndex: number): string => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
    ];
    return colors[playerIndex % colors.length];
  };

  if (!gameState.gameStarted || tiles.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white border-t border-gray-200 p-2 ${className}`}>
      <div className="text-xs font-semibold text-gray-700 mb-1">地图导览</div>
      <div className="relative">
        {isScrollable && (
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        )}
        {isScrollable && (
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        )}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide py-2 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex space-x-1 min-w-max">
            {tiles.map((tile, index) => (
              <div
                key={index}
                className={`map-tile relative flex flex-col items-center justify-center w-8 h-8 rounded ${getTileColor(
                  tile.type,
                )} text-xs`}
              >
                {getTileIcon(tile.type)}
                {/* 显示玩家位置 */}
                {gameState.players.map(
                  (player, playerIndex) =>
                    player.position === index && (
                      <div
                        key={playerIndex}
                        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getPlayerColor(
                          playerIndex,
                        )} border border-white ${
                          playerIndex === gameState.currentPlayerIndex
                            ? "ring-2 ring-offset-1 ring-blue-400"
                            : ""
                        }`}
                        title={player.name}
                      ></div>
                    ),
                )}
                {/* 显示格子编号 */}
                <div className="absolute -bottom-4 text-xs text-gray-500">
                  {index}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 图例 */}
      <div className="flex flex-wrap gap-2 mt-6 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-300 rounded mr-1"></div>
          <span className="text-gray-600">普通</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-400 rounded mr-1"></div>
          <span className="text-gray-600">宝箱</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-400 rounded mr-1"></div>
          <span className="text-gray-600">反转</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-400 rounded mr-1"></div>
          <span className="text-gray-600">补给</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
          <span className="text-gray-600">BOSS</span>
        </div>
      </div>
    </div>
  );
};

export default MapNavigator;
