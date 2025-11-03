import React, { useState, useRef, useEffect } from "react";
import DiceRoller from "./DiceRoller";
import PlayerHand from "./PlayerHand";
import MapNavigator from "./MapNavigator";
import { useGameContext } from "../contexts/GameContext";

interface CollapsibleDrawerProps {
  className?: string;
}

const CollapsibleDrawer: React.FC<CollapsibleDrawerProps> = ({ className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [drawerHeight, setDrawerHeight] = useState("50vh");
  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const { gameInstance, restartGame } = useGameContext();

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

  // 处理拖拽调整抽屉高度
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startHeight.current = drawerRef.current?.offsetHeight || 0;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = startY.current - e.clientY;
      const newHeight = Math.max(150, Math.min(window.innerHeight * 0.8, startHeight.current + deltaY));
      setDrawerHeight(`${newHeight}px`);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // 切换抽屉展开/收起状态
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!gameState.gameStarted) {
    return null;
  }

  return (
    <div
      ref={drawerRef}
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg transition-all duration-300 z-20 ${className}`}
      style={{ height: isExpanded ? drawerHeight : "60px" }}
    >
      {/* 拖拽手柄 */}
      <div
        className="absolute top-0 left-0 right-0 h-4 flex items-center justify-center cursor-ns-resize bg-gray-100 border-b border-gray-200"
        onMouseDown={handleMouseDown}
      >
        <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
      </div>

      {/* 抽屉内容 */}
      <div className="h-full overflow-hidden flex flex-col">
        {/* 收起/展开按钮和标题 */}
        <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={toggleExpanded}
              className="p-1 mr-2 text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <h3 className="text-sm font-medium text-gray-800">游戏控制</h3>
          </div>
          <button
            onClick={restartGame}
            className="text-xs text-red-600 hover:text-red-700 focus:outline-none"
          >
            重新开始
          </button>
        </div>

        {/* 地图导览区域 - 始终显示 */}
        <MapNavigator className="border-b border-gray-200" />

        {/* 可展开的内容区域 */}
        <div
          className={`flex-1 overflow-auto transition-all duration-300 ${isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}
        >
          <div className="p-3 space-y-4">
            {/* 当前玩家信息 */}
            {gameState.players.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-blue-800">
                  当前玩家: {gameState.players[gameState.currentPlayerIndex]?.name}
                </div>
                <div className="text-xs text-blue-600">
                  位置: {gameState.players[gameState.currentPlayerIndex]?.position}
                </div>
              </div>
            )}

            {/* 骰子区域 */}
            <div>
              <DiceRoller />
            </div>

            {/* 玩家手牌区域 */}
            <div>
              <PlayerHand />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleDrawer;