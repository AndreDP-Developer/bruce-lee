import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash}from 'node:crypto';import{Game}from '../src/game.js';import{Sound,SidOutput}from '../src/audio.js';
const sound=new Sound();let blocks=[];sound.enqueue=block=>blocks.push(block);const game=new Game(fs.readFileSync(new URL('../public/data/start.json',import.meta.url),'utf8'),{audio:sound.attach});
function capture(frames,input){blocks=[];for(let f=0;f<frames;f++)game.step(input);const data=Float32Array.from(blocks.flatMap(b=>Array.from(b)));const rms=Math.sqrt(data.reduce((s,v)=>s+v*v,0)/data.length);assert.ok(rms>.0001,`Audible PCM expected, RMS=${rms}`);assert.ok(data.every(Number.isFinite));assert.ok(data.every(v=>Math.abs(v)<=1));return createHash('sha256').update(new Uint8Array(data.buffer)).digest('hex');}
test('native running, punching, collection and damage generate distinct audible sample streams',()=>{
 const hashes=[];game.reset();hashes.push(capture(120,{right:true}));game.reset();hashes.push(capture(120,{attack:true}));
 game.reset();const l=game.lanterns()[0];for(const [a,v]of [[0x9e,l.col*4+12],[0xa1,l.row*16+12],[0xb6,3],[0xbf,0],[0xce,0]])game.write(a,v);hashes.push(capture(40,{}));assert.equal(game.read(l.address),0);
 game.reset();hashes.push(capture(950,{}));assert.ok(game.player.health<36||game.lives<5);assert.equal(new Set(hashes).size,4);
});
test('pulse width and noise pitch alter the generated effect instead of sharing a generic tone',()=>{
 function render(control,freq,width){const s=new SidOutput();s.volumes[0]=1;s.regs[24]=15;s.regs[4]=control;s.regs[0]=freq&255;s.regs[1]=freq>>8;s.regs[2]=width&255;s.regs[3]=width>>8;return Array.from({length:1000},()=>s.sample());}
 assert.notDeepEqual(render(64,5000,512),render(64,5000,2048));assert.notDeepEqual(render(128,2000,0),render(128,10000,0));
 const s=new SidOutput();for(let i=0;i<19656;i++)s.tick();assert.equal(s.take().length,882);assert.equal(s.take().length,0);
});
import {BackgroundTrack} from '../src/music.js';
test('supplied music pauses, resumes and mutes independently of native effects',()=>{
 const media={volume:0,currentTime:37,play(){this.plays=(this.plays||0)+1;return Promise.resolve();},pause(){this.pauses=(this.pauses||0)+1;}};
 const track=new BackgroundTrack('music.mp3',()=>media);track.unlock();assert.equal(media.loop,true);track.update(true,.12);assert.equal(media.volume,.12);assert.equal(media.plays,1);track.update(true,.12);assert.equal(media.plays,1);track.update(false,.12);assert.equal(media.pauses,1);assert.equal(media.currentTime,37);track.update(true,.12);assert.equal(media.plays,2);track.update(true,0);assert.equal(media.pauses,2);
});
