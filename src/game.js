import {createMachine} from './machine.js';
export const ROOMS=[
 ['The dragon courtyard','THE OUTER FORTRESS'],['The hidden passage','THE OUTER FORTRESS'],['The eastern guardian','THE OUTER FORTRESS'],['The white towers','THE OUTER FORTRESS'],
 ['The rising current','THE INNER CAVERNS'],['The violet descent','THE INNER CAVERNS'],['The lantern gallery','THE INNER CAVERNS'],['The scarlet halls','THE INNER CAVERNS'],['The three falls','THE INNER CAVERNS'],['The stair of embers','THE INNER CAVERNS'],
 ['The silver keep','THE HIGH FORTRESS'],['The three seals','THE HIGH FORTRESS'],['The first trial','THE WIZARD’S DOMAIN'],['The blue gauntlet','THE WIZARD’S DOMAIN'],['The second trial','THE WIZARD’S DOMAIN'],['The suspended shrine','THE WIZARD’S DOMAIN'],['The third trial','THE WIZARD’S DOMAIN'],['The electric chamber','THE WIZARD’S DOMAIN'],['The fire wizard','THE FINAL CHAMBER'],['The dragon’s treasure','THE FORTRESS IS YOURS']
];
export class Game{
 constructor(initial,{onFrame=()=>{},audio}={}){
  this.initial=initial;this.pixels=new Uint8Array(320*176*4);this.revision=0;this.onFrame=onFrame;
  this.machine=createMachine({audio,pixel:(x,y,r,g,b)=>{if(x<136||x>=456||y<75||y>=251)return;const i=((y-75)*320+x-136)*4;this.pixels[i]=r;this.pixels[i+1]=g;this.pixels[i+2]=b;this.pixels[i+3]=255;},blit:()=>{this.revision++;}});
  this.reset();
 }
 read(a){return this.machine.ram.readRam(a);}
 write(a,v){this.machine.ram.writeRam(a,v);}
 get room(){return Math.min(19,this.read(0x29));}
 get score(){return this.read(0x41)*65536+this.read(0x42)*256+this.read(0x43);}
 get lives(){const reserve=this.read(0x28);return reserve<128?reserve+1:0;}
 get remaining(){return this.room===13||this.room===19?0:this.read(0x2a+this.room);}
 get player(){return {x:this.read(0x9e)*2-24,y:this.read(0xa1)-25,health:this.read(0xd1),pose:this.read(0xbf)};}
 reset(){this.machine.runloop.deserialize(this.initial);this.machine.joy(0,1);this.machine.joy(0,2);this.state='title';this.assisted=false;this.invincible=false;this.frames=0;this.visited=new Set([0]);this.completed=false;this.machine.frame();this.onFrame();}
 start(){if(this.state==='gameover')this.reset();this.state='playing';}
 pause(){if(this.state==='playing')this.state='paused';this.clearInput();}
 resume(){if(this.state==='paused')this.state='playing';}
 clearInput(){this.machine.joy(0,1);this.machine.joy(0,2);}
 step(input={}){
  let bits=(input.up||input.jump?1:0)|(input.down?2:0)|(input.left?4:0)|(input.right?8:0)|(input.attack?16:0);
  this.machine.joy(bits,1);this.machine.joy(0,2);
  if(this.invincible){this.write(0xd1,36);this.write(0x28,4);}
  this.machine.frame();this.frames++;this.visited.add(this.room);
  if(this.room===19)this.completed=true;
  if(!this.lives&&this.state==='playing')this.state='gameover';
  this.onFrame();
 }
 // Developer room selection uses the original room-entry and draw routines.
 // It starts a fresh, visibly assisted session; normal play never calls this.
 selectRoom(id){if(!Number.isInteger(id)||id<0||id>19)throw Error('Room must be 0–19');this.reset();this.assisted=true;this.write(0x29,id);this.jumpTo(0x2fc5);for(let i=0;i<40;i++)this.machine.frame();this.visited=new Set([id]);this.state='paused';this.onFrame();}
 jumpTo(pc){const s=JSON.parse(this.machine.cpu.serialize());Object.assign(s,{pc,s:255,fdTick:'fd_fetch_T0',amTick:null,opFn:null,pendingInt:0,i:1});this.machine.cpu.deserialize(JSON.stringify(s));}
 lanterns(id=this.room){let a=this.read(0x4ce2+id*2)|(this.read(0x4ce3+id*2)<<8);const result=[];for(let n=0;n<40&&this.read(a)<128;n++,a+=4){const col=this.read(a+2),row=this.read(a+3);if(row>0)result.push({address:a,col,row,active:!!this.read(a),x:col*8+4,y:row*16-22});}return result;}
 hint(){if(this.completed)return 'The treasure is yours. Keep playing to begin a harder round.';if(this.room<3){const left=this.read(0x2a)+this.read(0x2b)+this.read(0x2c);return left?`Collect the lanterns across the three courtyards · ${left} remaining`:'The centre courtyard hatch is open. Return there and drop through.';}if(this.room===11)return 'Three passages. Clear each trial, then return to the seals.';if(this.room===18)return 'Dodge the wizard’s fire. Reach the switch at the far right.';return this.remaining?`Collect ${this.remaining} lantern${this.remaining===1?'':'s'} · watch for openings as you collect them`:'Look for an opening at the edge of the chamber.';}
 snapshot(){return {state:this.state,room:this.room+1,name:ROOMS[this.room][0],score:this.score,lives:this.lives,lanternsRemaining:this.remaining,player:this.player,assisted:this.assisted,completed:this.completed,frames:this.frames,visited:[...this.visited].map(i=>i+1),singlePlayer:this.read(0x42c9)===0&&this.read(0x42ca)===0};}
}
