import * as THREE from 'three';
import { BoatKit } from './boat-model.js';
const {Color,DataTexture,FloatType,RGBAFormat,NearestFilter,Scene,OrthographicCamera,BufferGeometry,Float32BufferAttribute,ShaderMaterial,HalfFloatType,LinearFilter,WebGLRenderTarget,Mesh}=THREE;
const {clamp,lerp}=THREE.MathUtils;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export function createIntegratedBoat(){
  const boat=new THREE.Group();const kit=BoatKit.build();boat.add(kit.root);boat.userData.kit=kit;boat.visible=false;return boat;
}
export function createSeaBoatRuntime(options){
  const {renderer,scene,camera,boat,U}=options;
  let inland=false,seaFactor=1,storm=0,mode='Chase',throttle=0,lastX=Infinity,lastZ=Infinity,hasSailed=false,idleTime=0,helmRudder=0,leverLatch=0;
  const touch=matchMedia('(pointer:coarse)').matches;
  const P=new Proxy(options.P,{get(target,key){if(key==='hs')return lerp(.05,target.hs,seaFactor);return target[key];}});
  const original=options.waterUniforms;
  const WU={...original,uWake:{value:null},uWi:{value:new THREE.Vector3(0,0,240)},uWN:original.uWN,uWk:{value:1},
    uBLp:original.uBLp,uBLd:original.uBLd,uBLk:original.uBLk};
  const WS={get dir(){return Math.atan2(U.uWD.value.y,U.uWD.value.x)*180/Math.PI;}};
const {Group,Vector3,Euler,Quaternion}=THREE,tmpC=new Color();
const KIT=boat.userData.kit,hullG=KIT.root,shell=[];Object.assign(boat,{heading:1.92,speed:0,power:0});   // real hull from the boat modules; bow (-Z) faces into the wind sea
const sunL=new THREE.DirectionalLight(0xffffff,2),hemi=new THREE.HemisphereLight(0xa8c8ee,0x20404e,.6);scene.add(sunL,hemi);
function boatLight(){KIT.uni.uNight.value=U.uNight.value;const day=U.uDay.value,L=U.uLight.value,c=U.uSunCol.value,m=Math.max(c.r,c.g,c.b,.01);
 sunL.position.copy(day>.1?U.uSun.value:U.uMoon.value).multiplyScalar(60);sunL.color.copy(c).multiplyScalar(1/m).lerp(tmpC.setRGB(.6,.7,1),1-day);
 sunL.intensity=2.8*day*(1-.55*storm)+.4*U.uNight.value;hemi.intensity=.12+.9*L}

/* --- GPU wave probe: samples the 3 FFT cascades at the hull's 8 buoyancy points (inverting the choppy horizontal shift), async read-back --- */
const NP=8,probeRT=new THREE.WebGLRenderTarget(NP,1,{type:FloatType,format:RGBAFormat,minFilter:NearestFilter,magFilter:NearestFilter,depthBuffer:false});
const probeU={uD0:WU.uD0,uD1:WU.uD1,uD2:WU.uD2,uLS:WU.uLS,uP:{value:Array.from({length:NP},()=>new THREE.Vector2())}};
const pScene=new Scene(),pCam=new OrthographicCamera(-1,1,1,-1,0,1),pGeo=new BufferGeometry();pGeo.setAttribute('position',new Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
const pMesh=new THREE.Mesh(pGeo,new ShaderMaterial({uniforms:probeU,depthTest:false,depthWrite:false,side:THREE.DoubleSide,vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`uniform sampler2D uD0,uD1,uD2;uniform vec3 uLS;uniform vec2 uP[${NP}];
void main(){vec2 P=uP[int(gl_FragCoord.x)],s=P;vec3 d=vec3(0.);
 for(int i=0;i<4;i++){d=textureLod(uD0,s/uLS.x,0.).xyz+textureLod(uD1,s/uLS.y,0.).xyz+textureLod(uD2,s/uLS.z,0.).xyz;s=P-d.xz;}   // surface point = grid + displacement
 gl_FragColor=vec4(d.y,d.x,d.z,1.);}`}));
pMesh.frustumCulled=false;pScene.add(pMesh);
const pbuf=new Float32Array(NP*4),pd=new Float32Array(NP*4);let pend=false,pvalid=false,pmode='async',pframes=0,fresh=false,sT=0,psT=0;
function probe(pts,t){
  if(seaFactor<.02){for(let i=0;i<NP;i++){pd[i*4]=options.getField().waterAt(pts[i][0],pts[i][1]).level;pd[i*4+3]=1;}pvalid=true;fresh=true;sT=t;return;}
 pts.forEach((p,i)=>probeU.uP.value[i].set(p[0],p[1]));pframes++;
 const prev=renderer.getRenderTarget();renderer.setRenderTarget(probeRT);renderer.render(pScene,pCam);renderer.setRenderTarget(prev);
 const got=d=>{if(d&&d.length>=NP*4&&d[3]===1&&d[7]===1){pd.set(d.subarray?d.subarray(0,NP*4):d);pvalid=true}};
 if(pmode==='sync'){renderer.readRenderTargetPixels(probeRT,0,0,NP,1,pbuf);got(pbuf);fresh=pvalid;sT=t;return}
 if(pframes>150&&!pvalid)pmode='sync';
 if(pend)return;
 pend=true;try{const r=renderer.readRenderTargetPixelsAsync(probeRT,0,0,NP,1,pbuf);Promise.resolve(r).then(a=>{pend=false;got(a&&a.length?a:pbuf);if(pvalid){fresh=true;sT=t}}).catch(()=>{pend=false;pmode='sync'})}catch(e){pend=false;pmode='sync'}}
const analytic=(x,z,t)=>{const a=WS.dir*Math.PI/180,q=x*Math.cos(a)+z*Math.sin(a);return P.hs*.3*(Math.sin(.16*q-1.25*t)+.5*Math.sin(.35*q-1.85*t+1))};   // last-resort fallback

/* --- rigid-body buoyancy (ported from sea-storm): 8 points push up with depth, damped against the water's own vertical speed --- */
const BP=[[0,-3,.05],[-.75,-1.8,.13],[.75,-1.8,.13],[-1.1,.2,.19],[1.1,.2,.19],[-1,2.2,.13],[1,2.2,.13],[0,3,.05]],NB=8,G0=9.81,DR=.7,KH=G0/DR,CD=4,IP=6.8,IR=2.25,PHV=.95,
 TUNE={noise:.42,kick:1.1,tau:.12,cap:3,heave:0.9,roll:0,pitch:.8,lean:0,vmax:5,lead:0.9,fall:1.3,rise:.3,drag:0.3,slamDrag:2.5,floor:.15,floorK:40,deck:.5,deckK:8};   // sea-state difficulty knobs (window.sea.TUNE)
const FRE=[1.6,1.25,1.25,1.1,1.1,1,1,1],ZP=[],HH=new Float32Array(NB),WV=new Float32Array(NB),HF=new Float32Array(NB),WF=new Float32Array(NB);let zcg=0,KP=0,KR=0,slamCD=0,yaw=0,thrLever=0;
BP.forEach(b=>zcg+=b[1]*b[2]);BP.forEach((b,i)=>{ZP[i]=b[1]-zcg;KP+=b[2]*ZP[i]**2;KR+=b[2]*b[0]**2});KP*=KH;KR*=KH;
const S={y:0,vy:0,p:0,vp:0,r:0,vr:0,init:false},ST={evt:0,wash:0,cap:0,capT:0,capH:0,bal:0,roll:0,pitch:0,sev:0,hit:3,slam:0,flip:true,lean:0,bowW:1,midW:1,sternW:1,sprayE:0,hcd:0},keys=new Set();
const rightBoat=()=>{if(ST.cap===1||ST.cap===-1){ST.cap=2;ST.capT=0}};
function floatStep(dt,t){
 const VM=4+9*ST.sev;   // vertical-speed limits grow with the sea: the hull can climb steep faces
 const h=boat.heading,ch=Math.cos(h),sh=Math.sin(h),p=boat.position,speed=boat.speed,pts=BP.map(b=>[p.x+b[0]*ch+b[1]*sh,p.z-b[0]*sh+b[1]*ch]);
 probe(pts,t);if(!pvalid&&pframes<150)return;                       // wait for the first GPU sample
 if(pvalid){if(fresh){fresh=false;const d=sT-psT;for(let i=0;i<NB;i++){const wi=options.getField().waterAt(pts[i][0],pts[i][1]);const gate=sstep(.4,16.,wi.depth)*seaFactor;const H=lerp(wi.level,pd[i*4]*sstep(.4,16.,wi.depth),gate);if(S.init&&d>1e-3)WV[i]+=(clamp((H-HH[i])/d,-VM,VM)-WV[i])*Math.min(1,d*7);HH[i]=H}psT=sT}}
 else for(let i=0;i<NB;i++){const H=analytic(pts[i][0],pts[i][1],t);WV[i]+=(clamp((H-HH[i])/dt,-VM,VM)-WV[i])*(1-Math.exp(-dt*7));HH[i]=H;sT=t}
 const LEAD=(TUNE.tau+.3*ST.sev)*TUNE.lead,age=Math.min(t-sT,.2),fa=1-Math.exp(-dt/(TUNE.tau+.3*ST.sev));let hm=0;   // low-pass the sampled water: the hull rides the swell, not the chop
 for(let i=0;i<NB;i++){const raw=HH[i]+WV[i]*age;HF[i]=S.init?HF[i]+(raw-HF[i])*fa:raw;WF[i]+=(WV[i]-WF[i])*fa;hm+=HF[i]*BP[i][2]}
 if(!S.init){S.y=hm;S.init=true;return}
 // sea severity -> roll forcing (the sea shakes the hull; steering is the counter), wave hits in rough water
 const sev=ST.sev=Math.max(clamp(P.hs/6,0,1),storm*.85),spN=Math.min(Math.abs(speed)/8,1),amp=sev*(.3+.7*spN),grp=.65+.35*Math.sin(t*.37+1.1);
 const nz=.55*Math.sin(t*1.85+.4)+.35*Math.sin(t*1.19+2.1)+.25*Math.sin(t*2.73+4),thd=TUNE.noise*amp*grp*nz;
 ST.hit-=dt;if(ST.hit<=0&&sev>.12&&!ST.pm){ST.pd=Math.random()<.5?-1:1;ST.pm=ST.pmT=(.35+.7*Math.random())*sev*(.3+.7*spN)*TUNE.kick;ST.pw=.3;ST.hit=(2.2+3.5*Math.random())/(.5+.5*sev)}   // wave hit: 0.55 s warning on the bar, then a 0.4 s push (not an instant jolt)
 if(ST.pm){if(ST.pw>0)ST.pw-=dt;else{const a=Math.min(ST.pm,ST.pmT*dt/.22);S.vr+=ST.pd*a;ST.pm-=a;if(ST.pm<1e-3)ST.pm=0}}
 const trim=.055*Math.tanh(speed/4)-.012*Math.tanh(Math.max(0,-boat.power)/2),ks=1-.35*sev,heel=clamp(.062*yaw*(1.5+Math.abs(speed))+TUNE.lean*ST.lean*(.4+.6*Math.min(1,Math.abs(speed)/3)),-.68,.68),trimT=KP*trim,heelT=KR*(heel+thd);
 const off2=TUNE.rise*sev-.05*Math.tanh(speed/5)-.5*clamp((Math.abs(S.r)-1)/1.6,0,1)+(ST.cap===2?.45*Math.sin(Math.PI*clamp(ST.capT/1.8,0,1)):0),n=Math.max(1,Math.ceil(dt/.008)),sd=dt/n;
 let wsh=0;
 for(let k=0;k<n;k++){
  const sp=Math.sin(S.p),cs=Math.cos(S.p),sr=Math.sin(S.r),tau=(k+1)*sd-dt;let fy=0,mp=0,mr=0;
  for(let b=0;b<NB;b++){const lx=BP[b][0],lz=ZP[b],w=BP[b][2],e=HF[b]+WF[b]*(tau+LEAD)-(S.y-off2+lx*sr*cs-lz*sp);   // e>0: point under water
   if(e<=-DR)continue;const xx=e/DR,rel=(S.vy+lx*S.vr-lz*S.vp)-WF[b],sub=clamp((e+.25*DR)/(.25*DR),0,1);
   let f=w*G0*Math.min(1+xx+(xx>0?.4*xx*xx:0),TUNE.cap)-w*CD*clamp(rel,-VM-1,VM+1)*sub*(1+.6*clamp(-rel/4,0,1));{const er=HH[b]+WV[b]*(age+tau)-(S.y+lx*sr*cs-lz*sp)-TUNE.deck*FRE[b];if(er>0){f+=w*G0*TUNE.deckK*er/DR-w*CD*clamp(rel,-VM,VM)*.6*clamp(er,0,1);wsh=Math.max(wsh,er)}}   // water reaching the gunwale pushes that corner of the hull up: it climbs the wave
   if(f<0)f=0;fy+=f;mp-=f*lz;mr+=f*lx}
  const air=clamp(1-fy/(.5*G0),0,1);const dfc=hm+TUNE.rise*sev-TUNE.floor-S.y;S.vy=clamp(S.vy+(fy-G0*(1+TUNE.fall*air)-TUNE.heave*S.vy+(dfc>0?TUNE.floorK*dfc-3*Math.min(S.vy,0)*Math.min(dfc,1):0))*sd,-TUNE.vmax*(1+1.6*sev),TUNE.vmax*(1+1.6*sev));S.vp+=((mp+trimT)/IP-TUNE.pitch*S.vp)*sd;
  if(ST.cap===0)S.vr+=(((mr*ks+heelT-S.vr)/IR)-(TUNE.roll+.4*sev)*S.vr)*sd;else if(ST.cap===2)S.vr+=((KR*1.05*(0-S.r)-8*S.vr)/IR)*sd;else S.vr+=((KR*Math.sin(ST.cap*Math.PI-S.r)-5.2*S.vr)/IR)*sd;
  S.vr=clamp(S.vr,-2.2,2.2);S.y+=S.vy*sd;S.p+=S.vp*sd;S.r+=S.vr*sd;if(S.p>.7||S.p<-.7){S.p=clamp(S.p,-.7,.7);S.vp*=.5}
  const rl=ST.cap===0?(ST.flip?1.3:.9):3.9;if(S.r>rl||S.r<-rl){S.r=clamp(S.r,-rl,rl);S.vr*=.3}}
 ST.wash=wsh;
 // capsize / recovery
 if(ST.flip){if(ST.cap===0){if(Math.abs(S.r)>PHV)ST.capH+=dt;else ST.capH=Math.max(0,ST.capH-dt*2);
   if(ST.capH>.1+.12*sev||Math.abs(S.r)>1.25){ST.cap=S.r>0?1:-1;ST.capT=0;ST.capH=0;ST.slam=1;S.vy-=.8;S.vp-=.35}}
  else if(ST.cap===2){ST.capT+=dt;if((ST.capT>1.4&&Math.abs(S.r)<.12&&Math.abs(S.vr)<.5)||ST.capT>4.5){ST.cap=0;if(ST.capT>4.5){S.r=0;S.vr=0}}}
  else{ST.capT+=dt;if(ST.capT>7){ST.cap=2;ST.capT=0}}}else ST.cap=0;
 ST.bal=clamp(S.r/PHV,-1.3,1.3);
 slamCD-=dt;const bowRel=S.vy+BP[0][0]*S.vr-ZP[0]*S.vp-WV[0];let slam=0;
 if(bowRel<-1.7&&slamCD<=0){slam=clamp((-bowRel-1.7)/3,0,1);if(slam>.08){slamCD=.4;S.vp-=slam*.3;ST.evt=slam}}
 ST.slam=Math.max(ST.slam*Math.exp(-dt*5),slam);
 {const sr=Math.sin(S.r),cs=Math.cos(S.r),sp=Math.sin(S.p),em=b=>HF[b]+WF[b]*LEAD-(S.y-off2+BP[b][0]*sr*cs-ZP[b]*sp),k=1-Math.exp(-dt*9);   // em > 0: that hull point is under water
  ST.bowW+=(sstep(-.3,.25,(em(0)*2+em(1)+em(2))/4)-ST.bowW)*k;ST.midW+=(sstep(-.3,.25,(em(3)+em(4))/2)-ST.midW)*k;ST.sternW+=(sstep(-.3,.25,(em(5)+em(6)+em(7))/3)-ST.sternW)*k;   // bow / waist / stern wetness 0..1
  const rise=clamp((-bowRel-.5)/3.5,0,1)*ST.bowW;   // water rushing up at the wetted bow = a wave hitting it
  ST.sprayE=Math.max(ST.sprayE*Math.exp(-dt*2.4),rise,slam);   // spray energy: jumps on a hit or slam, then decays
  if((ST.hcd-=dt)<=0&&rise>.3&&!slam){ST.evt=Math.max(ST.evt,rise*.55);ST.hcd=.5}}
 if(!isFinite(S.y+S.vy+S.p+S.r)){Object.assign(S,{y:hm,vy:0,p:0,vp:0,r:0,vr:0});ST.cap=0}
 const wob=1+2*storm;ST.pitch=S.p+.003*wob*Math.sin(t*1.13)+.002*wob*Math.sin(t*2.3+1.7);ST.roll=S.r+.004*wob*Math.sin(t*.71+2)+.002*wob*Math.sin(t*1.9);
 p.y=S.y;boat.quaternion.setFromEuler(new Euler(ST.pitch,h,ST.roll,'YXZ'))}

const WN=touch?384:512,WW=240,WTX=WW/WN,WC=2.6;
const wkOpt={type:HalfFloatType,format:RGBAFormat,minFilter:LinearFilter,magFilter:LinearFilter,depthBuffer:false};
let wkA=new WebGLRenderTarget(WN,WN,wkOpt),wkB=new WebGLRenderTarget(WN,WN,wkOpt);
const V2=THREE.Vector2,wkMat=new ShaderMaterial({depthTest:false,depthWrite:false,vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',
 uniforms:{uPrev:{value:null},uShift:{value:new V2()},uBoat:{value:new V2()},uDir:{value:new V2(0,-1)},uCen:{value:new V2()},uN:{value:WN},uK:{value:.006},uVd:{value:.99},uHd:{value:.9995},uFd:{value:.99},uWW:{value:WW},uSev:{value:0},uHull:{value:new THREE.Vector4(8.2,2.9,0,0)},uImp:{value:Array.from({length:24},()=>new THREE.Vector3())},uNI:{value:0},uT:{value:0},uWet:{value:new THREE.Vector3(1,1,1)}},
 fragmentShader:`uniform sampler2D uPrev;uniform vec2 uShift,uBoat,uDir,uCen;uniform float uN,uK,uVd,uHd,uFd,uWW,uSev;uniform vec4 uHull;uniform vec3 uImp[24],uWet;uniform float uNI,uT;
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec4 S(vec2 p){return (p.x<0.||p.x>1.||p.y<0.||p.y>1.)?vec4(0.):texture(uPrev,p);}
void main(){
 vec2 uv=gl_FragCoord.xy/uN,px=vec2(1./uN),p0=uv+uShift;
 vec4 c=S(p0),l=S(p0-vec2(px.x,0.)),r=S(p0+vec2(px.x,0.)),d=S(p0-vec2(0.,px.y)),u=S(p0+vec2(0.,px.y));
 float v=(c.y+uK*(l.x+r.x+d.x+u.x-4.*c.x))*uVd;                      // wave equation: acceleration = c^2 * laplacian
 float h=(c.x+v)*uHd;
 float f=mix(c.z,.25*(l.z+r.z+d.z+u.z),.04)*uFd;                      // foam: spreads a little, fades slowly
 vec2 ed=abs(uv-.5);float edge=1.-smoothstep(.38,.5,max(ed.x,ed.y));v*=mix(.55,1.,edge);h*=mix(.85,1.,edge);   // absorb at the window edge
 vec2 wp=uCen+(uv-.5)*uWW,rel=wp-uBoat;
 float al=dot(rel,uDir),ac=dot(rel,vec2(-uDir.y,uDir.x)),L=uHull.x*.5,B=uHull.y*.5,spd=uHull.z,th=uHull.w;
 float e=length(vec2(al/L,ac/B)),sp01=smoothstep(.8,5.,spd);
 float body=1.-smoothstep(.65,1.1,e);                                  // hull footprint
 float hump=exp(-pow((al-L*.9)/(L*.4),2.)-pow(ac/(B*1.3),2.))*clamp(spd/5.,0.,1.3);   // water piled up ahead of the stem
 float sternF0=exp(-pow((al+L*.9)/(L*.45),2.)-pow(ac/(B*1.1),2.));
 float sh=exp(-pow((al-L*.55)/(L*.3),2.)-pow((abs(ac)-B*1.1)/(B*.45),2.))*clamp(spd/4.,0.,1.2);   // bow shoulder crest: the root of the diverging (Kelvin) arms
 float tgt=-.12*body*clamp(spd/3.,0.,1.)+.3*hump-.08*sternF0*clamp(spd/3.,0.,1.)+.2*sh;                       // hull trough
 h+=(tgt-h)*clamp(max(body*.5,max(hump,max(sh*.7,sternF0*.6))),0.,1.)*.5;
 h+=(hs(floor(wp*2.2)+floor(uT*14.))-.5)*.06*sternF0*clamp(th,0.,1.);   // churning prop-wash boil
 float side=smoothstep(.75,1.,e)*(1.-smoothstep(1.02,1.4,e))*(.35+.65*hs(floor(wp*3.)+floor(uT*8.)));
 float bowF=exp(-pow((al-L*.8)/(L*.35),2.)-pow(ac/(B*1.2),2.));
 float sternF=exp(-pow((al+L*1.05)/(L*.5),2.)-pow(ac/(B*.95),2.));   // prop wash behind the transom
 f=max(f,max(max(side*sp01*.35*uWet.y,bowF*sp01*(.3+.2*uSev)*uWet.x),sternF*clamp(th,0.,1.)*.6*uWet.z));
 for(int j=0;j<24;j++){if(float(j)>=uNI)break;vec2 dd=wp-uImp[j].xy;float g=exp(-dot(dd,dd)/.45);v-=uImp[j].z*g;f=max(f,g*.12);}   // falling droplets dent the surface and leave a speck of foam
 gl_FragColor=vec4(clamp(h,-.3,.35),clamp(v,-.12,.12),min(f,1.),1.);}`});
const wkScene=new Scene(),wkMesh=new Mesh(pGeo,wkMat);wkMesh.frustumCulled=false;wkScene.add(wkMesh);
let wcx=0,wcz=0,wkReady=false;
function wakeStep(dt){
 const dx=(pd[3*4+1]+pd[4*4+1])*.5,dz=(pd[3*4+2]+pd[4*4+2])*.5;           // choppy shift at the hull: boat position in sea-grid space
 const gx=boat.position.x-(isFinite(dx)?dx:0),gz=boat.position.z-(isFinite(dz)?dz:0);
 const nx=Math.round(gx/WTX)*WTX,nz=Math.round(gz/WTX)*WTX,u=wkMat.uniforms,prev=renderer.getRenderTarget();
 if(!wkReady){wcx=nx;wcz=nz;wkReady=true;const cc=new Color(),ca=renderer.getClearAlpha();renderer.getClearColor(cc);renderer.setClearColor(0x000000,0);for(const t of [wkA,wkB]){renderer.setRenderTarget(t);renderer.clear()}renderer.setClearColor(cc,ca)}
 const nSub=Math.min(3,Math.max(1,Math.ceil(dt/.02))),sd=dt/nSub,spd=Math.abs(boat.speed),th=ST.cap?0:Math.min(Math.abs(boat.power)/10,1);
 u.uK.value=Math.pow(clamp(spd*.34,1.4,3.4)*sd/WTX,2);u.uVd.value=Math.exp(-sd*.7);u.uHd.value=Math.exp(-sd*.2);u.uFd.value=Math.exp(-sd/3.2);WU.uWk.value=.55/(1+.12*Math.max(P.hs-2,0));   // wake dents shrink in big seasu.uT.value+=dt;   // wave speed tracks boat speed: the V stays at the Kelvin angle (~19.5 deg)
 for(let j=0;j<nImp;j++)u.uImp.value[j].set(impB[j*3]-(isFinite(dx)?dx:0),impB[j*3+1]-(isFinite(dz)?dz:0),impB[j*3+2]);u.uSev.value=ST.sev;
 u.uBoat.value.set(gx,gz);u.uWet.value.set(ST.bowW,ST.midW,ST.sternW);u.uDir.value.set(-Math.sin(boat.heading),-Math.cos(boat.heading));u.uHull.value.set(8.2,2.9,spd,th);u.uCen.value.set(nx,nz);
 for(let k=0;k<nSub;k++){
  u.uNI.value=k?0:nImp;u.uShift.value.set(k?0:(nx-wcx)/WW,k?0:(nz-wcz)/WW);u.uPrev.value=wkA.texture;
  renderer.setRenderTarget(wkB);renderer.render(wkScene,pCam);[wkA,wkB]=[wkB,wkA]}
 renderer.setRenderTarget(prev);wcx=nx;wcz=nz;nImp=0;
 WU.uWake.value=wkA.texture;WU.uWi.value.set(nx,nz,WW);WU.uWN.value=WN}
WU.uWake.value=wkA.texture;WU.uWN.value=WN;

/* --- spray: real droplets. Each is a tiny ballistic streak (stretched along its velocity), thrown as a thin bow sheet, side froth, slam crowns, deck wash and a prop rooster-tail.
   Falling drops hit the sea: they vanish, dent the wake field (ripple rings) and leave a speck of foam. --- */
const SPN=3200,sPos=new Float32Array(SPN*3),sVel=new Float32Array(SPN*3),sLife=new Float32Array(SPN),sMax=new Float32Array(SPN),sSz=new Float32Array(SPN),sInfo=new Float32Array(SPN*2);
const sGeo=new THREE.InstancedBufferGeometry(),iPosA=new THREE.InstancedBufferAttribute(sPos,3).setUsage(THREE.DynamicDrawUsage),iVelA=new THREE.InstancedBufferAttribute(sVel,3).setUsage(THREE.DynamicDrawUsage),iInfoA=new THREE.InstancedBufferAttribute(sInfo,2).setUsage(THREE.DynamicDrawUsage);
sGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-.5,0,0,.5,0,0,-.5,1,0,.5,1,0]),3));sGeo.setIndex([0,1,2,2,1,3]);
sGeo.setAttribute('iPos',iPosA);sGeo.setAttribute('iVel',iVelA);sGeo.setAttribute('iInfo',iInfoA);sGeo.instanceCount=SPN;
const sMat=new ShaderMaterial({uniforms:{uPx:U.uPx,uLight:U.uLight},transparent:true,depthWrite:false,side:THREE.DoubleSide,
 vertexShader:`attribute vec3 iPos,iVel;attribute vec2 iInfo;uniform float uPx;varying vec2 vUv;varying float vA;
void main(){
 vA=iInfo.x;if(vA<.01){gl_Position=vec4(2.,2.,2.,1.);return;}
 vec4 a=viewMatrix*vec4(iPos,1.),b=viewMatrix*vec4(iPos-iVel*.04,1.);float dep=max(-a.z,.3);   // streak = 40 ms of travel
 vec3 dv=b.xyz-a.xyz;vec3 sd=length(dv)>1e-4?normalize(cross(dv,a.xyz)):vec3(1.,0.,0.);
 float w=max(iInfo.y*2.,dep*uPx*1.3);                                // at least ~1.3 px wide
 gl_Position=pr