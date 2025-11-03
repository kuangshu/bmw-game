import { useGameContext } from "./contexts/GameContext";
import WebGLBoard from "./components/WebGLBoard";
import CollapsibleDrawer from "./components/CollapsibleDrawer";

function AppContent() {
  const { gameInstance, initializeGame, restartGame } = useGameContext();

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

  if (!gameState.gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 p-4">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800">
            骰子闯关游戏
          </h1>
          <p className="mb-4 md:mb-6 text-gray-600 text-sm md:text-base">
            选择玩家数量开始游戏
          </p>
          <div className="space-y-3 md:space-y-4">
            {[2, 3, 4, 5, 6].map((count) => (
              <button
                key={count}
                onClick={() => initializeGame(count)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 md:py-3 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-base"
              >
                {count} 人游戏
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 游戏结束界面
  if (gameState.gameOver && gameState.winner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-4">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-green-600">
            🎉 游戏结束！
          </h1>
          <div className="mb-6">
            <div className="text-xl font-semibold text-gray-800">
              获胜者：{gameState.winner.name}
            </div>
            <div className="text-gray-600 mt-2">恭喜获得胜利！</div>
          </div>
          <button
            onClick={restartGame}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg transition-colors"
          >
            重新开始游戏
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* 顶部地图区域 */}
      <div className="flex-1 relative">
        <WebGLBoard />
      </div>

      {/* 底部可收起抽屉 */}
      <CollapsibleDrawer />
    </div>
  );
}

import { GameProvider } from "./contexts/GameContext";

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
