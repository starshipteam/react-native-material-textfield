import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  View,
  TextInput,
  Animated,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';

import Line from '../line';
import Label from '../label';
import Affix from '../affix';
import Helper from '../helper';
import Counter from '../counter';

import styles from './styles';

function startAnimation(animation, options, callback) {
  Animated
    .timing(animation, options)
    .start(callback);
}

function labelStateFromProps(props, state) {
  let { placeholder, defaultValue, inactivePlaceholder } = props;
  let { text, receivedFocus } = state;

  return !!((inactivePlaceholder && placeholder) || text || (!receivedFocus && defaultValue));
}

function errorStateFromProps(props, state) {
  let { error } = props;

  return !!error;
}

export default class TextField extends PureComponent {
  static defaultProps = {
    underlineColorAndroid: 'transparent',
    disableFullscreenUI: true,
    autoCapitalize: 'sentences',
    editable: true,

    animationDuration: 225,

    fontSize: 16,
    labelFontSize: 12,

    tintColor: 'rgb(0, 145, 234)',
    textColor: 'rgba(0, 0, 0, .87)',
    baseColor: 'rgba(0, 0, 0, .38)',

    errorColor: 'rgb(213, 0, 0)',

    lineWidth: StyleSheet.hairlineWidth,
    activeLineWidth: 2,
    disabledLineWidth: 1,

    lineType: 'solid',
    disabledLineType: 'dotted',

    disabled: false,
    inactivePlaceholder: true,
    errorMessageHidden: false,
  };

  static propTypes = {
    animationDuration: PropTypes.number,

    fontSize: PropTypes.number,
    labelFontSize: PropTypes.number,

    contentInset: PropTypes.shape({
      top: PropTypes.number,
      label: PropTypes.number,
      input: PropTypes.number,
      left: PropTypes.number,
      right: PropTypes.number,
      bottom: PropTypes.number,
    }),

    labelOffset: Label.propTypes.offset,

    labelTextStyle: PropTypes.any,
    titleTextStyle: PropTypes.any,
    affixTextStyle: PropTypes.any,

    tintColor: PropTypes.string,
    textColor: PropTypes.string,
    baseColor: PropTypes.string,
    inactiveLineColor: PropTypes.string,

    label: PropTypes.string,
    title: PropTypes.string,

    characterRestriction: PropTypes.number,

    error: PropTypes.string,
    errorColor: PropTypes.string,
    errorMessageHidden: PropTypes.bool,

    lineWidth: PropTypes.number,
    activeLineWidth: PropTypes.number,
    disabledLineWidth: PropTypes.number,

    lineType: Line.propTypes.lineType,
    disabledLineType: Line.propTypes.lineType,

    disabled: PropTypes.bool,

    defaultValue: PropTypes.string,

    formatText: PropTypes.func,

    renderLeftAccessory: PropTypes.func,
    renderRightAccessory: PropTypes.func,

    prefix: PropTypes.string,
    suffix: PropTypes.string,

    inactivePlaceholder: PropTypes.bool,

    containerStyle: PropTypes.any,
    inputContainerStyle: PropTypes.any,
  };

  static inputContainerStyle = styles.inputContainer;

  static contentInset = {
    top: 16,
    label: 4,
    input: 8,
    left: 0,
    right: 0,
    bottom: 8,
  };

  static labelOffset = {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
  };

  static getDerivedStateFromProps({ error }, state) {
    /* Keep last received error in state */
    if (error && error !== state.error) {
      return { error };
    }

    return null;
  }

  constructor(props) {
    super(props);

    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onPress = this.focus.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onChangeText = this.onChangeText.bind(this);
    this.onContentSizeChange = this.onContentSizeChange.bind(this);
    this.onFocusAnimationEnd = this.onFocusAnimationEnd.bind(this);

    this.createGetter('contentInset');
    this.createGetter('labelOffset');

    this.inputRef = React.createRef();
    this.mounted = false;
    this.focused = false;

    let { value: text, error, fontSize } = this.props;

    let labelState = labelStateFromProps(this.props, { text })? 1 : 0;
    let focusState = errorStateFromProps(this.props)? -1 : 0;

    this.state = {
      text,
      error,

      focusAnimation: new Animated.Value(focusState),
      labelAnimation: new Animated.Value(labelState),

      receivedFocus: false,

      height: fontSize * 1.5,
    };
  }

  createGetter(name) {
    this[name] = () => {
      let { [name]: value } = this.props;
      let { [name]: defaultValue } = this.constructor;

      return { ...defaultValue, ...value };
    };
  }

