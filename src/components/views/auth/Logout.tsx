import {
  ActionIcon,
  ActionIconProps,
  Button,
  Group,
  Modal,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { supabaseClient } from '../../../supabase/supabaseClient';

export interface LogoutBtnProps extends ActionIconProps {}

export const LogoutBtn = ({ children, ...other }: LogoutBtnProps) => {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Modal opened={opened} onClose={close} title="Odjava">
        <p>Ali ste prepričani da se želite odjaviti</p>
        <Group>
          <Button
            size="sm"
            variant="subtle"
            onClick={() => {
              supabaseClient.auth.signOut({
                scope: 'local',
              });
              close();
            }}
          >
            Odjava
          </Button>
          <Button size="sm" variant="subtle" onClick={close}>
            Cancel
          </Button>
        </Group>
      </Modal>
      <Tooltip label="Logout">
        <ActionIcon {...other} onClick={open}>
          {children}
        </ActionIcon>
      </Tooltip>
    </>
  );
};
