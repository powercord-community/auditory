const { Plugin } = require('powercord/entities');
const { React } = require('powercord/webpack');
const Settings = require('./Settings');

module.exports = class Auditory extends Plugin {
  startPlugin () {
    this.intervals = this.startVisualizer();
    this.registerSettings(
      'auditory',
      'Auditory',
      () =>
        React.createElement(Settings, {
          settings: this.settings
        })
    );
  }

  reload () {
    this.stopVisualizer();
    this.startVisualizer();
  }

  stopVisualizer () {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
  }

  startVisualizer () {
    const { desktopCapturer } = require('electron');
    desktopCapturer.getSources({ types: [ 'window', 'screen' ] }).then(async sources => {
      for (const source of sources) {
        if (source.name.includes('Discord')) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                mandatory: {
                  chromeMediaSource: 'desktop'
                }
              },
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop'
                }
              }
            });

            const audioCtx = new AudioContext();
            const audio = audioCtx.createMediaStreamSource(stream);

            // Create an analyser
            const analyser = audioCtx.createAnalyser();
            audio.connect(analyser);
            const FFT_SIZES = [ 32, 64, 128, 256, 1028 ];
            const FFT_DIVIDE = [ 1e5, 1e5, 1e6, 1e6, 1e7 ];
            analyser.fftSize = FFT_SIZES[this.settings.config.beastiness - 1];
            let bg = document.querySelector('.channels-Ie2l6A > .container-2Thooq:not(#powercord-spotify-modal)');

            const hexToRGB = (hex) => {
              const bigint = parseInt(hex, 16);
              return { r: (bigint >> 16) & 255,
                g: (bigint >> 8) & 255,
                b: bigint & 255 };
            };
            const customColor = hexToRGB(this.settings.config.color.replace('#', '')) || hexToRGB('ef5350');

            // Find the container to change the style
            const findElement = setInterval(() => {
              bg = document.querySelector('.channels-Ie2l6A > .container-2Thooq:not(#powercord-spotify-modal)');
            }, 1000);

            // Perform style changes
            const style = setInterval(() => {
              if (!bg) {
                return;
              }
              const bufferLength = analyser.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);
              analyser.getByteFrequencyData(dataArray);
              const amount = dataArray.reduce((a, b) => a + b);
              const xDFT_psd = Math.abs(amount ** 2);
              const amp = this.settings.config.mode === 'amp' ? xDFT_psd / FFT_DIVIDE[this.settings.config.beastiness - 1] : (amount / bufferLength) / 2;

              const defaultColors = {
                r: 32,
                g: 34,
                b: 37
              };
              if (!amp) {
                bg.style.background = `rgba(${defaultColors.r}, ${defaultColors.g}, ${defaultColors.b}, .3)`;
              } else {
                bg.style.background = `rgba(${customColor.r}, ${customColor.g}, ${customColor.b}, ${0.1 * (amp / 2 / (100.1 - (this.settings.config.brightness || 0.1))).toString()})`;
              }

              if (this.settings.config.beastiness > 1) {
                bg.style.boxShadow = `0px 0px ${10 + (amp / 10)}px 0px ${bg.style.background}`;
                bg.style['z-index'] = 1;
              }
            }, 1000 / (15 * (this.settings.config.beastiness * 2)));
            this.intervals = [ style, findElement ];
          } catch (e) {
            console.error(e);
          }
          return;
        }
      }
    });
  }
};