  componentDidMount() {
    this.mounted = true;
    if (Platform.OS === 'web' && !this.focused && this.props.autoFocus) {
      this.focus();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  componentDidUpdate(prevProps, prevState) {
    let errorState = errorStateFromProps(this.props);
    let prevErrorState = errorStateFromProps(prevProps);

    if (errorState ^ prevErrorState) {
      this.startFocusAnimation();
    }

    let labelState = labelStateFromProps(this.props, this.state);
    let prevLabelState = labelStateFromProps(prevProps, prevState);

    if (labelState ^ prevLabelState) {
      this.startLabelAnimation();
    }
  }

  startFocusAnimation() {
    let { focusAnimation } = this.state;
    let { animationDuration: duration } = this.props;

    let options = {
      toValue: this.focusState(),
      duration,
      useNativeDriver: false,
    };

    startAnimation(focusAnimation, options, this.onFocusAnimationEnd);
  }

  startLabelAnimation() {
    let { labelAnimation } = this.state;
    let { animationDuration: duration } = this.props;

    let options = {
      toValue: this.labelState(),
      useNativeDriver: true,
      duration,
    };

    startAnimation(labelAnimation, options);
  }

  setNativeProps(props) {
    let { current: input } = this.inputRef;

    input.setNativeProps(props);
  }

  focusState() {
    if (errorStateFromProps(this.props)) {
      return -1;
    }

    return this.focused? 1 : 0;
  }

  labelState() {
    if (labelStateFromProps(this.props, this.state)) {
      return 1;
    }

    return this.focused? 1 : 0;
  }

  focus() {
    let { disabled, editable } = this.props;
    let { current: input } = this.inputRef;

    if (!disabled && editable && !this.focused) {
      this.setFocused();
      input.focus();
    }
  }

  blur() {
    let { current: input } = this.inputRef;

    input.blur();
  }

  clear() {
    let { current: input } = this.inputRef;

    input.clear();

    /* onChangeText is not triggered by .clear() */
    this.onChangeText('');
  }

  value() {
    let { text } = this.state;
    let { defaultValue } = this.props;

    let value = this.isDefaultVisible()?
      defaultValue:
      text;

    if (null == value) {
      return '';
    }

    return 'string' === typeof value?
      value:
      String(value);
  }

  setValue(text) {
    this.setState({ text });
  }

  setFocused() {
    let { receivedFocus } = this.state;

    if (this.focused) {
      return;
    }

    this.focused = true;
    this.startFocusAnimation();
    this.startLabelAnimation();

    if (!receivedFocus) {
      this.setState({ receivedFocus: true, text: this.value() });
    }
  }

  setBlurred() {
    this.focused = false;
    this.startFocusAnimation();
    this.startLabelAnimation();
  }

  isFocused() {
    let { current: input } = this.inputRef;

    return input.isFocused();
  }

  isRestricted() {
    let { characterRestriction: limit } = this.props;
    let { length: count } = this.value();

    return limit < count;
  }

  isErrored() {
    return errorStateFromProps(this.props);
  }

  isDefaultVisible() {
    let { text, receivedFocus } = this.state;
    let { defaultValue } = this.props;

    return !receivedFocus && null == text && null != defaultValue;
  }

  isPlaceholderVisible() {
    let { placeholder } = this.props;

    return placeholder && !this.focused && !this.value();
  }

  isLabelActive() {
    return 1 === this.labelState();
  }

  onFocus(event) {
    let { onFocus, clearTextOnFocus } = this.props;

    if ('function' === typeof onFocus) {
      onFocus(event);
    }

    if (clearTextOnFocus) {
      this.clear();
    }

    this.setFocused();
  }

  onBlur(event) {
    let { onBlur } = this.props;

    if ('function' === typeof onBlur) {
      onBlur(event);
    }

    this.setBlurred();
  }

  onChange(event) {
    let { onChange } = this.props;

    if ('function' === typeof onChange) {
      onChange(event);
    }
  }

  onChangeText(text) {
    let { onChangeText, formatText } = this.props;

    if ('function' === typeof formatText) {
      text = formatText(text);
    }

    this.setState({ text });

    if ('function' === typeof onChangeText) {
      onChangeText(text);
    }
  }

  onContentSizeChange(event) {
    let { onContentSizeChange, fontSize } = this.props;
    let { height } = event.nativeEvent.contentSize;

    if ('function' === typeof onContentSizeChange) {
      onContentSizeChange(event);
    }

    this.setState({
      height: Math.max(
        fontSize * 1.5,
        Math.ceil(height) + Platform.select({ ios: 4, android: 1 })
      ),
    });
  }

  onFocusAnimationEnd() {
    let { error } = this.props;
    let { error: retainedError } = this.state;

    if (this.mounted && !error && retainedError) {
      this.setState({ error: null });
    }
  }

  inputHeight() {
    let { height: computedHeight } = this.state;
    let { multiline, fontSize, height = computedHeight } = this.props;

    return multiline?
      height:
      fontSize * 1.5;
  }

  inputContainerHeight() {
    let { labelFontSize, multiline } = this.props;
    let contentInset = this.contentInset();

    if ('web' === Platform.OS && multiline) {
      return 'auto';
    }

    return contentInset.top
      + labelFontSize
      + contentInset.label
      + this.inputHeight()
      + contentInset.input;
  }

  inputProps() {
    let store = {};
    for (let key in this.props) {
      if (TextField.propTypes && TextField.propTypes[key]) {
        continue;
      }
      store[key] = this.props[key];
    }

    return store;
  }

  inputStyle() {
    let { fontSize, baseColor, textColor, disabled, multiline } = this.props;

    let color = disabled || this.isDefaultVisible()?
      baseColor:
      textColor;

    let style = {
      fontSize,
      color,

      height: this.inputHeight(),
    };

    if (multiline) {
      let lineHeight = fontSize * 1.5;
      let offset = 'ios' === Platform.OS? 2 : 0;

      style.height += lineHeight;
      style.transform = [{
        translateY: lineHeight + offset,
      }];
    }

    return style;
  }

  renderLabel(props) {
    let offset = this.labelOffset();

    let {
      label,
      fontSize,
      labelFontSize,
      labelTextStyle,
    } = this.props;

    return (
      <Label
        {...props}
        fontSize={fontSize}
        activeFontSize={labelFontSize}
        offset={offset}
        label={label}
        style={StyleSheet.flatten(labelTextStyle)}
      />
    );
  }

  renderLine(props) {
    return (
      <Line {...props} />
    );
  }

  renderAccessory(prop) {
    let { [prop]: renderAccessory } = this.props;

    return 'function' === typeof renderAccessory?
      renderAccessory():
      null;
  }

  renderAffix(type) {
    let {
      [type]: affix,
      fontSize,
      baseColor: color,
      affixTextStyle: style,
    } = this.props;

    if (null == affix) {
      return null;
    }

    let props = {
      type,
      style,
      color,
      fontSize,
    };

    return (
      <Affix {...props}>{affix}</Affix>
    );
  }

  renderHelper() {
    let { focusAnimation, error } = this.state;

    let {
      title,
      disabled,
      baseColor,
      errorColor,
      errorMessageHidden,
      titleTextStyle: style,
      characterRestriction: limit,
    } = this.props;

    let { length: count } = this.value();
    let contentInset = this.contentInset();

    let containerStyle =  {
      paddingLeft: contentInset.left,
      paddingRight: contentInset.right,
      minHeight: contentInset.bottom,
    };

    let styleProps = {
      style,
      baseColor,
      errorColor,
    };

    let counterProps = {
      ...styleProps,
      limit,
      count,
    };

    let helperProps = {
      ...styleProps,
      title,
      error,
      errorMessageHidden,
      disabled,
      focusAnimation,
    };

    return (
      <View style={[styles.helperContainer, containerStyle]}>
        <Helper {...helperProps} />
        <Counter {...counterProps} />
      </View>
    );
  }

  renderInput() {
    let {
      disabled,
      editable,
      tintColor,
      style: inputStyleOverrides,
    } = this.props;

    let props = this.inputProps();
    let inputStyle = this.inputStyle();

    return (
      <TextInput
        selectionColor={tintColor}

        {...props}

        style={[styles.input, inputStyle, inputStyleOverrides]}
        editable={!disabled && editable}
        onChange={this.onChange}
        onChangeText={this.onChangeText}
        onContentSizeChange={this.onContentSizeChange}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
        value={this.value()}
        ref={this.inputRef}
      />
    );
  }

  render() {
    let { labelAnimation, focusAnimation } = this.state;
    let {
      editable,
      disabled,
      lineType,
      disabledLineType,
      lineWidth,
      activeLineWidth,
      disabledLineWidth,
      inactiveLineColor,
      tintColor,
      baseColor,
      errorColor,
      containerStyle,
      inputContainerStyle: inputContainerStyleOverrides,
      inactivePlaceholder,
    } = this.props;

    let restricted = this.isRestricted();
    let contentInset = this.contentInset();

    let inputContainerStyle = {
      paddingTop: contentInset.top,
      paddingRight: contentInset.right,
      paddingBottom: contentInset.input,
      paddingLeft: contentInset.left,
      height: this.inputContainerHeight(),
    };

    let touchableProps = {
      accessible: false,
      onPress: this.onPress,
      pointerEvents: !disabled && editable?
        'box-none':
        'none',
    };

    let inputContainerProps = {
      style: [
        this.constructor.inputContainerStyle,
        inputContainerStyle,
        inputContainerStyleOverrides,
      ],
    };

    let styleProps = {
      disabled,
      restricted,
      baseColor,
      tintColor,
      errorColor,

      contentInset,

      focusAnimation,
      labelAnimation,
    };

    let lineProps = {
      ...styleProps,

      lineWidth,
      activeLineWidth,
      disabledLineWidth,
      inactiveLineColor,

      lineType,
      disabledLineType,
    };

    return (
      <TouchableWithoutFeedback {...touchableProps}>
        <View style={containerStyle}>
          <Animated.View {...inputContainerProps}>
            {this.renderLine(lineProps)}
            {this.renderAccessory('renderLeftAccessory')}

            <View style={styles.stack}>
              {this.renderLabel(styleProps)}

              <Animated.View
                style={[styles.row, !inactivePlaceholder && { opacity: labelAnimation }]}>
                {this.renderAffix('prefix')}
                {this.renderInput()}
                {this.renderAffix('suffix')}
              </Animated.View>
            </View>

            {this.renderAccessory('renderRightAccessory')}
          </Animated.View>

          {this.renderHelper()}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}
