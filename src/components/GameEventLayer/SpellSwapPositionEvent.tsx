import React, { useState } from "react";
import { useGameContext } from "../../contexts/GameContext";
import type { GameEventData } from "../../entities/GameEventSystem";

export type SpellSwapPositionPayload = [
  null,
  { targetPlayerId: number; success: boolean },
];

interface SpellSwapPositionEventProps {
  eventData: GameEventData<SpellSwapPositionPayload[0]>;
  onComplete: (result: SpellSwapPositionPayload[1]) => void;
}

const SpellSwapPositionEvent: React.FC<SpellSwapPositionEventProps> = ({
  onComplete,
}) => {
  const { gameInstance } = useGameContext();
  const [targetPlayerId, setTargetPlayerId] = useState<number | null>(null);
  const [showShieldSelection, setShowShieldSelection] = useState(false);

  if (!gameInstance) return null;

  const gameState = gameInstance.toJSON();
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const handleSubmit = () => {
    if (targetPlayerId !== null) {
      // 检查目标玩家是否有spell_shield法术卡
      const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);
      if (targetPlayer) {
        const hasShieldCard = targetPlayer.cards.some(card => 
          card.type === 'spell' && card.effect === 'spell_shield'
        );
        
        if (hasShieldCard) {
          // 目标玩家有spell_shield法术卡，显示选择界面
          setShowShieldSelection(true);
        } else {
          // 目标玩家没有spell_shield法术卡，直接交换位置
          handleSwapPosition(false);
        }
      }
    }
  };

  const handleShieldSelection = (useShield: boolean) => {
    setShowShieldSelection(false);
    handleSwapPosition(useShield);
  };

  const handleSwapPosition = (useShield: boolean) => {
    if (targetPlayerId === null) return;
    
    if (useShield) {
      // 目标玩家使用了spell_shield，交换位置失败
      onComplete({ targetPlayerId, success: false });
    } else {
      // 交换位置成功
      const success = gameInstance.swapPosition(currentPlayer.id, targetPlayerId);
      onComplete({ targetPlayerId, success });
    }
  };

  // 渲染spell_shield选择界面
  if (showShieldSelection) {
    const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);
    return (
      <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
        <h2 className="font-bold text-lg mb-4">铜墙铁壁防御</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          {targetPlayer?.name} 拥有铜墙铁壁法术卡，是否使用来抵消位置交换？
        </p>
        <div className="flex space-x-4 w-full">
          <button
            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2"
            onClick={() => handleShieldSelection(true)}
          >
            使用铜墙铁壁
          </button>
          <button
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2"
            onClick={() => handleShieldSelection(false)}
          >
            允许交换
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">交换位置：选择要交换位置的玩家</h2>
      <div className="space-y-2 w-full">
        {gameState.players
          .filter((player) => player.id !== currentPlayer.id)
          .map((player) => (
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
