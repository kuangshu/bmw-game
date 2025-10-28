import React, { useState } from "react";
import type { GameEventData } from "../../entities/GameEventSystem";
import type { EventCard } from "../../entities/EventCard";
import { useGameContext } from "../../contexts/GameContext";

// 定义事件数据类型
interface EventCardDrawEventData {
  position: number;
}

// 定义组件属性类型
interface EventCardDrawEventProps {
  eventData: GameEventData<EventCardDrawEventData>;
  onComplete: (result: { selectedCardId: number }) => void;
}

// 抽取事件卡组件
const EventCardDrawEvent: React.FC<EventCardDrawEventProps> = ({
  // eventData参数虽然未直接使用，但是作为组件props的一部分，保留以符合接口定义
  eventData: _eventData,
  onComplete,
}) => {
  const { gameInstance } = useGameContext();
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 获取所有事件卡
  const getAllEventCards = (): EventCard[] => {
    if (!gameInstance) return [];
    return [...gameInstance.eventCardDeck.getAllCards()];
  };

  // 处理卡牌选择/取消选择
  const handleToggleCard = (cardId: number) => {
    if (isProcessing) return;
    
    // 如果点击的是已选中的卡牌，则取消选择
    if (selectedCardId === cardId) {
      setSelectedCardId(null);
    } else {
      // 否则选择该卡牌
      setSelectedCardId(cardId);
    }
  };

  // 处理确认选择
  const handleConfirm = () => {
    if (selectedCardId !== null && gameInstance && !isProcessing) {
      setIsProcessing(true);
      // 执行选中的事件卡效果
      gameInstance.eventCardDeck
        .executeEventCard(gameInstance, gameInstance.getCurrentPlayer(), selectedCardId)
        .then(() => {
          // 完成事件
          onComplete({ selectedCardId });
        })
        .catch((error) => {
          console.error("执行事件卡时出错:", error);
          // 即使出错也完成事件，避免卡住游戏流程
          onComplete({ selectedCardId });
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  };

  const eventCards = getAllEventCards();

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 min-w-[320px] max-w-md w-full mx-4 shadow-xl border border-indigo-100">
      <div className="text-center mb-6">
        <h2 className="font-bold text-2xl mb-2 text-indigo-800">事件卡抽取</h2>
        <p className="text-gray-600">
          请选择一张事件卡（点击可选中/取消选中）
        </p>
      </div>
      
      {/* 事件卡列表 - 隐藏具体信息 */}
      <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto p-2 bg-white/50 rounded-lg border border-indigo-100">
        {eventCards.map((card) => (
          <div
            key={card.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
              selectedCardId === card.id
                ? "border-indigo-500 bg-indigo-50 shadow-md"
                : "border-gray-200 hover:border-indigo-300 bg-white"
            } ${isProcessing ? "opacity-70 cursor-not-allowed" : ""}`}
            onClick={() => handleToggleCard(card.id)}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {/* 显示卡牌类型但隐藏具体名称和描述 */}
                  <h3 className="font-bold text-lg text-gray-800">事件卡</h3>
                  {card.keepable && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                      可保留
                    </span>
                  )}
                </div>
                {/* 隐藏卡牌描述 */}
                <p className="text-gray-600 mt-2 text-sm italic">卡牌信息已隐藏</p>
              </div>
              {/* 选中指示器 */}
              {selectedCardId === card.id && (
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* 操作按钮 */}
      <div className="flex justify-center mt-6 gap-3">
        <button
          className={`rounded-lg px-6 py-3 transition-all font-medium flex items-center justify-center ${
            selectedCardId !== null && !isProcessing
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={handleConfirm}
          disabled={selectedCardId === null || isProcessing}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </>
          ) : (
            "确认选择"
          )}
        </button>
      </div>
    </div>
  );
};

export default EventCardDrawEvent;