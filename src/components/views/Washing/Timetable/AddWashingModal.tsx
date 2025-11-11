import {
  Modal,
  Button,
  Stack,
  SimpleGrid,
  Card,
  Text,
  Group,
  Alert,
  LoadingOverlay,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { ConfirmAdd } from './ConfirmAdd';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { notifications } from '@mantine/notifications';
import dayjs, { Dayjs } from 'dayjs';
import {
  FormatLocalDateCustom,
  ReadTimeFromUTCString,
  WriteTimeToUTCString,
} from '../../../../utils/timeUtils';
import { invalidateDailyWashing, useGetDailySlots } from './GetSlotsByDay';
import { groupBy } from '../../../../utils/objectSplit';
import { invalidateWeeklyWashing } from './GetWashingByWeek';
import { ReservationItemInfo } from './ReservationItem';

export interface WashingModalProps {
  day: dayjs.Dayjs;
  enabled: boolean;
}

export const AddWashingModal = ({ day, enabled = true }: WashingModalProps) => {
  const [opened, { open, close }] = useDisclosure(false);
  const { data, isLoading, error } = useGetDailySlots(opened ? day : null);

  const AddReservation = (
    dateTimeStart: Dayjs,
    dateTimeEnd: Dayjs,
    machine: number,
  ) => {
    supabaseClient
      .rpc('add_reservation_with_range', {
        p_slot_start: WriteTimeToUTCString(dateTimeStart),
        p_slot_end: WriteTimeToUTCString(dateTimeEnd),
        p_machine_id: machine,
      })
      .select()
      .then((data) => {
        if (data.error) {
          notifications.show({
            title: 'Error',
            color: 'red',
            autoClose: 1500,
            message: <Text>{data.error.message}</Text>,
          });
        } else {
          notifications.show({
            title: 'Dodano',
            color: 'green',
            autoClose: 1500,
            message: <Text>Dodano.</Text>,
          });
          invalidateWeeklyWashing();
          invalidateDailyWashing();
          close();
        }
      });
  };

  const dataSplit = groupBy(data || [], 'machine_name');

  return (
    <>
      <Modal opened={opened} onClose={close} size="xl" centered fullScreen>
        <LoadingOverlay visible={isLoading} />
        {error ? (
          <Alert title="napaka">{error.message}</Alert>
        ) : (
          <SimpleGrid cols={Object.keys(dataSplit)?.length}>
            {Object.keys(dataSplit)?.map((machineSlot) => {
              return (
                <Stack w="100%">
                  <Text fw="bold" ta="center" size="lg">
                    {machineSlot}
                  </Text>
                  {dataSplit[machineSlot].map((slot) => {
                    return (
                      <Card>
                        <Group justify="space-between">
                          {slot.reservation_id ? (
                            <ReservationItemInfo
                              reservation={{ ...slot, name: slot.first_name }}
                            />
                          ) : (
                            <>
                              <Text>
                                {FormatLocalDateCustom(
                                  ReadTimeFromUTCString(slot.slot_start_utc),
                                  'HH:mm',
                                )}{' '}
                                -{' '}
                                {FormatLocalDateCustom(
                                  ReadTimeFromUTCString(slot.slot_end_utc),
                                  'HH:mm',
                                )}
                              </Text>
                              {ReadTimeFromUTCString(slot.slot_end_utc) >
                                dayjs().utc() && (
                                <ConfirmAdd
                                  callback={() => {
                                    AddReservation(
                                      ReadTimeFromUTCString(
                                        slot.slot_start_utc,
                                      ),
                                      ReadTimeFromUTCString(slot.slot_end_utc),
                                      slot.machine_id,
                                    );
                                  }}
                                />
                              )}
                            </>
                          )}
                        </Group>
                      </Card>
                    );
                  })}
                </Stack>
              );
            })}
          </SimpleGrid>
        )}
      </Modal>

      <Button
        disabled={!enabled}
        mt="xl"
        fullWidth
        variant="filled"
        size="xs"
        onClick={open}
        leftSection={<IconPlus size="1rem"></IconPlus>}
      >
        Dodaj termin
      </Button>
    </>
  );
};
