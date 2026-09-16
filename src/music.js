// Original, evolving pentatonic score. Phrase variations are generated lazily,
// rather than replaying a short audio loop or downloading a soundtrack.
const SCALE=[0,2,4,7,9];
const MOTIFS=[[0,2,3,2,1,0],[2,3,4,2,1,2],[4,3,2,0,1,0],[0,1,3,4,3,2],[2,0,1,2,4,3],[3,2,0,1,0,2]];
export function phrase(index){
 let seed=(index+1)*16807;const random=()=>{seed=(seed*48271)%2147483647;return seed/2147483647;};
 const root=[50,55,57,50,52,55,57,50][Math.floor(index/4)%8];
 const motif=MOTIFS[index%MOTIFS.length],events=[];
 const note=degree=>root+SCALE[((degree%5)+5)%5]+12*Math.floor(degree/5);
 for(let bar=0;bar<8;bar++){
  const base=bar*4,offset=[0,3,4,0,2,3,4,0][bar];
  events.push({beat:base,midi:note(offset-5),duration:3.5,voice:'bell',level:.13,pan:-.18});
  // Open space between phrases keeps the accompaniment unobtrusive.
  for(let j=0;j<3;j++)if(random()>.2)events.push({beat:base+[0,1.5,2.5][j],midi:note(offset+[0,2,4][j]),duration:1.9,voice:'pluck',level:.18+random()*.08,pan:(random()-.5)*.7});
  if(bar!==3&&bar!==7){
   const degree=motif[(bar+index)%motif.length]+(index%3===2?1:0);
   events.push({beat:base+.5,midi:note(degree+5),duration:1.1+random()*.8,voice:'flute',level:.13,pan:.18});
   if(bar%2===0)events.push({beat:base+2.5,midi:note(degree+4),duration:1,voice:'flute',level:.1,pan:.18});
  }
 }
 return events.sort((a,b)=>a.beat-b.beat);
}

export class Music{
 constructor(context,destination){this.context=context;this.destination=destination;this.index=0;this.next=0;this.queue=[];this.active=false;this.nodes=new Set();
  this.delay=context.createDelay(1);this.delay.delayTime.value=.29;const wet=context.createGain();wet.gain.value=.14;this.delay.connect(wet);wet.connect(destination);
 }
 setActive(active){if(active===this.active)return;this.active=active;if(!active){for(const node of this.nodes){try{node.stop();}catch{}}this.nodes.clear();this.queue=[];}else this.next=this.context.currentTime+.05;}
 update(){if(!this.active)return;const now=this.context.currentTime;
  if(!this.queue.length){this.queue=phrase(this.index++).map(e=>({...e,time:this.next+e.beat*60/76}));this.next+=32*60/76;}
  while(this.queue.length&&this.queue[0].time<now+.15)this.play(this.queue.shift());
 }
 play(event){const c=this.context,t=Math.max(c.currentTime,event.time),d=event.duration*60/76,f=440*2**((event.midi-69)/12),gain=c.createGain(),pan=c.createStereoPanner();pan.pan.value=event.pan;gain.connect(pan);pan.connect(this.destination);pan.connect(this.delay);
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(event.level,t+(event.voice==='flute'?.12:.009));gain.gain.exponentialRampToValueAtTime(.0001,t+d);
  const frequencies=event.voice==='pluck'?[1,2,3]:event.voice==='bell'?[1,2.01]:[1,2];let remaining=frequencies.length;
  frequencies.forEach((partial,i)=>{const osc=c.createOscillator(),level=c.createGain();osc.type='sine';osc.frequency.setValueAtTime(f*partial,t);level.gain.value=i===0?.7:event.voice==='flute'?.055:.12/(i+1);osc.connect(level);level.connect(gain);osc.start(t);osc.stop(t+d+.03);this.nodes.add(osc);osc.onended=()=>{this.nodes.delete(osc);osc.disconnect();level.disconnect();if(!--remaining){gain.disconnect();pan.disconnect();}};});
 }
}
