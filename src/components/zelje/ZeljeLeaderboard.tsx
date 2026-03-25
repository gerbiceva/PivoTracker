import {
  Stack,
  Title,
  Text,
  Group,
  Badge,
  Paper,
  ThemeIcon,
  Container,
  Box,
  Divider,
} from '@mantine/core';
import { IconTrophy, IconMusic } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
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
  status: 'queued' | 'playing' | 'done' | 'voting';
};

export const ZeljeLeaderboard = () => {
  const [songs, setSongs] = useState<ZeljeSong[]>([]);

  const loadSongs = async () => {
    try {
      const supabase = supabaseClient as any;
      const { data } = await supabase.from('zelje').select('*').order('created_at', { ascending: false });
      if (data) {
        const doneSongs = data
          .filter((s: ZeljeSong) => s.status === 'done')
          .map((s: ZeljeSong) => ({
            ...s,
            score: (s.emoji_like || 0) + (s.emoji_fire || 0) + (s.emoji_party || 0) - (s.emoji_dislike || 0),
          }))
          .sort((a: ZeljeSong & { score: number; }, b: ZeljeSong & { score: number; }) => b.score - a.score);
        setSongs(doneSongs);
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

  return (
    <Container size="sm" py="xl">
      <Stack gap="4rem">
        <Paper p="xl" radius="md" bg="dark.5">
          <Group justify="center" gap="sm">
            <IconTrophy size={32} color="#FFD700" />
            <Title order={1} ta="center" c="white">
              Leaderboard
            </Title>
          </Group>
          <Text ta="center" c="dimmed" mt="sm">
            Najboljše pesmi vseh časov
          </Text>
        </Paper>

        {songs.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Še ni končanih pesmi
          </Text>
        ) : (
          <Stack gap="5rem">
            {songs.map((song, index) => (
              <Paper
                key={song.id}
                p="md"
                radius="md"
                withBorder
                style={{
                  background: index === 0
                    ? 'linear-gradient(135deg, #FFD70020 0%, #FFD70010 100%)'
                    : undefined,
                  border: index === 0 ? '2px solid #FFD700' : undefined,
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="md" wrap="nowrap">
                    <Box
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: index === 0 ? '#FFD700' : (index === 1 ? '#C0C0C0' : '#CD7F32'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: 14,
                        color: index < 3 ? '#000' : '#666',
                      }}
                    >
                      {index + 1}
                    </Box>



                    <Text fw="bold" size="md">
                      {song.song_name}
                    </Text>
                  </Group>

                  {song.selfie_ref && (
                    <img
                      src={song.selfie_ref}
                      alt="Selfie"
                      style={{ width: 200, height: 200, borderRadius: '20%', objectFit: 'cover', margin: "-2rem 0" }}
                    />
                  )}

                  <Group gap="xs" wrap="nowrap">
                    {song.emoji_like > 0 && (
                      <Badge variant="light" color="red" size="xl">
                        ❤️ {song.emoji_like}
                      </Badge>
                    )}
                    {song.emoji_fire > 0 && (
                      <Badge variant="light" color="orange" size="xl">
                        🔥 {song.emoji_fire}
                      </Badge>
                    )}
                    {song.emoji_dislike > 0 && (
                      <Badge variant="light" color="gray" size="xl">
                        👎 {song.emoji_dislike}
                      </Badge>
                    )}
                    {song.emoji_party > 0 && (
                      <Badge variant="light" color="pink" size="xl">
                        🎉 {song.emoji_party}
                      </Badge>
                    )}
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
