import {
  Card,
  Group,
  Text,
  Stack,
  Badge,
  ActionIcon,
  Tooltip,
  Box,
} from '@mantine/core';
import { IconHeartFilled } from '@tabler/icons-react';
import { useState, useMemo, memo } from 'react';
import { useDebouncedCallback } from '@mantine/hooks';
import { ZeljeSong } from './Zelje';

const EMOJI_REACTIONS = ['🔥', '❤️', '🎉', '👎'];

interface FloatingEmojiProps {
  emoji: string;
  count: number;
  index: number;
  total: number;
  onReact?: (emoji: string) => void;
}

const FloatingEmoji = memo(({ emoji, count, index, total, onReact }: FloatingEmojiProps) => {
  const { randomOffset, randomDelay, randomDuration, randomRotate } = useMemo(
    () => ({
      randomOffset: Math.random() * 10 - 5,
      randomDelay: Math.random() * 1,
      randomDuration: 2 + Math.random() * 1.5,
      randomRotate: Math.random() * 30 - 15,
    }),
    []
  );

  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onReact?.(emoji);
    setTimeout(() => setIsClicked(false), 150);
  };

  const isTop = index % 2 === 0;
  const spacing = 100 / (total + 1);
  const leftPos = spacing * (index + 1);

  const emojiSize = Math.min(Math.max(20, count * 3), 120);
  const rotation = randomRotate;
  const clickScale = isClicked ? 1.5 : 1;

  const style: React.CSSProperties = {
    position: 'absolute',
    zIndex: 15,
    cursor: 'pointer',
    fontSize: emojiSize,
    lineHeight: 1,
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
    animation: `float${index} ${randomDuration}s ease-in-out ${randomDelay}s infinite`,
    transform: isTop
      ? `translate(-50%, 0) rotate(${rotation}deg) scale(${clickScale})`
      : `translate(50%, 0) rotate(${rotation}deg) scale(${clickScale})`,
    transition: 'transform 0.15s ease-out',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    ...(isTop
      ? { top: -10 + randomOffset, left: `calc(${leftPos}% + ${randomOffset}px)` }
      : { bottom: -(count * 3) / 2 - 5 + randomOffset, right: `calc(${leftPos}% + ${randomOffset}px)` }
    ),
  };

  return (
    <span style={style} onClick={handleClick}>
      {emoji}
    </span>
  );
});



interface SongCardProps {
  song: ZeljeSong;
  isQueue?: boolean;
  onReact?: (songId: string, emoji: string) => void;
}

export const SongCard = ({ song, isQueue = false, onReact }: SongCardProps) => {
  const [showReactions, setShowReactions] = useState(false);

  const debouncedReact = useDebouncedCallback((emoji: string) => {
    onReact?.(song.id, emoji);
  }, 100);

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
      padding="xs"
      radius="md"
      withBorder

      variant={isQueue ? 'light' : 'default'}
      color={isQueue ? 'orange' : undefined}
      style={{ overflow: "visible", position: "relative" }}
    >

      {floatingEmojis.map(({ emoji, count, index }) => (
        <FloatingEmoji
          key={emoji}
          emoji={emoji}
          count={count}
          index={index}
          total={total}
          onReact={debouncedReact}
        />
      ))}

      <Group justify="space-between" wrap="nowrap" style={{
        zIndex: 10, overflow: "visible"
      }}>
        <Group gap="md" wrap="nowrap" style={{ minWidth: 0, zIndex: 100 }}>
          <Stack gap={2} style={{ minWidth: 0, zIndex: 100, position: "absolute" }}>
            <Text fw="bold" size="lg" truncate>
              {song.song_name}
            </Text>
          </Stack>
        </Group>

        {song.selfie_ref && (
          <Box >
            <img
              src={song.selfie_ref}
              alt="Selfie"
              style={{ width: 160, height: 160, borderRadius: '25%', objectFit: 'cover', zIndex: -10, pointerEvents: "none", marginTop: "-3rem", }}
            />
          </Box>
        )}


        {song.status != "queued" && (
          <Group gap="xs" wrap="nowrap" style={{
            overflow: "visible",
            zIndex: 300,
            position: "relative",
          }}>
            <Group gap={4}>
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
                <Card withBorder style={{
                  zIndex: 30,
                  position: "relative"
                }}>

                  <Group
                    gap={4}
                    p="xs"
                    style={{
                      zIndex: 30,
                      position: "relative"
                    }}

                    onMouseLeave={() => setShowReactions(false)}
                  >
                    {EMOJI_REACTIONS.map((emoji) => (
                      <Tooltip key={emoji} label={emoji} withArrow withinPortal={true}>
                        <ActionIcon
                          variant="subtle"
                          size="xl"
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
                </Card>

              )}
            </Group>
          </Group>
        )}


        {isQueue && (
          // <Badge color="yellow" variant="filled" size="lg">
          //   🎵 Zdaj predvajam
          // </Badge>
          <div />
        )}
      </Group>

    </Card >
  );
};
