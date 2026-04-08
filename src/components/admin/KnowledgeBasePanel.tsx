'use client';
import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Upload, FileText, Image, Video, Link2, Plus, Trash2,
  Eye, EyeOff, Loader2, CheckCircle, AlertCircle, X, ExternalLink,
  FileVideo, File, Type, Globe
} from 'lucide-react';

interface KBItem {
  id: string;
  lesson_id: string;
  title: string;
  content_type: 'text' | 'image' | 'video' | 'document' | 'url';
  text_content?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  description?: string;
  extracted_summary?: string;
  key_concepts?: string[];
  is_active: boolean;
  created_at: string;
}

interface KnowledgeBasePanelProps {
  lessonId: string;
  topicTitle: string;
}

const CONTENT_TYPE_CONFIG = {
  text: { icon: Type, label: 'Text / Knowledge Note', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  image: { icon: Image, label: 'Image', color: 'text-green-400', bg: 'bg-green-400/10' },
  video: { icon: Video, label: 'Video', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  document: { icon: FileText, label: 'Document / PDF', color: 'text-amber', bg: 'bg-amber/10' },
  url: { icon: Globe, label: 'Web URL / Link', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeBasePanel({ lessonId, topicTitle }: KnowledgeBasePanelProps) {
  const [items, setItems] = useState<KBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addType, setAddType] = useState<KBItem['content_type']>('text');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTextContent, setNewTextContent] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, [lessonId]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/knowledge-base?lesson_id=${lessonId}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setError('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!newTitle) setNewTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) { setError('Please enter a title'); return; }
    setSaving(true);
    setError('');

    try {
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;

      // Upload file if needed
      if (selectedFile && (addType === 'image' || addType === 'video' || addType === 'document')) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('lesson_id', lessonId);
        formData.append('content_type', addType);

        const uploadRes = await fetch('/api/admin/upload-file', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        setUploading(false);

        if (!uploadData.success) { setError(uploadData.error || 'Upload failed'); setSaving(false); return; }
        fileUrl = uploadData.file_url;
        fileName = uploadData.file_name;
        fileSize = uploadData.file_size;
      }

      const res = await fetch('/api/admin/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          title: newTitle.trim(),
          content_type: addType,
          text_content: addType === 'text' ? newTextContent : (addType === 'url' ? newUrl : null),
          file_url: fileUrl || (addType === 'url' ? newUrl : null),
          file_name: fileName || null,
          file_size: fileSize || null,
          description: newDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (!data.success) { setError(data.error || 'Failed to save'); setSaving(false); return; }

      setItems(prev => [data.item, ...prev]);
      // Reset form
      setAdding(false);
      setNewTitle('');
      setNewDescription('');
      setNewTextContent('');
      setNewUrl('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleToggleActive = async (item: KBItem) => {
    const res = await fetch('/api/admin/knowledge-base', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
    });
    const data = await res.json();
    if (data.success) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Remove this item from the knowledge base?')) return;
    const res = await fetch(`/api/admin/knowledge-base?id=${itemId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const activeCount = items.filter(i => i.is_active).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold flex items-center gap-2">
            <BookOpen size={18} className="text-amber" />
            Knowledge Base
          </h3>
          <p className="text-slate-light/50 text-xs mt-0.5">
            {activeCount} active item{activeCount !== 1 ? 's' : ''} — Lumi uses these to teach {topicTitle}
          </p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber text-navy rounded-lg text-sm font-semibold hover:bg-amber/90 transition-colors"
        >
          <Plus size={14} />
          Add Content
        </button>
      </div>

      {/* Add Form */}
      {adding && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-semibold text-sm">Add to Knowledge Base</h4>
            <button onClick={() => setAdding(false)} className="text-slate-light/40 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Content Type Selector */}
          <div className="grid grid-cols-5 gap-2">
            {(Object.entries(CONTENT_TYPE_CONFIG) as [KBItem['content_type'], typeof CONTENT_TYPE_CONFIG.text][]).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setAddType(type)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                    addType === type
                      ? `${config.bg} border-current ${config.color}`
                      : 'border-white/10 text-slate-light/40 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-[10px] text-center leading-tight">{config.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Title */}
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Title (e.g. 'Photosynthesis Diagram', 'Key Facts Sheet')"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-light/30 focus:outline-none focus:border-amber/50"
          />

          {/* Description */}
          <input
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            placeholder="Brief description of what this content covers (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-light/30 focus:outline-none focus:border-amber/50"
          />

          {/* Content-specific input */}
          {addType === 'text' && (
            <textarea
              value={newTextContent}
              onChange={e => setNewTextContent(e.target.value)}
              placeholder="Paste your knowledge content here — facts, explanations, curriculum notes, teacher guidance, etc. Lumi will use this to give deeper, more accurate explanations."
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-light/30 focus:outline-none focus:border-amber/50 resize-none"
            />
          )}

          {addType === 'url' && (
            <input
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://... (YouTube video, website, resource link)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-light/30 focus:outline-none focus:border-amber/50"
            />
          )}

          {(addType === 'image' || addType === 'video' || addType === 'document') && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-amber/50 transition-colors"
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle size={20} className="text-green-400" />
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-slate-light/40 text-xs">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-slate-light/40 hover:text-red-400 ml-2"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={24} className="text-slate-light/40 mx-auto mb-2" />
                  <p className="text-slate-light/60 text-sm">
                    {addType === 'image' && 'Click to upload an image (JPG, PNG, GIF, WebP)'}
                    {addType === 'video' && 'Click to upload a video (MP4, WebM)'}
                    {addType === 'document' && 'Click to upload a document (PDF, Word, TXT)'}
                  </p>
                  <p className="text-slate-light/30 text-xs mt-1">Max 50MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={
                  addType === 'image' ? 'image/*' :
                  addType === 'video' ? 'video/*' :
                  '.pdf,.doc,.docx,.txt,.md'
                }
                onChange={handleFileSelect}
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || uploading}
              className="flex items-center gap-2 px-4 py-2 bg-amber text-navy rounded-lg text-sm font-semibold hover:bg-amber/90 disabled:opacity-50 transition-colors"
            >
              {(saving || uploading) ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Add to Knowledge Base'}
            </button>
            <button
              onClick={() => { setAdding(false); setError(''); }}
              className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="text-amber animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
          <BookOpen size={32} className="text-slate-light/20 mx-auto mb-3" />
          <p className="text-slate-light/40 text-sm font-medium">No knowledge base items yet</p>
          <p className="text-slate-light/25 text-xs mt-1">
            Add text notes, images, videos, or documents to help Lumi teach this topic more deeply
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const config = CONTENT_TYPE_CONFIG[item.content_type];
            const Icon = config.icon;
            const isExpanded = expandedItem === item.id;

            return (
              <div
                key={item.id}
                className={`border rounded-xl transition-all ${
                  item.is_active
                    ? 'border-white/10 bg-white/3'
                    : 'border-white/5 bg-white/1 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Type Icon */}
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} className={config.color} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium truncate">{item.title}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.color} flex-shrink-0`}>
                        {config.label}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-slate-light/40 text-xs truncate mt-0.5">{item.description}</p>
                    )}
                    {item.extracted_summary && (
                      <p className="text-slate-light/30 text-xs truncate mt-0.5 italic">
                        AI Summary: {item.extracted_summary}
                      </p>
                    )}
                    {item.key_concepts && item.key_concepts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.key_concepts.slice(0, 4).map((c, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-slate-light/40 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Preview/Expand */}
                    <button
                      onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                      className="p-1.5 text-slate-light/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      title="Preview"
                    >
                      <Eye size={14} />
                    </button>

                    {/* External link for files/URLs */}
                    {item.file_url && (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-light/40 hover:text-amber rounded-lg hover:bg-white/10 transition-colors"
                        title="Open file"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}

                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                        item.is_active ? 'text-green-400 hover:text-green-300' : 'text-slate-light/40 hover:text-white'
                      }`}
                      title={item.is_active ? 'Disable (Lumi won\'t use this)' : 'Enable (Lumi will use this)'}
                    >
                      {item.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-light/40 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded Preview */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-3">
                    {item.content_type === 'text' && item.text_content && (
                      <pre className="text-slate-light/60 text-xs whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
                        {item.text_content}
                      </pre>
                    )}
                    {item.content_type === 'image' && item.file_url && (
                      <img
                        src={item.file_url}
                        alt={item.title}
                        className="max-h-48 rounded-lg object-contain mx-auto"
                      />
                    )}
                    {item.content_type === 'video' && item.file_url && (
                      <video
                        src={item.file_url}
                        controls
                        className="w-full max-h-48 rounded-lg"
                      />
                    )}
                    {item.content_type === 'url' && (item.file_url || item.text_content) && (
                      <a
                        href={item.file_url || item.text_content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber hover:underline text-sm flex items-center gap-2"
                      >
                        <ExternalLink size={14} />
                        {item.file_url || item.text_content}
                      </a>
                    )}
                    {item.content_type === 'document' && item.file_url && (
                      <div className="flex items-center gap-3">
                        <FileText size={24} className="text-amber" />
                        <div>
                          <p className="text-white text-sm">{item.file_name}</p>
                          {item.file_size && (
                            <p className="text-slate-light/40 text-xs">{formatFileSize(item.file_size)}</p>
                          )}
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber hover:underline text-xs flex items-center gap-1 mt-1"
                          >
                            <ExternalLink size={12} />
                            Open Document
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Usage hint */}
      {items.length > 0 && (
        <div className="bg-amber/5 border border-amber/20 rounded-lg p-3">
          <p className="text-amber/80 text-xs font-medium mb-1">How Lumi uses this knowledge base:</p>
          <ul className="text-amber/60 text-xs space-y-0.5">
            <li>• Active text items are injected into Lumi&apos;s context for deeper explanations</li>
            <li>• Images can be shown to pupils during the lesson at the right moment</li>
            <li>• Videos can be referenced by Lumi with timestamps and key moments</li>
            <li>• Toggle items on/off to control what Lumi has access to per session</li>
          </ul>
        </div>
      )}
    </div>
  );
}
