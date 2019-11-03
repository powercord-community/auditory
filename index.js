const { Plugin } = require('powercord/entities');
const { React } = require('powercord/webpack');
const Settings = require('./Settings');
const { resolve } = require('path');

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
    this.loadCSS(resolve(__dirname, 'style.scss'));
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

            const brightness = this.settings.get('brightness', 50);
            let beastiness = this.settings.get('beastiness', 1);
            const color = this.settings.get('color', '#ffffff');
            const mode = this.settings.get('mode', 'amp');
            const pds = this.settings.get('pds', false);
            const important = this.settings.get('important', false);
            const defaultcolor = this.settings.get('defaultcolor', '#202225');

            if (beastiness < 0 || beastiness > 5) {
              beastiness = 2; // default performance value
            }

            // Create an analyser
            const analyser = audioCtx.createAnalyser();
            audio.connect(analyser);
            const FFT_SIZES = [ 32, 64, 128, 256, 1024 ];
            const FFT_DIVIDE = [ 1e5, 1e5, 1e6, 1e6, 1e7 ];
            analyser.fftSize = FFT_SIZES[(beastiness || 1) - 1];
            let bg = document.querySelector('.container-3baos1:not(#powercord-spotify-modal)');

            const hexToRGB = (hex) => {
              const bigint = parseInt(hex, 16);
              return { r: (bigint >> 16) & 255,
                g: (bigint >> 8) & 255,
                b: bigint & 255 };
            };
            const customColor = hexToRGB((color || '').replace('#', '')) || hexToRGB('ef5350');
            const customBGColor = hexToRGB((defaultcolor || '').replace('#', '')) || hexToRGB('202225');

            // Find the container to change the style
            const findElement = setInterval(() => {
              bg = document.querySelector('.container-3baos1:not(#powercord-spotify-modal)');
            }, 1000);

            let red = 255,
              green = 0,
              blue = 0;
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
              const amp = mode === 'amp' ? xDFT_psd / FFT_DIVIDE[(beastiness || 1) - 1] : (amount / bufferLength) / 2;

              if (!amp) {
                bg.setAttribute('style', `background: rgba(${customBGColor.r}, ${customBGColor.g}, ${customBGColor.b}, 0.3)`);
              } else {
                if (pds) {
                  if (red > 0 && blue === 0) {
                    red--;
                    green++;
                  }
                  if (green > 0 && red === 0) {
                    green--;
                    blue++;
                  }
                  if (blue > 0 && green === 0) {
                    red++;
                    blue--;
                  }
                  bg.setAttribute('style', `background: rgba(${red}, ${green}, ${blue}, ${0.1 * (amp / 2 / (100.1 - (brightness || 0.1))).toString()}) ${important ? '!important' : ''}`);
                } else {
                  bg.setAttribute('style', `background: rgba(${customColor.r}, ${customColor.g}, ${customColor.b}, ${0.1 * (amp / 2 / (100.1 - (brightness || 0.1))).toString()}) ${important ? '!important' : ''}`);
                }
              }

              if (beastiness > 1) {
                if (!amp) {
                  bg.style.boxShadow = `0px 0px ${10 + (amp / 10)}px 0px ${bg.style.background}`;
                } else {
                  if (pds) {
                    bg.style.boxShadow = `10px 10px ${10 + amp}px 30px ${bg.style.background}`;
                    bg.style.position = 'relative';
                    bg.style['z-index'] = 100;
                  } else {
                    bg.style.boxShadow = `0px 0px ${10 + (amp / 10)}px 0px ${bg.style.background}`;
                  }
                }
              }
            }, 1000 / (15 * ((beastiness || 1) * 2)));
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
