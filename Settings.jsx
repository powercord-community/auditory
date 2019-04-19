const { React, getModuleByDisplayName } = require('powercord/webpack');
const { TextInput } = require('powercord/components/settings');
const Slider = getModuleByDisplayName('Slider');
const RadioGroup = getModuleByDisplayName('RadioGroup');
const FormTitle = getModuleByDisplayName('FormTitle');
const FormText = getModuleByDisplayName('FormText');

module.exports = class Settings extends React.Component {
  constructor (props) {
    super(props);

    const get = props.settings.get.bind(props.settings);
    this.plugin = powercord.pluginManager.get('auditory');
    this.state = {
      beastiness: get('beastiness', 1),
      mode: get('mode', 'amp'),
      color: get('color', null),
      brightness: get('brightness', 1)
    };
  }

  render () {
    return (
      <div>
        <FormTitle>Performance</FormTitle>
        <FormText style={{ marginBottom: '32px' }} type='description'>
          Changing this value will change the amount of detail the visualizer will pick up on, how often it updates and certain visual effects
        </FormText>
        <Slider
          defaultValue={this.state.beastiness || 1}
          handleSize={10}
          style={{ marginTop: '32px',
            marginBottom: '32px' }}
          markers={[ 1, 2, 3, 4, 5 ]}
          stickToMarkers={true}
          equidistance={true}
          minValue={1}
          maxValue={5}
          onValueChange={(e) => this._set('beastiness', e)}
        />

        <FormTitle style={{ marginTop: '32px' }}>Brightness</FormTitle>
        <Slider
          defaultValue={this.state.brightness || 1}
          handleSize={10}
          style={{ marginTop: '16px' }}
          stickToMarkers={false}
          equidistance={true}
          minValue={1}
          maxValue={100}
          onValueChange={(e) => this._set('brightness', e)}
        />

        <FormTitle style={{ marginTop: '32px' }}>Visualizer Mode</FormTitle>
        <RadioGroup
          value={this.state.mode || 'amp'}
          options={[
            {
              name: 'Amplitude',
              value: 'amp'
            },
            {
              name: 'FFT',
              value: 'fft'
            }
          ]}
          onChange={(e) => this._set('mode', e.value)}
        >
        </RadioGroup>

        <FormTitle style={{ marginTop: '32px' }}>Color</FormTitle>
        <FormText type='description'>Enter a hex code (eg. #31fa41)</FormText>
        <TextInput
          defaultValue={this.state.color || ''}
          onChange={(e) => this._set('color', e)}
        />
      </div>
    );
  }

  _set (key, value = !this.state[key], defaultValue) {
    if (!value && defaultValue) {
      value = defaultValue;
    }

    this.props.settings.set(key, value);
    this.setState({ [key]: value });
    this.plugin.reload();
  }
};
