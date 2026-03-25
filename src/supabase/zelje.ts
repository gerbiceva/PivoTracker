import { supabaseClient } from './supabaseClient';

export type ZeljeStatus = 'queued' | 'playing' | 'done';

export interface ZeljeSong {
  id: string;
  song_name: string;
  selfie_ref: string | null;
  created_at: string;
  emoji_like: number;
  emoji_fire: number;
  emoji_dislike: number;
  emoji_party: number;
  status: ZeljeStatus;
}

export const addZeljeSong = async (songName: string, selfieRef?: string) => {
  const { data, error } = await supabaseClient.rpc('add_zelje_song', {
    song_name: songName,
    selfie_ref: selfieRef || null,
  });

  if (error) throw error;
  return data as ZeljeSong;
};

export const reactToZelje = async (songId: string, emojiType: 'like' | 'fire' | 'dislike' | 'party') => {
  const { data, error } = await supabaseClient.rpc('react_to_zelje', {
    song_id: songId,
    emoji_type: emojiType,
  });

  if (error) throw error;
  return data as ZeljeSong;
};

export const subscribeToZeljeSongs = (callback: (songs: ZeljeSong[]) => void) => {
  return supabaseClient
    .channel('zelje:songs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'zelje' }, () => {
      fetchZeljeSongs().then(callback);
    })
    .subscribe();
};

export const fetchZeljeSongs = async () => {
  const { data, error } = await supabaseClient
    .from('zelje')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as ZeljeSong[];
};
