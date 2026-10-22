import {
  Anchor,
  Box,
  Button,
  CloseButton,
  Collapse,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCalendarCheck,
  IconCalendarEvent,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconInfoCircle,
  IconPlus,
  IconAlertTriangle,
  IconUsers,
} from '@tabler/icons-react';
import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { Database } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { refetchTables } from '../../../supabase/supa-utils/supaSWRCache';
import {
  plural,
  poolMonthLabel,
  signupCountLabel,
  timeLeftLabel,
} from '../Dezurstva/format';

type MyNotification =
  Database['public']['Functions']['get_my_notifications']['Returns'][number];

// action_state of a reception_apply notification (see get_my_notifications)
interface ReceptionState {
  pool_id: number;
  month: string;
  closes_at: string;
  applied: boolean;
  count: number;
}

const receptionState = (n: MyNotification) =>
  n.action === 'reception_apply' && n.action_state
    ? (n.action_state as unknown as ReceptionState)
    : null;

// notifications waiting for an answer first, then important ones, then newest
const priority = (n: MyNotification) => {
  const reception = receptionState(n);
  if (reception && !reception.applied) return 0;
  if (n.tone === 'important') return 1;
  return 2;
};

const showError = (message: string) =>
  notifications.show({ color: 'red', title: 'Napaka', message });

// a toast with an undo button
const showUndo = (message: string, undo: () => void) => {
  const id = notifications.show({
    message: (
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Text size="sm">{message}</Text>
        <Button
          size="compact-xs"
          variant="light"
          onClick={() => {
            notifications.hide(id);
            undo();
          }}
        >
          Razveljavi
        </Button>
      </Group>
    ),
  });
};

const refetchNotifications = () =>
  refetchTables(['notifications', 'notification_dismissals']);

interface NoticeFrameProps {
  icon: ReactNode;
  color?: string;
  eyebrow?: string;
  title: string;
  body?: string | null;
  footer?: ReactNode;
  onClose?: () => void;
}

// shared card layout; the border carries the state colour
const NoticeFrame = ({
  icon,
  color = 'cyan',
  eyebrow,
  title,
  body,
  footer,
  onClose,
}: NoticeFrameProps) => (
  <Paper
    withBorder
    radius="md"
    p="md"
    shadow="xs"
    style={{ borderColor: `var(--mantine-color-${color}-light-hover)` }}
  >
    <Group align="flex-start" wrap="nowrap" gap="sm">
      <ThemeIcon variant="light" color={color} size="lg" radius="md">
        {icon}
      </ThemeIcon>
      <Stack gap={2} flex={1} miw={0}>
        {eyebrow && (
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
            {eyebrow}
          </Text>
        )}
        <Text fw={700} lh={1.3}>
          {title}
        </Text>
        {body && (
          <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-line' }}>
            {body}
          </Text>
        )}
      </Stack>
      {onClose && (
        <CloseButton
          size="sm"
          aria-label="Zapri obvestilo"
          onClick={onClose}
          mt={-4}
          mr={-6}
        />
      )}
    </Group>
    {footer && (
      <Group
        justify="space-between"
        gap="xs"
        mt="sm"
        pt="sm"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
      >
        {footer}
      </Group>
    )}
  </Paper>
);

