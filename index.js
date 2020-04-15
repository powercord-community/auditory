const { Plugin } = require('powercord/entities');
const { React } = require('powercord/webpack');
const { sleep, waitFor } = require('powercord/util');
const Settings = require('./Settings');
const { resolve } = require('path');

module.exports = class Auditory extends Plugin {
  async startPlugin () {
    await waitFor('.container-3baos1:not(#powercord-spotify-modal)')
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

            let displayInfo = true;
            let isPlaying = false;
            let isMousedOver = false;
            const brightness = this.settings.get('brightness', 50);
            let beastiness = this.settings.get('beastiness', 1);
            const visualizeWithAvatar = this.settings.get('hideinfo', true)
            const color = this.settings.get('color', '#ffffff');
            const mode = this.settings.get('mode', 'amp');
            const pds = this.settings.get('pds', false);
            const important = this.settings.get('important', false);
            const shakeAmount = this.settings.get('shake', 1)
            const defaultcolor = this.settings.get('defaultcolor', '#202225');

            if (beastiness < 0 || beastiness > 5) {
              beastiness = 2; // default performance value
            }

            // Create an analyser
            const analyser = audioCtx.createAnalyser();
            let transitioning = false;
            audio.connect(analyser);
            const FFT_SIZES = [ 32, 64, 128, 256, 1024 ];
            const FFT_DIVIDE = [ 1e5, 1e5, 1e6, 1e6, 1e7 ];
            analyser.fftSize = FFT_SIZES[(beastiness || 1) - 1];
            let panels = document.querySelector('.panels-j1Uci_');
            let bg = document.querySelector('.container-3baos1:not(#powercord-spotify-modal)');
            const avatar = document.querySelector('.avatar-SmRMf2.wrapper-3t9DeA');
            const avatarWrapper = avatar.parentElement;
            avatarWrapper.classList.add('auditory-avatar-wrapper')
            bg.classList.add('auditory-background')

            const onMouseEnter = () => {
              if (visualizeWithAvatar) {
                transitioning = true;
                displayInfo = true;
                avatarWrapper.classList.remove('auditory-center')
                avatarWrapper.classList.add('auditory-normal')
                for (let child of [ ...bg.children ]) {
                  if (child.classList.contains('auditory-avatar-wrapper')) continue;
                  if (child) {
                    child.style.display = '';
                    child.classList.add('auditory-fade-in')
                    setTimeout(() => {
                      child.classList.remove('auditory-fade-in')
                      transitioning = false;
                    }, 500)
                  }
                }
              }    
            }

            const onMouseLeave = () => {
              if (visualizeWithAvatar) {
                transitioning = true;
                setTimeout(() => {
                  transitioning = false;
                  displayInfo = false;
                  avatarWrapper.classList.add('auditory-center')
                  avatarWrapper.classList.remove('auditory-normal')
                }, 300)
                
                for (let child of [ ...bg.children ]) {
                  if (child.classList.contains('auditory-avatar-wrapper')) continue;
                  child.classList.add('auditory-fade-out')
                  setTimeout(() => {
                    child.style.display = 'none';
                    child.classList.remove('auditory-fade-out')
                  }, 400)
                }
              }
            }

            if (visualizeWithAvatar) {
              panels.addEventListener('mouseenter', () => {
                isMousedOver = true;
                onMouseEnter()
              })
              panels.addEventListener('mouseleave', () => {
                setTimeout(() => {
                  isMousedOver = false;
                  if (isPlaying) {
                    onMouseLeave();
                  }
                }, 1.5e3);
              })
            }

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
              const bass = (dataArray.slice(0, 16).reduce((a, b) => a + b)) / 10;
              const xDFT_psd = Math.abs(amount ** 2);
              const amp = mode === 'amp' ? xDFT_psd / FFT_DIVIDE[(beastiness || 1) - 1] : (amount / bufferLength) / 2;

              if (!amp) {
                isPlaying = false;
                if (!transitioning && !displayInfo && visualizeWithAvatar) {
                  onMouseEnter();
                }
                bg.setAttribute('style', `background: rgba(${customBGColor.r}, ${customBGColor.g}, ${customBGColor.b}, 0.3)`);
              } else {
                if (amp > 5) {
                  isPlaying = true;
                }
                if (!transitioning && displayInfo && isPlaying && !isMousedOver && visualizeWithAvatar) {
                  onMouseLeave();
                }
                if (visualizeWithAvatar) {
                  if (bass > 325 && shakeAmount > 0) {
                    avatar.style.filter = `blur(${amp / (shakeAmount > 0 ? 300 : 500)}px)`;
                    avatarWrapper.classList.add(shakeAmount > 1 ? 'bigrumble' : 'rumble');
                  } else {
                    avatar.style.filter = `blur(0px)`;
                    avatarWrapper.classList.remove('rumble', 'bigrumble');
                  }
                }
                
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
                  avatar.style.transform = 'rotate(0deg) scale(1)';
                } else {
                  bg.style.position = 'relative';
                  if (pds) {
                    bg.style.boxShadow = `10px 10px ${10 + amp}px 30px ${bg.style.background}`;
                    bg.style['z-index'] = 100;
                  } else {
                    bg.style.boxShadow = `0px 0px ${10 + (amp / 10)}px 0px ${bg.style.background}`;
                  }
                  if (!displayInfo && visualizeWithAvatar) {
                    avatar.style.transform = `rotate(${amp / 10}deg) scale(${(Math.max(0.1, amp / 100) * 1.35)})`
                  }
                }
              }
              if (isMousedOver) {
                avatar.style.transform = 'rotate(0deg) scale(1)';
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
