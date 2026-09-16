import {BackgroundTrack} from './music.js';
// Sample the original SID register/envelope stream during CPU execution.
// This preserves short effects, pulse width, pitch-dependent noise and sweeps.
export class SidOutput {
 constructor(){this.regs=new Uint8Array(32);this.volumes=[0,0,0];this.phase=[0,0,0];this.noisePhase=[0,0,0];this.noise=[0x7ffff8,0x5ffff8,0x3ffff8];this.clock=0;this.samples=[];this.dc=0;}
 tick(){this.clock+=44100;if(this.clock<982800)return;this.clock-=982800;this.samples.push(this.sample());}
 sample(){let mixed=0;for(let i=0;i<3;i++){
  const r=i*7,c=this.regs[r+4],freq=(this.regs[r]+256*this.regs[r+1])*985248/16777216;
  if(c&8){this.phase[i]=0;this.noise[i]=0x7ffff8;continue;}
  this.phase[i]=(this.phase[i]+freq/44100)%1;const p=this.phase[i];
  this.noisePhase[i]+=freq*16/44100;
  while(this.noisePhase[i]>=1){this.noisePhase[i]--;const s=this.noise[i];this.noise[i]=((s<<1)|(((s>>>22)^(s>>>17))&1))&0x7fffff;}
  let value=0,count=0;
  if(c&16){value+=1-4*Math.abs(p-.5);count++;}
  if(c&32){value+=2*p-1;count++;}
  if(c&64){const width=(this.regs[r+2]+256*(this.regs[r+3]&15))/4096;value+=p<width?1:-1;count++;}
  if(c&128){const s=this.noise[i];const bits=(((s>>>22)&1)<<7)|(((s>>>20)&1)<<6)|(((s>>>16)&1)<<5)|(((s>>>13)&1)<<4)|(((s>>>11)&1)<<3)|(((s>>>7)&1)<<2)|(((s>>>4)&1)<<1)|((s>>>2)&1);value+=bits/127.5-1;count++;}
  if(count&&!(i===2&&(this.regs[24]&128)))mixed+=value/count*Math.max(0,Math.min(1,this.volumes[i]));
 }
 const value=mixed*(this.regs[24]&15)/15*.26;this.dc+=.002*(value-this.dc);return value-this.dc;
 }
 take(){const block=Float32Array.from(this.samples);this.samples.length=0;return block;}
}

export class Sound {
 constructor(){this.music=new BackgroundTrack();this.musicEnabled=true;this.musicVolume=.12;this.synth=new SidOutput();this.enabled=true;this.running=false;this.effectsVolume=.8;this.sources=new Set();this.nextTime=0;}
 attach=(c)=>{c.audio={reset:()=>{this.synth=new SidOutput();},onRegWrite:(r,v)=>{this.synth.regs[r]=v;},setVoiceVolume:(i,v)=>{this.synth.volumes[i]=v;},tick:()=>this.synth.tick(),endFrame:()=>this.enqueue(this.synth.take())};};
 async unlock(){this.music.unlock();if(!this.context){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=this.context=new C();this.master=c.createGain();this.master.gain.value=0;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=11000;filter.Q.value=.5;this.master.connect(filter);filter.connect(c.destination);}await this.context.resume();}
 enqueue(samples){if(!this.context||!this.running||!this.enabled||!samples.length)return;const c=this.context;
  if(this.nextTime<c.currentTime||this.nextTime>c.currentTime+.15)this.nextTime=c.currentTime+.025;
  const buffer=c.createBuffer(1,samples.length,44100);buffer.getChannelData(0).set(samples);const source=c.createBufferSource();source.buffer=buffer;source.connect(this.master);source.start(this.nextTime);this.nextTime+=samples.length/44100;this.sources.add(source);source.onended=()=>{source.disconnect();this.sources.delete(source);};
 }
 update(){this.music.update(this.enabled&&this.running&&this.musicEnabled,this.musicVolume);if(!this.context)return;const active=this.enabled&&this.running;this.master.gain.setTargetAtTime(active?this.effectsVolume:0,this.context.currentTime,.006);if(!active){for(const source of this.sources){try{source.stop();}catch{}}this.sources.clear();this.nextTime=0;}}
}
