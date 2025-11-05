import {
  Button,
  Container,
  Stack,
  Title,
  Text,
  Alert,
  Image,
  Flex,
  Badge,
  Box,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import { DayItem } from '../Timetable/DayItem';
import dayjs from 'dayjs';
import { ReservationAlert } from '../MyWashing/ReservationAlert';

export const PranjeInfo = () => {
  return (
    <Container>
      <Stack mb="4rem">
        <Title>Pravila pranja</Title>
        <Title order={2}>Splošna pravila</Title>
        <Text>
          V najboljšem študentskem domu imamo tudi pralnico, v kleti. Na voljo
          sta vam pralni in sušilni stroj:
          <Text fw="bold" c="indigo">
            stroj 1
          </Text>
          <Text fw="bold" c="orange">
            stroj 2
          </Text>
          (označena sta). Na voljo sta
          <b> dva termina po 3.ure na teden na osebo</b> (ne bodi kreten in ne
          peri več, ker je pralnica za CELOTEN DOM.)
        </Text>
        <Text>
          Čistilka pere ob četrtkih na 2 od 9-12, takrat vi ne morete prati.
        </Text>
        <Alert color="red">
          PO PRANJU ALI SUŠENJU PUSTITE VRATA STROJEV ODPRTA, DA SE ZRAČIJO (ČE
          NE, BODO COTE SMRDELE). NE BIT SVINJA IN POSPRAVLJAJ ZA SABO
        </Alert>
        <Title order={2}>Navodila</Title>
        <Title order={3}>Pralni stroj</Title>
        <Text>
          Nosilnost je 7kg, PROSIM ne ga preveč napolnit, ker se bo potem takem
          uničil boben. TUDI VRATA zapirajte NEŽNO saj so stroji že starejši in
          v uporabi vsak dan. Priporočam, da si kupite ali pa izposodite
          detergent, kapsule itd., da ne bodo cote smrdele. Torej, če želite
          prati temno ali mešano perilo vam priporočam, da nastavite na način
          <Badge>40° MIX</Badge>.
        </Text>
        <Image src="/pranje/susilec_panel.jpg" />
        <Text>
          Če želite prati posteljnino; brisače, bele majice, gate in nogavice
          priporočam, da nastavite na <Badge>90°</Badge>ali{' '}
          <Badge>COTTON</Badge>. Za drug delikatni material se pozanimajte po
          spletu ali pa pri ministrih.
        </Text>
        <Flex>
          <Image src="/pranje/stroj_milo.jpg" w="200px" mx="auto" />
        </Flex>

        <Title order={3}>Sušilni stroj</Title>
        <Text>
          predno date perilo sušiti, poglejte, ali je mrežica ali FILTER NA
          VRATIH očiščena. Če ste prali posteljnino, brisače itd. priporočan, da
          nastavite na način <Badge>BEDDING</Badge> ali <Badge>MIX</Badge> (bolš
          bedding sam, da malo dlje traja). Če pa ste prali temno ali mešano
          perilo, priporočamo način <Badge>MIX</Badge> (najbolš posuši). Na
          voljo so tudi sušila pri pralnih strojih,če ne želite sušiti v
          sušilnih strojih.
        </Text>
        <Image src="/pranje/stroj_panel.jpg" />
        <Alert color="red" my="xl">
          PO UPORABI STROJA VZEMITE MREŽIČO IZ VRAT IN JO OČISTITE!
        </Alert>
        <Flex>
          <Image src="/pranje/susilec_zaprto.jpg" mx="auto" />
          <Image src="/pranje/filter_odprt.jpg" w="300px" mx="auto" />
        </Flex>

        <Text c="dimmed">
          Za dodatna vprašanja, ali prošnje smo na voljo vsi ministri , najdite
          najbližjega in ga ogovorite.
        </Text>

        <Title order={2}>Sistem</Title>
        <Title order={3}>Dodajanje</Title>

        <Text>
          Nove termine lahko dodaš na strani
          <Button variant="subtle" component={Link} to="/pranje/novo">
            Dodaj termin
          </Button>
          Zgoraj desno lahko izbiraš tedne, spodaj pa se ti bo prikazal pregled
          terminov. Tam vidiš listo dnevov, kjer so prikazani zasedeni termini
          za oba stroja.
        </Text>
        <Text>
          Spodnji primer prikazuje, uporabnika "Janez Novak", ki je ob sedmih
          registriral termin na drugem stroju.
        </Text>
        <Text>
          Za dodajanje novih terminov je v dropdownu gumb <b>Dodaj termin +</b>
        </Text>
        <DayItem
          day={{
            date: dayjs(),
            events: [
              {
                auth_user_id: '',
                created_at: new Date().toISOString(),
                date_of_birth: new Date().toISOString(),
                machine_id: 2,
                machine_name: 'testni stroj',
                name: 'Janez',
                note: '',
                phone_number: '031031031',
                reservation_id: -1,
                room: 404,
                slot_end_utc: new Date().toISOString(),
                slot_index_local: 4,
                slot_start_utc: new Date().toISOString(),
                surname: 'Novak',
                user_id: '',
              },
            ],
            isToday: false,
          }}
        />

        <Text>
          Za vsak termin lahko pogledate kdo takrat pere. Namen tega je, da
          lahko kregate, če kdo pere v vašem terminu, je pozabil dat cote iz
          stroja in podobne nevšečnosti ...
        </Text>
        <Text>
          V tem primeru uporabnika kontaktirajte ali pa pridite do njegove sobe
          in mu povejte kar mu gre.
        </Text>

        <Title order={3}>Pregled</Title>

        <Text>
          Nove termine lahko dodaš na strani
          <Button variant="subtle" component={Link} to="/pranje/moje">
            Pregled pranja
          </Button>
          .
        </Text>
        <Text>Tukaj lahko vidiš vse svoje rezervacije:</Text>
        <Box maw="300px">
          <ReservationAlert
            reservation={{
              machine_id: 1,
              machine_name: 'Storj 1',
              note: '',
              reservation_id: 0,
              slot_end_utc: dayjs().startOf('day').toISOString(),
              slot_start_utc: dayjs().endOf('day').toISOString(),
            }}
            onRemove={() => {}}
          />
        </Box>
        <Text>
          Piše ti datum, dan ter termin. Zraven imaš pralni stroj, ki si ga
          rezerviral ter opcijo za izbris termina.
        </Text>
      </Stack>
    </Container>
  );
};
