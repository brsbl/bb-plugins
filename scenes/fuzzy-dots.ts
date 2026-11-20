import { param, type BuiltInScene } from "./param.js";

const SOURCE = `// Fuzzy Dots: twelve fuzzy little Dots with an unruly coat.

const vec3 FUZZ_WHITE=vec3(1.0,0.985,0.965);
const vec3 FUZZ_INK=vec3(0.055,0.062,0.080);


float fuzzyRoundedBox(vec2 q,vec2 halfSize,float r){
  vec2 b=abs(q)-halfSize;
  return length(max(b,0.0))+min(max(b.x,b.y),0.0)-r;
}
float fuzzyShape(vec2 q,float kind) {
  float angle=atan(q.y,q.x);
  if(kind<0.5)return length(q)-0.86-0.10*cos(6.0*angle+0.45); // cloud
  if(kind<1.5)return length(q*vec2(1.0,1.04))-0.90; // round puff
  if(kind<2.5)return fuzzyRoundedBox(q,vec2(0.65),0.22);
  if(kind<3.5)return length(vec2(q.x,max(abs(q.y)-0.24,0.0)))-0.70;
  if(kind<4.5){ // softly rounded upright triangle
    vec2 b=q;
    float r=0.67,k=1.7320508;
    b.x=abs(b.x)-r;
    b.y+=r/k;
    if(b.x+k*b.y>0.0)b=vec2(b.x-k*b.y,-k*b.x-b.y)*0.5;
    b.x-=clamp(b.x,-2.0*r,0.0);
    return -length(b)*sign(b.y)-0.16;
  }
  if(kind<5.5){ // lobed heart, including the notch and pointed lower half
    vec2 h=q*1.08+vec2(0.0,0.08);
    float a=dot(h,h)-0.82;
    float f=a*a*a-h.x*h.x*h.y*h.y*h.y;
    vec2 grad=vec2(6.0*h.x*a*a-2.0*h.x*h.y*h.y*h.y,
                   6.0*h.y*a*a-3.0*h.x*h.x*h.y*h.y);
    return clamp(f/max(0.35,length(grad)),-0.75,0.6);
  }
  if(kind<6.5){ // frog head with two separate eye bumps
    float body=length(q*vec2(1.0,1.28))-0.79;
    float bumps=min(length(q-vec2(-0.43,0.60)),length(q-vec2(0.43,0.60)))-0.29;
    return min(body,bumps);
  }
  if(kind<7.5)return abs(length(q)-0.62)-0.22; // ring with a real hole
  if(kind<8.5)return length(q)-0.75-0.14*cos(7.0*angle); // flower
  if(kind<9.5)return max(length(q)-0.88,0.76-length(q-vec2(0.37,0.13))); // crescent
  if(kind<10.5){ // rounded diamond
    vec2 b=mat2(0.7071,-0.7071,0.7071,0.7071)*q;
    return fuzzyRoundedBox(b,vec2(0.50),0.16);
  }
  // Peanut: two soft lobes and a visibly narrower waist.
  float a=length(q-vec2(-0.39,0.05))-0.54;
  float b=length(q-vec2(0.39,-0.05))-0.54;
  float h=clamp(0.5+0.5*(b-a)/0.20,0.0,1.0);
  return mix(b,a,h)-0.20*h*(1.0-h);
}

vec3 fuzzyNormal(vec2 q,float kind){
  float d=fuzzyShape(q,kind);
  vec2 g=vec2(fuzzyShape(q+vec2(0.006,0.0),kind)-d,
              fuzzyShape(q+vec2(0.0,0.006),kind)-d)/0.006;
  float depth=exp(min(d,-0.015)*3.4);
  float height=sqrt(max(0.02,1.0-depth));
  return normalize(vec3(g*depth*0.62/height,1.0));
}
vec3 fuzzyLight(vec2 q,vec3 dye,float kind) {
  vec3 n=fuzzyNormal(q,kind);
  vec3 keyDir=normalize(vec3(-0.55,0.75,1.0));
  float key=max(0.0,dot(n,keyDir));
  float fill=max(0.0,dot(n,normalize(vec3(0.7,-0.1,0.5))));
  float rim=pow(1.0-n.z,2.0)*smoothstep(-0.2,0.6,q.x+q.y);
  float softSpec=pow(max(0.0,dot(n,normalize(keyDir+vec3(0.0,0.0,1.0)))),18.0);
  return dye*(0.50+0.52*key*p_light+0.17*fill)
       +FUZZ_WHITE*(0.08*softSpec+0.13*rim)*p_light;
}

// Rounded, overlapping tufts with height-derived normals and dark crevices.
vec4 fuzzyTufts(vec2 q,float seed,float t){
  float cell=0.065;
  vec2 coord=q/cell+vec2(0.005*sin(t*0.4+seed),seed);
  vec2 grid=floor(coord);
  float height=0.0;
  vec2 slope=vec2(0.0);
  for(int j=-1;j<=1;j++){
    for(int i=-1;i<=1;i++){
      vec2 id=grid+vec2(float(i),float(j));
      float h=hash21(id+seed);
      vec2 center=id+vec2(0.18+0.64*h,0.18+0.64*hash21(id+27.7));
      vec2 r=coord-center;
      r.x+=0.20*r.y;
      float spread=3.4+1.8*h;
      float lump=(0.62+0.38*h)*exp(-dot(r,r)*spread);
      height+=lump;
      slope+=lump*(-2.0*spread)*vec2(r.x,r.y+0.20*r.x);
    }
  }
  return vec4(normalize(vec3(-slope*0.46,1.0)),clamp(height,0.0,1.0));
}
// Actual finite curling filaments, resampling the form's lighting at each root.
// Three fiber scales share the body's lighting; each strand adds cylindrical highlights.
vec4 fuzzyLayer(vec2 q,vec3 dye,vec3 formLight,float kind,float seed,float t,float cell,float curl) {
  vec2 grid=floor(q/cell);
  vec3 chosen=formLight*0.77;
  float best=100.0,coverage=0.0;
  float aa=max(0.003,0.65*length(fwidth(q))/cell);
  for(int j=-1;j<=1;j++){
    for(int i=-1;i<=1;i++){
      vec2 id=grid+vec2(float(i),float(j));
      float h=hash21(id+seed*21.3);
      vec2 root=(id+vec2(0.12+0.76*h,0.12+0.76*hash21(id+seed+17.1)))*cell;
      if(fuzzyShape(root,kind)>0.0)continue;
      float flow=-1.2+0.65*sin(root.x*3.1+root.y*4.8+seed);
      flow+=0.26*sin(t*0.45+root.y*5.0)+0.50*(h-0.5);
      vec2 dir=vec2(cos(flow),sin(flow));
      vec2 outward=normalize(root+vec2(0.0001));
      dir=normalize(mix(dir,outward,smoothstep(0.68,0.94,length(root))));
      vec2 rel=(q-root)/cell;
      vec3 rootColor=formLight*(0.83+0.25*h);
      for(int k=0;k<3;k++){
        float fk=float(k);
        float hk=hash21(id+vec2(fk*7.1,seed+43.8));
        float tilt=(hk-0.5)*0.65;
        vec2 tang=normalize(dir+vec2(-dir.y,dir.x)*tilt);
        vec2 side=vec2(-tang.y,tang.x);
        float along=dot(rel,tang)+fk*0.10;
        float len=0.85+0.60*hk+0.25*p_fuzz;
        float a=clamp(along,0.0,len);
        float bend=curl*((hk-0.5)*1.35*a*a+0.22*sin(a*6.4+hk*8.0));
        float crossFiber=dot(rel,side)-bend-(fk-1.0)*0.17;
        float end=along-a;
        float dist=length(vec2(crossFiber,end));
        float width=(0.013+0.014*hk)*(1.0-0.65*a/len);
        float mask=1.0-smoothstep(width,width+aa,dist);
        coverage=max(coverage,mask);
        if(dist<best){
          best=dist;
          float roundLight=sqrt(max(0.0,1.0-pow(clamp(crossFiber/max(width+aa,0.001),-1.0,1.0),2.0)));
          
          float sideCoord=clamp(crossFiber/max(width+aa*0.28,0.001),-1.0,1.0);
          vec3 cylinder=normalize(vec3(side*sideCoord,roundLight));
          vec3 lightDir=normalize(vec3(-0.55,0.75,1.0));
          float diffuse=max(0.0,dot(cylinder,lightDir));
          float highlight=pow(max(0.0,dot(cylinder,normalize(lightDir+vec3(0.0,0.0,1.0)))),22.0);
          float tip=0.85+0.15*a/len;
          chosen=rootColor*(0.70+0.42*diffuse)*tip;
          chosen+=FUZZ_WHITE*(0.075*highlight+0.018*roundLight)*p_light;
          chosen+=dye*0.045*(1.0-diffuse);
        }
      }
    }
  }
  return vec4(chosen,coverage);
}
vec4 fuzzyCoat(vec2 q,vec3 dye,float kind,float seed,float t){
  vec3 formLight=fuzzyLight(q,dye,kind);
  float fineCell=0.011;
  vec4 fine=fuzzyLayer(q,dye,formLight,kind,seed,t,fineCell,0.75);
  float cell=0.028+0.017*p_fuzz;
  vec4 loose=fuzzyLayer(q,dye,formLight,kind,seed+71.2,t*0.8,cell,1.15);
  vec4 shag=fuzzyLayer(q,dye,formLight,kind,seed+103.8,t*0.65,0.065+0.035*p_fuzz,0.80);


  vec4 tufts=fuzzyTufts(q,seed,t);
  vec3 formNormal=fuzzyNormal(q,kind);
  vec3 pileNormal=normalize(vec3(formNormal.xy+tufts.xy*0.68,formNormal.z*tufts.z));
  vec3 keyDir=normalize(vec3(-0.55,0.75,1.0));
  float pileLight=max(0.0,dot(pileNormal,keyDir));
  float crevice=mix(0.85,1.0,smoothstep(0.15,0.82,tufts.w));
  float softSpec=pow(max(0.0,dot(pileNormal,normalize(keyDir+vec3(0.0,0.0,1.0)))),16.0);
  vec3 base=dye*(0.52+0.55*pileLight*p_light)*crevice;
  base+=FUZZ_WHITE*0.038*softSpec*p_light;
  vec3 col=mix(base,fine.rgb*crevice,fine.a*0.55);
  col=mix(col,loose.rgb*(0.88+0.12*tufts.w),loose.a*0.72);
  col=mix(col,shag.rgb,shag.a*0.84);
  return vec4(col,max(shag.a,max(fine.a,loose.a)));
}
vec3 fuzzyEye(vec3 col,vec2 q,vec2 center,float blink){
  vec2 e=(q-center)/vec2(0.070,0.105*blink);
  float d=length(e);
  float mask=1.0-smoothstep(0.95,1.05,d);
  float h=sqrt(max(0.0,1.0-dot(e,e)));
  vec3 c=FUZZ_INK*0.65+vec3(0.045)*pow(h,3.0);
  vec2 gl=(e-vec2(-0.30,0.42))*vec2(3.5,4.0);
  c+=FUZZ_WHITE*0.90*exp(-dot(gl,gl));
  return mix(col,c,mask);
}
vec3 fuzzyBuddy(vec3 background,vec2 q,vec3 dye,float kind,float seed,float t,float waiting,float ruffle,bool accessory){
  if(abs(q.x)>1.52||abs(q.y)>1.65)return background;
  float zoom=0.65*exp(log(80.0/0.65)*clamp((p_size-0.65)/79.35,0.0,1.0));
  float life=0.8*clamp(p_drift,0.0,1.8)*(1.0-smoothstep(2.0,8.0,zoom));
  // Each pose has its own phase and rhythm; the macro coat stays steady.
  float breath=sin(t*(0.58+0.07*hash21(vec2(seed,4.1)))+seed*2.6);
  float tilt=0.022*life*sin(t*(0.25+0.04*hash21(vec2(seed,9.2)))+seed*1.8);
  q.y-=0.014*life*sin(t*0.43+seed*3.7);
  q=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*q;
  q/=vec2(1.0-0.010*life*breath,1.0+0.021*life*breath);
  q.x+=0.012*life*sin(t*0.6+seed)*q.y+0.009*ruffle*sin(q.y*6.0-t);
  float d=fuzzyShape(q,kind);
  float edge=max(0.002,0.65*length(fwidth(q)));
  vec3 col=background;
  if(d<0.30){
    vec4 coat=fuzzyCoat(q,dye,kind,seed,t);
    float mask=1.0-smoothstep(-edge,edge,d);
    mask=max(mask,coat.a*0.95*(1.0-smoothstep(0.13,0.28,d)));
    mask*=1.0-smoothstep(1.38,1.52,abs(q.x));
    mask*=1.0-smoothstep(1.49,1.65,abs(q.y));
    vec3 body=coat.rgb;
    body+=FUZZ_WHITE*waiting*0.07*(0.5+0.5*sin(t*1.7+seed));
    float blinkPeriod=6.5+3.7*hash21(vec2(seed,16.4));
    float blinkClock=mod(t+seed*7.3,blinkPeriod);
    float blink=1.0-0.94*min(1.0,p_drift)*exp(-pow((blinkClock-blinkPeriod+0.60)/0.085,2.0));
    float glance=sin(t*0.29+seed*1.9);
    float curiosity=sign(glance)*smoothstep(0.50,0.94,abs(glance));
    vec2 look=life*vec2(0.058*curiosity,0.022*sin(t*0.21+seed));
    look+=vec2(0.006*sin(t*0.47+seed),0.0)*min(1.0,p_drift);

    vec2 eyeA=vec2(-0.25,0.24),eyeB=vec2(0.25,0.24);
    if(kind>5.5&&kind<6.5){
      eyeA=vec2(-0.43,0.60); eyeB=vec2(0.43,0.60);
      float whiteEyes=max(1.0-smoothstep(0.15,0.18,length(q-eyeA)),
                         1.0-smoothstep(0.15,0.18,length(q-eyeB)));
      body=mix(body,FUZZ_WHITE,whiteEyes);
    }
    if(kind>6.5&&kind<7.5){eyeA=vec2(-0.23,0.56);eyeB=vec2(0.23,0.56);}
    if(kind>8.5&&kind<9.5){eyeA=vec2(-0.59,0.32);eyeB=vec2(-0.61,-0.04);}
    body=fuzzyEye(body,q,eyeA+look,blink);
    body=fuzzyEye(body,q,eyeB+look,blink);
    if(accessory&&((kind>1.5&&kind<2.5)||(kind>3.5&&kind<4.5))){
      // Alfred's round glasses, also available on the squircle.
      float g1=abs(length((q-vec2(-0.25,0.24))/vec2(0.15,0.16))-1.0)*0.15;
      float g2=abs(length((q-vec2(0.25,0.24))/vec2(0.15,0.16))-1.0)*0.15;
      float bridge=max(abs(q.y-0.26)-0.012,abs(q.x)-0.10);
      float gd=min(min(g1,g2)-0.012,bridge);
      body=mix(body,FUZZ_INK*1.4,1.0-smoothstep(-edge,edge,gd));
    }
    col=mix(col,body,mask);
  }
  if(accessory&&kind<0.5){
    // Periwinkle cloud keeps its fuzzy black beret.
    vec2 h=q-vec2(-0.025,0.87);
    h=mat2(0.992,-0.126,0.126,0.992)*h;
    vec2 b=h/vec2(0.75,0.27);
    float hd=pow(pow(abs(b.x),3.0)+pow(abs(b.y),3.0),1.0/3.0)-1.0;
    float cap=1.0-smoothstep(-edge,edge+0.025,hd);
    vec3 hc=FUZZ_INK*(0.65+0.55*smoothstep(-0.25,0.23,h.y-h.x));
    hc*=0.90+0.15*noise(h*vec2(140.0,60.0));
    col=mix(col,hc,cap);
  }
  if(accessory&&kind>0.5&&kind<1.5){
    // A cream headband distinguishes the peach round puff.
    float band=max(abs(q.y-0.66)-0.047,abs(q.x)-0.68);
    float bm=1.0-smoothstep(-edge,edge,band);
    col=mix(col,FUZZ_WHITE*0.96,bm);
  }

  if(accessory&&kind>4.5&&kind<5.5){
    // Iggy-inspired padded headphones: crown arc and two glossy ear cups.
    vec2 h=q-vec2(0.0,0.12);
    float arc=abs(length(h/vec2(0.91,0.94))-1.0)*0.90;
    float am=(1.0-smoothstep(0.024,0.04,arc))*smoothstep(0.1,0.18,h.y);
    col=mix(col,FUZZ_INK,am);
    for(int k=0;k<2;k++){
      vec2 e=q-vec2(k==0?-0.84:0.84,0.10);
      float cup=length(e/vec2(0.12,0.24));
      vec3 c=FUZZ_INK*(0.65+0.4*smoothstep(-0.10,0.10,-e.x+e.y));
      col=mix(col,c,1.0-smoothstep(0.94,1.04,cup));
    }
  }
  if(accessory&&((kind>3.5&&kind<4.5)||(kind>5.5&&kind<6.5))){
    // Bow tie for the scholar triangle and frog.
    vec2 b=q-vec2(0.0,-0.54);
    float tie=max(abs(b.x)-0.22,abs(b.y)-0.045-0.40*abs(b.x));
    col=mix(col,FUZZ_INK,1.0-smoothstep(-edge,edge,tie));
  }
  return col;
}
vec2 fuzzyPosition(int i,float t){
  float fi=float(i);
  vec2 pos;
  if(i==0)pos=vec2(0.52,0.22);
  else if(i==1)pos=vec2(0.08,0.33);
  else if(i==2)pos=vec2(0.91,0.35);
  else if(i==3)pos=vec2(0.75,0.79);
  else if(i==4)pos=vec2(0.28,0.77);
  else if(i==5)pos=vec2(0.15,0.08);
  else if(i==6)pos=vec2(0.88,0.07);
  else if(i==7)pos=vec2(0.52,0.57);
  else if(i==8)pos=vec2(0.10,0.62);
  else if(i==9)pos=vec2(0.90,0.66);
  else if(i==10)pos=vec2(0.53,0.87);
  else pos=vec2(0.71,0.30);
  pos+=vec2(0.014*sin(t*(0.14+fi*0.013)+fi*1.7),0.010*cos(t*(0.18+fi*0.015)+fi*2.1));
  return toP(pos);
}
float fuzzyRadius(int i){
  if(i==0)return 0.145;
  if(i==1||i==2)return 0.115;
  if(i==3||i==4)return 0.079;
  if(i==5||i==6)return 0.132;
  return 0.093;
}
vec3 scene(vec2 uv,vec2 p){
  float t=u_time*p_drift;
  float zoom=0.65*exp(log(80.0/0.65)*clamp((p_size-0.65)/79.35,0.0,1.0));
  // Continuous camera zoom into the blue cloud's belly: the face leaves
  // the frame geometrically, so at high zoom the real coat fills the screen.
  vec2 focus=fuzzyPosition(0,t)+vec2(-0.12,-0.37)*fuzzyRadius(0);
  vec2 world=p/zoom+focus*(1.0-0.65/zoom);
  float mist=0.5+0.5*sin(p.x*2.0+t*0.07)*cos(p.y*2.7-t*0.10);
  vec3 col=mix(vec3(0.965,0.945,0.915),vec3(0.91,0.945,0.99),mist);
  float done=0.0,err=0.0,ruffle=0.0;
  for(int i=0;i<12;i++){
    if(i>=u_rippleCount)break;
    vec4 r=u_ripples[i];
    float dist=length(p-toP(r.xy));
    float wave=exp(-pow((dist-r.z*0.25)*11.0,2.0))*exp(-r.z*0.7);
    ruffle+=wave;
    if(abs(r.w-1.0)<0.5)err+=wave;else done+=wave;
  }
  vec2 dp=p-toP(u_pointer);
  float touch=exp(-dot(dp,dp)/0.035);
  // Draw the nearest cloud last, so zoom keeps one continuous physical surface.
  for(int k=0;k<12;k++){
    int i=k==11?0:k+1;
    if(float(i)>=p_crowd)continue;
    float fi=float(i);
    vec2 center=fuzzyPosition(i,t);
    float radius=fuzzyRadius(i);
    vec2 q=(world-center)/radius;

    vec3 dye=u_palette[i%4];
    if(i==4)dye=mix(u_palette[1],vec3(1.0,0.82,0.24),0.67);
    if(i==5)dye=mix(u_palette[3],vec3(1.0,0.48,0.67),0.67);
    if(i==6)dye=mix(u_palette[2],vec3(0.70,0.91,0.24),0.62);
    dye=mix(dye,vec3(0.94,0.34,0.40),clamp(err*0.40,0.0,0.5));
    if(abs(q.x)<1.8&&abs(q.y)<1.8){
      float sd=fuzzyShape(q-vec2(0.075,-0.115),fi);
      float shade=exp(-max(0.0,sd)*max(0.0,sd)*24.0);
      col*=1.0-shade*0.14;
    }
    col=fuzzyBuddy(col,q,dye,fi,fi*1.31+0.6,t,0.0,ruffle+touch,i<7);
  }
  for(int i=0;i<16;i++){
    if(i>=u_agentCount||zoom>=12.0)break;
    vec4 a=u_agents[i];
    a.w*=1.0-smoothstep(4.0,12.0,zoom);
    float fi=float(i);
    vec2 center=toP(a.xy)+vec2(0.010*sin(t*0.5+fi),0.012*cos(t*0.6+fi));
    vec2 q=(world-center)/(0.077*max(a.w,0.001));
    vec3 dye=mix(u_palette[i%4],FUZZ_WHITE,0.08);
    dye=mix(dye,vec3(0.94,0.34,0.40),clamp(err*0.4,0.0,0.5));
    vec3 painted=fuzzyBuddy(col,q,dye,mod(fi*5.0+4.0,12.0),fi+31.2,t,step(0.5,a.z),ruffle+touch,false);
    col=mix(col,painted,a.w);
  }
  col=mix(col,FUZZ_WHITE,clamp(done*0.055,0.0,0.09));
  return mix(u_canvas,col,p_color);
}`;

export const fuzzyDots: BuiltInScene = {
  id: "fuzzy-dots",
  name: "Fuzzy Dots",
  source: SOURCE,
  palette: ["#9ac2fb","#f6b582","#92cbb0","#c3a0e1"],
  params: [
    param("size", "Zoom", 0.65, 80, 0.65),
    param("fuzz", "Fiber length", 0.2, 2, 0.2),
    param("drift", "Drift", 0, 3, 1),
    param("crowd", "Companions", 2, 12, 12, 1),
    param("light", "Soft light", 0.4, 1.6, 1.28),
    param("color", "Color strength", 0, 1, 0.97),
  ],
};

