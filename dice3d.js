/* WebGL solid d10 dice with simplified gravity, collision and friction.
   Result is read from settled top-facing geometry; not a full physics engine. */
const TAU=Math.PI*2;
const STYLES=`.d3stage{position:relative;height:275px;border:2px solid #6b523b;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse at 50% 80%,#65543c,#171a18 80%)}.d3canvas{width:100%;height:100%;display:block}.d3labels{position:absolute;inset:0;pointer-events:none}.d3face{position:absolute;transform:translate(-50%,-50%);color:#fff1d5;text-shadow:0 1px 3px #080808,0 0 5px #000;font:bold 17px Georgia,serif}.d3result{position:absolute;bottom:9px;left:0;right:0;text-align:center;color:#ffe8c1;font:600 13px Georgia,serif;text-shadow:0 2px 4px #000}`;
const vertices=Array.from({length:10},(_,i)=>[Math.cos(i*TAU/10),Math.sin(i*TAU/10),i%2===0?.38:-.38]);vertices.push([0,0,1.32],[0,0,-1.32]);
const faces=Array.from({length:10},(_,i)=>[i,(i+1)%10,(i+2)%10,i%2===0?10:11]);
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function sub(a,b){return a.map((v,i)=>v-b[i])}
function norm(v){const l=Math.hypot(...v)||1;return v.map(x=>x/l)}
function rotate(v,a){let[x,y,z]=v;let c=Math.cos(a[0]),s=Math.sin(a[0]);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(a[1]);s=Math.sin(a[1]);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(a[2]);s=Math.sin(a[2]);return[x*c-y*s,x*s+y*c,z]}
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
export function createDiceTable(host){
 if(!document.getElementById('d3-local-style')){const st=document.createElement('style');st.id='d3-local-style';st.textContent=STYLES;document.head.appendChild(st)}
 const stage=document.createElement('div');stage.className='d3stage';stage.setAttribute('aria-label','WebGL 입체 십면체 주사위 두 개');const canvas=document.createElement('canvas');canvas.className='d3canvas';stage.appendChild(canvas);const labels=document.createElement('div');labels.className='d3labels';stage.appendChild(labels);const status=document.createElement('div');status.className='d3result';status.textContent='물리 낙하·충돌 시뮬레이션 · 윗면으로 판정';stage.appendChild(status);host.appendChild(stage);
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true})||canvas.getContext('experimental-webgl');if(!gl){stage.remove();throw Error('WebGL is unavailable on this browser')}
 const vs=shader(gl,gl.VERTEX_SHADER,`attribute vec3 position;attribute vec3 normal;uniform mat4 transform;varying vec3 N;void main(){gl_Position=transform*vec4(position,1.0);N=normal;}`);
 const fs=shader(gl,gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 N;uniform vec3 color;void main(){float light=0.37+0.63*max(dot(normalize(N),normalize(vec3(-0.5,0.8,1.0))),0.0);gl_FragColor=vec4(color*light,1.0);}`);
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const position=gl.getAttribLocation(program,'position'),normalLoc=gl.getAttribLocation(program,'normal'),transform=gl.getUniformLocation(program,'transform'),color=gl.getUniformLocation(program,'color');
 const data=[];
 for(const face of faces){for(const tri of [[0,1,3],[1,2,3]]){let a=vertices[face[tri[0]]],b=vertices[face[tri[1]]],c=vertices[face[tri[2]]];let n=norm(cross(sub(b,a),sub(c,a)));const mid=a.map((_,i)=>(a[i]+b[i]+c[i])/3);if(n.reduce((sum,x,i)=>sum+x*mid[i],0)<0){[b,c]=[c,b];n=n.map(x=>-x)}for(const v of [a,b,c])data.push(...v,...n)}}
 const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(normalLoc);gl.vertexAttribPointer(normalLoc,3,gl.FLOAT,false,24,12);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
 const angles=[[.4,.5,.3],[-.3,.7,.1]],positions=[[-1.3,0,0],[1.3,0,0]];const labelSets=[['00','10','20','30','40','50','60','70','80','90'],['0','1','2','3','4','5','6','7','8','9']];let disposed=false,rolling=false,raf=0,resolveRoll=null;
 const elements=labelSets.map(set=>set.map(t=>{const el=document.createElement('span');el.className='d3face';el.textContent=t;labels.appendChild(el);return el}));
 function draw(){if(disposed)return;const w=stage.clientWidth||350,h=stage.clientHeight||275,dpr=Math.min(2,window.devicePixelRatio||1);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const aspect=w/h,fov=1.0,scale=1/Math.tan(fov/2);const persp=[scale/aspect,0,0,0,0,scale,0,0,0,0,-1.02,-1,0,0,-.20,0];
 for(let d=0;d<2;d++){const a=angles[d],p=positions[d],rotated=vertices.map(v=>rotate(v,a));const matrix=[...Array(16)].fill(0); // projection * model with rotated basis
 const ex=rotate([1,0,0],a),ey=rotate([0,1,0],a),ez=rotate([0,0,1],a);const model=[ex[0],ex[1],ex[2],0,ey[0],ey[1],ey[2],0,ez[0],ez[1],ez[2],0,p[0],p[1],p[2]-5.7,1];for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)matrix[col*4+row]+=persp[k*4+row]*model[col*4+k];
 gl.uniformMatrix4fv(transform,false,new Float32Array(matrix));gl.uniform3fv(color,d===0?[.76,.22,.30]:[.17,.43,.72]);gl.drawArrays(gl.TRIANGLES,0,data.length/6);
 let top=-Infinity,topIndex=0;faces.forEach((f,i)=>{const pts=f.map(j=>rotated[j]);const mid=[0,1,2].map(k=>pts.reduce((v,q)=>v+q[k],0)/4);let n=norm(cross(sub(pts[1],pts[0]),sub(pts[3],pts[0])));if(n.reduce((v,x,k)=>v+x*mid[k],0)<0)n=n.map(x=>-x);if(n[2]>top){top=n[2];topIndex=i}
 const el=elements[d][i];if(n[2]<.37){el.style.display='none';return}const x=mid[0]+p[0],y=mid[1]+p[1],z=mid[2]+p[2]-5.7;const sx=(x*scale/aspect/-z+1)*w/2,sy=(1-y*scale/-z)*h/2;el.style.display='block';el.style.left=sx+'px';el.style.top=sy+'px';el.style.opacity=String(Math.min(1,(n[2]-.3)*2));});
 positions[d].topIndex=topIndex;
 }}
 draw();
 return {roll(){
  if(disposed||rolling)return Promise.reject(Error('dice unavailable'));
  rolling=true;
  const start=performance.now(),duration=2450;
  const bodies=[0,1].map(d=>({height:1.7+Math.random()*.6,vy:0,
    omega:[(Math.random()-.5)*.31,(Math.random()-.5)*.36,(Math.random()-.5)*.34],
    bounce:0,rest:false}));
  status.textContent='두 개의 입체 주사위가 낙하하고 충돌하는 중…';
  function landedFace(d){
   let best=-Infinity,which=0;
   faces.forEach((face,i)=>{const pts=face.map(j=>rotate(vertices[j],angles[d]));
    let n=norm(cross(sub(pts[1],pts[0]),sub(pts[3],pts[0])));
    const center=[0,1,2].map(k=>pts.reduce((acc,v)=>acc+v[k],0)/4);
    if(n.reduce((acc,v,k)=>acc+v*center[k],0)<0)n=n.map(x=>-x);
    if(n[1]>best){best=n[1];which=i}
   });return which;
  }
  return new Promise(resolve=>{
   resolveRoll=resolve;
   let last=start;
   const tick=t=>{
    if(disposed){resolveRoll=null;resolve(1);return}
    const dt=Math.min(40,Math.max(8,t-last));last=t;
    for(let d=0;d<2;d++){
     const body=bodies[d];
     if(!body.rest){
      // Fixed-step style rigid-body approximation: gravity, floor impact,
      // restitution and angular friction. The result is READ from the
      // upward-facing polygon after settling, never generated separately.
      const step=dt/16.67;
      body.vy-=.035*step;body.height+=body.vy*step;
      if(body.height<0){body.height=0;body.vy=-body.vy*.48;body.bounce++;
       body.omega=body.omega.map(w=>w*.72);
       if(body.bounce>4||Math.abs(body.vy)<.07){body.vy=0;body.rest=true}}
      for(let k=0;k<3;k++)angles[d][k]+=body.omega[k]*step;
      if(body.bounce)body.omega=body.omega.map(w=>w*.993);
     }
     positions[d][1]=Math.min(.9,body.height*.45);
    }
    draw();
    if(t-start<duration){raf=requestAnimationFrame(tick);return}
    const tens=landedFace(0),ones=landedFace(1);
    const value=(tens*10+ones)||100;
    rolling=false;
    status.textContent=`착지한 윗면: ${labelSets[0][tens]} + ${ones} → ${value===100?'100':String(value).padStart(2,'0')}`;
    resolveRoll=null;resolve(value);
   };raf=requestAnimationFrame(tick)
  })
 },dispose(){disposed=true;cancelAnimationFrame(raf);if(resolveRoll){resolveRoll(1);resolveRoll=null}stage.remove();gl.deleteBuffer(buf);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs)}};
}
