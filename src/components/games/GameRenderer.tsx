'use client';

import { GameProps } from '@/types';
import MatchItGame from './MatchItGame';
import SortItGame from './SortItGame';
import FillItGame from './FillItGame';
import TrueFalseGame from './TrueFalseGame';
import BuildItGame from './BuildItGame';
import QuickFireGame from './QuickFireGame';

export default function GameRenderer(props: GameProps) {
  const subtype = props.asset.asset_subtype;

  switch (subtype) {
    case 'match_it':
      return <MatchItGame {...props} />;
    case 'sort_it':
      return <SortItGame {...props} />;
    case 'fill_it':
      return <FillItGame {...props} />;
    case 'true_false':
      return <TrueFalseGame {...props} />;
    case 'build_it':
      return <BuildItGame {...props} />;
    case 'quick_fire':
      return <QuickFireGame {...props} />;
    default:
      return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
          <p className="text-slate-light/60 text-sm">Unknown game type: {subtype}</p>
        </div>
      );
  }
}
