import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  Modal,
  TextInput,
  Divider,
  Paper,
  ThemeIcon,
  Container,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconMusic, IconFlame } from '@tabler/icons-react';
import { useState } from 'react';
import { SongCard } from './SongCard';

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

export const Zelje = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [songs, setSongs] = useState(MOCK_SONGS);
  const [queue] = useState(MOCK_QUEUE);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongUrl, setNewSongUrl] = useState('');

  const handleReact = (songId: string, emoji: string) => {
    setSongs((prev) =>
      prev.map((song) =>
        song.id === songId
          ? {
            ...song,
            likes: song.likes + 1,
            reactions: {
              ...song.reactions,
              [emoji]: (song.reactions[emoji] || 0) + 1,
            },
          }
          : song
      )
    );
    setSongs((prev) => [...prev].sort((a, b) => b.likes - a.likes));
  };

  const handleAddSong = () => {
    if (!newSongTitle.trim() || !newSongArtist.trim()) return;

    const newSong: Song = {
      id: Date.now().toString(),
      title: newSongTitle.trim(),
      artist: newSongArtist.trim(),
      url: newSongUrl.trim() || undefined,
      likes: 1,
      reactions: { '❤️': 1 },
      addedBy: 'Ti',
    };

    setSongs((prev) => [...prev, newSong].sort((a, b) => b.likes - a.likes));
    setNewSongTitle('');
    setNewSongArtist('');
    setNewSongUrl('');
    close();
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">

        {queue.length > 0 && (
          <Box>
            <Group gap="sm" mb="md">
              <ThemeIcon size="lg" color="yellow" variant="filled">
                <IconMusic size={18} />
              </ThemeIcon>
              <Title order={2}>Zdaj predvajam</Title>
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

        <Text c="dimmed" ta="center">
          Klikni na ❤️ in izberi emoji za glasovanje!
        </Text>

        <Stack gap="md">
          {songs.map((song) => (
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

        <Modal opened={opened} onClose={close} title="Dodaj novo pesem" centered radius="lg">
          <Stack>
            <TextInput
              label="Naslov pesmi"
              placeholder="npr. Wonderwall"
              value={newSongTitle}
              onChange={(e) => setNewSongTitle(e.target.value)}
              required
            />
            <TextInput
              label="Izvajalec"
              placeholder="npr. Oasis"
              value={newSongArtist}
              onChange={(e) => setNewSongArtist(e.target.value)}
              required
            />
            <TextInput
              label="URL (YouTube/Spotify)"
              placeholder="https://..."
              value={newSongUrl}
              onChange={(e) => setNewSongUrl(e.target.value)}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={close}>
                Prekliči
              </Button>
              <Button onClick={handleAddSong} disabled={!newSongTitle.trim() || !newSongArtist.trim()}>
                Dodaj
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};
