import { GameState } from '../entities/Game'
import WebGLBoard from './WebGLBoard'

interface GameBoardProps {
  gameState: GameState
  orientation: 'portrait' | 'landscape'
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  return (
    <div className="w-full h-full relative">
      <WebGLBoard gameState={gameState} />
    </div>
  )
}

export default GameBoard