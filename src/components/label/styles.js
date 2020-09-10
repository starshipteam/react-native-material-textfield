import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: '-50%',
    width: '100%',
    paddingLeft: '50%',
  },

  text: {
    textAlign: 'left',
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
});
