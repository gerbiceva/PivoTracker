import {
  ActionIcon,
  ActionIconProps,
  useMantineColorScheme,
} from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';

export const ColorchemeToggle = ({ ...other }: ActionIconProps) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon {...other} onClick={toggleColorScheme} variant="subtle">
      {colorScheme == 'light' ? <IconMoon /> : <IconSun />}
    </ActionIcon>
  );
};
