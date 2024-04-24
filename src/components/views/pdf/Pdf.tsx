import { Box, Button, Tooltip } from '@mantine/core';
import {
  BlobProvider,
  Document,
  Font,
  Image,
  Page,
  Text,
  View,
} from '@react-pdf/renderer';
import { IconFile } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Tables } from '../../../supabase/supabase';
import { numberToEur } from '../../../utils/Converter';

Font.register({ family: 'Roboto', src: '/roboto.ttf' });

// Create Document Component
interface PDFProps {
  transactions: Tables<'named_transactions'>[];
  userinfo: Tables<'customers'>;
}

export const PDFUrl = ({ transactions, userinfo }: PDFProps) => {
  // const user = useUser();

  const vsehPiv = transactions
    .map((trans) => trans.ordered)
    .reduce((prev, curr) => (prev || 0) + (curr || 0), 0);
  const vsegaPlacano = transactions
    .map((trans) => trans.paid)
    .reduce((prev, curr) => (prev || 0) + (curr || 0), 0);
  const vsegaDolg = transactions
    .map((trans) => trans.owed)
    .reduce((prev, curr) => (prev || 0) + (curr || 0), 0);

  const item = (key: string, value: string, bg?: string) => (
    <View
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          opacity: 0.7,
          fontSize: '20px',
        }}
      >
        {key}
      </Text>
      <Text
        style={{
          fontSize: '20px',
          padding: '1px 5px',
          backgroundColor: bg ? bg : undefined,
        }}
      >
        {value}
      </Text>
    </View>
  );

  const today = new Date();

  const PdfDoc = () => (
    <Document>
      <Page
        size="A4"
        style={{
          padding: '30px',
          fontFamily: 'Roboto',
        }}
      >
        <View
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            alignItems: 'center',
          }}
        >
          {/* pošiljatelj */}
          <View
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'nowrap',
            }}
          >
            <Image
              src="/gerbalogo.JPG"
              style={{
                width: '200px',
                opacity: 0.5,
              }}
            />
            <View>
              <Text
                style={{
                  fontWeight: 'black',
                  fontSize: '25px',
                }}
              >
                Gerbičeva 59
              </Text>
              <Text
                style={{
                  padding: '2px 0',
                  opacity: 0.7,
                }}
              >
                Tekoče ministrstvo
              </Text>
              <Text
                style={{
                  padding: '5px 0',
                  opacity: 0.5,
                }}
              >
                {today.toLocaleString()}
              </Text>
              {item(
                'Rok plačila:',
                new Date(
                  today.setMonth(today.getMonth() + 1),
                ).toLocaleDateString(),
              )}
            </View>
          </View>

          {/* prejemnik */}
          <View>
            <Text
              style={{
                backgroundColor: 'black',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '15px',
                color: 'white',
                margin: '5px auto',
              }}
            >
              {userinfo.id}
            </Text>
            <Text
              style={{
                padding: '5px 0',
              }}
            >
              {userinfo.fullname}
            </Text>
          </View>
        </View>

        {/* title */}
        <View
          style={{
            width: '100%',
            padding: '50px 10px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: '20px',
            }}
          >
            Opomin
          </Text>
        </View>

        {/* transactions */}
        <View
          style={{
            width: '100%',
            padding: '30px 50px',
            display: 'flex',
            flexDirection: 'column',
            alignContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: '20px',
              padding: '5px 0',
              margin: '15px 0',
              opacity: 0.8,
              borderBottom: '2px solid black',
            }}
          >
            Transakcije
          </Text>
          {transactions.map((transaction) => (
            <View
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
              }}
            >
              <Text
                style={{ fontSize: '14px', padding: '3px 10px', opacity: 0.3 }}
              >
                {transaction.id}
              </Text>
              <Text
                style={{ fontSize: '14px', opacity: 0.8, padding: '3px 10px' }}
              >
                {new Date(transaction.ordered_at || 0).toLocaleDateString()}
              </Text>
              <Text
                style={{ fontSize: '14px', opacity: 0.8, padding: '3px 10px' }}
              >
                {transaction.ordered}
              </Text>
              <Text
                style={{
                  fontSize: '14px',
                  opacity: 0.8,
                  padding: '3px 10px',
                  fontWeight: 'bold',
                }}
              >
                {numberToEur((transaction.paid || 0) / 10)}
              </Text>

              <Text
                style={{
                  fontSize: '14px',
                  padding: '1px 5px',
                  margin: '2px 5px',
                  backgroundColor: '#dfdfdf',
                }}
              >
                {numberToEur(transaction.owed || 0)}
              </Text>
            </View>
          ))}
          <Text
            style={{
              fontSize: '25px',
              padding: '5px 0',
              margin: '15px 0',
              opacity: 0.8,
              borderBottom: '2px solid black',
            }}
          >
            Izračun
          </Text>
          {item('skupaj dobljeno: ', `${vsehPiv} piv`)}
          {item('strošek: ', numberToEur((vsehPiv || 0) * 1.5))}
          {item('skupaj plačano: ', numberToEur((vsegaPlacano || 0) / 10))}
          <View
            style={{
              width: '100%',
              borderBottom: '1px solid gray',
              padding: '8px 0',
              marginBottom: '20px',
            }}
          />
          {item('Skupaj za plačilo: ', numberToEur(vsegaDolg || 0), '#dfdfdf')}
        </View>
        <View
          style={{
            padding: '08px 50px',
            width: '100%',
            borderBottom: '1px solid gray',
            opacity: 0.7,
            marginBottom: '20px',
          }}
        />
        <Text
          style={{
            padding: '10px 50px',
            fontSize: '12px',
            maxWidth: '400px',
          }}
        >
          Znesek je potrebno poravnati pri pristojnem tekočem ministru v vašem
          štuku.
        </Text>
        <Text
          style={{
            padding: '20px 50px',
            fontSize: '12px',
          }}
        >
          Po 1. odstavku 32. člena Zakona o gozdovh (ZG) (Uradni list RS, št.
          30/93, 56/99 – ZON, 67/02, 110/02, 115/06 – ORZG40, 110/07, 106/10,
          63/13, 101/13 – ZDavNepr, 17/14, 22/14 – odl. US, 24/15, 9/16, 77/16
          in 78/23 – ZUNPEOVE), bomo v primeru neplačila izdali predlog za
          izvržbo. Zoper ta opomin pritožba ni mogoča.
        </Text>
        <View
          style={{
            padding: '20px 50px',
            fontSize: '12px',
            marginTop: 'auto',
            marginLeft: 'auto',
          }}
        >
          <Text>
            {/* {user.user?.email}: ___________________ */}
            Žan Oberstar 310
          </Text>
          <Text>
            {/* {user.user?.email}: ___________________ */}
            minister za tekoče zadeve
          </Text>
        </View>
      </Page>
    </Document>
  );
  return (
    <BlobProvider document={<PdfDoc />}>
      {({ url }) => {
        return (
          <Box>
            <Tooltip label="PDF za terjatve">
              <Button
                component={Link}
                to={url || ''}
                target="_blank"
                size="md"
                variant="light"
                color="dark.5"
                rightSection={<IconFile />}
              >
                Izdaj račun
              </Button>
            </Tooltip>
          </Box>
        );
      }}
    </BlobProvider>
  );
};
