import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    ...(Platform.select({ web: {
      left: '-100%',
      width: '200%',
      paddingLeft: '100%',
    },
    default: {
      left: '-50%',
      width: '100%',
      paddingLeft: '50%',
    } })),
  },

  text: {
    textAlign: 'left',
    includeFontPadding: false,
    textAlignVertical: 'top',
    ...(Platform.select({ web: {
      width: '100%',
    },
    default: {
      width: '200%',
    } })),
  },
});
