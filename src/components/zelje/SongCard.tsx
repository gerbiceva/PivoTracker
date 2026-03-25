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
import { useState, useMemo, memo } from 'react';

const EMOJI_REACTIONS = ['🔥', '❤️', '🎉', '👏', '🤘', '😎'];

interface FloatingEmojiProps {
  emoji: string;
  count: number;
  index: number;
  total: number;
}

const FloatingEmoji = memo(({ emoji, count, index, total }: FloatingEmojiProps) => {
  const { randomOffset, randomDelay, randomDuration, randomRotate } = useMemo(
    () => ({
      randomOffset: Math.random() * 10 - 5,
      randomDelay: Math.random() * 1,
      randomDuration: 2 + Math.random() * 1.5,
      randomRotate: Math.random() * 30 - 15,
    }),
    []
  );

  const isTop = index % 2 === 0;
  const spacing = 100 / (total + 1);
  const leftPos = spacing * (index + 1);

  const position = isTop
    ? { top: -10 + randomOffset, left: `${leftPos}%`, transform: `translateX(-50%) rotate(${randomRotate}deg)` }
    : { bottom: -(count * 3) / 2 - 5 + randomOffset, right: `${leftPos}%`, transform: `translateX(50%) rotate(${randomRotate}deg)` };

  return (
    <Text
      key={emoji}
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        ...position,
        fontSize: count * 5,
        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 1,
        animation: `float${index} ${randomDuration}s ease-in-out ${randomDelay}s infinite`,
        transition: 'transform 0.2s ease-in-out',
      }}
    >
      {emoji}
    </Text>
  );
});

interface Song {
  id: string;
  song_name: string;
  selfie_ref: string | null;
  emoji_like: number;
  emoji_fire: number;
  emoji_dislike: number;
  emoji_party: number;
}

interface SongCardProps {
  song: Song;
  isQueue?: boolean;
  onReact?: (songId: string, emoji: string) => void;
}

export const SongCard = ({ song, isQueue = false, onReact }: SongCardProps) => {
  const [showReactions, setShowReactions] = useState(false);

  const emojiMap: Record<string, number> = {
    '❤️': song.emoji_like,
    '🔥': song.emoji_fire,
    '👎': song.emoji_dislike,
    '🎉': song.emoji_party,
  };

  const floatingEmojis = Object.entries(emojiMap)
    .filter(([, count]) => count > 0)
    .slice(0, 3)
    .map(([emoji, count], index) => ({
      emoji,
      count,
      index,
    }));

  const total = floatingEmojis.length;

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder

      variant={isQueue ? 'light' : 'default'}
      color={isQueue ? 'yellow' : undefined}
      style={{ position: 'relative', paddingTop: 28, paddingBottom: 28, overflow: "visible" }}
    >
      {floatingEmojis.map(({ emoji, count, index }) => (
        <FloatingEmoji key={emoji} emoji={emoji} count={count} index={index} total={total} />
      ))}
      <Group justify="space-between" wrap="nowrap" style={{
        zIndex: 10
      }}>
        <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {song.selfie_ref ? (
            <img
              src={song.selfie_ref}
              alt="Selfie"
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <ThemeIcon
              size="xl"
              radius="md"
              variant="filled"
              color={isQueue ? 'yellow' : 'violet'}
              opacity={0.6}
            >
              <IconMusic size={20} />
            </ThemeIcon>
          )}
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text fw="bold" size="md" truncate>
              {song.song_name}
            </Text>
          </Stack>
        </Group>

        {!isQueue && (
          <Group gap="xs" wrap="nowrap">
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
                          onReact?.(song.id, emoji);
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
