'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Image as ImageIcon, Video, Music, Trash2, Copy, Check,
  FolderOpen, Search, Grid, List, X, Loader2, FileUp, Eye,
  ExternalLink, AlertTriangle
} from 'lucide-react';
import { MOCK_SUBJECTS, MOCK_TOPICS } from '@/lib/mock-data';
import { Topic } from '@/types';

const ALL_TOPICS: Topic[] = Object.values(MOCK_TOPICS).flat();

interface MediaFile {
  id?: string;
  pathname: string;
  url: string;
  filename: string;
  mime_type: string;
  media_type: 'image' | 'video' | 'audio';
  size_bytes?: number;
  alt_text?: string;
  folder?: string;
  created_at?: string;
}

interface ImageResult {
  url: string;
  source_type: string;
  title: string;
  description?: string;
  score: number;
  is_approved: boolean;
  concerns: string;
  lumi_instruction: string;
}

const FOLDERS = [
  { id: 'all', label: 'All Media', icon: FolderOpen },
  { id: 'lessons', label: 'Lessons', icon: ImageIcon },
  { id: 'avatars', label: 'Avatars', icon: ImageIcon },
  { id: 'backgrounds', label: 'Backgrounds', icon: ImageIcon },
  { id: 'icons', label: 'Icons', icon: ImageIcon },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'audio', label: 'Audio', icon: Music },
];

