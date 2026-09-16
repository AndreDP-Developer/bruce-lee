import {test} from 'node:test';
import assert from 'node:assert/strict';
import {phrase,Music} from '../src/music.js';
import {Sound} from '../src/audio.js';
class Param{constructor(){this.value=0;}setValueAtTime(v){this.value=v;}setTargetAtTime(v){this.value=v;}exponentialRampToValueAtTime(v){assert.ok(v>0);this.value=v;}}
class Node{constructor(){for(const key of ['gain','frequency','pan','delayTime','Q','threshold','knee','ratio'])this[key]=new Param();}connect(){}disconnect(){}start(t){this.started=t??0;}stop(){this.stopped=true;}}
class Context{constructor(){this.currentTime=0;this.sampleRate=8000;this.destination=new Node();this.oscillators=[];}createGain(){return new Node();}createDelay(){return new Node();}createStereoPanner(){return new Node();}createDynamicsCompressor(){return new Node();}createBiquadFilter(){return new Node();}createBufferSource(){return new Node();}createOscillator(){const n=new Node();this.oscillators.push(n);return n;}createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)};}async resume(){}}

test('32 phrases vary, stay in musical range, and leave space between melodies',()=>{
 const variants=new Set();for(let i=0;i<32;i++){const events=phrase(i);variants.add(JSON.stringify(events));assert.ok(events.length>20);assert.ok(events.every(e=>e.beat>=0&&e.beat<32&&e.midi>=38&&e.midi<=90&&e.level<.3));assert.ok(events.every((e,j)=>j===0||e.beat>=events[j-1].beat));assert.ok(events.filter(e=>e.voice==='flute').length<16);}assert.equal(variants.size,32);
});
test('music scheduler stops scheduled voices on pause and resumes without backlog',()=>{
 const c=new Context(),m=new Music(c,c.destination);m.setActive(true);m.update();assert.ok(m.nodes.size>0);const nodes=[...m.nodes];m.setActive(false);assert.ok(nodes.every(n=>n.stopped));assert.equal(m.queue.length,0);c.currentTime=400;m.setActive(true);m.update();assert.ok(m.queue.every(e=>e.time>=400));
});
test('sound uses a noise channel, respects volume and mute, and creates one context',async()=>{
 globalThis.window={AudioContext:Context};const s=new Sound();await s.unlock();const context=s.context;await s.unlock();assert.equal(s.context,context);s.running=true;s.regs[24]=15;s.regs[4]=128;s.volumes[0]=1;s.update();assert.equal(s.voices[0].tone.gain.value,0);assert.ok(s.voices[0].noiseGain.gain.value>0);assert.ok(s.music.active);s.regs[4]=64;s.update();assert.ok(s.voices[0].tone.gain.value>0);assert.equal(s.voices[0].noiseGain.gain.value,0);s.effectsVolume=0;s.musicEnabled=false;s.update();assert.equal(s.effects.gain.value,0);assert.equal(s.music.active,false);s.enabled=false;s.update();assert.equal(s.master.gain.value,0);delete globalThis.window;
});
