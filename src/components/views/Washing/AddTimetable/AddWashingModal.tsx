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
import dayjs, { Dayjs } from 'dayjs';
import {
  FormatLocalDateCustom,
  ReadTimeFromUTCString,
} from '../../../../utils/timeUtils';
import { useGetDailySlots } from './GetSlotsByDay';
import { groupBy } from '../../../../utils/objectSplit';
import { ReservationItemInfo } from './ReservationItem';
import { addReservation } from './addReservation';

export interface WashingModalProps {
  day: dayjs.Dayjs;
  enabled: boolean;
}

export const AddWashingModal = ({ day, enabled = true }: WashingModalProps) => {
  const [opened, { open, close }] = useDisclosure(false);
  const { data, isLoading, error } = useGetDailySlots(opened ? day : null);

  const AddReservation = async (
    dateTimeStart: Dayjs,
    dateTimeEnd: Dayjs,
    machine: number,
  ) => {
    if (await addReservation(dateTimeStart, dateTimeEnd, machine)) close();
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
                              {slot.slot_index_local == 4 &&
                              ReadTimeFromUTCString(
                                slot.slot_start_utc,
                              ).weekday() == 3 &&
                              slot.machine_id == 2 ? (
                                <Text size="md" py="6">
                                  Čistilka
                                </Text>
                              ) : (
                                <>
                                  <Text>
                                    {FormatLocalDateCustom(
                                      ReadTimeFromUTCString(
                                        slot.slot_start_utc,
                                      ),
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
                                          ReadTimeFromUTCString(
                                            slot.slot_end_utc,
                                          ),
                                          slot.machine_id,
                                        );
                                      }}
                                    />
                                  )}
                                </>
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
