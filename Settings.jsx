const { React, getModuleByDisplayName } = require('powercord/webpack');
const { TextInput, SwitchItem } = require('powercord/components/settings');

module.exports = class Settings extends React.Component {
  constructor (props) {
    super(props);

    const get = props.settings.get.bind(props.settings);
    this.plugin = powercord.pluginManager.get('auditory');
    this.state = {
      beastiness: get('beastiness', 1),
      mode: get('mode', 'amp'),
      color: get('color', null),
      brightness: get('brightness', 1),
      important: get('important', false),
      defaultcolor: get('defaultcolor', '')
    };
  }

  async componentDidMount () {
    this.setState({
      Slider: await getModuleByDisplayName('Slider'),
      RadioGroup: await getModuleByDisplayName('RadioGroup'),
      FormTitle: await getModuleByDisplayName('FormTitle'),
      FormText: await getModuleByDisplayName('FormText')
    });
  }

  render () {
    if (!this.state.Slider) {
      return null;
    }
    const { Slider, RadioGroup, FormTitle, FormText } = this.state;
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

        <FormTitle style={{ marginTop: '32px' }}>Styling</FormTitle>
        <SwitchItem
          note='This ensures that Auditory styling and effects take priority over themes and other CSS that affect the user container.'
          value={this.state.important || false}
          onChange={() => this._set('important')}
        >Override any existing styling</SwitchItem>

        <FormTitle>Visualizer Color</FormTitle>

        <TextInput
          defaultValue={this.state.color || ''}
          placeholder='Enter a hex code (eg. #31fa41)'
          onChange={(e) => this._set('color', e)}
        />
        <FormTitle>Idle Color (when no audio is playing)</FormTitle>
        <FormText type='description'>
          Leave this blank to default to the Discord grey.
        </FormText>
        <TextInput
          defaultValue={this.state.defaultcolor || ''}
          placeholder='Enter a hex code (eg. #31fa41)'
          onChange={(e) => this._set('defaultcolor', e)}
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
