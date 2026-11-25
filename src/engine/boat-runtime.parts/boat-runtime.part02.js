ojectionMatrix*vec4(mix(a.xyz,b.xyz,position.y)+sd*position.x*w,1.);
 vUv=vec2(position.x+.5,position.y);}`,
 fragmentShader:`varying vec2 vUv;varying float vA;uniform float uLight;
void main(){
 float x=abs(vUv.x*2.-1.),y=vUv.y;
 float side=1.-smoothstep(.4,1.,x);                                   // round across the width
 float head=smoothstep(0.,.12,y),tail=1.-smoothstep(.15,1.,y);       // blunt bright head, fading tail
 float a=side*head*tail*vA*.85;if(a<.02)discard;
 vec3 c=mix(vec3(.72,.84,.95),vec3(1.),smoothstep(.55,0.,y)*(1.-x*.6))*(.3+.7*uLight);   // bright glint on the head, bluish water on the tail
 gl_FragColor=vec4(c,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
const sPts=new THREE.Mesh(sGeo,sMat);sPts.frustumCulled=false;sPts.renderOrder=2;scene.add(sPts);
let sHead=0,sAcc=0,pAcc=0,wAcc=0,hAcc=0,seaY=0,nImp=0;const impB=new Float32Array(24*3),sv=new Vector3(),R=Math.random,dsz=(k=1)=>(.016+.06*R()*R()*R())*k;   // many tiny drops, a few fat ones
function spawn(lx,ly,lz,vr,vu,vf,life,size){   // local hull position; velocity as right/up/forward components
 const m=boat.matrixWorld.elements,i=sHead;sHead=(sHead+1)%SPN;sv.set(lx,ly,lz).applyMatrix4(boat.matrixWorld);
 sPos[i*3]=sv.x;sPos[i*3+1]=sv.y;sPos[i*3+2]=sv.z;
 sVel[i*3]=m[0]*vr+m[4]*vu-m[8]*vf;sVel[i*3+1]=m[1]*vr+m[5]*vu-m[9]*vf;sVel[i*3+2]=m[2]*vr+m[6]*vu-m[10]*vf;
 sLife[i]=sMax[i]=life;sSz[i]=size}
function sprayStep(dt){
 if(pvalid){let s=0;for(let i=0;i<NP;i++)s+=pd[i*4];seaY=s/NP}
 const spd=Math.abs(boat.speed),spN=Math.min(spd/8,1),sev=ST.sev,fw=boat.speed>0?1:0;
 const bw=ST.bowW,se=ST.sprayE,vq=Math.min(1,spN+.6*se);
 sAcc+=bw*(fw*(spd>1.5?1:0)*(70+260*sev)*spN*(.4+.6*Math.min(1,.4+se))+520*se)*dt;   // bow sheet: only while the bow is in the water; surges with each wave hit / slam
 while(sAcc>=1){sAcc--;const sd=R()<.5?-1:1,t=R();spawn(sd*(.1+.5*t),.12,-3.8+t*2.4,sd*(1.5+(3+4*vq)*R()*(1-.4*t)),1.2+(2.5+4*sev+2*vq+3*se)*R()*(1-.5*t),spd*(.15+.4*R()),.55+.7*R(),dsz(1+.6*sev+.5*se))}
 hAcc+=fw*(spd>1.5?1:0)*spd*12*ST.midW*dt;                                               // low froth flicked off the hull sides
 while(hAcc>=1){hAcc--;const sd=R()<.5?-1:1;spawn(sd*.55,.08,-2.4+4.4*R(),sd*(.5+1.8*R()),.8+1.8*R(),spd*.5*R(),.3+.35*R(),dsz(.8))}
 if(ST.evt>0){const n=Math.ceil((60+260*ST.evt)*ST.bowW);for(let k=0;k<n;k++){const sd=R()<.5?-1:1;spawn(sd*(.3+.5*R()),.2,-3.6+1.8*R(),sd*(1.5+6*R()*ST.evt),3+9*R()*ST.evt,spd*(.3+.5*R()),.8+1*R(),dsz(1.3))}ST.evt=0}   // slam: crown burst
 if(ST.wash>.05&&!ST.cap){wAcc+=Math.min(ST.wash,1.2)*120*dt;while(wAcc>=1){wAcc--;const sd=R()<.5?-1:1;spawn(sd*1.2,.35,-3+5*R(),sd*(1+2*R()),2+3*R(),spd*.2,.5+.5*R(),dsz(1.1))}}   // green water over the rail
 const th=ST.cap?0:Math.abs(boat.power)/10;if(th>.2){pAcc+=th*th*140*ST.sternW*dt;while(pAcc>=1){pAcc--;spawn((R()-.5)*.5,.1,3.9,(R()-.5)*2,2+4*R()*th,-(2+5*R()*th),.45+.5*R(),dsz())}}   // prop wash rooster tail
 for(let i=0;i<SPN;i++){
  if(sLife[i]>0){sLife[i]-=dt;sVel[i*3+1]-=9.8*dt;const dr=1-dt*.3;sVel[i*3]*=dr;sVel[i*3+2]*=dr;
   sPos[i*3]+=sVel[i*3]*dt;sPos[i*3+1]+=sVel[i*3+1]*dt;sPos[i*3+2]+=sVel[i*3+2]*dt;
   if(sVel[i*3+1]<0&&sPos[i*3+1]<seaY){   // splashdown
    if(nImp<24&&R()<.15){impB[nImp*3]=sPos[i*3];impB[nImp*3+1]=sPos[i*3+2];impB[nImp*3+2]=.003+sSz[i]*.06;nImp++}
    sLife[i]=0;sInfo[i*2]=0;sPos[i*3+1]=-9999;continue}
   const f=Math.max(0,sLife[i]/sMax[i]);sInfo[i*2]=f<.15?f/.15:1;sInfo[i*2+1]=sSz[i]}
  else{sInfo[i*2]=0;sPos[i*3+1]=-9999}}
 iPosA.needsUpdate=true;iVelA.needsUpdate=true;iInfoA.needsUpdate=true}

/* --- night lights: real lights on the hull (search lamp with a beam, two deck floods, nav lights, masthead, cabin glow, stern light) + a lit pool on the water --- */
const nlSpot=(col,I,dist,ang,pen,dec,pos,aim)=>{const l=new THREE.SpotLight(col,I,dist,ang,pen,dec),tg=new THREE.Object3D();l.position.set(...pos);tg.position.set(...aim);hullG.add(l,tg);l.target=tg;return l},
 nlPoint=(col,I,dist,dec,pos)=>{const l=new THREE.PointLight(col,I,dist,dec);l.position.set(...pos);hullG.add(l);return l};   // model space: bow is +Z, as the glowing lamp lenses
const nlSearch=nlSpot(0xfff1d6,90,90,.22,.5,1,[.42,2.62,1.2],[.42,1.2,30]),
 nlFA=nlSpot(0xfff1d6,22,16,.95,.6,1.4,[.55,2.28,-.81],[.6,.4,-3.2]),nlFB=nlSpot(0xfff1d6,22,16,.95,.6,1.4,[-.55,2.28,-.81],[-.6,.4,-3.2]),
 nlRed=nlPoint(0xff2a1a,3,7,2,[.4,3.45,-.5]),nlGrn=nlPoint(0x22ff66,3,7,2,[-.4,3.45,-.5]),nlMast=nlPoint(0xffffff,4,9,2,[0,3.75,-.5]),
 nlCab=nlPoint(0xffc27a,5,6,2,[0,1.9,.1]),nlStern=nlPoint(0xffffff,2,6,2,[0,1.7,-3.85]);
const nlBeamM=new ShaderMaterial({uniforms:{uK:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
 vertexShader:'varying float vT;varying float vE;void main(){vT=position.z/30.;vec3 n=normalize(normalMatrix*normal),v=normalize(-(modelViewMatrix*vec4(position,1.)).xyz);vE=pow(abs(dot(n,v)),1.4);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform float uK;varying float vT;varying float vE;void main(){float a=uK*.09*pow(clamp(1.-vT,0.,1.),1.3)*vE;gl_FragColor=vec4(vec3(1.,.95,.8)*a,a);}'});
const nlBeamG=new THREE.CylinderGeometry(2.6,.06,30,28,1,true);nlBeamG.rotateX(Math.PI/2);nlBeamG.translate(0,0,15);
const nlBeam=new THREE.Mesh(nlBeamG,nlBeamM);nlBeam.position.set(.42,2.62,1.2);nlBeam.rotation.x=.05;nlBeam.renderOrder=3;hullG.add(nlBeam);
const nlA=new Vector3(),nlB=new Vector3();
function nightLights(){
 const k=Math.min(1,U.uNight.value+.55*(1-U.uLight.value)),on=k>.03;   // night, dusk or a dark storm
 nlSearch.intensity=90*k;nlFA.intensity=nlFB.intensity=22*k;nlRed.intensity=nlGrn.intensity=3*k;nlMast.intensity=4*k;nlCab.intensity=5*k;nlStern.intensity=2*k;
 for(const l of [nlSearch,nlFA,nlFB,nlRed,nlGrn,nlMast,nlCab,nlStern])l.visible=on;
 nlBeam.visible=on;nlBeamM.uniforms.uK.value=k*(1+.5*U.uRain.value);   // beam shows more in rain / spray
 const bp=WU.uBLp.value,bd=WU.uBLd.value;
 nlSearch.getWorldPosition(nlA);nlSearch.target.getWorldPosition(nlB).sub(nlA).normalize();bp[0].set(nlA.x,nlA.y,nlA.z,22*k);bd[0].set(nlB.x,nlB.y,nlB.z,Math.cos(.24));
 nlFA.getWorldPosition(nlA);bp[1].set(nlA.x,nlA.y,nlA.z,7*k);bd[1].set(0,1,0,-2);
 nlMast.getWorldPosition(nlA);bp[2].set(nlA.x,nlA.y,nlA.z,2.5*k);bd[2].set(0,1,0,-2);
 WU.uBLk.value=on?1:0}


  const cp=new Vector3(),tp=new Vector3(),lk=new Vector3(),ee=new Euler();
  let cameraReady=false,realTime=0;
  function cameras(dt,t){
    const h=boat.heading,p=boat.position,hs=P.hs,fx=-Math.sin(h),fz=-Math.cos(h),rx=Math.cos(h),rz=-Math.sin(h);
    const active=mode==='Cinematic'?['Bow','Waterline','Drone'][Math.floor(t/12)%3]:mode;
    if(active==='Bridge'){
      hullG.localToWorld(tp.copy(KIT.eye));camera.position.copy(tp);
      const offset=options.getYaw()-externalState.heading;
      camera.quaternion.setFromEuler(ee.set(ST.pitch*.5+options.getPitch(),h-offset,ST.roll*.5,'YXZ'));
      return;
    }
    if(active==='Bow'){tp.set(p.x+fx*13+rx*5,p.y+2.3+.3*hs,p.z+fz*13+rz*5);lk.set(p.x,p.y+1.5,p.z);}
    else if(active==='Waterline'){tp.set(p.x+rx*(16+hs),p.y+1.4+.3*hs,p.z+rz*(16+hs));lk.set(p.x,p.y+1.2,p.z);}
    else if(active==='Drone'){tp.set(p.x-fx*24+rx*13,p.y+22+hs*1.4,p.z-fz*24+rz*13);lk.set(p.x+fx*10,p.y,p.z+fz*10);}
    else {const a=h+.38+(options.getYaw()-externalState.heading)*.65;tp.set(p.x+Math.sin(a)*23,p.y+7+hs*.65,p.z+Math.cos(a)*23);lk.set(p.x+fx*5,p.y+1.7,p.z+fz*5);}
    tp.y=Math.max(tp.y,options.getField().heightAt(tp.x,tp.z)+1.4,p.y+.8);
    if(!cameraReady){cp.copy(tp);cameraReady=true;}
    cp.lerp(tp,1-Math.exp(-dt*(mode==='Cinematic'?1.6:4.5)));
    camera.position.copy(cp);camera.lookAt(lk);
  }
  let externalState={heading:0};
  function update(dt,t,state){
    hasSailed=true;idleTime=0;sPts.visible=true;
    dt=Math.min(dt,.05);realTime=t;externalState=state;
    const field=options.getField();
    const inlVal=field.inlAt?field.inlAt(state.x,state.z):(field.isFreshAt(state.x,state.z)?1:0);
    seaFactor=1-sstep(.22,.88,inlVal);inland=seaFactor<.15;storm=U.uStorm.value*seaFactor;
    if(Math.hypot(state.x-lastX,state.z-lastZ)>50){boat.position.set(state.x,field.waterAt(state.x,state.z).level,state.z);boat.heading=-state.heading-Math.PI/2;S.init=false;cameraReady=false;boat.power=0;throttle=0;helmRudder=0;ST.cap=0;}
    keys.clear();
    for(const [code,value] of [['KeyW','up'],['ArrowUp','up'],['KeyS','down'],['ArrowDown','down'],['KeyA','left'],['ArrowLeft','left'],['KeyD','right'],['ArrowRight','right'],['Space','stop']])if(options.keys.has(code))keys.add(value);
    if(keys.has('stop'))throttle=0;
    const steering=ST.cap?0:(keys.has('left')?1:0)-(keys.has('right')?1:0);
    // Throttle lever: hold to speed up or slow down and it stays where you leave it.
    // Crossing neutral needs a fresh press, so braking to a stop never slips into reverse.
    const leverUp=keys.has('up')&&!keys.has('down'),leverDown=keys.has('down')&&!keys.has('up');
    if(ST.cap){throttle=0;leverLatch=0;}
    else if(leverUp){if(throttle<0){throttle=Math.min(0,throttle+7*dt);if(throttle===0)leverLatch=1;}else if(leverLatch!==1)throttle=Math.min(8,throttle+(throttle<3?4.4:3)*dt);}
    else if(leverDown){if(throttle>0){throttle=Math.max(0,throttle-6.5*dt);if(throttle===0)leverLatch=-1;}else if(leverLatch!==-1)throttle=Math.max(-3,throttle-2.6*dt);}
    else leverLatch=0;
    // The hull answers the lever with some weight: quick at first, easing into the new speed.
    const leverGap=throttle-boat.power;
    boat.power+=Math.sign(leverGap)*Math.min(Math.abs(leverGap),(.7+Math.abs(leverGap)*1.7)*dt);
    helmRudder+=(steering-helmRudder)*(1-Math.exp(-dt*6));
    const turn=helmRudder*1.1*Math.min(1,.1+Math.abs(boat.power)/3.6)*dt*(boat.power>=0?1:-1);
    boat.heading+=turn;yaw+=(turn/Math.max(dt,.001)-yaw)*(1-Math.exp(-dt*8));ST.lean+=(steering-ST.lean)*(1-Math.exp(-dt/.3));
    boat.speed=boat.power;
    const minDraft=.88;
    const dx=-Math.sin(boat.heading)*boat.speed*dt,dz=-Math.cos(boat.heading)*boat.speed*dt;
    const nx=boat.position.x+dx,nz=boat.position.z+dz;
    if(field.waterAt(nx,nz).depth>minDraft){
      boat.position.x=nx;boat.position.z=nz;
    }else{
      // Smooth bank-sliding along curved riverbanks, lake coves & narrow channels
      const okX=field.waterAt(nx,boat.position.z).depth>minDraft;
      const okZ=field.waterAt(boat.position.x,nz).depth>minDraft;
      if(okX){boat.position.x=nx;boat.power*=Math.exp(-dt*2.4);}
      else if(okZ){boat.position.z=nz;boat.power*=Math.exp(-dt*2.4);}
      else{
        // Gently nudge away from shallow bank toward deeper water
        const dP=field.waterAt(boat.position.x+2,boat.position.z).depth-field.waterAt(boat.position.x-2,boat.position.z).depth;
        const dQ=field.waterAt(boat.position.x,boat.position.z+2).depth-field.waterAt(boat.position.x,boat.position.z-2).depth;
        const gL=Math.hypot(dP,dQ);
        if(gL>.05){
          const px=boat.position.x+(dP/gL)*Math.min(Math.abs(boat.speed)*dt*.5,.45);
          const pz=boat.position.z+(dQ/gL)*Math.min(Math.abs(boat.speed)*dt*.5,.45);
          if(field.waterAt(px,pz).depth>minDraft){boat.position.x=px;boat.position.z=pz;}
        }
        boat.speed*=Math.exp(-dt*5);boat.power*=Math.exp(-dt*8);
      }
    }
    floatStep(dt,t);boat.updateMatrixWorld(true);KIT.animate(dt,boat.power,ST.lean);
    nightLights();wakeStep(dt);sprayStep(dt);boatLight();
    original.uSeaWake.value=wkA.texture;original.uSeaWakeBox.value.copy(WU.uWi.value);
    original.uSeaWakeStrength.value=WU.uWk.value;
    state.x=lastX=boat.position.x;state.z=lastZ=boat.position.z;state.heading=-boat.heading-Math.PI/2;state.speed=boat.speed;
    if(!options.getDrag()&&document.pointerLockElement!==options.el){const look=options.getYaw(),angle=((state.heading-look+Math.PI*3)%(Math.PI*2))-Math.PI;options.setYaw(look+angle*(1-Math.exp(-dt*1.4)));}
    options.onStats(Math.abs(boat.speed)*1.944,((state.heading*180/Math.PI+90)%360+360)%360);
    cameras(dt,t);
  }
  function idle(dt,t){
    if(!hasSailed)return;idleTime+=dt;
    const speed=boat.speed,power=boat.power;boat.speed=boat.power=0;
    ST.evt=0;ST.wash=0;ST.sprayE=0;wakeStep(Math.min(dt,.05));sprayStep(Math.min(dt,.05));
    boat.speed=speed;boat.power=power;
    original.uSeaWake.value=wkA.texture;original.uSeaWakeBox.value.copy(WU.uWi.value);original.uBLk.value=0;
    if(idleTime>25){hasSailed=false;sPts.visible=false;original.uSeaWakeStrength.value=0;}
  }
  return {update,idle,setCamera(value){mode=value;cameraReady=false;camera.fov=value==='Bridge'?75:58;camera.updateProjectionMatrix();},
    setThrottle(value){throttle=clamp(value,-3,8);},right:rightBoat,
    telemetry(){return {throttle,speed:boat.speed||0,power:boat.power||0,roll:ST.roll,pitch:ST.pitch,capsized:ST.cap!==0,camera:mode,time:realTime};},
    dispose(){for(const target of [probeRT,wkA,wkB])target.dispose();for(const mat of [pMesh.material,wkMat,sMat,nlBeamM])mat.dispose();pGeo.dispose();sGeo.dispose();nlBeamG.dispose();sunL.removeFromParent();hemi.removeFromParent();sPts.removeFromParent();}
  };
}
