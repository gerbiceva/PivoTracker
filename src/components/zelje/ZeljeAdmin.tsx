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
import { useState } from 'react';

interface Song {
  id: string;
  title: string;
  artist: string;
  url?: string;
  likes: number;
  reactions: Record<string, number>;
  addedBy?: string;
}

const MOCK_QUEUE: Song[] = [
  {
    id: '1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    likes: 42,
    reactions: { '🔥': 15, '❤️': 12, '🎉': 8, '👏': 7 },
    addedBy: 'Janez',
  },
];

const MOCK_SONGS: Song[] = [
  {
    id: '2',
    title: 'Take On Me',
    artist: 'a-ha',
    likes: 28,
    reactions: { '🔥': 10, '❤️': 8, '🤘': 6, '😎': 4 },
    addedBy: 'Marko',
  },
  {
    id: '3',
    title: 'Livin\' on a Prayer',
    artist: 'Bon Jovi',
    likes: 25,
    reactions: { '🔥': 12, '❤️': 7, '👏': 6 },
    addedBy: 'Ana',
  },
  {
    id: '4',
    title: 'Sweet Child O\' Mine',
    artist: 'Guns N\' Roses',
    likes: 22,
    reactions: { '🤘': 10, '🔥': 8, '❤️': 4 },
    addedBy: 'Peter',
  },
  {
    id: '5',
    title: 'Dancing Queen',
    artist: 'ABBA',
    likes: 18,
    reactions: { '🎉': 10, '❤️': 8 },
    addedBy: 'Maja',
  },
  {
    id: '6',
    title: 'Wonderwall',
    artist: 'Oasis',
    likes: 15,
    reactions: { '❤️': 6, '😎': 5, '👏': 4 },
    addedBy: 'Luka',
  },
];

interface SongRowProps {
  song: Song;
  onPlayNow: (song: Song) => void;
  onRemove: (songId: string) => void;
  showQueueBadge?: boolean;
}

const SongRow = ({ song, onPlayNow, onRemove, showQueueBadge }: SongRowProps) => {
  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <ThemeIcon size="lg" radius="md" variant="light" color="violet">
            <IconMusic size={18} />
          </ThemeIcon>
          <Box style={{ minWidth: 0 }}>
            <Text fw="bold" size="sm" truncate>
              {song.title}
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {song.artist}
            </Text>
          </Box>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Badge variant="light" color="gray" size="sm">
            {song.likes} glasov
          </Badge>

          {showQueueBadge && (
            <Badge color="yellow" variant="filled" size="sm">
              V vrsti
            </Badge>
          )}

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconPlayerPlay size={14} />}
                onClick={() => onPlayNow(song)}
              >
                Predvajaj zdaj
              </Menu.Item>
              <Menu.Divider />
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
  const [songs, setSongs] = useState(MOCK_SONGS);
  const [queue, setQueue] = useState(MOCK_QUEUE);

  const handlePlayNow = (song: Song) => {
    setQueue((prev) => [...prev, song]);
    setSongs((prev) => prev.filter((s) => s.id !== song.id));
  };

  const handleRemoveFromQueue = (songId: string) => {
    setQueue((prev) => prev.filter((s) => s.id !== songId));
  };

  const handleRemoveFromVoting = (songId: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  const handleFinishSong = (songId: string) => {
    setQueue((prev) => prev.filter((s) => s.id !== songId));
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
            <Badge color="yellow" variant="filled">
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
                <Paper
                  key={song.id}
                  p="md"
                  radius="md"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    border: '2px solid #ffd700',
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                      <ThemeIcon size="xl" radius="md" color="yellow">
                        <IconMusic size={20} />
                      </ThemeIcon>
                      <Box style={{ minWidth: 0 }}>
                        <Text fw="bold" size="md" c="white" truncate>
                          {song.title}
                        </Text>
                        <Text size="sm" c="dimmed" truncate>
                          {song.artist}
                        </Text>
                      </Box>
                    </Group>

                    <Group gap="xs" wrap="nowrap">
                      <Button
                        size="xs"
                        variant="light"
                        color="green"
                        leftSection={<IconArrowRight size={14} />}
                        onClick={() => handleFinishSong(song.id)}
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
                            onClick={() => handleRemoveFromQueue(song.id)}
                          >
                            Odstrani iz vrste
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>

        <Divider
          label={
            <Group gap="xs">
              <IconFlame size={16} />
              <Text>Glasovanje</Text>
              <Badge variant="light" color="violet" size="sm">
                {songs.length}
              </Badge>
            </Group>
          }
          labelPosition="left"
          size="lg"
        />

        <Text c="dimmed" ta="center">
          Klikni ••• za predvajanje ali odstranitev
        </Text>

        <Stack gap="sm">
          {songs.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              onPlayNow={handlePlayNow}
              onRemove={handleRemoveFromVoting}
            />
          ))}
        </Stack>

        {songs.length === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            Ni več pesmi za glasovanje
          </Text>
        )}
      </Stack>
    </Container>
  );
};
