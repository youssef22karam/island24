(mix(N,normalize(vec3(outward.x,.62,outward.y)),edge*.75));
 float nvr=dot(N,V);if(nvr<.01)N=normalize(N-V*min(nvr,0.));
 float nv=clamp(dot(N,V),.015,1.);
 // Fresnel reflection: slightly boosted on still glassy lakes and dark swamp mirrors
 float fBase=mix(.0204,.038,freshMix*(.65*lakeW+.85*swampish));
 float F=fBase+(1.-fBase)*pow(1.-nv,5.);
 // a film a few millimetres thick is no optical flat: its mirror breaks into patches
 F*=mix(1.,.45+.55*smoothstep(.25,.75,sn(vUV*2.3+vec2(3.7,1.9))),thinFilm*.85);
 float rough=uRough*.6+.025+distanceToEye*.000025+(.03*simFar+.035*(1.-rip1*.5-rip2*.5))*ripAmt;
 // Glassy lakes and still swamps have very low roughness so trees and peaks reflect crisply
 float roughF=.006+distanceToEye*.00001+.038*smoothstep(.35,1.,(.1+.9*gust)*uWindAmt)*(1.-swampish*.85)*smoothstep(.08,.4,pixel)+.035*uRain+.018*fspd*smoothstep(.1,.5,pixel);
 rough=mix(rough,roughF,freshMix);
 vec3 reflected=reflectedWorld(N,V,0.);
 float overcast=smoothstep(.25,.85,uStorm);
 vec3 sparkle=specular(uSun,N,V,rough)*uSunCol*(1.-.88*overcast)*smoothstep(0.,.06,uSun.y)*(1.-swampish*.55);
 sparkle+=specular(uMoon,N,V,rough)*vec3(.10,.13,.2)*uNight;

 // ---- body colour:
 //      \u2022 Open lakes: bright turquoise shallow littoral rim -> clear blue-teal -> deep dark teal
 //      \u2022 Rivers: sediment shallows -> olive green-brown -> deep river channel
 //      \u2022 Swamps: olive/tea bank shallows -> dark tannin-brown / nearly black in deep pockets (Ref C & D)
 float surfMurk=clamp(murk,0.,1.)*mask;
 float path=min(column,45.)/max(nv,.19);
 float extinction=.12+.6*pow(1.-uClar,2.);
 float absorption=0.;
 vec3 seaBody=mix(vec3(.07,.6,.7),uBody,smoothstep(1.6,24.,depth));
 seaBody=mix(seaBody,vec3(.28,.8,.8),smoothstep(2.6,.4,depth)*.42);
 seaBody=mix(seaBody,vec3(.46,.55,.44),surfMurk*.55);

 // 1) Lake colour: bright turquoise littoral rim fading into clear blue-teal then deep basin teal
 float shallowRim=1.-smoothstep(.35,3.2,depth);
 vec3 lakeCol=mix(vec3(.042,.225,.255),vec3(.011,.058,.085),smoothstep(2.4,16.,depth));
 lakeCol=mix(lakeCol,vec3(.17,.54,.52),shallowRim*.72);

 // 2) River/estuary mouth colour: matching refined emerald-jade running water with sunlit sandy rims
 vec3 riverCol=mix(vec3(.062,.245,.202),vec3(.020,.095,.092),smoothstep(1.6,9.5,depth));
 riverCol=mix(riverCol,vec3(.24,.38,.27),(1.-smoothstep(.15,1.7,depth))*.58);

 // 3) Swamp colour: warm luminous amber-tea edge fading into dark velvety olive-obsidian depth
 vec3 swampCol=mix(vec3(.11,.135,.058),vec3(.010,.018,.010),smoothstep(.24,1.8,depth));

 vec3 freshBody=lakeCol*lakeW+riverCol*riverW+swampCol*swampish;
 float normW=max(lakeW+riverW+swampish,1e-4);
 freshBody/=normW;
 // Soft sediment-coloured shoreline rim right at the water edge (0..0.45 m)
 float shoreSed=(1.-smoothstep(.04,.48,column))*inl;
 freshBody=mix(freshBody,mix(vec3(.22,.21,.13),vec3(.11,.095,.055),swampish),shoreSed*.42);

 float silt=clamp(uRain*.75+uStorm*.3,0.,.85);
 freshBody=mix(freshBody,vec3(.26,.205,.14),silt);
 // Balanced optical clarity linking the estuary seamlessly into the crystal inland water and kelp bed
 float extLake=mix(.12,.21,smoothstep(2.0,10.,depth));
 float extRiver=.21;
 float extSwamp=mix(.74,1.35,smoothstep(.28,1.5,depth));
 float extF=((extLake*lakeW+extRiver*riverW+extSwamp*swampish)/normW)*(1.+1.8*silt);

 // the plume: gradual river-to-sea brackish mixing zone with swirling jade-turquoise front
 vec3 brackishTint=mix(seaBody,freshBody*1.28+vec3(.012,.052,.042),smoothstep(.05,.72,freshMix));
 seaBody=mix(seaBody,mix(brackishTint,freshBody,smoothstep(.25,.92,inl)),freshMix);
 extinction=mix(extinction,extF,freshMix);
 absorption=max(1.-exp(-path*extinction),surfMurk*.5);
 vec3 body=seaBody*uLight*mix(1.,.5,uStorm);
 vec3 color=reflected*F+sparkle+body*(1.-F)*absorption;
 float alpha=F+(1.-F)*absorption;
  #ifdef WATER_REFRACTION
  if(uRefractionActive>.5&&freshMix>.5){
   vec2 bend=N.xz*min(column,3.)*.32*smoothstep(.05,.5,column);
   vec4 q=uRefractionMatrix*vec4(vP.x+bend.x,0.,vP.z+bend.y,1.);
   vec2 ruv=q.xy/max(q.w,.001);
   float valid=step(.005,ruv.x)*step(.005,ruv.y)*step(ruv.x,.995)*step(ruv.y,.995)*step(0.,q.w);
   vec3 through=texture2D(uRefraction,clamp(ruv,.005,.995)).rgb;
   color+=through*(1.-alpha)*valid;
   alpha=mix(alpha,1.,valid);
  }
  #endif
 // sunlight through steep, thin wave faces just before they break
 float spd=length(vel);vec2 dir=vel/max(spd,1e-3);
 float back=pow(max(dot(-V,uSun)*.5+.5,0.),3.);
 float waveFace=smoothstep(.1,.45,-dot(gradE,dir))*smoothstep(.4,1.6,column)*wS;
 color+=vec3(.03,.32,.27)*waveFace*(.25+1.2*back)*(uSunCol*.45+hzSoft()*.3*uLight)*(1.-F);
 // the sheet's own shadow line where it meets the sand
 color*=1.-.18*edge*smoothstep(.005,.02,column);

 // ---- foam: simulated density -> coverage. Near: advected lace / roller.
 //      Far: the footprint spans many bubbles, so draw the mean coverage.
 float coverage=0.,relief=.5;
 if(mask>0.){
  float dens=clamp(foamD,0.,1.2);
  float farCov=clamp(dens*.6,0.,.78)*smoothstep(.03,.14,dens);
  float structDetail=1.-smoothstep(.35,1.6,pixel);
  float nearCov=0.;
  if(structDetail>.001){
   float rel;
   float structure=foamStructure(vUV,vel*.9,rel)+(sn(vUV*.045+3.1)-.5)*.16;
   float aa=clamp(.085+pixel*.22,.085,.4);
   float d2=pow(clamp(dens,0.,1.),1.5)*.88;
   float residual=smoothstep(1.-d2-aa,1.-d2+aa,structure)*smoothstep(.06,.2,d2);
   float roller=smoothstep(.15,.7,rho)*smoothstep(.2,.5,structure+.35*rho);
   // soft (never dotted) wet rim on the advancing swash tongue
   float rim=(1.-smoothstep(.012,.05,column))*smoothstep(.005,.014,column)*smoothstep(.4,1.3,spd)*step(-1.5,bed);
   nearCov=max(max(residual*.94,roller*.9),rim*smoothstep(.35,.75,structure)*.5);
   // the uprush tongue: a bright, ragged lip of bubbles riding the leading edge
   vec2 outS=-gradH/max(length(gradH),1e-4);
   float onshore=smoothstep(.1,.55,dot(vel,outS));
   float lipBand=smoothstep(.003,.008,column)*(1.-smoothstep(.018,.055,column));
   float lace=smoothstep(.42,.68,structure+(sn(vUV*1.9+vec2(5.1,2.3))-.5)*.3);
   float lip=lipBand*onshore*lace*step(-1.5,bed);
   // translucent bubble veil beneath the lace: aerated water is milky, not paint
   float veil=smoothstep(.04,.5,dens)*(1.-residual)*.3;
   nearCov=max(nearCov,max(lip*.95,veil));
   relief=rel;
  }
  coverage=mix(farCov,nearCov,structDetail)*smoothstep(.006,.03,column)*mask;
 }
  float fftFoam=0.;
  if(fftWeight>.002){
   float turbulence=1.+(texture2D(uD0,vUV/uLS.x).a-1.)+.8*(texture2D(uD1,vUV/uLS.y).a-1.)+.4*(texture2D(uD2,vUV/uLS.z).a-1.);
   fftFoam=clamp((uFoam.x-turbulence)*2.,0.,1.)*fftWeight;
  }
  // ---- running water: gentle flow streaks, riffles, and soft shoreline foam;
  //      swamp & slow-water zones: patchy floating carpet (duckweed, water lettuce,
  //      lily-pad clusters) broken into clumps and open dark channels with contact darkening.
 float freshFoam=0.,floatMat=0.,floatShadow=0.,lettuce=0.,lilyClump=0.;
 if(freshMix>.01){
  vec4 ph=flowPhases(flow);
  vec2 qa=vUV+ph.xy,qb=vUV-flow*ph.w*1.6+vec2(11.,3.);
  float fd=1.-smoothstep(.3,1.4,pixel);
  vec2 fdir=flow/max(fspd,1e-4),fnrm=vec2(-fdir.y,fdir.x);
  // Flow-aligned coordinates for subtle longitudinal river streaks
  vec2 sa=vec2(dot(qa,fdir)*.32,dot(qa,fnrm)*1.85),sb=vec2(dot(qb,fdir)*.32,dot(qb,fnrm)*1.85);
  float fa=sn(sa)*.62+sn(qa*2.1)*.38,fb=sn(sb)*.62+sn(qb*2.1)*.38;
  float fn=mix(.5,fa*ph.z+fb*(1.-ph.z),fd);
  float riff=smoothstep(.26,.9,fspd)*(1.-smoothstep(.22,.9,column));
  freshFoam=smoothstep(.68-.28*riff,.84-.18*riff,fn)*riff*.88;
  // Subtle flow streaks along river current
  float streak=smoothstep(.12,.48,fspd)*smoothstep(.64,.82,fn)*.32;
  color+=mix(vec3(.04,.07,.05),vec3(.12,.16,.14),lakeW)*streak*uLight*inl*(1.-swampish);
  float lanes=smoothstep(.22,.62,fspd)*smoothstep(.79,.87,fn)*.42;
  // Soft shoreline foam / wet-sand rim on lakes and rivers
  float shoreRim=(1.-smoothstep(.02,.24,column))*smoothstep(.006,.025,column)*(1.-swampish*.75);
  float bankLine=shoreRim*(.22+.38*smoothstep(.12,.5,fspd))*smoothstep(.48,.74,sn(vUV*.24-flow*uTime*.06));
  freshFoam=max(max(freshFoam,lanes),bankLine)*inl;

  // ---- Floating vegetation layer (Ref D & C): patchy duckweed, water lettuce & lily-pad clusters
  //      with domain-warped noise masks so the carpet breaks into clumps and open dark channels.
  float slowZone=(1.-smoothstep(.08,.26,fspd))*inl*(1.-smoothstep(.8,2.8,depth));
  float vegHab=clamp(swampish*1.18+slowZone*.42,0.,1.)*smoothstep(.02,.14,column)*(1.-silt*.65);
  if(vegHab>.01){
   vec2 wp=vUV+vec2(sn(vUV*.032+1.7)-.5,sn(vUV*.032+8.3)-.5)*16.+flow*uTime*.025;
   // Open dark channels cut through the floating mat
   float chanField=abs(sn(wp*.024+vec2(4.1,-2.3))-.5);
   float openChan=smoothstep(.045,.15,chanField)*(1.-smoothstep(.11,.24,fspd));
   // Multi-scale clump mask: large rafts + smaller detached clusters
   float macroClump=sn(wp*.052)*.58+sn(wp*.13+5.7)*.42;
   float microClump=mix(.55,sn(vUV*1.4)*.6+sn(vUV*4.2+2.1)*.4,1.-smoothstep(.15,.85,pixel));
   float carpetField=macroClump*openChan*(.72+.28*microClump);
   // Soft contact shadow / darkening halo slightly wider than the plant clumps
   floatShadow=smoothstep(.34,.52,carpetField)*vegHab;
   floatMat=smoothstep(.44,.58,carpetField)*vegHab*(.82+.18*smoothstep(.35,.7,microClump));
   lettuce=smoothstep(.54,.72,sn(wp*.29+9.1))*floatMat;
   lilyClump=smoothstep(.60,.76,sn(wp*.19-4.4))*(1.-lettuce*.7)*floatMat;
  }
 }
 vec2 boatWakeUV=(vUV-uSeaWakeBox.xy)/max(uSeaWakeBox.z,1.)+.5;
 float boatWakeEdge=1.-smoothstep(.38,.49,max(abs(boatWakeUV.x-.5),abs(boatWakeUV.y-.5)));
 float boatFoam=texture2D(uSeaWake,boatWakeUV).b*boatWakeEdge*(1.-inl);
 float foam=max(max(max(fftFoam,coverage),freshFoam),boatFoam*.8)*mix(.72,1.,detail);
 foam*=1.-smoothstep(3200.,11000.,distanceToEye);
 // foam is a rough, bright, slightly translucent layer lit by sun and sky only
 float wrap=clamp((dot(N,uSun)+.3)/1.3,0.,1.);
 vec3 foamLit=vec3(.88,.91,.92)*(hzSoft()*(.42+.16*N.y)*uLight+uSunCol*wrap*.55+vec3(.015,.02,.03)*uNight)*(.82+.18*relief);
 color=mix(color,foamLit,foam);alpha=mix(alpha,1.,foam);

 // Contact darkening under and around the floating aquatic plant clumps
 if(floatShadow>.002){
  color*=1.-.46*floatShadow*(1.-floatMat*.55);
 }
 if(floatMat>.002){
  float microF=1.-smoothstep(.08,.45,pixel);
  float texG=mix(.5,sn(vUV*2.6)*.6+sn(vUV*7.8)*.4,microF);
  // Warm sunlit yellow-green duckweed base, ribbed lime water-lettuce rosettes, and deep-green lily pads
  vec3 duckCol=mix(vec3(.20,.34,.065),vec3(.34,.47,.115),texG);
  vec3 letCol=mix(vec3(.26,.42,.10),vec3(.39,.52,.15),texG);
  vec3 padCol=mix(vec3(.11,.24,.048),vec3(.21,.34,.082),texG);
  vec3 matAlbedo=mix(duckCol,letCol,lettuce);
  matAlbedo=mix(matAlbedo,padCol,lilyClump);
  // Subtle normal relief on plant clusters so low sunlight catches clump edges
  vec3 pN=normalize(vec3((texG-.5)*.28,1.,(sn(vUV*2.6+4.1)-.5)*.28));
  float pSun=max(dot(pN,uSun),0.);
  vec3 matLit=matAlbedo*(hzSoft()*(.36+.14*pN.y)*uLight+uSunCol*pSun*.64+vec3(.01,.015,.02)*uNight);
  // Contact shadow rim at the edge of each clump
  matLit*=.76+.24*smoothstep(.05,.45,floatMat);
  color=mix(color,matLit,clamp(floatMat*.92,0.,1.));
  alpha=mix(alpha,1.,clamp(floatMat*.95,0.,1.));
 }

 float edgeAA=max(fwidth(column)*.7,.0008);
 // Soft shoreline transparency grading smoothly over the shallowest 4 cm
 float shoreline=smoothstep(.005,.028+edgeAA,column);
 color*=shoreline;alpha*=shoreline;
  // Subtle atmospheric wetland mist at dawn/twilight and in low swamp basins
  float mistWisp=.65+.35*sn(vUV*.014+vec2(uTime*.012,-uTime*.008));
  float dawnMist=(uTwi*.0032+uDay*.00045)*(1.-uNight)*swampish*mistWisp*exp(-max(cameraPosition.y,0.)*.065);
  float fog=1.-exp(-distanceToEye*(uFog+dawnMist));
 color=mix(color,horizon(),fog);alpha=mix(alpha,1.,fog);
 alpha*=1.-freshTakeover;
 gl_FragColor=vec4(color/max(alpha,.0001),alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 gl_FragColor.rgb*=gl_FragColor.a;
}`;
export { En, Rn };
