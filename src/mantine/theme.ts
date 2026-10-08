import { Container, createTheme } from '@mantine/core';

export const mantineTheme = createTheme({
  primaryColor: 'cyan',
  primaryShade: 8,
  // colors: {
  //   primary: virtualColor({
  //     name: 'grayish',
  //     dark: 'gray.1',
  //     light: 'gray.9',
  //   }),
  // },
  components: {
    // pages sit inside App's padded Container; without this the side
    // gutters add up on phones
    Container: Container.extend({ defaultProps: { px: 0 } }),
  },
});
