import React, { useState } from 'react'
import { GameState, PlayerData, Card } from '../types/game'
import { Player } from '../entities/Player'

interface PlayerHandProps {
  player: PlayerData
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
}

const PlayerHand: React.FC<PlayerHandProps> = ({ player, gameState, setGameState }) => {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null)

  const isBossBattle = gameState.bossBattle && gameState.bossBattle.position === player.position

  const useCard = (card: Card) => {
    if (isBossBattle && card.type === 'energy') {
      // BOSS战斗中，选择能量卡
      setSelectedCardId(card.id)
    } else if (card.type === 'energy') {
      // 普通情况下使用能量卡
      const updatedPlayers = gameState.players.map(p => {
        if (p.id === player.id) {
          // 创建Player实例进行操作
          const playerInstance = Player.fromData(p)
          playerInstance.addEnergy()
          playerInstance.removeCard(card.id)
          return playerInstance.toJSON()
        }
        return p
      })
      
      setGameState({
        ...gameState,
        players: updatedPlayers
      })
    } else if (card.type === 'spell') {
      // 检查能量是否足够
      if (player.energy < card.value) {
        alert(`❌ 能量不足！需要${card.value}点能量来使用${card.name}`)
        return
      }
      
      // 根据法术类型处理效果
      let newGameState = { ...gameState }
      
      switch (card.effect) {
        case 'fix_dice':
          // 定身术：指定下一次骰子点数
          const diceValue = prompt(`请输入下一次掷骰子的点数（2-12）:`)
          if (diceValue && /^([2-9]|1[0-2])$/.test(diceValue)) {
            newGameState.activeSpells = {
              ...newGameState.activeSpells,
              fixedDice: parseInt(diceValue)
            }
            alert(`✅ 定身术生效！下次掷骰子点数为 ${diceValue}`)
          } else {
            alert('❌ 无效的骰子点数，请输入2-12之间的数字')
            return
          }
          break
          
        case 'extra_turn':
          // 分身术：额外进行一次掷骰子
          newGameState.activeSpells = {
            ...newGameState.activeSpells,
            extraTurn: true
          }
          alert('✅ 分身术生效！你将获得额外一次行动机会')
          break
          
        case 'swap_position':
          // 聚形散气：选择玩家交换位置
          const targetPlayerId = prompt(
            `请选择要交换位置的玩家ID:\n${gameState.players.map(p => `${p.id}: ${p.name}`).join('\n')}`
          )
          if (targetPlayerId) {
            const targetId = parseInt(targetPlayerId)
            const targetPlayer = gameState.players.find(p => p.id === targetId)
            if (targetPlayer && targetPlayer.id !== player.id) {
              newGameState.activeSpells = {
                ...newGameState.activeSpells,
                swapTarget: targetId
              }
              alert(`✅ 聚形散气生效！将与 ${targetPlayer.name} 交换位置`)
            } else {
              alert('❌ 无效的玩家ID或不能与自己交换位置')
              return
            }
          } else {
            return
          }
          break
          
        case 'spell_shield':
          // 铜墙铁壁：获得法术护盾
          newGameState.activeSpells = {
            ...newGameState.activeSpells,
            spellShield: player.id
          }
          alert('✅ 铜墙铁壁生效！你将免疫下一次法术攻击')
          break
          
        default:
          alert(`使用法术卡: ${card.description}`)
          break
      }
      
      // 消耗能量并移除卡片
      const updatedPlayers = gameState.players.map(p => {
        if (p.id === player.id) {
          const playerInstance = Player.fromData(p)
          playerInstance.consumeEnergy()
          playerInstance.removeCard(card.id)
          return playerInstance.toJSON()
        }
        return p
      })

      newGameState.players = updatedPlayers
      setGameState(newGameState)
    }
  }

  const submitBossBattle = () => {
    if (!isBossBattle || !selectedCardId) return

    const selectedCard = player.cards.find(card => card.id === selectedCardId)
    if (!selectedCard || selectedCard.type !== 'energy') return

    const bossBattle = gameState.bossBattle!
    const totalEnergy = player.energy + selectedCard.value

    if (totalEnergy >= bossBattle.requirement) {
      // 击败BOSS
      const updatedPlayers = gameState.players.map(p => {
        if (p.id === player.id) {
          const playerInstance = Player.fromData(p)
          playerInstance.addEnergy() // 先添加卡片能量
          playerInstance.consumeEnergy() // 再消耗BOSS需求能量
          playerInstance.removeCard(selectedCardId)
          playerInstance.position = bossBattle.position // 保持在BOSS位置
          return playerInstance.toJSON()
        }
        return p
      })
      
      alert(`🎉 使用${selectedCard.value}点能量卡，击败BOSS！消耗了${bossBattle.requirement}点能量`)
      
      setGameState({
        ...gameState,
        players: updatedPlayers,
        bossBattle: undefined
      })
    } else {
      alert(`❌ 能量不足！需要${bossBattle.requirement}点，你只有${totalEnergy}点（包含选中的卡片）`)
    }
  }

  const abandonBossBattle = () => {
    if (!isBossBattle) return

    const bossBattle = gameState.bossBattle!
    
    // 回到上一个BOSS位置，继续走完剩下的步数
    const updatedPlayers = gameState.players.map(p => {
      if (p.id === player.id) {
        const playerInstance = Player.fromData(p)
        playerInstance.position = bossBattle.originalPosition
        if (selectedCardId) {
          playerInstance.removeCard(selectedCardId)
        }
        
        // 计算新的位置（继续走完剩下的步数）
        const newPosition = Math.min(playerInstance.position + bossBattle.remainingSteps, 80)
        playerInstance.position = newPosition
        
        alert(`💨 放弃挑战，回到位置${bossBattle.originalPosition}并继续移动${bossBattle.remainingSteps}步，到达位置${newPosition}`)
        
        return playerInstance.toJSON()
      }
      return p
    })

    setGameState({
      ...gameState,
      players: updatedPlayers,
      bossBattle: undefined
    })
    setSelectedCardId(null)
  }


  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{player.name}的手牌</h3>
      
      <div className="mb-4">
        <span className="text-sm text-gray-600">能量: </span>
        <span className="font-bold text-green-600">{player.energy}</span>
      </div>

      {isBossBattle && (
        <div className="mb-4 p-3 bg-purple-100 rounded-lg border border-purple-300">
          <div className="text-sm font-semibold text-purple-800 mb-2">BOSS战</div>
          <div className="text-xs text-purple-600">
            需要能量: {gameState.bossBattle!.requirement}点
            {selectedCardId && (
              <div className="mt-1">已选中卡片: +{player.cards.find(c => c.id === selectedCardId)?.value}点</div>
            )}
          </div>
          
          <div className="flex space-x-2 mt-3">
            <button
              onClick={submitBossBattle}
              disabled={!selectedCardId || (player.energy + (player.cards.find(c => c.id === selectedCardId)?.value || 0)) < gameState.bossBattle!.requirement}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-1 px-2 rounded text-xs transition-colors"
            >
              提交
            </button>
            <button
              onClick={abandonBossBattle}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs transition-colors"
            >
              放弃
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2">
        {player.cards.map(card => (
          <button
            key={card.id}
            onClick={() => useCard(card)}
            className={`p-2 rounded text-xs text-left ${
              card.type === 'energy' 
                ? selectedCardId === card.id 
                  ? 'bg-yellow-300 border-2 border-yellow-500'
                  : 'bg-yellow-100 hover:bg-yellow-200 border border-yellow-300'
                : 'bg-blue-100 hover:bg-blue-200 border border-blue-300'
            } ${isBossBattle && card.type === 'energy' ? 'cursor-pointer' : ''}`}
            disabled={isBossBattle && card.type !== 'energy'}
          >
            <div className="font-semibold">
              {card.name}
            </div>
            <div className="text-gray-600">{card.description}</div>
            {isBossBattle && card.type === 'energy' && (
              <div className="text-xs text-green-600 mt-1">点击选择</div>
            )}
          </button>
        ))}
      </div>
      
      {player.cards.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-4">
          暂无手牌
        </div>
      )}
    </div>
  )
}

export default PlayerHand