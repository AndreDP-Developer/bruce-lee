import {attach as wires} from './vendor/c64/target/wires.js';
import {attach as ram} from './vendor/c64/target/ram.js';
import {attach as vic} from './vendor/c64/target/vic.js';
import {attach as sid} from './vendor/c64/target/sid.js';
import {attach as cias} from './vendor/c64/target/cias.js';
import {attach as cpu} from './vendor/c64/target/cpu.js';
import {attach as tape} from './vendor/c64/target/tape.js';
import {bringup} from './vendor/c64/target/bringup.js';
// The game banks out all system ROMs. Boot from the verified single-player
// checkpoint instead of redistributing BASIC, KERNAL or a character ROM.
const basic=new Uint8Array(8192),kernal=new Uint8Array(8192),character=new Uint8Array(4096);
export function createMachine({pixel=()=>{},blit=()=>{},audio}={}){
 let joy1=()=>{},joy2=()=>{},keys=()=>{};
 const c64=bringup({target:{wires,ram,vic,sid,cias,cpu,tape,basic,kernal,character},host:{
  video(c){c.video={reset(){},setPixel:pixel,blit};},
  audio:audio||((c)=>{c.audio={reset(){},setVoiceVolume(){},onRegWrite(){}};}),
  joystick(c){c.joystick={setSetJoystick1(fn){joy1=fn;},setSetJoystick2(fn){joy2=fn;}};},
  keyboard(c){c.keyboard={setSetKeyMatrix(fn){keys=fn;}};}
 },attachments:[]});
 c64.frame=()=>{for(let j=0;j<19656;j++){c64.runloop.getState().cycle++;c64.cpu.tick();c64.vic.tick();c64.cias.tick();c64.sid.tick();c64.tape.tick();}};
 c64.joy=(bits,port=2)=>(port===1?joy1:joy2)((~bits)&255);
 c64.keys=keys;
 return c64;
}
