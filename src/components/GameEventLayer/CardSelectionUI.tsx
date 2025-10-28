import React, { useState } from "react";
import type { Card } from "../../entities/Player";

// 定义事件数据类型
// 玩家选择事件数据类型
export type CardSelectionPayload = [
  {
    cards: Card[]; // 可选择的卡牌数组
    minSelection: number; // 最小选择数量
    maxSelection: number; // 最大选择数量
    isHidden?: boolean; // 是否遮挡卡牌信息
    title?: string; // 标题
    description?: string; // 描述
  },
  { selectedCardIds: number[] },
];

interface CardSelectionUIProps {
  eventData: CardSelectionPayload[0];
  onComplete: (result: CardSelectionPayload[1]) => void;
}

const CardSelectionUI: React.FC<CardSelectionUIProps> = ({
  eventData,
  onComplete,
}) => {
  const { cards, minSelection, maxSelection, isHidden, title, description } =
    eventData;
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);

  // 处理卡牌选择/取消选择
  const handleToggleCard = (cardId: number) => {
    // 如果已达到最大选择数量且点击的是未选中的卡牌，则不处理
    if (
      selectedCardIds.length >= maxSelection &&
      !selectedCardIds.includes(cardId)
    ) {
      return;
    }

    if (selectedCardIds.includes(cardId)) {
      // 取消选择
      setSelectedCardIds(selectedCardIds.filter((id) => id !== cardId));
    } else {
      // 选择卡牌
      setSelectedCardIds([...selectedCardIds, cardId]);
    }
  };

  // 处理确认选择
  const handleConfirm = () => {
    // 检查是否满足最小选择数量
    if (selectedCardIds.length >= minSelection) {
      onComplete({ selectedCardIds });
    }
  };

  // 处理取消选择
  const handleCancel = () => {
    onComplete({ selectedCardIds: [] });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 min-w-[320px] max-w-md w-full mx-4 shadow-xl border border-indigo-100">
      <div className="text-center mb-6">
        <h2 className="font-bold text-2xl mb-2 text-indigo-800">
          {title || "选择卡牌"}
        </h2>
        {description && <p className="text-gray-600">{description}</p>}
        <p className="text-sm text-gray-500 mt-2">
          选择 {minSelection} 到 {maxSelection} 张卡牌
        </p>
      </div>

      {/* 卡牌列表 */}
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2 bg-white/50 rounded-lg border border-indigo-100">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
              selectedCardIds.includes(card.id)
                ? "border-indigo-500 bg-indigo-50 shadow-md"
                : "border-gray-200 hover:border-indigo-300 bg-white"
            }`}
            onClick={() => handleToggleCard(card.id)}
          >
            {isHidden ? (
              // 遮挡卡牌信息
              <div className="flex flex-col items-center">
                <div className="w-12 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">?</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">未知卡牌</div>
              </div>
            ) : (
              // 显示卡牌信息
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-gray-800 truncate">
                  {card.name}
                </h3>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {card.description}
                </p>
                <div className="mt-2 flex justify-between items-center">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      card.type === "energy"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {card.type === "energy" ? "能量" : "法术"}
                  </span>
                  {card.type === "energy" && (
                    <span className="text-xs font-bold text-gray-700">
                      {card.value}
                    </span>
                  )}
                </div>
              </div>
            )}
            {selectedCardIds.includes(card.id) && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
        ))}

        {cards.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-500">
            没有可选择的卡牌
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-center space-x-3 mt-6">
        <button
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          onClick={handleConfirm}
          disabled={selectedCardIds.length < minSelection}
        >
          确认选择 ({selectedCardIds.length}/{maxSelection})
        </button>
        <button
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          onClick={handleCancel}
        >
          取消
        </button>
      </div>
    </div>
  );
};

export default CardSelectionUI;
