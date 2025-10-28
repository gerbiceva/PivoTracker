import {
  Text,
  Stack,
  Title,
  Container,
  TextInput,
  SimpleGrid,
  Fieldset,
  Box,
  Tooltip,
  useMatches,
} from '@mantine/core';
import { ReadTimeFromUTCString } from '../../../utils/timeUtils';
import { getZodiacSign, zodiacToIcon } from '../../../utils/zodiac';

export const EditSelf = () => {
  const cols = useMatches({
    base: 1,
    sm: 2,
  });

  return (
    <Container>
      <Stack py="lg">
        <Stack gap="xs" pos="relative">
          <Title>Uporabnik</Title>
          <Text c="dimmed">Pregled informacij o sebi.</Text>
          <Text c="dimmed">
            Tukaj lahko pogledate svoje nastavitve in če niso pravilne
            obvestitesvojega ministra.
          </Text>

          <Box pos="absolute" style={{ right: 0 }}>
            <Tooltip
              color="gray"
              label={getZodiacSign(
                ReadTimeFromUTCString(new Date().toUTCString()),
              )}
            >
              <Box opacity={0.1}>
                {zodiacToIcon(
                  getZodiacSign(
                    ReadTimeFromUTCString(new Date().toUTCString()),
                  ),
                  '10rem',
                )}
              </Box>
            </Tooltip>
          </Box>
        </Stack>

        <Fieldset legend="Osebne informacije">
          <SimpleGrid cols={cols}>
            <TextInput readOnly label="Ime" value="Lan" variant="filled" />
            <TextInput
              readOnly
              label="Priimek"
              value="Lanovič"
              variant="filled"
            />
            <TextInput
              readOnly
              label="Email"
              value="Lan@lan.lan"
              variant="filled"
            />
          </SimpleGrid>
        </Fieldset>

        <Fieldset legend="Podatki stanovalca">
          <SimpleGrid cols={cols}>
            <TextInput readOnly label="Soba" value="Lan" variant="filled" />
            <TextInput
              readOnly
              label="Datum rojstva"
              value="Lan"
              variant="filled"
            />
            <TextInput
              readOnly
              label="Telefonska številka"
              value="Lan"
              variant="filled"
            />
          </SimpleGrid>
        </Fieldset>
      </Stack>
    </Container>
  );
};
