import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Text } from 'react-native';

import styles from './styles';

export default class Affix extends PureComponent {
  static defaultProps = {
    numberOfLines: 1,
  };

  static propTypes = {
    numberOfLines: PropTypes.number,
    style: PropTypes.any,

    color: PropTypes.string.isRequired,
    fontSize: PropTypes.number.isRequired,

    type: PropTypes
      .oneOf(['prefix', 'suffix'])
      .isRequired,

    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]),
  };

  render() {
    let { style, children, type, fontSize, color } = this.props;

    let containerStyle = {
      height: fontSize * 1.5,
    };

    let textStyle = {
      fontSize,
      color,
    };

    switch (type) {
      case 'prefix':
        containerStyle.paddingRight = 8;
        textStyle.textAlign = 'left';
        break;

      case 'suffix':
        containerStyle.paddingLeft = 8;
        textStyle.textAlign = 'right';
        break;
    }

    return (
      <Text style={[styles.container, containerStyle, style, textStyle]}>{children}</Text>
    );
  }
}
