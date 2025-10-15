import { useState, useEffect } from 'react'
import GameBoard from './components/GameBoard'
import DiceRoller from './components/DiceRoller'
import PlayerHand from './components/PlayerHand'
import { GameState, PlayerData, Card } from './types/game'
import { Player } from './entities/Player'
import { GameProvider, useGameContext } from './contexts/GameContext'

const initialGameState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  gameStarted: false,
  gameOver: false,
  winner: null
}

function AppContent() {
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [isMobile, setIsMobile] = useState(false)
  const { generateTiles } = useGameContext()

  // 检测设备和屏幕方向
  useEffect(() => {
    const checkDeviceAndOrientation = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    checkDeviceAndOrientation()
    window.addEventListener('resize', checkDeviceAndOrientation)
    
    return () => window.removeEventListener('resize', checkDeviceAndOrientation)
  }, [])

  // 创建完整的牌堆（60张牌：52张能量牌 + 8张法术牌）
  const createCardDeck = (): Card[] => {
    const deck: Card[] = []
    let cardId = 1
    
    // 能量卡配置
    const energyCardTypes = [
      { name: '甜筒', value: 1, count: 20 },
      { name: '薯条', value: 3, count: 16 },
      { name: '芝士汉堡', value: 6, count: 10 },
      { name: '咸蛋黄汉堡', value: 6, count: 6 }
    ]
    
    // 生成能量卡（总共52张）
    energyCardTypes.forEach(cardType => {
      for (let i = 0; i < cardType.count; i++) {
        deck.push({
          id: cardId++,
          type: 'energy',
          value: cardType.value,
          name: cardType.name,
          description: `提供 ${cardType.value} 点能量`
        })
      }
    })
    
    // 法术卡配置
    const spellCardTypes = [
      { 
        name: '定身术', 
        value: 3, 
        effect: 'fix_dice', 
        description: '指定下一次扔骰子的点数（消耗3能量）',
        count: 2
      },
      { 
        name: '分身术', 
        value: 3, 
        effect: 'extra_turn', 
        description: '多进行一次扔骰子的行为（消耗3能量）',
        count: 2
      },
      { 
        name: '聚形散气', 
        value: 6, 
        effect: 'swap_position', 
        description: '指定一个玩家和其交换位置（消耗6能量）',
        count: 2
      },
      { 
        name: '铜墙铁壁', 
        value: 4, 
        effect: 'spell_shield', 
        description: '抵消其他人对玩家使用的法术效果（消耗4能量）',
        count: 2
      }
    ]
    
    // 生成法术卡（总共8张）
    spellCardTypes.forEach(cardType => {
      for (let i = 0; i < cardType.count; i++) {
        deck.push({
          id: cardId++,
          type: 'spell',
          value: cardType.value,
          name: cardType.name,
          effect: cardType.effect,
          description: cardType.description
        })
      }
    })
    
    return deck
  }

  // 从牌堆中随机抽取指定数量的卡片
  const drawCardsFromDeck = (deck: Card[], count: number): { drawnCards: Card[], remainingDeck: Card[] } => {
    const shuffledDeck = [...deck].sort(() => Math.random() - 0.5)
    const drawnCards = shuffledDeck.slice(0, count)
    const remainingDeck = shuffledDeck.slice(count)
    
    return { drawnCards, remainingDeck }
  }

  // 初始化游戏
  const initializeGame = (playerCount: number) => {
    // 创建完整牌堆
    const fullDeck = createCardDeck()
    
    // 为每个玩家抽取4张起始手牌并创建Player实例
    const players: PlayerData[] = []
    let currentDeck = fullDeck
    
    for (let i = 0; i < playerCount; i++) {
      const { drawnCards, remainingDeck } = drawCardsFromDeck(currentDeck, 4)
      currentDeck = remainingDeck
      // 创建Player实例并转换为PlayerData用于状态管理
      const player = new Player(
        i + 1,
        `玩家 ${i + 1}`,
        'warrior', // 默认角色
        0, // 初始位置
        drawnCards
      )
      
      players.push(player.toJSON())
    }

    // 生成地图格子
    generateTiles()

    setGameState({
      ...initialGameState,
      players,
      gameStarted: true
    })
  }

  // 重新开始游戏
  const restartGame = () => {
    setGameState(initialGameState)
  }

  if (!gameState.gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 p-4">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800">骰子闯关游戏</h1>
          <p className="mb-4 md:mb-6 text-gray-600 text-sm md:text-base">选择玩家数量开始游戏</p>
          <div className="space-y-3 md:space-y-4">
            {[2, 3, 4, 5, 6].map(count => (
              <button
                key={count}
                onClick={() => initializeGame(count)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 md:py-3 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-base"
              >
                {count} 人游戏
              </button>
            ))}
          </div>
          {isMobile && (
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-yellow-800 text-xs">
              💡 提示：建议横屏以获得更好的游戏体验
            </div>
          )}
        </div>
      </div>
    )
  }

  // 游戏结束界面
  if (gameState.gameOver && gameState.winner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-4">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-green-600">🎉 游戏结束！</h1>
          <div className="mb-6">
            <div className="text-xl font-semibold text-gray-800">获胜者：{gameState.winner.name}</div>
            <div className="text-gray-600 mt-2">恭喜获得胜利！</div>
          </div>
          <button
            onClick={restartGame}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg transition-colors"
          >
            重新开始游戏
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex ${orientation === 'landscape' ? 'flex-row' : 'flex-col'}`}>
      {/* 游戏地图区域 */}
      <div className={`${orientation === 'landscape' ? 'w-3/4' : 'h-3/4'} relative`}>
        <GameBoard gameState={gameState} orientation={orientation} />
      </div>
      
      {/* 控制面板区域 */}
      <div className={`${orientation === 'landscape' ? 'w-1/4' : 'h-1/4'} bg-gray-50 border-t border-l border-gray-200 overflow-auto`}>
        <div className="p-2 md:p-4 space-y-3 md:space-y-4">
          <div className="flex justify-between items-center">
            <button
              onClick={restartGame}
              className="text-xs md:text-sm text-red-600 hover:text-red-700"
            >
              重新开始
            </button>
            {isMobile && (
              <div className="text-xs text-gray-500">
                {orientation === 'portrait' ? '竖屏' : '横屏'}
              </div>
            )}
          </div>
          
          <DiceRoller gameState={gameState} setGameState={setGameState} />
          <PlayerHand 
            player={gameState.players[gameState.currentPlayerIndex]} 
            gameState={gameState}
            setGameState={setGameState}
          />
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  )
}

export default App