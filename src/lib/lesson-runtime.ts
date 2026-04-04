import { AgeGroup, LessonPhase, ParsedContentSignal, ParsedPhaseSignal, TopicStatus } from '@/types';

export type ParsedImageSignal = {
  url: string;
  media_type?: 'image' | 'gif' | 'youtube';
  title?: string;
};

export function getAgeGroup(age: number): Exclude<AgeGroup, 'all'> {
  if (age <= 7) return '5-7';
  if (age <= 11) return '8-11';
  if (age <= 14) return '12-14';
  return '15-16';
}

export function parseContentSignals(text: string): ParsedContentSignal[] {
  const matches = text.match(/\[CONTENT:([a-z_]+):([^\]]+)\]/g) ?? [];
  return matches
    .map((match) => {
      const [, type, id] = match.match(/\[CONTENT:([a-z_]+):([^\]]+)\]/) ?? [];
      return { type, id };
    })
    .filter((entry) => entry.type && entry.id);
}

export function parseImageSignals(text: string): ParsedImageSignal[] {
  const results: ParsedImageSignal[] = [];

  const imageMatches = text.match(/\[IMAGE:(https?:\/\/[^\]]+)\]/g) ?? [];
  for (const match of imageMatches) {
    const [, url] = match.match(/\[IMAGE:(https?:\/\/[^\]]+)\]/) ?? [];
    if (url) {
      const isGif = url.toLowerCase().includes('.gif') || url.toLowerCase().includes('giphy');
      results.push({ url, media_type: isGif ? 'gif' : 'image' });
    }
  }

  const ytMatches = text.match(/\[YOUTUBE:([A-Za-z0-9_-]{6,15})\]/g) ?? [];
  for (const match of ytMatches) {
    const [, videoId] = match.match(/\[YOUTUBE:([A-Za-z0-9_-]{6,15})\]/) ?? [];
    if (videoId) {
      results.push({ url: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`, media_type: 'youtube' });
    }
  }

  const gifMatches = text.match(/\[GIF:(https?:\/\/[^\]]+)\]/g) ?? [];
  for (const match of gifMatches) {
    const [, url] = match.match(/\[GIF:(https?:\/\/[^\]]+)\]/) ?? [];
    if (url) results.push({ url, media_type: 'gif' });
  }

  return results;
}

export function stripAllSignals(text: string): string {
  return text
    .replace(/\[CONTENT:[^\]]+\]/g, '')
    .replace(/\[PHASE:[^\]]+\]/g, '')
    .replace(/\[IMAGE:[^\]]+\]/g, '')
    .replace(/\[YOUTUBE:[^\]]+\]/g, '')
    .replace(/\[GIF:[^\]]+\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parsePhaseSignal(text: string): ParsedPhaseSignal | null {
  const match = text.match(/\[PHASE:([a-z]+)\]/);
  if (!match) return null;
  return { phase: match[1] as LessonPhase };
}

export function getNextPhase(currentPhase: LessonPhase): LessonPhase {
  const order: LessonPhase[] = ['spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate'];
  const currentIndex = order.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === order.length - 1) return 'celebrate';
  return order[currentIndex + 1];
}

export function inferTopicStatus(mastery: number): TopicStatus {
  if (mastery >= 80) return 'completed';
  if (mastery >= 30) return 'in_progress';
  return 'available';
}
