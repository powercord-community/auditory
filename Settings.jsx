const { React, getModuleByDisplayName } = require('powercord/webpack');
const { TextInput, SwitchItem } = require('powercord/components/settings');

module.exports = class Settings extends React.Component {
  constructor (props) {
    super(props);
    this.props = props;
    this.plugin = powercord.pluginManager.get('auditory');
    this.state = {};
  }

  async componentDidMount () {
    const get = this.props.settings.get.bind(this.props.settings);
    this.setState({
      Slider: await getModuleByDisplayName('Slider'),
      RadioGroup: await getModuleByDisplayName('RadioGroup'),
      FormTitle: await getModuleByDisplayName('FormTitle'),
      FormText: await getModuleByDisplayName('FormText'),
      beastiness: get('beastiness', 1),
      mode: get('mode', 'amp'),
      color: get('color', null),
      brightness: get('brightness', 1),
      important: get('important', false),
      pds: get('pds', false),
      hideinfo: get('hideinfo', true),
      defaultcolor: get('defaultcolor', '')
    });
  }

  render () {
    if (!this.state.Slider) {
      return null;
    }
    const { Slider, RadioGroup, FormTitle, FormText } = this.state;
    return (
      <div>
        <SwitchItem
          note='All information and buttons in the user panel will be hidden and only shown if moused over. Your avatar will be moved to the center of the user panel and act as the visualizer, moving to the music'
          value={this.state.hideinfo || false}
          onChange={() => this._set('hideinfo')}
        >Use avatar as visualizer <sup style={{ marginLeft: '4px' }} class="beta-3smTDE">New!</sup></SwitchItem>

        <FormTitle>Performance</FormTitle>
        <FormText style={{ marginBottom: '32px' }} type='description'>
          Changing this value will change the amount of detail the visualizer will pick up on, how often it updates and certain visual effects. Higher values may increase CPU usage.
        </FormText>
        <Slider
          defaultValue={this.state.beastiness || 1}
          initialValue={this.state.beastiness || 1}
          style={{ marginTop: '32px',
            marginBottom: '32px' }}
          markers={[ 1, 2, 3, 4, 5 ]}
          handleSize={10}
          stickToMarkers={true}
          minValue={1}
          maxValue={5}
          onValueChange={(e) => this._set('beastiness', e)}
        />

        <FormTitle style={{ marginTop: '32px' }}>Brightness</FormTitle>
        <Slider
          defaultValue={this.state.brightness || 1}
          initialValue={this.state.brightness || 1}
          handleSize={10}
          style={{ marginTop: '16px' }}
          stickToMarkers={false}
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

        <SwitchItem
          note={'Party and don\'t stop. (quite CPU intensive)'}
          value={this.state.pds || false}
          onChange={() => this._set('pds')}
        >PDS Mode</SwitchItem>
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
