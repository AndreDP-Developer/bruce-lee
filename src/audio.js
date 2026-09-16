import {Music} from './music.js';
// Retain native SID event timing, but tame the upper harmonics and render
// noise as noise rather than substituting a piercing square wave.
export class Sound{
 constructor(){this.regs=new Uint8Array(32);this.volumes=[0,0,0];this.enabled=true;this.running=false;this.voices=[];this.musicEnabled=true;this.musicVolume=.45;this.effectsVolume=.45;}
 attach=(c)=>{c.audio={reset:()=>{this.regs.fill(0);this.volumes.fill(0);},onRegWrite:(r,v)=>{this.regs[r]=v;},setVoiceVolume:(i,v)=>{this.volumes[i]=v;}};};
 async unlock(){if(!this.context){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=this.context=new C();
  this.master=c.createGain();this.master.gain.value=0;const limiter=c.createDynamicsCompressor();limiter.threshold.value=-18;limiter.knee.value=18;limiter.ratio.value=4;this.master.connect(limiter);limiter.connect(c.destination);
  this.effects=c.createGain();this.effects.connect(this.master);this.musicBus=c.createGain();this.musicBus.connect(this.master);this.music=new Music(c,this.musicBus);
  const noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=noise.getChannelData(0);for(let j=0;j<data.length;j++)data[j]=Math.random()*2-1;
  for(let i=0;i<3;i++){
   const osc=c.createOscillator(),tone=c.createGain(),source=c.createBufferSource(),noiseGain=c.createGain(),filter=c.createBiquadFilter();
   osc.type='triangle';tone.gain.value=0;source.buffer=noise;source.loop=true;noiseGain.gain.value=0;filter.type='lowpass';filter.frequency.value=1800;filter.Q.value=.45;
   osc.connect(tone);tone.connect(filter);source.connect(noiseGain);noiseGain.connect(filter);filter.connect(this.effects);osc.start();source.start();this.voices.push({osc,tone,noiseGain,source});
  }
 }await this.context.resume();}
 update(){if(!this.context)return;const t=this.context.currentTime,active=this.enabled&&this.running;
  this.master.gain.setTargetAtTime(active?.65:0,t,.025);
  this.effects.gain.setTargetAtTime(this.effectsVolume*(this.regs[24]&15)/15*.12,t,.025);
  this.musicBus.gain.setTargetAtTime(this.musicVolume,t,.04);this.music.setActive(active&&this.musicEnabled&&this.musicVolume>0);this.music.update();
  this.voices.forEach(({osc,tone,noiseGain},i)=>{const r=i*7,control=this.regs[r+4],noise=!!(control&128),volume=(control&0xf0)&&!(control&8)?Math.max(0,Math.min(1,this.volumes[i])):0;
   // Triangle keeps the pitch cues while avoiding the old buzzy pulse timbre.
   osc.frequency.setTargetAtTime(Math.max(20,Math.min(8000,(this.regs[r]+256*this.regs[r+1])*985248/16777216)),t,.009);
   tone.gain.setTargetAtTime(noise?0:volume,t,.012);noiseGain.gain.setTargetAtTime(noise?volume*.55:0,t,.012);
  });
 }
}
