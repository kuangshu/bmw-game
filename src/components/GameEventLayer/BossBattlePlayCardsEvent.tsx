import React, { useState } from "react";
import { useGameContext } from "../../contexts/GameContext";
import type { GameEventData } from "../../entities/GameEventSystem";
import type { Card } from "../../entities";

// BOSS战斗出牌事件数据类型
export type BossBattlePlayCardsPayload = [
  { requirement: number },
  { playedCards: Card[]; defeatedBoss: boolean },
];

interface BossBattlePlayCardsEventProps {
  eventData: GameEventData<BossBattlePlayCardsPayload[0]>;
  onComplete: (result: BossBattlePlayCardsPayload[1]) => void;
}

const BossBattlePlayCardsEvent: React.FC<BossBattlePlayCardsEventProps> = ({
  eventData,
  onComplete,
}) => {
  const { gameInstance } = useGameContext();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const player = gameInstance?.getCurrentPlayer();
  const requirement = eventData.eventData?.requirement || 0;

  const handleCardSelect = (cardId: number) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId],
    );
  };

  const handlePlayCards = () => {
    const playedCards = selectedCards
      .map((cardId) => player?.getCard(cardId))
      .filter(Boolean) as Card[];

    // 计算总能量，包括能量卡和事件卡
    let totalEnergy = 0;
    selectedCards.forEach((cardId) => {
      const card = player?.getCard(cardId);
      if (card) {
        if (card.type === "energy") {
          totalEnergy += card.value;
        } else if (card.type === "event") {
          totalEnergy += card.value;
        }
      }
    });

    // 判断是否击败BOSS
    const defeatedBoss = totalEnergy >= requirement;

    onComplete({ playedCards, defeatedBoss });
  };

  const handleDiscard = () => {
    const playedCards = selectedCards
      .map((cardId) => player?.getCard(cardId))
      .filter(Boolean) as Card[];

    // 弃牌撤退，视为未击败BOSS
    onComplete({ playedCards, defeatedBoss: false });
  };

  // 计算选中卡片的总能量，包括能量卡和事件卡
  const calculateTotalEnergy = () => {
    let total = 0;
    selectedCards.forEach((cardId) => {
      const card = player?.getCard(cardId);
      if (card) {
        if (card.type === "energy") {
          total += card.value;
        } else if (card.type === "event") {
          total += card.value;
        }
      }
    });
    return total;
  };

  const totalEnergy = calculateTotalEnergy();
  const hasEnoughEnergy = totalEnergy >= requirement;

  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">BOSS战斗 - 出牌</h2>
      <p className="mb-4">
        需要 {requirement} 点能量，当前已选：{totalEnergy} 点
      </p>

      <div className="grid grid-cols-3 gap-2 mb-4 w-full">
        {player?.cards.map((card: Card) => (
          <button
            key={card.id}
            className={`p-2 border rounded ${selectedCards.includes(card.id) ? "bg-blue-200 border-blue-500" : "bg-white border-gray-300"}`}
            onClick={() => handleCardSelect(card.id)}
          >
            <div>{card.name}</div>
            <div className="text-sm">
              {card.type === "energy"
                ? `能量: ${card.value}`
                : card.type === "event"
                  ? `事件卡: ${card.value}`
                  : "法术卡"}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          className={`bg-green-500 hover:bg-green-600 text-white rounded px-4 py-2 ${!hasEnoughEnergy ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handlePlayCards}
          disabled={!hasEnoughEnergy}
        >
          出牌攻击
        </button>
        <button
          className={`bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2 ${selectedCards.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleDiscard}
          disabled={selectedCards.length === 0}
        >
          弃牌撤退
        </button>
      </div>
    </div>
  );
};

export default BossBattlePlayCardsEvent;
