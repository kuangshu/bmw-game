import React, { useState, useEffect } from "react";
import { useGameContext } from "../contexts/GameContext";
import { GameEventType } from "../entities";

const PlayerHand: React.FC = () => {
  const { gameInstance, endTurn, canRollDice } = useGameContext();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [isPlayCardsMode, setIsPlayCardsMode] = useState(false);

  // 获取游戏状态
  const gameState = gameInstance
    ? gameInstance.toJSON()
    : {
        players: [],
        currentPlayerIndex: 0,
        gameStarted: false,
        gameOver: false,
        winner: null,
        bossBattle: null,
      };
  const player = gameState.players[gameState.currentPlayerIndex];
  if (!player) return null;

  // 订阅PLAY_CARDS事件
  useEffect(() => {
    if (!gameInstance) return;

    const handlePlayCardsEvent = (event: any) => {
      setIsPlayCardsMode(true);
      setCurrentEventId(event.eventId || null);
      setSelectedIds([]); // 重置选择状态
    };

    // 订阅事件
    gameInstance.eventSystem.subscribe("PLAY_CARDS", handlePlayCardsEvent);

    // 清理函数
    return () => {
      gameInstance.eventSystem.unsubscribe("PLAY_CARDS", handlePlayCardsEvent);
    };
  }, [gameInstance]);

  // 判断可否选中
  const canSelect = (card: any) => {
    // 出牌模式下所有卡牌都可选
    if (isPlayCardsMode) return true;

    // 正常模式下只有法术牌可选，但排除spell_shield法术
    if (card.type === "spell" && card.effect !== "spell_shield") return true;

    return false;
  };

  // 选中/取消
  const toggleSelect = (card: any) => {
    if (!canSelect(card)) return;

    // 出牌模式下所有卡牌都支持多选
    if (isPlayCardsMode) {
      if (selectedIds.includes(card.id)) {
        setSelectedIds(selectedIds.filter((id) => id !== card.id));
      } else {
        setSelectedIds([...selectedIds, card.id]);
      }
    } else {
      // 正常模式下：法术牌只能单选，能量卡多选
      if (card.type === "spell") {
        setSelectedIds(selectedIds[0] === card.id ? [] : [card.id]);
      } else if (card.type === "energy") {
        if (selectedIds.includes(card.id)) {
          setSelectedIds(selectedIds.filter((id) => id !== card.id));
        } else {
          setSelectedIds([...selectedIds, card.id]);
        }
      }
    }
  };

  // 使用法术牌（只允许单张选中）
  const handleUseSpell = () => {
    if (!gameInstance) return;
    const cardId = selectedIds[0];
    const card = player.cards.find((c) => c.id === cardId);
    if (card && card.type === "spell") {
      // 使用事件系统发布法术卡事件
      const eventSystem = gameInstance.eventSystem;
      let eventType: GameEventType = "DICE_ROLL"; // 默认事件类型

      // 根据法术卡效果确定事件类型
      switch (card.effect) {
        case "fix_dice":
          eventType = "SPELL_FIX_DICE";
          break;
        case "swap_position":
          eventType = "SPELL_SWAP_POSITION";
          break;
        case "extra_turn":
          eventType = "SPELL_EXTRA_TURN";
          break;
      }

      // 发布事件
      eventSystem.publishEvent({
        type: eventType,
        playerId: player.id,
      });

      // 旧的实现方式保留作为备选
      // gameInstance.activateSpellCard(gameInstance.players[gameState.currentPlayerIndex], cardId)
      setSelectedIds([]);
    }
  };

  // 完成出牌事件
  const handleCompletePlayCards = () => {
    if (!gameInstance || !currentEventId) return;

    // 获取选中的卡牌信息
    const selectedCards = player.cards.filter((card) =>
      selectedIds.includes(card.id),
    );

    // 完成事件并返回选中的卡牌
    gameInstance.eventSystem.completeEvent(currentEventId, {
      selectedCardIds: selectedIds,
      selectedCards: selectedCards,
    });

    // 重置状态
    setIsPlayCardsMode(false);
    setCurrentEventId(null);
    setSelectedIds([]);
  };

  // 取消出牌事件
  const handleCancelPlayCards = () => {
    if (!gameInstance || !currentEventId) return;

    // 完成事件但返回空结果
    gameInstance.eventSystem.completeEvent(currentEventId, {
      selectedCardIds: [],
      selectedCards: [],
    });

    // 重置状态
    setIsPlayCardsMode(false);
    setCurrentEventId(null);
    setSelectedIds([]);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{player.name}的手牌</h3>
      <div className="grid grid-cols-2 gap-2">
        {player.cards.map((card) => {
          const selected = selectedIds.includes(card.id);
          const canPick = canSelect(card);
          return (
            <div
              key={card.id}
              onClick={() => toggleSelect(card)}
              className={`p-2 rounded text-xs text-left cursor-pointer border-2 ${selected ? "border-blue-600 bg-blue-100" : card.type === "energy" ? "bg-yellow-100 border-yellow-300" : "bg-blue-100 border-blue-300"} ${!canPick ? "opacity-50 cursor-default" : ""}`}
            >
              <div className="font-semibold">{card.name}</div>
              <div className="text-gray-600">{card.description}</div>
            </div>
          );
        })}
      </div>
      {/* 出牌模式操作栏 */}
      {isPlayCardsMode && (
        <div className="mt-3 space-y-2">
          <div className="text-sm text-gray-600">出牌模式：选择要出的卡牌</div>
          <div className="flex space-x-2">
            <button
              className="flex-1 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
              onClick={handleCompletePlayCards}
              disabled={selectedIds.length === 0}
            >
              确认出牌 ({selectedIds.length})
            </button>
            <button
              className="flex-1 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={handleCancelPlayCards}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 法术牌操作栏 */}
      {!isPlayCardsMode &&
        selectedIds.length > 0 &&
        player.cards.find(
          (c: any) => c.id === selectedIds[0] && c.type === "spell",
        ) && (
          <button
            className="mt-3 w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            onClick={handleUseSpell}
          >
            使用法术牌
          </button>
        )}

      {/* 能量卡用于 BOSS 战斗组合的场景可后续添加 group submit 按钮等 */}
      {player.cards.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-4">暂无手牌</div>
      )}

      {/* 回合结束按钮 - 只在当前回合投掷行为结束后显示 */}
      {!isPlayCardsMode && !canRollDice() && (
        <button
          className="mt-4 w-full py-2 bg-gray-700 text-white rounded hover:bg-gray-900"
          onClick={endTurn}
        >
          结束回合
        </button>
      )}
    </div>
  );
};

export default PlayerHand;
