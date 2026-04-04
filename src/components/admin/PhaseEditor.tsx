'use client';

import { useState, useCallback } from 'react';
import { Edit3, Save, X, Plus, Trash2, Image as ImageIcon, Video, Smile, Sparkles, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import MediaPicker from './MediaPicker';

interface PhaseQuestion {
  question: string;
  expected_answer: string;
  hints: string[];
}

interface PhaseJson {
  phase_goal: string;
  opening_question?: string;
  teaching_points: string[];
  questions: PhaseQuestion[];
  transition_to_next: string;
  closing_summary?: string;
  fun_fact?: string;
  funny_moment?: string;
}

interface PhaseMedia {
  id: string;
  media_type: 'image' | 'video' | 'gif' | 'youtube';
  url: string;
  thumbnail: string;
  title: string;
  lumi_instruction: string;
}

interface PhaseEditorProps {
  lessonId: string;
  phase: string;
  phaseData: PhaseJson;
  phaseMedia: PhaseMedia[];
  topic: string;
  keyConcepts?: string[];
  ageGroup?: string;
  onSave: (phase: string, updatedData: PhaseJson) => Promise<void>;
  onMediaAdded: (phase: string, media: PhaseMedia) => void;
  onMediaRemoved: (phase: string, mediaId: string) => void;
}

const PHASE_COLOURS: Record<string, string> = {
  spark: 'from-amber-500 to-orange-500',
  explore: 'from-blue-500 to-cyan-500',
  anchor: 'from-purple-500 to-violet-500',
  practise: 'from-green-500 to-emerald-500',
  create: 'from-pink-500 to-rose-500',
  check: 'from-indigo-500 to-blue-600',
  celebrate: 'from-yellow-400 to-amber-500',
};

const PHASE_EMOJIS: Record<string, string> = {
  spark: '⚡',
  explore: '🔭',
  anchor: '⚓',
  practise: '🎯',
  create: '🎨',
  check: '✅',
  celebrate: '🎉',
};

export default function PhaseEditor({
  lessonId,
  phase,
  phaseData,
  phaseMedia,
  topic,
  keyConcepts = [],
  ageGroup = '8-11',
  onSave,
  onMediaAdded,
  onMediaRemoved,
}: PhaseEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<PhaseJson>(phaseData);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [removingMedia, setRemovingMedia] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(phase, editedData);
      setIsEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [phase, editedData, onSave]);

  const handleCancel = useCallback(() => {
    setEditedData(phaseData);
    setIsEditing(false);
  }, [phaseData]);

  const updateTeachingPoint = (index: number, value: string) => {
    const updated = [...editedData.teaching_points];
    updated[index] = value;
    setEditedData({ ...editedData, teaching_points: updated });
  };

  const addTeachingPoint = () => {
    setEditedData({
      ...editedData,
      teaching_points: [...editedData.teaching_points, '']
    });
  };

  const removeTeachingPoint = (index: number) => {
    setEditedData({
      ...editedData,
      teaching_points: editedData.teaching_points.filter((_, i) => i !== index)
    });
  };

  const updateQuestion = (index: number, field: keyof PhaseQuestion, value: string) => {
    const updated = [...editedData.questions];
    if (field === 'hints') {
      updated[index] = { ...updated[index], hints: value.split('\n') };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setEditedData({ ...editedData, questions: updated });
  };

  const addQuestion = () => {
    setEditedData({
      ...editedData,
      questions: [...editedData.questions, { question: '', expected_answer: '', hints: [''] }]
    });
  };

  const removeQuestion = (index: number) => {
    setEditedData({
      ...editedData,
      questions: editedData.questions.filter((_, i) => i !== index)
    });
  };

  const handleRemoveMedia = async (mediaId: string) => {
    setRemovingMedia(mediaId);
    try {
      await fetch('/api/admin/lesson-media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_id: mediaId }),
      });
      onMediaRemoved(phase, mediaId);
    } catch (err) {
      console.error('Failed to remove media:', err);
    } finally {
      setRemovingMedia(null);
    }
  };

  const gradient = PHASE_COLOURS[phase] || 'from-gray-500 to-gray-600';
  const emoji = PHASE_EMOJIS[phase] || '📚';

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      {/* Phase header */}
      <div className={`bg-gradient-to-r ${gradient} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className="text-white font-bold text-base capitalize">{phase} Phase</h3>
            <p className="text-white/70 text-xs">{phaseData.phase_goal}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phaseMedia.length > 0 && (
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
              {phaseMedia.length} media
            </span>
          )}
          <button
            onClick={() => setShowMediaPicker(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Media
          </button>
          {!isEditing ? (
            <button
              onClick={() => { setIsEditing(true); setIsExpanded(true); }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-white text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Media attachments */}
          {phaseMedia.length > 0 && (
            <div>
              <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Attached Media ({phaseMedia.length})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {phaseMedia.map((media) => (
                  <div key={media.id} className="relative group rounded-lg overflow-hidden bg-gray-700 aspect-video">
                    {media.thumbnail ? (
                      <img src={media.thumbnail} alt={media.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {media.media_type === 'image' && <ImageIcon className="w-6 h-6 text-gray-500" />}
                        {(media.media_type === 'video' || media.media_type === 'youtube') && <Video className="w-6 h-6 text-gray-500" />}
                        {media.media_type === 'gif' && <Smile className="w-6 h-6 text-gray-500" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => void handleRemoveMedia(media.id)}
                        disabled={removingMedia === media.id}
                        className="bg-red-500 hover:bg-red-400 text-white p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                      <p className="text-white text-xs truncate">{media.title}</p>
                    </div>
                    <div className="absolute top-1 right-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        media.media_type === 'image' ? 'bg-blue-500/80 text-white' :
                        media.media_type === 'youtube' || media.media_type === 'video' ? 'bg-red-500/80 text-white' :
                        'bg-purple-500/80 text-white'
                      }`}>
                        {media.media_type === 'youtube' ? 'YT' : media.media_type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase goal */}
          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Phase Goal</label>
            {isEditing ? (
              <textarea
                value={editedData.phase_goal}
                onChange={(e) => setEditedData({ ...editedData, phase_goal: e.target.value })}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-amber-500 focus:outline-none resize-none"
                rows={2}
              />
            ) : (
              <p className="text-gray-200 text-sm">{phaseData.phase_goal}</p>
            )}
          </div>

          {/* Opening question */}
          {(phaseData.opening_question || isEditing) && (
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Opening Question</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.opening_question || ''}
                  onChange={(e) => setEditedData({ ...editedData, opening_question: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-amber-500 focus:outline-none"
                />
              ) : (
                <p className="text-amber-300 text-sm italic">&ldquo;{phaseData.opening_question}&rdquo;</p>
              )}
            </div>
          )}

          {/* Funny moment */}
          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-yellow-400" />
              Funny Moment / Joke (optional)
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.funny_moment || ''}
                onChange={(e) => setEditedData({ ...editedData, funny_moment: e.target.value })}
                placeholder="Add a funny analogy, joke, or silly moment for Lumi to use..."
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-500 focus:outline-none placeholder-gray-500"
              />
            ) : phaseData.funny_moment ? (
              <p className="text-yellow-300 text-sm">😄 {phaseData.funny_moment}</p>
            ) : (
              <p className="text-gray-500 text-xs italic">No funny moment added yet — click Edit to add one!</p>
            )}
          </div>

          {/* Teaching points */}
          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Teaching Points</label>
            <div className="space-y-2">
              {(isEditing ? editedData : phaseData).teaching_points.map((point, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-gray-500 text-xs mt-2 w-4 shrink-0">{i + 1}.</span>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => updateTeachingPoint(i, e.target.value)}
                        className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-amber-500 focus:outline-none"
                      />
                      <button onClick={() => removeTeachingPoint(i)} className="text-red-400 hover:text-red-300 mt-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-200 text-sm flex-1">{point}</p>
                  )}
                </div>
              ))}
              {isEditing && (
                <button
                  onClick={addTeachingPoint}
                  className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add teaching point
                </button>
              )}
            </div>
          </div>

          {/* Questions */}
          {(isEditing ? editedData : phaseData).questions.length > 0 && (
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Questions</label>
              <div className="space-y-3">
                {(isEditing ? editedData : phaseData).questions.map((q, i) => (
                  <div key={i} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-gray-400 text-xs font-bold mt-0.5">Q{i + 1}</span>
                      {isEditing && (
                        <button onClick={() => removeQuestion(i)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="space-y-2 mt-1">
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => updateQuestion(i, 'question', e.target.value)}
                          placeholder="Question..."
                          className="w-full bg-gray-700 text-white rounded px-2 py-1.5 text-xs border border-gray-600 focus:border-amber-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={q.expected_answer}
                          onChange={(e) => updateQuestion(i, 'expected_answer', e.target.value)}
                          placeholder="Expected answer..."
                          className="w-full bg-gray-700 text-green-300 rounded px-2 py-1.5 text-xs border border-gray-600 focus:border-green-500 focus:outline-none"
                        />
                        <textarea
                          value={q.hints.join('\n')}
                          onChange={(e) => updateQuestion(i, 'hints', e.target.value)}
                          placeholder="Hints (one per line)..."
                          className="w-full bg-gray-700 text-yellow-300 rounded px-2 py-1.5 text-xs border border-gray-600 focus:border-yellow-500 focus:outline-none resize-none"
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div className="mt-1 space-y-1">
                        <p className="text-white text-sm">{q.question}</p>
                        <p className="text-green-400 text-xs">✓ {q.expected_answer}</p>
                        {q.hints.length > 0 && (
                          <p className="text-yellow-400 text-xs">💡 {q.hints[0]}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={addQuestion}
                    className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add question
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Fun fact */}
          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Fun Fact (optional)
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.fun_fact || ''}
                onChange={(e) => setEditedData({ ...editedData, fun_fact: e.target.value })}
                placeholder="A surprising or amazing fact about this topic..."
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-amber-500 focus:outline-none placeholder-gray-500"
              />
            ) : phaseData.fun_fact ? (
              <p className="text-amber-300 text-sm">⭐ {phaseData.fun_fact}</p>
            ) : null}
          </div>

          {/* Transition */}
          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Transition to Next Phase</label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.transition_to_next}
                onChange={(e) => setEditedData({ ...editedData, transition_to_next: e.target.value })}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-amber-500 focus:outline-none"
              />
            ) : (
              <p className="text-gray-400 text-sm italic">{phaseData.transition_to_next}</p>
            )}
          </div>
        </div>
      )}

      {/* Media Picker modal */}
      {showMediaPicker && (
        <MediaPicker
          lessonId={lessonId}
          phase={phase}
          topic={topic}
          keyConcepts={keyConcepts}
          ageGroup={ageGroup}
          onMediaAdded={(media, instruction) => {
            onMediaAdded(phase, { id: media.id, media_type: media.type, url: media.url, thumbnail: media.thumbnail, title: media.title, lumi_instruction: instruction });
            setShowMediaPicker(false);
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  );
}
