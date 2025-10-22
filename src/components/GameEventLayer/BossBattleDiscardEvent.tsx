import React, { useState } from 'react';
import { useGameContext } from "../../contexts/GameContext";
import type { GameEventData } from "../../entities/GameEventSystem";
import type { Card } from "../../entities";

// BOSS战斗弃牌事件数据类型
interface BossBattleDiscardEventData {
  // 可以添加特定于BOSS战斗弃牌事件的属性
}

interface BossBattleDiscardEventProps {
  eventData: GameEventData<BossBattleDiscardEventData>;
  onComplete: (result: { discardedCards: Card[] }) => void;
}

const BossBattleDiscardEvent: React.FC<BossBattleDiscardEventProps> = ({ onComplete }) => {
  const { gameInstance } = useGameContext();
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  
  const player = gameInstance?.getCurrentPlayer();
  
  const handleDiscardCard = () => {
    if (selectedCardId !== null) {
      const discardedCard = player?.getCard(selectedCardId);
      onComplete({ discardedCards: discardedCard ? [discardedCard] : [] });
    }
  };
  
  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">BOSS战斗 - 弃牌撤退</h2>
      <p className="mb-4">请选择一张卡片弃掉以撤退</p>
      
      <div className="grid grid-cols-3 gap-2 mb-4 w-full">
        {player?.cards.map((card: Card) => (
          <button
            key={card.id}
            className={`p-2 border rounded ${selectedCardId === card.id ? 'bg-red-200 border-red-500' : 'bg-white border-gray-300'}`}
            onClick={() => setSelectedCardId(card.id)}
          >
            <div>{card.name}</div>
            <div className="text-sm">{card.type === 'energy' ? `能量: ${card.value}` : '法术卡'}</div>
          </button>
        ))}
      </div>
      
      <button
        className={`bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2 ${selectedCardId === null ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleDiscardCard}
        disabled={selectedCardId === null}
      >
        确认弃牌撤退
      </button>
    </div>
  );
};

export default BossBattleDiscardEvent;