export default function AdminImagesPage() {
  // Media library state
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'verify'>('library');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verification state
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [searching, setSearching] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [customUrl, setCustomUrl] = useState('');

  const selectedTopic = ALL_TOPICS.find((t) => t.id === selectedTopicId);
  const selectedSubject = selectedTopic
    ? MOCK_SUBJECTS.find((s) => s.id === selectedTopic.subject_id)
    : null;

  // Fetch media files
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFolder !== 'all') {
        params.set('folder', selectedFolder);
      }
      const res = await fetch(`/api/admin/media?${params}`);
      const data = await res.json();
      if (res.ok) {
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch media:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedFolder]);

  useEffect(() => {
    if (activeTab === 'library') {
      fetchFiles();
    }
  }, [fetchFiles, activeTab]);

  // Handle file upload
  const uploadFiles = async (filesToUpload: FileList | File[]) => {
    setUploading(true);
    const fileArray = Array.from(filesToUpload);

    for (const file of fileArray) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', selectedFolder === 'all' ? 'general' : selectedFolder);

      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      try {
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData,
        });

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        if (res.ok) {
          const data = await res.json();
          if (data.media) {
            setFiles(prev => [data.media, ...prev]);
          }
        } else {
          const error = await res.json();
          alert(`Failed to upload ${file.name}: ${error.error}`);
        }
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        alert(`Failed to upload ${file.name}`);
      }

      setTimeout(() => {
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[file.name];
          return next;
        });
      }, 2000);
    }

    setUploading(false);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      uploadFiles(droppedFiles);
    }
  };

  // Delete file
  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Delete ${file.filename}?`)) return;

    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: file.url, pathname: file.pathname }),
      });

      if (res.ok) {
        setFiles(prev => prev.filter(f => f.pathname !== file.pathname));
        if (selectedFile?.pathname === file.pathname) {
          setSelectedFile(null);
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Copy URL
  const copyUrl = (file: MediaFile) => {
    const url = `/api/admin/media/file?pathname=${encodeURIComponent(file.pathname)}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(file.pathname);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Filter files
  const filteredFiles = files.filter(file => {
    if (searchQuery) {
      return file.filename.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Format file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get media preview URL
  const getPreviewUrl = (file: MediaFile) => {
    return `/api/admin/media/file?pathname=${encodeURIComponent(file.pathname)}`;
  };

  // Verification handlers
  const handleSearch = async () => {
    if (!selectedTopic || !selectedSubject) return;
    setSearching(true);
    setImages([]);

    try {
      const res = await fetch(
        `/api/lumi/visual-search?topic=${encodeURIComponent(selectedTopic.title)}&subject=${encodeURIComponent(selectedSubject.name)}`
      );
      const data = await res.json();

      if (data.found && data.image) {
        setImages([
          {
            url: data.image.url,
            source_type: data.image.source_type,
            title: data.image.title,
            description: data.image.description,
            score: data.verification?.score ?? 0,
            is_approved: data.verification?.is_approved ?? false,
            concerns: data.verification?.concerns ?? '',
            lumi_instruction: data.verification?.lumi_instruction ?? '',
          },
        ]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleVerifyCustom = async () => {
    if (!customUrl || !selectedTopic || !selectedSubject) return;
    setVerifying(true);

    try {
      const res = await fetch('/api/lumi/verify-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: customUrl,
          topic_title: selectedTopic.title,
          subject_name: selectedSubject.name,
        }),
      });
      const data = await res.json();

      const newImage: ImageResult = {
        url: customUrl,
        source_type: 'admin_upload',
        title: 'Custom image',
        score: data.score,
        is_approved: data.is_approved,
        concerns: data.concerns,
        lumi_instruction: data.lumi_instruction,
      };

      setImages((prev) => [newImage, ...prev]);
      setSelectedImage(newImage);
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className="min-h-screen p-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-electric/20 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-navy-light border-2 border-dashed border-electric rounded-3xl p-12 text-center"
            >
              <Upload size={64} className="text-electric mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Drop files here</h2>
              <p className="text-slate-light/70">Images, videos, and audio files supported</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Production Studio</h1>
          <p className="text-slate-light/70 text-sm mt-1">Upload, manage, and verify media assets</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-navy-light rounded-xl p-1">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'library' ? 'bg-electric text-white' : 'text-slate-light/70 hover:text-white'
            }`}
          >
            Media Library
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'verify' ? 'bg-electric text-white' : 'text-slate-light/70 hover:text-white'
            }`}
          >
            Verify Images
          </button>
        </div>
      </div>

      {/* Media Library Tab */}
      {activeTab === 'library' && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light/50" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl bg-navy-light border border-white/10 text-white text-sm w-48 focus:outline-none focus:border-electric"
                />
              </div>

              {/* View toggle */}
              <div className="flex bg-navy-light rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-electric text-white' : 'text-slate-light/70 hover:text-white'}`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-electric text-white' : 'text-slate-light/70 hover:text-white'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-electric text-white font-semibold hover:bg-electric/90 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Upload Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              className="hidden"
            />
          </div>

          <div className="flex gap-6">
            {/* Sidebar - Folders */}
            <div className="w-48 shrink-0">
              <div className="bg-navy-light rounded-2xl p-3 space-y-1">
                {FOLDERS.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                      selectedFolder === folder.id
                        ? 'bg-electric text-white'
                        : 'text-slate-light/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <folder.icon size={16} />
                    {folder.label}
                  </button>
                ))}
              </div>

              {/* Upload progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="mt-4 bg-navy-light rounded-2xl p-3 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-light/70 uppercase">Uploading</h3>
                  {Object.entries(uploadProgress).map(([name, progress]) => (
                    <div key={name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white truncate max-w-[120px]">{name}</span>
                        <span className="text-electric">{progress}%</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-electric"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Main content */}
            <div className="flex-1">
              {/* Drop zone when empty */}
              {!loading && filteredFiles.length === 0 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center cursor-pointer hover:border-electric/50 transition-colors"
                >
                  <FileUp size={48} className="text-slate-light/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No files yet</h3>
                  <p className="text-slate-light/60 text-sm mb-4">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-slate-light/40 text-xs">
                    Supports: JPG, PNG, GIF, WebP, SVG, MP4, WebM, MP3, WAV
                  </p>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="text-electric animate-spin" />
                </div>
              )}

              {/* Grid view */}
              {!loading && filteredFiles.length > 0 && viewMode === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredFiles.map((file) => (
                    <motion.div
                      key={file.pathname}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`group relative bg-navy-light rounded-xl overflow-hidden cursor-pointer border-2 transition-colors ${
                        selectedFile?.pathname === file.pathname ? 'border-electric' : 'border-transparent hover:border-white/20'
                      }`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="aspect-square relative">
                        {file.media_type === 'image' && (
                          <img
                            src={getPreviewUrl(file)}
                            alt={file.alt_text || file.filename}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {file.media_type === 'video' && (
                          <div className="w-full h-full bg-navy flex items-center justify-center">
                            <Video size={32} className="text-slate-light/40" />
                          </div>
                        )}
                        {file.media_type === 'audio' && (
                          <div className="w-full h-full bg-navy flex items-center justify-center">
                            <Music size={32} className="text-slate-light/40" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); copyUrl(file); }}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                            title="Copy URL"
                          >
                            {copiedUrl === file.pathname ? <Check size={16} className="text-mint" /> : <Copy size={16} className="text-white" />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2">
                        <p className="text-xs text-white truncate">{file.filename}</p>
                        <p className="text-xs text-slate-light/50">{formatSize(file.size_bytes)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* List view */}
              {!loading && filteredFiles.length > 0 && viewMode === 'list' && (
                <div className="bg-navy-light rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-xs font-semibold text-slate-light/70 uppercase px-4 py-3">Preview</th>
                        <th className="text-left text-xs font-semibold text-slate-light/70 uppercase px-4 py-3">Filename</th>
                        <th className="text-left text-xs font-semibold text-slate-light/70 uppercase px-4 py-3">Type</th>
                        <th className="text-left text-xs font-semibold text-slate-light/70 uppercase px-4 py-3">Size</th>
                        <th className="text-right text-xs font-semibold text-slate-light/70 uppercase px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((file) => (
                        <tr
                          key={file.pathname}
                          className={`border-b border-white/5 cursor-pointer transition-colors ${
                            selectedFile?.pathname === file.pathname ? 'bg-electric/10' : 'hover:bg-white/5'
                          }`}
                          onClick={() => setSelectedFile(file)}
                        >
                          <td className="px-4 py-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-navy">
                              {file.media_type === 'image' ? (
                                <img src={getPreviewUrl(file)} alt="" className="w-full h-full object-cover" />
                              ) : file.media_type === 'video' ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video size={16} className="text-slate-light/40" />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Music size={16} className="text-slate-light/40" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-white">{file.filename}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-light/70">{file.mime_type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-light/70">{formatSize(file.size_bytes)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); copyUrl(file); }}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                              >
                                {copiedUrl === file.pathname ? <Check size={14} className="text-mint" /> : <Copy size={14} className="text-slate-light/70" />}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                              >
                                <Trash2 size={14} className="text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* File detail panel */}
            <AnimatePresence>
              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-64 shrink-0"
                >
                  <div className="bg-navy-light rounded-2xl overflow-hidden sticky top-6">
                    <div className="aspect-video relative bg-navy">
                      {selectedFile.media_type === 'image' && (
                        <img
                          src={getPreviewUrl(selectedFile)}
                          alt={selectedFile.alt_text || selectedFile.filename}
                          className="w-full h-full object-contain"
                        />
                      )}
                      {selectedFile.media_type === 'video' && (
                        <video
                          src={getPreviewUrl(selectedFile)}
                          controls
                          className="w-full h-full"
                        />
                      )}
                      {selectedFile.media_type === 'audio' && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <Music size={48} className="text-electric mb-4" />
                          <audio src={getPreviewUrl(selectedFile)} controls className="w-full" />
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="text-white font-semibold truncate">{selectedFile.filename}</h3>
                        <p className="text-xs text-slate-light/50 mt-1">{selectedFile.mime_type}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-light/70">Size</span>
                          <span className="text-white">{formatSize(selectedFile.size_bytes)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-light/70">Type</span>
                          <span className="text-white capitalize">{selectedFile.media_type}</span>
                        </div>
                        {selectedFile.folder && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-light/70">Folder</span>
                            <span className="text-white">{selectedFile.folder}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-slate-light/70">Media URL</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`/api/admin/media/file?pathname=${encodeURIComponent(selectedFile.pathname)}`}
                            className="flex-1 px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-xs truncate"
                          />
                          <button
                            onClick={() => copyUrl(selectedFile)}
                            className="px-3 py-2 rounded-lg bg-electric text-white text-xs font-semibold hover:bg-electric/90 transition-colors"
                          >
                            {copiedUrl === selectedFile.pathname ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleDelete(selectedFile)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Verify Images Tab */}
      {activeTab === 'verify' && (
        <>
          <p className="text-sm text-slate-light/60 mb-6">
            Search, verify, and manage teaching images. Images scoring 8/10 or above are auto-approved.
          </p>

          {/* Search controls */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-6">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-5">
                <label className="block text-xs font-bold text-white mb-1.5">Topic</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                >
                  <option value="">Select a topic...</option>
                  {MOCK_SUBJECTS.map((subject) => (
                    <optgroup key={subject.id} label={`${subject.icon_emoji} ${subject.name}`}>
                      {ALL_TOPICS.filter((t) => t.subject_id === subject.id).map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="col-span-5">
                <label className="block text-xs font-bold text-white mb-1.5">Custom Image URL (optional)</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-light/30"
                  placeholder="https://example.com/image.jpg"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </div>
              <div className="col-span-2 flex items-end gap-2">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky/20 text-sky text-sm font-bold hover:bg-sky/30 disabled:opacity-50"
                  onClick={handleSearch}
                  disabled={!selectedTopicId || searching}
                >
                  {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Search
                </button>
                {customUrl && (
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber/20 text-amber text-sm font-bold hover:bg-amber/30 disabled:opacity-50"
                    onClick={handleVerifyCustom}
                    disabled={verifying || !selectedTopicId}
                  >
                    {verifying ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                    Verify
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results grid */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8">
              {images.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                  <ImageIcon size={32} className="text-slate-light/30 mx-auto mb-3" />
                  <p className="text-white font-semibold mb-2">No images yet</p>
                  <p className="text-slate-light/50 text-sm">
                    Select a topic and search to find teaching images.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      className={`rounded-xl border overflow-hidden text-left transition-all ${
                        selectedImage?.url === img.url
                          ? 'border-amber ring-2 ring-amber/30'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <div className="aspect-video bg-navy/50 relative">
                        <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              img.is_approved ? 'bg-emerald/90 text-white' : 'bg-amber/90 text-navy'
                            }`}
                          >
                            {img.score}/10
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy/80 text-white font-bold">
                            {img.source_type}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/5">
                        <p className="text-sm text-white font-semibold truncate">{img.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {img.is_approved ? (
                            <span className="text-xs text-emerald flex items-center gap-1">
                              <Check size={10} /> Approved
                            </span>
                          ) : (
                            <span className="text-xs text-amber flex items-center gap-1">
                              <AlertTriangle size={10} /> Needs Review
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detail panel */}
            <div className="col-span-4">
              {selectedImage ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4 sticky top-24">
                  <img src={selectedImage.url} alt={selectedImage.title} className="w-full rounded-lg" />

                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-light/40 mb-1">Accuracy Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-navy rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${selectedImage.score * 10}%`,
                            backgroundColor: selectedImage.score >= 8 ? '#10B981' : selectedImage.score >= 5 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-white">{selectedImage.score}/10</span>
                    </div>
                  </div>

                  {selectedImage.concerns && selectedImage.concerns !== 'None' && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-slate-light/40 mb-1">Concerns</p>
                      <p className="text-sm text-amber/80">{selectedImage.concerns}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-light/40 mb-1">Lumi Teaching Instruction</p>
                    <p className="text-sm text-sky/80 italic">{selectedImage.lumi_instruction}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 px-3 py-2 rounded-lg bg-emerald/20 text-emerald text-xs font-bold hover:bg-emerald/30">
                      <Check size={12} className="inline mr-1" /> Approve
                    </button>
                    <button className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30">
                      <X size={12} className="inline mr-1" /> Blacklist
                    </button>
                  </div>

                  <a
                    href={selectedImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-white/5 text-white text-xs font-bold hover:bg-white/10"
                  >
                    <ExternalLink size={12} /> Open Full Size
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                  <Eye size={24} className="text-slate-light/30 mx-auto mb-2" />
                  <p className="text-sm text-slate-light/50">Select an image to review</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
