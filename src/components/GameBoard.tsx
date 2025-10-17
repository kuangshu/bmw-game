import { useGameContext } from '../contexts/GameContext'
import WebGLBoard from './WebGLBoard'

const GameBoard: React.FC = () => {
  const { gameInstance } = useGameContext()
  
  // 从gameInstance获取游戏状态
  const gameState = gameInstance ? gameInstance.toJSON() : {
    players: [],
    currentPlayerIndex: 0,
    gameStarted: false,
    gameOver: false,
    winner: null
  }
  
  return (
    <div className="w-full h-full relative">
      <WebGLBoard gameState={gameState} />
    </div>
  )
}

export default GameBoard