// "Prijave na žreb za dežurstva": sign up / withdraw until the draw
const ReceptionNotice = ({
  n,
  state,
  onClose,
}: {
  n: MyNotification;
  state: ReceptionState;
  onClose?: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const left = timeLeftLabel(state.closes_at);

  const call = async (
    fn: 'apply_to_reception_pool' | 'withdraw_from_reception_pool',
  ) => {
    setBusy(true);
    const { error } = await supabaseClient.rpc(fn, {
      p_pool_id: state.pool_id,
    });
    setBusy(false);
    refetchTables(['notifications', 'reception_applications']);
    return error;
  };

  const apply = async () => {
    const error = await call('apply_to_reception_pool');
    if (error) showError(error.message);
  };

  const withdraw = async () => {
    const error = await call('withdraw_from_reception_pool');
    if (error) return showError(error.message);
    showUndo('Odjavljen si z žreba.', apply);
  };

  return (
    <NoticeFrame
      icon={
        state.applied ? (
          <IconCalendarCheck size={20} />
        ) : (
          <IconCalendarEvent size={20} />
        )
      }
      color={state.applied ? 'green' : 'cyan'}
      eyebrow={`Dežurstva · ${poolMonthLabel(state.month)}`}
      title={
        state.applied
          ? 'Prijavljen si na žreb za dežurstva'
          : 'Prijave na žreb za dežurstva so odprte'
      }
      body={n.body}
      onClose={onClose}
      footer={
        <>
          <Group gap="md" c="dimmed">
            {state.applied ? (
              <Group gap={4} c="green">
                <IconCheck size={14} />
                <Text size="sm" fw={600}>
                  Prijavljen
                </Text>
              </Group>
            ) : (
              left && (
                <Group gap={4}>
                  <IconClock size={14} />
                  <Text size="sm">{left}</Text>
                </Group>
              )
            )}
            <Group gap={4}>
              <IconUsers size={14} />
              <Text size="sm">{signupCountLabel(state.count)}</Text>
            </Group>
          </Group>
          {state.applied ? (
            <Button
              variant="default"
              size="xs"
              loading={busy}
              onClick={withdraw}
            >
              Odjavi se
            </Button>
          ) : (
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              loading={busy}
              onClick={apply}
            >
              {n.action_label ?? 'Prijavi se'}
            </Button>
          )}
        </>
      }
    />
  );
};

// any other notification: title, text and an optional link button
const GenericNotice = ({
  n,
  onClose,
}: {
  n: MyNotification;
  onClose?: () => void;
}) => {
  const data = n.action_data as { to?: string } | null;
  // only links inside the app
  const to = n.action === 'link' && data?.to?.startsWith('/') ? data.to : null;
  const important = n.tone === 'important';

  return (
    <NoticeFrame
      icon={
        important ? (
          <IconAlertTriangle size={20} />
        ) : (
          <IconInfoCircle size={20} />
        )
      }
      color={important ? 'yellow' : n.tone === 'success' ? 'green' : 'cyan'}
      eyebrow={important ? 'Pomembno' : undefined}
      title={n.title}
      body={n.body}
      onClose={onClose}
      footer={
        to && (
          <Button component={Link} to={to} size="xs" variant="light" ml="auto">
            {n.action_label}
          </Button>
        )
      }
    />
  );
};

export const HomeNotifications = () => {
  // closed in this session, hidden right away while the request runs
  const [hidden, setHidden] = useState<number[]>([]);
  const [expanded, setExpanded] = useState(false);

  const { data } = getSupaWR({
    query: () => supabaseClient.rpc('get_my_notifications'),
    table: [
      'notifications',
      'notification_dismissals',
      'reception_applications',
      'reception_pools',
    ],
    params: ['mine'],
  });

  const list = (data ?? [])
    .filter((n) => !hidden.includes(n.id))
    .sort((a, b) => priority(a) - priority(b));

  if (list.length === 0) return null;

  const dismiss = async (n: MyNotification) => {
    setHidden((h) => [...h, n.id]);
    const { error } = await supabaseClient.rpc('dismiss_notification', {
      p_notification_id: n.id,
    });
    if (error) {
      setHidden((h) => h.filter((id) => id !== n.id));
      return showError(error.message);
    }
    refetchNotifications();
    showUndo('Obvestilo je skrito.', async () => {
      const { error } = await supabaseClient.rpc('undismiss_notification', {
        p_notification_id: n.id,
      });
      if (error) return showError(error.message);
      setHidden((h) => h.filter((id) => id !== n.id));
      refetchNotifications();
    });
  };

  const render = (n: MyNotification) => {
    const onClose = n.dismissible ? () => dismiss(n) : undefined;
    const reception = receptionState(n);
    return reception ? (
      <ReceptionNotice key={n.id} n={n} state={reception} onClose={onClose} />
    ) : (
      <GenericNotice key={n.id} n={n} onClose={onClose} />
    );
  };

  const [first, ...rest] = list;

  return (
    <Box w={{ base: '100%', sm: 400 }} maw="100%">
      <Stack gap="xs">
        {render(first)}
        {rest.length > 0 && (
          <>
            <Collapse in={expanded}>
              <Stack gap="xs">{rest.map(render)}</Stack>
            </Collapse>
            <UnstyledButton
              onClick={() => setExpanded((e) => !e)}
              style={{ alignSelf: 'flex-end' }}
              aria-expanded={expanded}
            >
              <Anchor component="span" size="sm" c="dimmed">
                <Group gap={4}>
                  {expanded
                    ? 'Skrij'
                    : `Še ${rest.length} ${plural(rest.length, ['obvestilo', 'obvestili', 'obvestila', 'obvestil'])}`}
                  <IconChevronDown
                    size={14}
                    style={{
                      transform: expanded ? 'rotate(180deg)' : undefined,
                    }}
                  />
                </Group>
              </Anchor>
            </UnstyledButton>
          </>
        )}
      </Stack>
    </Box>
  );
};
