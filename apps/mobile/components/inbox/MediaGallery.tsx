import { useMemo } from 'react';
import { MediaViewer } from '@/components/media/MediaViewer';

interface MediaGalleryProps {
  messages: any[];
  visible: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export function MediaGallery({ messages, visible, onClose, initialIndex = 0 }: MediaGalleryProps) {
  const mediaItems = useMemo(() => {
    const out: Array<{ id: string; uri: string; type: 'image' | 'video'; thumbnail?: string }> = [];
    for (const m of messages || []) {
      const media = m?.media;
      if (!Array.isArray(media)) continue;
      for (let idx = 0; idx < media.length; idx++) {
        const item = media[idx];
        const t = (item?.type || '').toString().toLowerCase();
        const isImage = t === 'image';
        const isVideo = t === 'video';
        if (!isImage && !isVideo) continue;
        const uri = item?.url || item?.uri || item?.thumbnail;
        if (!uri) continue;
        out.push({ 
          id: `${m.id || 'm'}-${idx}-${uri}`, 
          uri, 
          type: isVideo ? 'video' : 'image', 
          thumbnail: item?.thumbnail 
        });
      }
    }
    return out;
  }, [messages]);

  if (mediaItems.length === 0) {
    return null;
  }

  return (
    <MediaViewer
      visible={visible}
      mediaItems={mediaItems}
      initialIndex={initialIndex}
      onClose={onClose}
    />
  );
}
