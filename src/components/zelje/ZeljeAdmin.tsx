import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  Badge,
  ActionIcon,
  Divider,
  Paper,
  ThemeIcon,
  Container,
  Box,
  Menu,
} from '@mantine/core';
import {
  IconMusic,
  IconFlame,
  IconDotsVertical,
  IconTrash,
  IconPlayerPlay,
  IconArrowRight,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { supabaseClient } from '../../supabase/supabaseClient';
import { SongCard } from './SongCard';

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

interface SongRowProps {
  song: ZeljeSong;
  onPlayNow: (song: ZeljeSong) => void;
  onAddToQueue: (song: ZeljeSong) => void;
  onPromoteToPlaying: (song: ZeljeSong) => void;
  onRemove: (songId: string) => void;
  showQueueBadge?: boolean;
}

const SongRow = ({ song, onPlayNow, onAddToQueue, onPromoteToPlaying, onRemove, showQueueBadge }: SongRowProps) => {
  return (
    <Paper p="sm" radius="md" withBorder>
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {song.selfie_ref ? (
            <img
              src={song.selfie_ref}
              alt="Selfie"
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <ThemeIcon size="lg" radius="md" variant="light" color="violet">
              <IconMusic size={18} />
            </ThemeIcon>
          )}
          <Box style={{ minWidth: 0 }}>
            <Text fw="bold" size="sm" truncate>
              {song.song_name}
            </Text>
          </Box>
        </Group>

        <Group gap="xs" wrap="nowrap">
          {song.emoji_like > 0 && (
            <Badge variant="light" color="red" size="sm">
              ❤️ {song.emoji_like}
            </Badge>
          )}
          {song.emoji_fire > 0 && (
            <Badge variant="light" color="orange" size="sm">
              🔥 {song.emoji_fire}
            </Badge>
          )}
          {song.emoji_dislike > 0 && (
            <Badge variant="light" color="gray" size="sm">
              👎 {song.emoji_dislike}
            </Badge>
          )}
          {song.emoji_party > 0 && (
            <Badge variant="light" color="pink" size="sm">
              🎉 {song.emoji_party}
            </Badge>
          )}

          {showQueueBadge && (
            <Button
              size="xs"
              variant="light"
              color="yellow"
              onClick={() => onPromoteToPlaying(song)}
            >
              Predvajaj
            </Button>
          )}

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {!showQueueBadge && (
                <>
                  <Menu.Item
                    leftSection={<IconPlayerPlay size={14} />}
                    onClick={() => onAddToQueue(song)}
                  >
                    Dodaj v vrsto
                  </Menu.Item>
                  {/* <Menu.Item
                    leftSection={<IconArrowRight size={14} />}
                    onClick={() => onPlayNow(song)}
                  >
                    Predvajaj zdaj
                  </Menu.Item> */}
                  <Menu.Divider />
                </>
              )}
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => onRemove(song.id)}
              >
                Odstrani
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Paper>
  );
};

export const ZeljeAdmin = () => {
  const [playing, setPlaying] = useState<ZeljeSong | null>(null);
  const [queue, setQueue] = useState<ZeljeSong[]>([]);
  const [votingSongs, setVotingSongs] = useState<ZeljeSong[]>([]);

  const loadSongs = async () => {
    try {
      const supabase = supabaseClient;
      const { data } = await supabase.from("zelje").select('*').order('created_at', { ascending: true });
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

  const handlePlayNow = async (song: ZeljeSong) => {
    try {
      const supabase = supabaseClient as any;
      await supabase.from('zelje').update({ status: 'playing' }).eq('id', song.id);
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const handleAddToQueue = async (song: ZeljeSong) => {
    try {
      const supabase = supabaseClient as any;
      await supabase.from('zelje').update({ status: 'queued' }).eq('id', song.id);
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  };

  const handlePromoteToPlaying = async (song: ZeljeSong) => {
    try {
      const supabase = supabaseClient as any;
      await supabase.from('zelje').update({ status: 'playing' }).eq('id', song.id);
    } catch (error) {
      console.error('Error promoting to playing:', error);
    }
  };

  const handleFinishSong = async (songId: string) => {
    try {
      const supabase = supabaseClient as any;
      await supabase.from('zelje').update({ status: 'done' }).eq('id', songId);
    } catch (error) {
      console.error('Error finishing song:', error);
    }
  };

  const handleRemove = async (songId: string) => {
    try {
      const supabase = supabaseClient as any;
      await supabase.from('zelje').delete().eq('id', songId);
    } catch (error) {
      console.error('Error removing song:', error);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Paper p="xl" radius="md" bg="dark.5">
          <Title order={1} ta="center" c="white" mb="sm">
            🎤 Karaoke Admin 🎤
          </Title>
          <Text ta="center" c="dimmed">
            Upravljaj z vrstnim redom pesmi
          </Text>
        </Paper>

        <Box>
          <Group gap="sm" mb="md">
            <ThemeIcon size="lg" color="yellow" variant="filled">
              <IconPlayerPlay size={18} />
            </ThemeIcon>
            <Title order={2}>Trenutno predvajanje</Title>
          </Group>

          {!playing ? (
            <Text c="dimmed" ta="center" py="md">
              Ni pesmi ki se trenutno predvaja
            </Text>
          ) : (
            <Paper
              p="md"
              radius="md"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: '2px solid #ffd700',
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <SongCard song={playing} isQueue />
                </Box>
                <Group gap="xs" wrap="nowrap" ml="sm">
                  <Button
                    size="xs"
                    variant="light"
                    color="green"
                    leftSection={<IconArrowRight size={14} />}
                    onClick={() => handleFinishSong(playing.id)}
                  >
                    Končano
                  </Button>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleRemove(playing.id)}
                      >
                        Odstrani
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Group>
            </Paper>
          )}
        </Box>

        <Box>
          <Group gap="sm" mb="md">
            <ThemeIcon size="lg" color="violet" variant="filled">
              <IconMusic size={18} />
            </ThemeIcon>
            <Title order={2}>V vrsti</Title>
            <Badge color="violet" variant="filled">
              {queue.length}
            </Badge>
          </Group>

          {queue.length === 0 ? (
            <Text c="dimmed" ta="center" py="md">
              Ni pesmi v vrsti
            </Text>
          ) : (
            <Stack gap="sm">
              {queue.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  onPlayNow={handlePlayNow}
                  onAddToQueue={handleAddToQueue}
                  onPromoteToPlaying={handlePromoteToPlaying}
                  onRemove={handleRemove}
                  showQueueBadge
                />
              ))}
            </Stack>
          )}
        </Box>

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

        <Text c="dimmed" ta="center">
          Klikni ••• za predvajanje ali odstranitev
        </Text>

        <Stack gap="sm">
          {votingSongs.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              onPlayNow={handlePlayNow}
              onAddToQueue={handleAddToQueue}
              onPromoteToPlaying={handlePromoteToPlaying}
              onRemove={handleRemove}
            />
          ))}
        </Stack>

        {votingSongs.length === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            Ni več pesmi za glasovanje
          </Text>
        )}
      </Stack>
    </Container>
  );
};
