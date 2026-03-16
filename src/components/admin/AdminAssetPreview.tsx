'use client';

import { TopicAsset, DiagramComponent } from '@/types';
import ContentRenderer from '@/components/content/ContentRenderer';
import { FileJson, Lightbulb, Sparkles, ListChecks, FileText, BookOpen, Image as ImageIcon, Video } from 'lucide-react';

interface AdminAssetPreviewProps {
  asset: TopicAsset;
  subjectColour: string;
  diagrams?: DiagramComponent[];
}

function previewTypeForAsset(asset: TopicAsset) {
  if (asset.asset_type === 'realworld_card') {
    return asset.asset_subtype === 'inspiring' ? 'realworld_inspiring' : 'realworld_everyday';
  }

  if (asset.asset_type === 'game_questions') {
    return 'game';
  }

  return asset.asset_type;
}

function hasRenderableLearnerShape(asset: TopicAsset) {
  const content = (asset.content_json ?? {}) as Record<string, unknown>;

  switch (asset.asset_type) {
    case 'concept_card':
      return typeof content.definition === 'string' || typeof content.hook_question === 'string';
    case 'video':
      return Boolean(asset.file_url) || typeof content.explanation === 'string' || typeof content.hook === 'string';
    case 'realworld_card':
      return typeof content.description === 'string' || typeof content.scenario === 'string';
    case 'game_questions':
      return Array.isArray(content.statements) || Array.isArray(content.questions) || Array.isArray(content.pairs) || Array.isArray(content.items);
    case 'worksheet':
      return true;
    case 'diagram':
      return typeof content.diagram_component_id === 'string';
    default:
      return false;
  }
}

function prettifyKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderValue(value: unknown) {
  if (typeof value === 'string') {
    return <p className="text-sm text-slate-200 leading-6 whitespace-pre-wrap">{value}</p>;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <p className="text-sm text-slate-200">{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="rounded-xl bg-white/5 border border-white/10 p-3">
            {typeof item === 'object' && item !== null ? (
              <div className="space-y-2">
                {Object.entries(item as Record<string, unknown>).map(([nestedKey, nestedValue]) => (
                  <div key={nestedKey}>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">{prettifyKey(nestedKey)}</p>
                    {renderValue(nestedValue)}
                  </div>
                ))}
              </div>
            ) : (
              renderValue(item)
            )}
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <div className="space-y-2">
        {Object.entries(value as Record<string, unknown>).map(([nestedKey, nestedValue]) => (
          <div key={nestedKey} className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">{prettifyKey(nestedKey)}</p>
            {renderValue(nestedValue)}
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-sm text-slate-500">No preview data</p>;
}

function GenericStructuredPreview({ asset, subjectColour }: { asset: TopicAsset; subjectColour: string }) {
  const content = (asset.content_json ?? {}) as Record<string, unknown>;

  const icon = (() => {
    switch (asset.asset_type) {
      case 'concept_card':
        return <Lightbulb size={18} style={{ color: subjectColour }} />;
      case 'video':
        return <Video size={18} style={{ color: subjectColour }} />;
      case 'realworld_card':
        return <BookOpen size={18} style={{ color: subjectColour }} />;
      case 'game_questions':
        return <ListChecks size={18} style={{ color: subjectColour }} />;
      case 'worksheet':
        return <FileText size={18} style={{ color: subjectColour }} />;
      case 'diagram':
        return <ImageIcon size={18} style={{ color: subjectColour }} />;
      default:
        return <FileJson size={18} style={{ color: subjectColour }} />;
    }
  })();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${subjectColour}22` }}>
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Visual Content Summary</p>
          <h4 className="text-base font-bold text-white">{asset.title}</h4>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-amber/20 bg-amber/10 p-3 flex items-start gap-2">
        <Sparkles size={16} className="text-amber mt-0.5" />
        <p className="text-sm text-amber-100/90">
          This asset does not yet match one of the learner-facing component schemas, so this preview is showing a polished structured summary instead of raw HTML or raw JSON.
        </p>
      </div>

      <div className="space-y-3">
        {Object.keys(content).length > 0 ? (
          Object.entries(content).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-white/10 bg-navy/40 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2">{prettifyKey(key)}</p>
              {renderValue(value)}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">No structured content was returned for this asset.</p>
        )}
      </div>
    </div>
  );
}

export default function AdminAssetPreview({ asset, subjectColour, diagrams = [] }: AdminAssetPreviewProps) {
  if (hasRenderableLearnerShape(asset)) {
    return (
      <ContentRenderer
        contentType={previewTypeForAsset(asset)}
        contentId={asset.id}
        assets={[asset]}
        diagrams={diagrams}
        subjectColour={subjectColour}
        childAge={9}
      />
    );
  }

  return <GenericStructuredPreview asset={asset} subjectColour={subjectColour} />;
}
