import {
  Card,
  Group,
  Text,
  Stack,
  Badge,
  ActionIcon,
  Tooltip,
  ThemeIcon,
} from '@mantine/core';
import { IconMusic, IconHeartFilled } from '@tabler/icons-react';
import { useState } from 'react';

const EMOJI_REACTIONS = ['🔥', '❤️', '🎉', '👏', '🤘', '😎'];

interface Song {
  id: string;
  title: string;
  artist: string;
  url?: string;
  likes: number;
  reactions: Record<string, number>;
  addedBy?: string;
}

interface SongCardProps {
  song: Song;
  isQueue?: boolean;
  onReact: (songId: string, emoji: string) => void;
}

export const SongCard = ({ song, isQueue = false, onReact }: SongCardProps) => {
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = (emoji: string) => {
    onReact(song.id, emoji);
  };

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      variant={isQueue ? 'light' : 'default'}
      color={isQueue ? 'yellow' : undefined}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <ThemeIcon
            size="xl"
            radius="md"
            variant="filled"
            color={isQueue ? 'yellow' : 'violet'}
          >
            <IconMusic size={20} />
          </ThemeIcon>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text fw="bold" size="md" truncate>
              {song.title}
            </Text>
            <Text size="sm" c="dimmed" truncate>
              {song.artist}
            </Text>
          </Stack>
        </Group>

        {!isQueue && (
          <Group gap="xs" wrap="nowrap">
            <Group gap={4}>
              {Object.entries(song.reactions)
                .slice(0, 3)
                .map(([emoji, count]) => (
                  <Badge
                    key={emoji}
                    variant="outline"
                    color="gray"
                    size="md"
                    style={{ fontSize: '12px' }}
                  >
                    {emoji} {count}
                  </Badge>
                ))}
            </Group>

            <Group gap={4} pos="relative">
              <Tooltip label="React" withArrow withinPortal={true}>
                <ActionIcon
                  variant="filled"
                  color="violet"
                  size="lg"
                  radius="xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactions(!showReactions);
                  }}
                >
                  <IconHeartFilled size={16} />
                </ActionIcon>
              </Tooltip>

              {showReactions && (
                <Group
                  gap={4}
                  p="xs"

                  onMouseLeave={() => setShowReactions(false)}
                >
                  {EMOJI_REACTIONS.map((emoji) => (
                    <Tooltip key={emoji} label={emoji} withArrow withinPortal={true}>
                      <ActionIcon
                        variant="subtle"
                        size="lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(emoji);
                          setShowReactions(false);
                        }}
                        style={{ fontSize: '20px' }}
                      >
                        {emoji}
                      </ActionIcon>
                    </Tooltip>
                  ))}
                </Group>
              )}
            </Group>
          </Group>
        )}

        {isQueue && (
          <Badge color="yellow" variant="filled" size="lg">
            🎵 Zdaj predvajam
          </Badge>
        )}
      </Group>
    </Card>
  );
};
