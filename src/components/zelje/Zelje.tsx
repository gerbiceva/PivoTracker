import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  Divider,
  ThemeIcon,
  Container,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconMusic, IconFlame } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { SongCard } from './SongCard';
import { AddSongModal } from './AddSongModal';
import { supabaseClient } from '../../supabase/supabaseClient';

type ZeljeSong = {
  id: string;
  song_name: string;
  selfie_ref: string | null;
  created_at: string;
  emoji_like: number;
  emoji_fire: number;
  emoji_dislike: number;
  emoji_party: number;
  status: 'queued' | 'playing' | 'done';
};

export const Zelje = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [playing, setPlaying] = useState<ZeljeSong | null>(null);
  const [queue, setQueue] = useState<ZeljeSong[]>([]);
  const [votingSongs, setVotingSongs] = useState<ZeljeSong[]>([]);

  const loadSongs = async () => {
    try {
      const supabase = supabaseClient as any;
      const { data } = await supabase.from('zelje').select('*').order('created_at', { ascending: true });
      if (data) {
        const playingSongs = data.filter((s: ZeljeSong) => s.status === 'playing');
        setPlaying(playingSongs.length > 0 ? playingSongs[0] : null);
        setQueue(data.filter((s: ZeljeSong) => s.status === 'queued'));
        setVotingSongs(data.filter((s: ZeljeSong) => s.status === 'voting'));
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  useEffect(() => {
    loadSongs();

    const supabase = supabaseClient as any;
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zelje',
        },
        () => {
          loadSongs();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleReact = async (songId: string, emoji: string) => {
    const emojiMap: Record<string, 'like' | 'fire' | 'dislike' | 'party'> = {
      '❤️': 'like',
      '🔥': 'fire',
      '👎': 'dislike',
      '🎉': 'party',
    };

    const emojiType = emojiMap[emoji];
    if (!emojiType) return;

    try {
      await (supabaseClient.rpc as any)('react_to_zelje', {
        song_id: songId,
        emoji_type: emojiType,
      });
    } catch (error) {
      console.error('Error reacting to song:', error);
    }
  };

  return (
    <Container size="sm" py="xl" px="sm">
      <Stack gap="xl">

        {playing && (
          <Box>
            <Group gap="sm" mb="md" pb="3rem">
              <ThemeIcon size="lg" color="yellow" variant="filled">
                <IconMusic size={18} />
              </ThemeIcon>
              <Title order={2} >Zdaj predvajam</Title>
            </Group>
            <SongCard key={playing.id} song={playing} isQueue onReact={() => { }} />
          </Box>
        )}

        {queue.length > 0 && (
          <Box>
            <Group gap="sm" mb="md">
              <ThemeIcon size="lg" color="violet" variant="filled">
                <IconMusic size={18} />
              </ThemeIcon>
              <Title order={2}>V vrsti</Title>
            </Group>
            <Stack gap="sm">
              {queue.map((song) => (
                <SongCard key={song.id} song={song} isQueue onReact={() => { }} />
              ))}
            </Stack>
          </Box>
        )}

        <Divider
          label={
            <Group gap="xs">
              <IconFlame size={16} />
              <Text>Glasovanje</Text>
            </Group>
          }
          labelPosition="left"
          size="lg"
        />

        <Text c="dimmed" ta="center" pb="3rem">
          Klikni na emoji za glasovanje!
        </Text>

        <Stack gap="5rem">
          {votingSongs.map((song) => (
            <SongCard key={song.id} song={song} onReact={handleReact} />
          ))}
        </Stack>

        <Button
          leftSection={<IconPlus size={18} />}
          size="lg"
          radius="xl"
          variant="filled"
          color="violet"
          onClick={open}
          style={{ position: 'fixed', bottom: 30, right: 30 }}
        >
          Dodaj pesem
        </Button>

        <AddSongModal opened={opened} onClose={close} onSongAdded={() => { }} />
      </Stack>
    </Container>
  );
};
