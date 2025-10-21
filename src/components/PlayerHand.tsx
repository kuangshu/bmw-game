import React, { useState } from 'react'
import { useGameContext } from '../contexts/GameContext'

const PlayerHand: React.FC = () => {
  const { gameInstance, endTurn } = useGameContext()
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // 获取游戏状态
  const gameState = gameInstance ? gameInstance.toJSON() : {
    players: [],
    currentPlayerIndex: 0,
    gameStarted: false,
    gameOver: false,
    winner: null,
    bossBattle: null,
  }
  const player = gameState.players[gameState.currentPlayerIndex]
  if (!player) return null

  // 判断可否选中
  const canSelect = (card: any) => {
    if (card.type === 'spell') return true
    if (card.type === 'energy') return true
    return false
  }

  // 选中/取消（法术牌只能单选，能量卡多选且只能在boss战状态）
  const toggleSelect = (card: any) => {
    if (!canSelect(card)) return;
    if (card.type === 'spell') {
      setSelectedIds(selectedIds[0] === card.id ? [] : [card.id]);
    } else if (card.type === 'energy') {
      if (selectedIds.includes(card.id)) {
        setSelectedIds(selectedIds.filter(id => id !== card.id))
      } else {
        setSelectedIds([...selectedIds, card.id])
      }
    }
  }

  // 使用法术牌（只允许单张选中）
  const handleUseSpell = () => {
    if (!gameInstance) return
    const cardId = selectedIds[0]
    const card = player.cards.find((c: any) => c.id === cardId)
    if (card && card.type === 'spell') {
      // 使用事件系统发布法术卡事件
      const eventSystem = gameInstance.eventSystem;
      let eventType: any = "CUSTOM"; // 默认事件类型
      
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
        case "spell_shield":
          eventType = "SPELL_SHIELD";
          break;
      }
      
      // 发布事件
      eventSystem.publishEvent({
        type: eventType,
        playerId: player.id,
        spellCardId: cardId,
        options: {}
      });
      
      // 旧的实现方式保留作为备选
      // gameInstance.activateSpellCard(gameInstance.players[gameState.currentPlayerIndex], cardId)
      setSelectedIds([])
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{player.name}的手牌</h3>
      <div className="grid grid-cols-2 gap-2">
        {player.cards.map(card => {
          const selected = selectedIds.includes(card.id)
          const canPick = canSelect(card)
          return (
            <div
              key={card.id}
              onClick={() => toggleSelect(card)}
              className={`p-2 rounded text-xs text-left cursor-pointer border-2 ${selected ? 'border-blue-600 bg-blue-100' : card.type === 'energy' ? 'bg-yellow-100 border-yellow-300' : 'bg-blue-100 border-blue-300'} ${!canPick ? 'opacity-50 cursor-default' : ''}`}
            >
              <div className="font-semibold">{card.name}</div>
              <div className="text-gray-600">{card.description}</div>
            </div>
          )
        })}
      </div>
      {/* 法术牌操作栏 */}
      {selectedIds.length > 0 && player.cards.find((c: any) => c.id === selectedIds[0] && c.type === 'spell') && (
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
      {/* 回合结束按钮 */}
      <button
        className="mt-4 w-full py-2 bg-gray-700 text-white rounded hover:bg-gray-900"
        onClick={endTurn}
      >
        结束回合
      </button>
    </div>
  )
}

export default PlayerHand
