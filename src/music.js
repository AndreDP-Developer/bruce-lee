// User-supplied recording on an independent media channel. It never modifies
// the native game-effect samples or their gain.
export class BackgroundTrack {
 constructor(url,createAudio=url=>{const audio=new Audio(url);audio.id='background-music';audio.hidden=true;document.body.append(audio);return audio;}){this.url=url;this.createAudio=createAudio;this.audio=null;this.playing=false;this.blocked=false;}
 unlock(){if(!this.audio&&this.url){this.audio=this.createAudio(this.url);this.audio.loop=true;this.audio.preload='auto';this.audio.volume=.12;}this.blocked=false;}
 update(active,volume){if(!this.audio)return;this.audio.volume=Math.max(0,Math.min(1,volume));const wanted=active&&volume>0;
  if(!wanted){if(this.playing)this.audio.pause();this.playing=false;return;}
  if(this.playing||this.blocked)return;this.playing=true;const result=this.audio.play();result?.catch(()=>{this.playing=false;this.blocked=true;});
 }
}
