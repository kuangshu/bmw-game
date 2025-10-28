import React, { useEffect, useState } from "react";
import { useGameContext } from "../../contexts/GameContext";
import type {
  GameEventData,
  GameEventType,
} from "../../entities/GameEventSystem";
import SpellFixDiceEvent from "./SpellFixDiceEvent";
import SpellSwapPositionEvent from "./SpellSwapPositionEvent";
import SpellExtraTurnEvent from "./SpellExtraTurnEvent";
import BossBattlePlayCardsEvent from "./BossBattlePlayCardsEvent";
import PlayerRoleSelectionEvent from "./PlayerRoleSelectionEvent";
import EventCardDrawEvent from "./EventCardDrawEvent";
import PlayerSelectionUI from "./PlayerSelectionUI";
import DiceRollEvent from "./DiceRollEvent";

// 游戏事件层组件
const GameEventLayer: React.FC = () => {
  const { gameInstance } = useGameContext();
  const [currentEvent, setCurrentEvent] = useState<GameEventData<any> | null>(
    null,
  );

  useEffect(() => {
    if (!gameInstance) return;

    const eventSystem = gameInstance.eventSystem;

    // 初始检查是否有待处理的事件
    const checkInitialEvent = () => {
      const pendingEvent = eventSystem.getPendingEvent();
      if (pendingEvent) {
        setCurrentEvent(pendingEvent);
      }
    };

    // 订阅所有可能的事件类型
    const handleNewEvent = (eventData: GameEventData<any>) => {
      setCurrentEvent(eventData);
    };

    // 订阅所有相关事件类型
    const eventTypes: GameEventType[] = [
      "SPELL_FIX_DICE",
      "SPELL_SWAP_POSITION",
      "SPELL_EXTRA_TURN",
      "BOSS_BATTLE_PLAY_CARDS",
      "TILE_TREASURE",
      "TILE_REVERSE",
      "TILE_SUPPLY",
      "TILE_TELEPORT",
      "GAME_OVER",
      "TURN_END",
      "PLAYER_CHOICE",
      "DICE_ROLL",
      "PLAYER_ROLE_SELECTION",
      "EVENT_CARD_DRAW",
    ];

    // 为每个事件类型订阅处理函数
    eventTypes.forEach((type) => {
      eventSystem.subscribe(type, handleNewEvent);
    });

    // 初始检查
    checkInitialEvent();

    // 清理订阅
    return () => {
      eventTypes.forEach((type) => {
        eventSystem.unsubscribe(type, handleNewEvent);
      });
    };
  }, [gameInstance]);

  // 处理事件完成
  const handleEventComplete = (result: any) => {
    if (!gameInstance || !currentEvent) return;

    // 使用事件系统自动生成的eventId
    const eventId = currentEvent.eventId;
    gameInstance.eventSystem.completeEvent(eventId, result);

    // 移除已处理的事件，使用精准的eventId
    gameInstance.eventSystem.removeProcessedEvent(eventId);

    // 清除当前事件
    setCurrentEvent(null);
  };

  if (!currentEvent) return null;

  // 根据事件类型渲染对应的UI组件
  const renderEventUI = () => {
    switch (currentEvent.type) {
      case "SPELL_FIX_DICE":
        return (
          <SpellFixDiceEvent
            eventData={currentEvent}
            onComplete={handleEventComplete}
          />
        );
      case "SPELL_SWAP_POSITION":
        return (
          <SpellSwapPositionEvent
            eventData={currentEvent}
            onComplete={handleEventComplete}
          />
        );
      case "SPELL_EXTRA_TURN":
        return (
          <SpellExtraTurnEvent
            eventData={currentEvent}
            onComplete={handleEventComplete}
          />
        );
      case "BOSS_BATTLE_PLAY_CARDS":
        return (
          <BossBattlePlayCardsEvent
            eventData={currentEvent}
            onComplete={handleEventComplete}
          />
        );
      case "PLAYER_ROLE_SELECTION":
        return (
          <PlayerRoleSelectionEvent
            eventData={currentEvent}
            onComplete={handleEventComplete}
          />
        );
      case "EVENT_CARD_DRAW":
        return (
          <EventCardDrawEvent
            eventData={currentEvent}
            onComplete={handleEventComplete}
          />
        );
      case "PLAYER_CHOICE":
        return (
          <PlayerSelectionUI
            eventData={currentEvent}
            onComplete={handleEventComplete}
          />
        );
      case "DICE_ROLL":
        return (
          <DiceRollEvent
            eventData={currentEvent}
            onComplete={handleEventComplete}
          />
        );
      default:
        return (
          <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
            <h2 className="font-bold text-lg mb-4">未知事件</h2>
            <p className="mb-4">无法处理此事件类型: {currentEvent.type}</p>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2"
              onClick={() => handleEventComplete({})}
            >
              关闭
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      {renderEventUI()}
    </div>
  );
};

export default GameEventLayer;
