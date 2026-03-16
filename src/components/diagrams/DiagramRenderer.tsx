'use client';

import { DiagramProps } from '@/types';
import FractionBar from './FractionBar';
import Timeline from './Timeline';
import LabelledDiagram from './LabelledDiagram';
import SortingVisual from './SortingVisual';
import NumberLine from './NumberLine';

export default function DiagramRenderer(props: DiagramProps) {
  switch (props.diagram.diagram_type) {
    case 'fraction_bar':
      return <FractionBar {...props} />;
    case 'timeline':
      return <Timeline {...props} />;
    case 'labelled_diagram':
      return <LabelledDiagram {...props} />;
    case 'sorting_visual':
      return <SortingVisual {...props} />;
    case 'number_line':
      return <NumberLine {...props} />;
    default:
      return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
          <p className="text-slate-light/60 text-sm">Unknown diagram type: {props.diagram.diagram_type}</p>
        </div>
      );
  }
}
