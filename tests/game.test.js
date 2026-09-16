import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Game,ROOMS} from '../src/game.js';

// The hardware modules are singletons: keep these integration checks sequential.
const game=new Game(fs.readFileSync(new URL('../public/data/start.json',import.meta.url),'utf8'));
function collect(l){
 for(const [address,value] of [[0x9e,l.col*4+12],[0xa1,l.row*16+12],[0xb6,3],[0xbf,0],[0xce,0],[0xd1,36],[0x95,1],[0x96,0],[0x97,0]])game.write(address,value);
 for(let f=0;f<16;f++)game.step();
 assert.equal(game.read(l.address),0,'Original collision routine must collect the lantern');
}

test('normal start, movement, first room transition, pause and restart',()=>{
 game.reset();game.start();assert.equal(game.lives,5);assert.equal(game.snapshot().singlePlayer,true);
 const x=game.player.x;for(let f=0;f<60;f++)game.step({right:true});assert.ok(game.player.x>x);
 for(let f=0;f<300&&game.room===0;f++)game.step({right:true});assert.equal(game.room,1);
 game.pause();assert.equal(game.state,'paused');game.resume();assert.equal(game.state,'playing');
 game.selectRoom(8);assert.equal(game.assisted,true);game.reset();assert.equal(game.assisted,false);assert.equal(game.room,0);assert.equal(game.score,0);
});

test('all 20 original rooms render distinct frames and run with input',()=>{
 const hashes=new Set();assert.equal(ROOMS.length,20);
 for(let id=0;id<20;id++){
  game.selectRoom(id);assert.equal(game.room,id);assert.equal(game.snapshot().singlePlayer,true);
  hashes.add(createHash('sha256').update(game.pixels).digest('hex'));
  assert.ok(game.pixels.some((v,i)=>i%4!==3&&v>0));
  for(let f=0;f<90;f++)game.step({right:f<30,jump:f>=30&&f<60,attack:f>=60});
  assert.ok(Number.isFinite(game.player.x));assert.ok(game.room>=0&&game.room<20);
 }
 assert.equal(hashes.size,20);
});

test('all 89 lanterns and the final switch respond to original collision logic',()=>{
 let total=0;
 for(let id=0;id<20;id++){
  game.selectRoom(id);const lanterns=game.lanterns();for(const l of lanterns){collect(l);total++;}
  assert.equal(game.remaining,0,`Room ${id+1} must have no remaining lanterns`);
 }
 assert.equal(total,90);
});

test('all 37 available native exit dispatches reach the configured room',()=>{
 let count=0;
 for(let id=0;id<18;id++){
  game.selectRoom(id);const types=new Set();
  for(let row=1;row<13;row++){const ptr=game.read(0x4338+row)|(game.read(0x434c+row)<<8);for(let col=0;col<40;col++){const c=game.read(ptr+col)&127;if(c>=2&&c<=5)types.add(c);}}
  for(const type of types){
   game.selectRoom(id);const expected=game.read(0x4b5e+(type-2)*20+id);
   // Boundary-contact fixture: execute the actual game exit/entry routines.
   game.write(0x51,0);game.write(0x9e,8);game.write(0x4f5d,1);
   game.jumpTo([0x2f3c,0x2f51,0x2f66,0x2f7b][type-2]);game.machine.cpu.getState().x=0;
   for(let f=0;f<20&&game.room===id;f++)game.step();
   assert.equal(game.room,expected,`Room ${id+1}, exit type ${type}`);count++;
  }
 }
 assert.equal(count,37);
});

test('final switch defeats the wizard and opens the treasure room',()=>{
 game.selectRoom(18);const l=game.lanterns()[0];collect(l);
 for(let f=0;f<700&&game.room!==19;f++)game.step({right:f>164});
 assert.equal(game.room,19);assert.equal(game.completed,true);assert.ok(game.score>=5000);
});

test('both computer enemies spawn and can damage Bruce',()=>{
 game.reset();game.start();let ninja=false,yamo=false,damaged=false;
 for(let f=0;f<950;f++){game.step();ninja||=!!game.read(0x97);yamo||=!!game.read(0x96);damaged||=game.player.health<36;}
 assert.ok(ninja);assert.ok(yamo);assert.ok(damaged);assert.equal(game.snapshot().singlePlayer,true);
});

test('practice validation and game-over UI state',()=>{
 assert.throws(()=>game.selectRoom(-1));assert.throws(()=>game.selectRoom(20));
 game.reset();game.start();game.write(0x28,255);game.step();assert.equal(game.state,'gameover');
 game.start();assert.equal(game.lives,5);assert.equal(game.state,'playing');
});

