import React, { useState } from 'react';
import { useGameContext } from '../../contexts/GameContext';
import type { GameEventData } from '../../entities/GameEventSystem';

// 交换位置事件数据类型
interface SpellSwapPositionEventData {
  // 可以添加特定于交换位置事件的属性
}

interface SpellSwapPositionEventProps {
  eventData: GameEventData<SpellSwapPositionEventData>;
  onComplete: (result: { targetPlayerId: number }) => void;
}

const SpellSwapPositionEvent: React.FC<SpellSwapPositionEventProps> = ({ onComplete }) => {
  const { gameInstance } = useGameContext();
  const [targetPlayerId, setTargetPlayerId] = useState<number | null>(null);

  if (!gameInstance) return null;

  const gameState = gameInstance.toJSON();
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const handleSubmit = () => {
    if (targetPlayerId !== null) {
      onComplete({ targetPlayerId });
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">交换位置：选择要交换位置的玩家</h2>
      <div className="space-y-2 w-full">
        {gameState.players
          .filter(player => player.id !== currentPlayer.id)
          .map(player => (
            <div
              key={player.id}
              className={`p-2 rounded cursor-pointer ${
                targetPlayerId === player.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => setTargetPlayerId(player.id)}
            >
              {player.name}
            </div>
          ))}
      </div>
      <button
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 disabled:bg-gray-400"
        onClick={handleSubmit}
        disabled={targetPlayerId === null}
      >
        确认交换
      </button>
    </div>
  );
};

export default SpellSwapPositionEvent;
