// A small Web Audio output for the original game's SID register/envelope stream.
// Oscillator approximation: original events/tunes, not a cycle-accurate SID filter.
export class Sound{
 constructor(){this.regs=new Uint8Array(32);this.volumes=[0,0,0];this.enabled=true;this.running=false;this.voices=[];}
 attach=(c)=>{c.audio={reset:()=>{this.regs.fill(0);this.volumes.fill(0);},onRegWrite:(r,v)=>{this.regs[r]=v;},setVoiceVolume:(i,v)=>{this.volumes[i]=v;}};};
 async unlock(){if(!this.context){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.context=new C();this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination);for(let i=0;i<3;i++){const osc=this.context.createOscillator(),gain=this.context.createGain();osc.type='square';gain.gain.value=0;osc.connect(gain);gain.connect(this.master);osc.start();this.voices.push({osc,gain});}}await this.context.resume();}
 update(){if(!this.context)return;const t=this.context.currentTime;this.master.gain.setTargetAtTime(this.enabled&&this.running?(this.regs[24]&15)/15*0.07:0,t,0.02);this.voices.forEach(({osc,gain},i)=>{const r=i*7,c=this.regs[r+4];osc.type=c&32?'sawtooth':c&16?'triangle':'square';osc.frequency.setTargetAtTime(Math.max(20,(this.regs[r]+256*this.regs[r+1])*985248/16777216),t,0.006);gain.gain.setTargetAtTime((c&0xf0)?Math.max(0,Math.min(1,this.volumes[i])):0,t,0.008);});}
}
