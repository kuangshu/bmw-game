import React from "react";
// 预留各法术牌交互窗体
import SpellFixDiceAction from "./SpellFixDiceAction";
import SpellSwapPositionAction from "./SpellSwapPositionAction";
import SpellExtraTurnAction from "./SpellExtraTurnAction";
import SpellShieldAction from "./SpellShieldAction";
import { useGameContext } from '../contexts/GameContext';

const SpellActionLayer: React.FC = () => {
  const { activeSpellPending } = useGameContext();
  const { card } = activeSpellPending || {};
  if (!card) return null;
  const curSpellType = card.effect;
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      {curSpellType === "fix_dice" && <SpellFixDiceAction />}
      {curSpellType === "swap_position" && <SpellSwapPositionAction />}
      {curSpellType === "extra_turn" && <SpellExtraTurnAction />}
      {curSpellType === "spell_shield" && <SpellShieldAction />}
    </div>
  );
};
export default SpellActionLayer;
