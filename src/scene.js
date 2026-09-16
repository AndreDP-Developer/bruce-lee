import * as THREE from './vendor/three.module.js';

function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function backdrop(id){
 const c=canvas(1280,704),g=c.getContext('2d'),outdoors=id<4;
 const colors=outdoors?['#101e30','#536371','#9d7860']:id<7?['#10152b','#242547','#3a344e']:id<10?['#1c111c','#522b2a','#8a4c37']:['#101723','#293646','#4f4751'];
 const sky=g.createLinearGradient(0,0,0,704);colors.forEach((v,i)=>sky.addColorStop(i/2,v));g.fillStyle=sky;g.fillRect(0,0,1280,704);
 if(outdoors){
  const glow=g.createRadialGradient(1040,150,10,1040,150,290);glow.addColorStop(0,'#f2d5a447');glow.addColorStop(1,'#f2d5a400');g.fillStyle=glow;g.fillRect(0,0,1280,600);g.fillStyle='#f3dcb3';g.beginPath();g.arc(1040,142,26,0,Math.PI*2);g.fill();
  for(let layer=0;layer<4;layer++){g.fillStyle=['#475765','#344651','#273c45','#20363c'][layer];g.beginPath();g.moveTo(0,704);for(let x=0;x<=1320;x+=24){const h=285+layer*76+Math.sin(x/109+id*1.1+layer)*63+Math.sin(x/41+layer)*25;g.lineTo(x,h);}g.lineTo(1280,704);g.closePath();g.fill();}
  // Distant temple roofs: scenery only, behind the original collision layer.
  g.fillStyle='#102329a8';for(let t=0;t<3;t++){const x=810+t*110,y=426-t*18;g.fillRect(x+20,y,44,180);for(let r=0;r<3;r++){g.beginPath();g.moveTo(x-14+r*7,y+45*r);g.quadraticCurveTo(x+25,y+8+45*r,x+42,y-18+45*r);g.quadraticCurveTo(x+59,y+8+45*r,x+98-r*7,y+45*r);g.closePath();g.fill();}}
  for(let x=24;x<1280;x+=157){g.strokeStyle='#122c2d90';g.lineWidth=7;g.beginPath();g.moveTo(x,704);g.quadraticCurveTo(x-32,590,x+13,470);g.stroke();for(let y=510;y<704;y+=31){g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x-45,y-30,x-62,y-15);g.moveTo(x,y);g.quadraticCurveTo(x+32,y-40,x+53,y-31);g.stroke();}}
 }else{
  // Recessed stone arches give the flat C64 chambers a little depth.
  g.lineWidth=12;g.strokeStyle='#a7b0be0c';g.fillStyle='#05091238';
  for(let x=90;x<1280;x+=208){g.beginPath();g.moveTo(x,704);g.lineTo(x,240);g.bezierCurveTo(x,115,x+128,115,x+128,240);g.lineTo(x+128,704);g.closePath();g.fill();g.stroke();}
  const glow=g.createRadialGradient(650,580,0,650,580,700);glow.addColorStop(0,id<10?'#e1a36220':'#aecde218');glow.addColorStop(1,'#00000000');g.fillStyle=glow;g.fillRect(0,0,1280,704);
 }
 const vignette=g.createRadialGradient(640,320,100,640,320,800);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#03060b88');g.fillStyle=vignette;g.fillRect(0,0,1280,704);
 return c;
}
function glowTexture(){const c=canvas(128,128),g=c.getContext('2d'),v=g.createRadialGradient(64,64,0,64,64,64);v.addColorStop(0,'#ffd998aa');v.addColorStop(.18,'#efb96144');v.addColorStop(1,'#efa15100');g.fillStyle=v;g.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
export class Scene{
 constructor(host){
  this.host=host;this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x090e16);this.renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','Bruce Lee game screen');
  this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(0,320,0,176,0.1,100);this.camera.position.z=10;
  this.background=new THREE.Mesh(new THREE.PlaneGeometry(320,176),new THREE.MeshBasicMaterial({depthWrite:false,side:THREE.DoubleSide}));this.background.position.set(160,88,-2);this.background.scale.y=-1;this.scene.add(this.background);
  this.data=new Uint8Array(320*176*4);this.texture=new THREE.DataTexture(this.data,320,176);this.texture.colorSpace=THREE.SRGBColorSpace;this.texture.magFilter=THREE.NearestFilter;this.texture.minFilter=THREE.NearestFilter;this.texture.needsUpdate=true;
  this.surface=new THREE.Mesh(new THREE.PlaneGeometry(320,176),new THREE.MeshBasicMaterial({map:this.texture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));this.surface.position.set(160,88,0);this.scene.add(this.surface);
  this.glow=glowTexture();this.lights=new THREE.Group();this.lights.position.z=-.2;this.scene.add(this.lights);
  const points=new Float32Array(60*3);for(let i=0;i<60;i++){points[i*3]=(i*127.31)%320;points[i*3+1]=(i*81.19)%176;points[i*3+2]=-.4;}
  this.dust=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(points,3)),new THREE.PointsMaterial({color:0xefcc8e,size:.42,transparent:true,opacity:.22,depthWrite:false}));this.scene.add(this.dust);
  this.room=-1;this.atmosphere=true;this.soft=false;this.revision=-1;this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();
 }
 resize(){const r=this.host.getBoundingClientRect();this.renderer.setSize(r.width,r.height,false);}
 settings({atmosphere,soft}){this.atmosphere=atmosphere;this.soft=soft;this.texture.magFilter=this.texture.minFilter=soft?THREE.LinearFilter:THREE.NearestFilter;this.texture.needsUpdate=true;this.revision=-1;}
 update(game,t,reduced=false){
  if(this.room!==game.room){this.room=game.room;this.background.material.map?.dispose();this.background.material.map=new THREE.CanvasTexture(backdrop(this.room));this.background.material.map.colorSpace=THREE.SRGBColorSpace;this.background.material.needsUpdate=true;this.lights.clear();this.lanterns=game.lanterns().map(l=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glow,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.position.set(l.x,l.y,0);s.scale.set(20,20,1);this.lights.add(s);return {...l,s};});}
  this.background.visible=this.atmosphere;this.dust.visible=this.atmosphere&&!reduced;this.lights.visible=this.atmosphere;
  if(game.revision!==this.revision){this.data.set(game.pixels);if(this.atmosphere){
   for(let i=0;i<this.data.length;i+=4){const r=this.data[i],g=this.data[i+1],b=this.data[i+2];let alpha=255;
    if(this.room<4){if(r===136&&g===136&&b===136)alpha=34;else if(r===136&&g===119&&b===221)alpha=20;else if(r===102&&g===102&&b===102)alpha=100;}
    else if(this.room<7){if(r===68&&g===51&&b===170)alpha=34;}
    else if(this.room<10){if(r===153&&g===102&&b===34)alpha=50;}
    else if(this.room<18){if(r===136&&g===136&&b===136||r===136&&g===119&&b===221||r===153&&g===85&&b===187)alpha=42;}
    this.data[i+3]=alpha;
   }
  }this.texture.needsUpdate=true;this.revision=game.revision;}
  for(const l of this.lanterns||[]){l.s.visible=!!game.read(l.address);l.s.material.opacity=reduced?.6:.52+Math.sin(t*2+l.x)*.1;}
  if(!reduced){const a=this.dust.geometry.attributes.position;for(let i=0;i<a.count;i++){a.setX(i,((i*127.31+t*1.2)%332)-6);a.setY(i,(i*81.19+Math.sin(t*.3+i)*5)%176);}a.needsUpdate=true;}
  this.renderer.render(this.scene,this.camera);
 }
}

