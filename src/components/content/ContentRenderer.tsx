'use client';

import { TopicAsset, DiagramComponent, GameResult } from '@/types';
import ConceptCard from './ConceptCard';
import RealWorldCard from './RealWorldCard';
import VideoPlayer from './VideoPlayer';
import GameRenderer from '../games/GameRenderer';
import DiagramRenderer from '../diagrams/DiagramRenderer';

interface ContentRendererProps {
  contentType: string;
  contentId: string;
  assets: TopicAsset[];
  diagrams: DiagramComponent[];
  subjectColour: string;
  childAge: number;
  onGameComplete?: (result: GameResult) => void;
  onDiagramComplete?: () => void;
  onVideoComplete?: () => void;
}

export default function ContentRenderer({
  contentType,
  contentId,
  assets,
  diagrams,
  subjectColour,
  childAge,
  onGameComplete,
  onDiagramComplete,
  onVideoComplete,
}: ContentRendererProps) {
  const asset = assets.find((a) => a.id === contentId);

  switch (contentType) {
    case 'concept_card': {
      if (!asset) return <ContentNotFound type="concept card" />;
      return <ConceptCard asset={asset} subjectColour={subjectColour} />;
    }

    case 'video': {
      if (!asset) return <ContentNotFound type="video" />;
      const videoUrl = asset.file_url || '';
      const vttUrl = asset.file_url ? asset.file_url.replace('.mp4', '.vtt') : undefined;
      if (!videoUrl) {
        // Fallback: show video script from content_json
        const content = asset.content_json as { hook?: string; explanation?: string; example?: string; closing_question?: string };
        return (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${subjectColour}20` }}>
                <span style={{ color: subjectColour }}>▶</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: subjectColour }}>Video</p>
                <p className="text-sm text-white font-bold">{asset.title}</p>
              </div>
            </div>
            {content.hook && <p className="text-sm text-amber/80 italic mb-2">{content.hook}</p>}
            {content.explanation && <p className="text-sm text-slate-light/80 mb-2">{content.explanation}</p>}
            {content.example && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-2">
                <p className="text-xs font-bold text-slate-light/50 mb-1">Example</p>
                <p className="text-sm text-white/80">{content.example}</p>
              </div>
            )}
            {content.closing_question && (
              <p className="text-sm text-amber/70 italic mt-2">{content.closing_question}</p>
            )}
          </div>
        );
      }
      return <VideoPlayer src={videoUrl} subtitleSrc={vttUrl} subjectColour={subjectColour} onComplete={onVideoComplete} />;
    }

    case 'realworld_everyday':
    case 'realworld_inspiring': {
      if (!asset) return <ContentNotFound type="real-world card" />;
      return <RealWorldCard asset={asset} subjectColour={subjectColour} />;
    }

    case 'diagram': {
      if (!asset) return <ContentNotFound type="diagram" />;
      const diagramId = (asset.content_json as { diagram_component_id?: string }).diagram_component_id;
      const diagram = diagrams.find((d) => d.id === diagramId);
      if (!diagram) return <ContentNotFound type="diagram component" />;
      return <DiagramRenderer diagram={diagram} subjectColour={subjectColour} onComplete={onDiagramComplete} />;
    }

    case 'game': {
      if (!asset) return <ContentNotFound type="game" />;
      return (
        <GameRenderer
          asset={asset}
          childAge={childAge}
          subjectColour={subjectColour}
          onComplete={(result) => onGameComplete?.(result)}
        />
      );
    }

    case 'worksheet': {
      if (!asset) return <ContentNotFound type="worksheet" />;
      return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📝</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: subjectColour }}>Worksheet</p>
              <p className="text-sm text-white font-bold">{asset.title}</p>
            </div>
          </div>
          <p className="text-sm text-slate-light/70 mb-3">A printable worksheet is ready for you!</p>
          <a
            href={`/api/content/generate-worksheet?asset_id=${asset.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: subjectColour }}
          >
            Download Worksheet
          </a>
        </div>
      );
    }

    default:
      return <ContentNotFound type={contentType} />;
  }
}

function ContentNotFound({ type }: { type: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center">
      <p className="text-slate-light/50 text-sm">Content not found: {type}</p>
    </div>
  );
}
