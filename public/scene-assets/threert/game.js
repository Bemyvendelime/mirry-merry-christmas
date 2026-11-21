/* ThreeRT — MIT, Meshy LLC 2026. See ThreeRT-LICENSE.txt. */
(()=>{var y=class s{constructor(e=0,t=0,r=0){this.x=e,this.y=t,this.z=r}set(e,t,r){return this.x=e,this.y=t,this.z=r,this}setScalar(e){return this.set(e,e,e)}copy(e){return this.set(e.x,e.y,e.z)}setComponent(e,t){if(e===0)this.x=t;else if(e===1)this.y=t;else if(e===2)this.z=t;else throw new RangeError(`index is out of range: ${e}`);return this}clone(){return new s(this.x,this.y,this.z)}add(e){return this.set(this.x+e.x,this.y+e.y,this.z+e.z)}sub(e){return this.set(this.x-e.x,this.y-e.y,this.z-e.z)}subVectors(e,t){return this.set(e.x-t.x,e.y-t.y,e.z-t.z)}addScaledVector(e,t){return this.set(this.x+e.x*t,this.y+e.y*t,this.z+e.z*t)}multiplyScalar(e){return this.set(this.x*e,this.y*e,this.z*e)}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){return this.set(e.y*t.z-e.z*t.y,e.z*t.x-e.x*t.z,e.x*t.y-e.y*t.x)}length(){return Math.hypot(this.x,this.y,this.z)}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}normalize(){let e=this.length();return e>0?this.multiplyScalar(1/e):this}distanceTo(e){return Math.hypot(this.x-e.x,this.y-e.y,this.z-e.z)}lerp(e,t){return this.set(this.x+(e.x-this.x)*t,this.y+(e.y-this.y)*t,this.z+(e.z-this.z)*t)}applyMatrix4(e){let t=e.elements,{x:r,y:n,z:i}=this,o=1/(t[3]*r+t[7]*n+t[11]*i+t[15]);return this.set((t[0]*r+t[4]*n+t[8]*i+t[12])*o,(t[1]*r+t[5]*n+t[9]*i+t[13])*o,(t[2]*r+t[6]*n+t[10]*i+t[14])*o)}transformDirection(e){let t=e.elements,{x:r,y:n,z:i}=this;return this.set(t[0]*r+t[4]*n+t[8]*i,t[1]*r+t[5]*n+t[9]*i,t[2]*r+t[6]*n+t[10]*i).normalize()}applyQuaternion(e){let{x:t,y:r,z:n}=this,{x:i,y:o,z:l,w:a}=e,u=2*(o*n-l*r),m=2*(l*t-i*n),h=2*(i*r-o*t);return this.set(t+a*u+o*h-l*m,r+a*m+l*u-i*h,n+a*h+i*m-o*u)}setFromMatrixPosition(e){return this.set(e.elements[12],e.elements[13],e.elements[14])}toArray(){return[this.x,this.y,this.z]}fromArray(e,t=0){return this.set(e[t],e[t+1],e[t+2])}},D=class s{_x;_y;_z;_w;_onChange=()=>{};constructor(e=0,t=0,r=0,n=1){this._x=e,this._y=t,this._z=r,this._w=n}get x(){return this._x}set x(e){this._x=e,this._onChange()}get y(){return this._y}set y(e){this._y=e,this._onChange()}get z(){return this._z}set z(e){this._z=e,this._onChange()}get w(){return this._w}set w(e){this._w=e,this._onChange()}set(e,t,r,n,i=!0){return this._x=e,this._y=t,this._z=r,this._w=n,i&&this._onChange(),this}copy(e){return this.set(e.x,e.y,e.z,e.w)}clone(){return new s(this._x,this._y,this._z,this._w)}setFromAxisAngle(e,t){let r=t/2,n=Math.sin(r);return this.set(e.x*n,e.y*n,e.z*n,Math.cos(r))}setFromEuler(e,t=!0){let r=Math.cos(e.x/2),n=Math.cos(e.y/2),i=Math.cos(e.z/2),o=Math.sin(e.x/2),l=Math.sin(e.y/2),a=Math.sin(e.z/2);switch(e.order){case"XYZ":return this.set(o*n*i+r*l*a,r*l*i-o*n*a,r*n*a+o*l*i,r*n*i-o*l*a,t);case"YXZ":return this.set(o*n*i+r*l*a,r*l*i-o*n*a,r*n*a-o*l*i,r*n*i+o*l*a,t);case"ZXY":return this.set(o*n*i-r*l*a,r*l*i+o*n*a,r*n*a+o*l*i,r*n*i-o*l*a,t);case"ZYX":return this.set(o*n*i-r*l*a,r*l*i+o*n*a,r*n*a-o*l*i,r*n*i+o*l*a,t);case"YZX":return this.set(o*n*i+r*l*a,r*l*i+o*n*a,r*n*a-o*l*i,r*n*i-o*l*a,t);case"XZY":return this.set(o*n*i-r*l*a,r*l*i-o*n*a,r*n*a+o*l*i,r*n*i+o*l*a,t)}}setFromRotationMatrix(e){let t=e.elements,r=t[0],n=t[4],i=t[8],o=t[1],l=t[5],a=t[9],u=t[2],m=t[6],h=t[10],c=r+l+h;if(c>0){let p=.5/Math.sqrt(c+1);return this.set((m-a)*p,(i-u)*p,(o-n)*p,.25/p)}else if(r>l&&r>h){let p=2*Math.sqrt(1+r-l-h);return this.set(.25*p,(n+o)/p,(i+u)/p,(m-a)/p)}else if(l>h){let p=2*Math.sqrt(1+l-r-h);return this.set((n+o)/p,.25*p,(a+m)/p,(i-u)/p)}let d=2*Math.sqrt(1+h-r-l);return this.set((i+u)/d,(a+m)/d,.25*d,(o-n)/d)}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let{x:r,y:n,z:i,w:o}=e,{x:l,y:a,z:u,w:m}=t;return this.set(r*m+o*l+n*u-i*a,n*m+o*a+i*l-r*u,i*m+o*u+r*a-n*l,o*m-r*l-n*a-i*u)}normalize(){let e=Math.hypot(this._x,this._y,this._z,this._w)||1;return this.set(this._x/e,this._y/e,this._z/e,this._w/e)}slerp(e,t){let{x:r,y:n,z:i,w:o}=e,l=this._x*r+this._y*n+this._z*i+this._w*o;if(l<0&&(r=-r,n=-n,i=-i,o=-o,l=-l),l>.9995)return this.set(this._x+(r-this._x)*t,this._y+(n-this._y)*t,this._z+(i-this._z)*t,this._w+(o-this._w)*t).normalize();let a=Math.acos(l),u=Math.sin(a),m=Math.sin((1-t)*a)/u,h=Math.sin(t*a)/u;return this.set(this._x*m+r*h,this._y*m+n*h,this._z*m+i*h,this._w*m+o*h)}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}angleTo(e){return 2*Math.acos(Math.min(1,Math.abs(this.dot(e))))}invert(){return this.set(-this._x,-this._y,-this._z,this._w)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),r=Math.random(),n=Math.sqrt(1-r),i=Math.sqrt(r);return this.set(n*Math.sin(e),n*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}toArray(){return[this._x,this._y,this._z,this._w]}fromArray(e,t=0){return this.set(e[t],e[t+1],e[t+2],e[t+3])}},Xe=class{_x;_y;_z;order;_onChange=()=>{};constructor(e=0,t=0,r=0,n="XYZ"){this._x=e,this._y=t,this._z=r,this.order=n}get x(){return this._x}set x(e){this._x=e,this._onChange()}get y(){return this._y}set y(e){this._y=e,this._onChange()}get z(){return this._z}set z(e){this._z=e,this._onChange()}set(e,t,r,n=this.order){return this._x=e,this._y=t,this._z=r,this.order=n,this._onChange(),this}setFromQuaternion(e,t=!0){let n=new O().makeRotationFromQuaternion(e).elements,i=d=>Math.min(1,Math.max(-1,d)),o=n[0],l=n[4],a=n[8],u=n[5],m=n[9],h=n[6],c=n[10];return this._y=Math.asin(i(a)),Math.abs(a)<.9999999?(this._x=Math.atan2(-m,c),this._z=Math.atan2(-l,o)):(this._x=Math.atan2(h,u),this._z=0),this.order="XYZ",t&&this._onChange(),this}},O=class s{elements;constructor(){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}identity(){return this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],this}copy(e){return this.elements=e.elements.slice(),this}clone(){return new s().copy(this)}compose(e,t,r){return this.composeComponents(e.x,e.y,e.z,t.x,t.y,t.z,t.w,r.x,r.y,r.z)}composeComponents(e,t,r,n,i,o,l,a,u,m){let h=this.elements,c=n+n,d=i+i,p=o+o,f=n*c,b=n*d,g=n*p,w=i*d,v=i*p,x=o*p,P=l*c,I=l*d,S=l*p;return h[0]=(1-(w+x))*a,h[1]=(b+S)*a,h[2]=(g-I)*a,h[3]=0,h[4]=(b-S)*u,h[5]=(1-(f+x))*u,h[6]=(v+P)*u,h[7]=0,h[8]=(g+I)*m,h[9]=(v-P)*m,h[10]=(1-(f+w))*m,h[11]=0,h[12]=e,h[13]=t,h[14]=r,h[15]=1,this}makeRotationFromQuaternion(e){return this.compose(new y,e,new y(1,1,1))}multiplyMatrices(e,t){let r=e.elements,n=t.elements,i=new Array(16);for(let o=0;o<4;o++)for(let l=0;l<4;l++)i[l*4+o]=r[o]*n[l*4]+r[4+o]*n[l*4+1]+r[8+o]*n[l*4+2]+r[12+o]*n[l*4+3];return this.elements=i,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}lookAt(e,t,r){let n=this.elements,i=new y().subVectors(e,t);i.lengthSq()===0&&(i.z=1),i.normalize();let o=new y().crossVectors(r,i);o.lengthSq()===0&&(Math.abs(r.z)===1?i.x+=1e-4:i.z+=1e-4,i.normalize(),o.crossVectors(r,i)),o.normalize();let l=new y().crossVectors(i,o);return n[0]=o.x,n[4]=l.x,n[8]=i.x,n[1]=o.y,n[5]=l.y,n[9]=i.y,n[2]=o.z,n[6]=l.z,n[10]=i.z,this}decompose(e,t,r){let n=this.elements,i=Math.hypot(n[0],n[1],n[2]),o=Math.hypot(n[4],n[5],n[6]),l=Math.hypot(n[8],n[9],n[10]);this.determinant()<0&&(i=-i),e.set(n[12],n[13],n[14]);let a=this.clone(),u=a.elements;return u[0]/=i,u[1]/=i,u[2]/=i,u[4]/=o,u[5]/=o,u[6]/=o,u[8]/=l,u[9]/=l,u[10]/=l,t.setFromRotationMatrix(a),r.set(i,o,l),this}determinant(){let e=this.elements,t=e[0],r=e[4],n=e[8],i=e[12],o=e[1],l=e[5],a=e[9],u=e[13],m=e[2],h=e[6],c=e[10],d=e[14],p=e[3],f=e[7],b=e[11],g=e[15];return p*(+i*a*h-n*u*h-i*l*c+r*u*c+n*l*d-r*a*d)+f*(+t*a*d-t*u*c+i*o*c-n*o*d+n*u*m-i*a*m)+b*(+t*u*h-t*l*d-i*o*h+r*o*d+i*l*m-r*u*m)+g*(-n*l*m-t*a*h+t*l*c+n*o*h-r*o*c+r*a*m)}set(e,t,r,n,i,o,l,a,u,m,h,c,d,p,f,b){return this.elements=[e,i,u,d,t,o,m,p,r,l,h,f,n,a,c,b],this}makeTranslation(e,t,r){return e instanceof y?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,r,0,0,0,1)}makeRotationX(e){let t=Math.cos(e),r=Math.sin(e);return this.set(1,0,0,0,0,t,-r,0,0,r,t,0,0,0,0,1)}makeRotationY(e){let t=Math.cos(e),r=Math.sin(e);return this.set(t,0,r,0,0,1,0,0,-r,0,t,0,0,0,0,1)}makeRotationZ(e){let t=Math.cos(e),r=Math.sin(e);return this.set(t,-r,0,0,r,t,0,0,0,0,1,0,0,0,0,1)}makeScale(e,t,r){return this.set(e,0,0,0,0,t,0,0,0,0,r,0,0,0,0,1)}setPosition(e,t,r){let n=this.elements;return e instanceof y?[n[12],n[13],n[14]]=[e.x,e.y,e.z]:[n[12],n[13],n[14]]=[e,t,r],this}invert(){let e=this.elements,[t,r,n,i,o,l,a,u,m,h,c,d,p,f,b,g]=e,w=h*b*u-f*c*u+f*a*d-l*b*d-h*a*g+l*c*g,v=p*c*u-m*b*u-p*a*d+o*b*d+m*a*g-o*c*g,x=m*f*u-p*h*u+p*l*d-o*f*d-m*l*g+o*h*g,P=p*h*a-m*f*a-p*l*c+o*f*c+m*l*b-o*h*b,I=t*w+r*v+n*x+i*P;if(I===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let S=1/I;return this.elements=[w*S,(f*c*i-h*b*i-f*n*d+r*b*d+h*n*g-r*c*g)*S,(l*b*i-f*a*i+f*n*u-r*b*u-l*n*g+r*a*g)*S,(h*a*i-l*c*i-h*n*u+r*c*u+l*n*d-r*a*d)*S,v*S,(m*b*i-p*c*i+p*n*d-t*b*d-m*n*g+t*c*g)*S,(p*a*i-o*b*i-p*n*u+t*b*u+o*n*g-t*a*g)*S,(o*c*i-m*a*i+m*n*u-t*c*u-o*n*d+t*a*d)*S,x*S,(p*h*i-m*f*i-p*r*d+t*f*d+m*r*g-t*h*g)*S,(o*f*i-p*l*i+p*r*u-t*f*u-o*r*g+t*l*g)*S,(m*l*i-o*h*i-m*r*u+t*h*u+o*r*d-t*l*d)*S,P*S,(m*f*n-p*h*n+p*r*c-t*f*c-m*r*b+t*h*b)*S,(p*l*n-o*f*n-p*r*a+t*f*a+o*r*b-t*l*b)*S,(o*h*n-m*l*n+m*r*a-t*h*a-o*r*c+t*l*c)*S],this}equals(e){return this.elements.every((t,r)=>t===e.elements[r])}fromArray(e,t=0){for(let r=0;r<16;r++)this.elements[r]=e[r+t];return this}toArray(e=[],t=0){for(let r=0;r<16;r++)e[r+t]=this.elements[r];return e}},M=class s{r=1;g=1;b=1;constructor(e,t,r){e!==void 0&&this.set(e,t,r)}set(e,t,r){return e instanceof s?(this.r=e.r,this.g=e.g,this.b=e.b):typeof e=="number"&&t===void 0?this.setHex(e):typeof e=="number"?(this.r=e,this.g=t,this.b=r):typeof e=="string"?this.setStyle(e):Array.isArray(e)&&(this.r=e[0],this.g=e[1],this.b=e[2]),this}setHex(e){return this.r=N((e>>16&255)/255),this.g=N((e>>8&255)/255),this.b=N((e&255)/255),this}setStyle(e){let t=/^#?([0-9a-f]{6})$/i.exec(e.trim());if(t)return this.setHex(parseInt(t[1],16));let r=Pr[e.toLowerCase()];if(r!==void 0)return this.setHex(r);throw new Error(`unsupported color: ${e}`)}setRGB(e,t,r){return this.r=e,this.g=t,this.b=r,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}clone(){return new s().setRGB(this.r,this.g,this.b)}copy(e){return this.setRGB(e.r,e.g,e.b)}setHSL(e,t,r){if(e=(e%1+1)%1,t=Math.min(Math.max(t,0),1),r=Math.min(Math.max(r,0),1),t===0)return this.setRGB(N(r),N(r),N(r));let n=r<=.5?r*(1+t):r+t-r*t,i=2*r-n,o=l=>(l=(l%1+1)%1,l<1/6?i+(n-i)*6*l:l<1/2?n:l<2/3?i+(n-i)*6*(2/3-l):i);return this.setRGB(N(o(e+1/3)),N(o(e)),N(o(e-1/3)))}getHSL(e={h:0,s:0,l:0}){let[t,r,n]=[this.r,this.g,this.b].map(h=>Math.min(Math.max(Qt(h),0),1)),i=Math.max(t,r,n),o=Math.min(t,r,n),l=(o+i)/2;if(o===i)return Object.assign(e,{h:0,s:0,l});let a=i-o,u=l<=.5?a/(i+o):a/(2-i-o),m=i===t?(r-n)/a+(r<n?6:0):i===r?(n-t)/a+2:(t-r)/a+4;return Object.assign(e,{h:m/6,s:u,l})}lerp(e,t){return this.setRGB(this.r+(e.r-this.r)*t,this.g+(e.g-this.g)*t,this.b+(e.b-this.b)*t)}add(e){return this.setRGB(this.r+e.r,this.g+e.g,this.b+e.b)}multiply(e){return this.setRGB(this.r*e.r,this.g*e.g,this.b*e.b)}getStyle(){return`#${this.getHex().toString(16).padStart(6,"0")}`}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}getHex(){let e=t=>Math.round(Math.min(Math.max(Qt(t),0),1)*255);return e(this.r)<<16|e(this.g)<<8|e(this.b)}fromArray(e,t=0){return this.setRGB(e[t],e[t+1],e[t+2])}toArray(e,t=0){return e?(e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e):[this.r,this.g,this.b]}static fromTemperature(e){return new s().setRGB(...Ar(e))}},ye=class s{isVector2=!0;x;y;constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.set(e,e)}copy(e){return this.set(e.x,e.y)}clone(){return new s(this.x,this.y)}add(e){return this.set(this.x+e.x,this.y+e.y)}sub(e){return this.set(this.x-e.x,this.y-e.y)}multiplyScalar(e){return this.set(this.x*e,this.y*e)}dot(e){return this.x*e.x+this.y*e.y}length(){return Math.hypot(this.x,this.y)}normalize(){let e=this.length()||1;return this.set(this.x/e,this.y/e)}distanceTo(e){return Math.hypot(this.x-e.x,this.y-e.y)}lerp(e,t){return this.set(this.x+(e.x-this.x)*t,this.y+(e.y-this.y)*t)}equals(e){return e.x===this.x&&e.y===this.y}toArray(){return[this.x,this.y]}fromArray(e,t=0){return this.set(e[t],e[t+1])}},ne=class s{isBox3=!0;min;max;constructor(e=new y(1/0,1/0,1/0),t=new y(-1/0,-1/0,-1/0)){this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}makeEmpty(){return this.min.set(1/0,1/0,1/0),this.max.set(-1/0,-1/0,-1/0),this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}expandByPoint(e){return this.min.set(Math.min(this.min.x,e.x),Math.min(this.min.y,e.y),Math.min(this.min.z,e.z)),this.max.set(Math.max(this.max.x,e.x),Math.max(this.max.y,e.y),Math.max(this.max.z,e.z)),this}setFromArray(e){this.makeEmpty();let t=new y;for(let r=0;r+2<e.length;r+=3)this.expandByPoint(t.set(e[r],e[r+1],e[r+2]));return this}setFromPoints(e){this.makeEmpty();for(let t of e)this.expandByPoint(t);return this}union(e){return this.expandByPoint(e.min).expandByPoint(e.max)}applyMatrix4(e){if(this.isEmpty())return this;let{min:t,max:r}=this,n=[0,1,2,3,4,5,6,7].map(i=>new y(i&1?r.x:t.x,i&2?r.y:t.y,i&4?r.z:t.z).applyMatrix4(e));return this.setFromPoints(n)}getCenter(e=new y){return this.isEmpty()?e.set(0,0,0):e.set((this.min.x+this.max.x)/2,(this.min.y+this.max.y)/2,(this.min.z+this.max.z)/2)}getSize(e=new y){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}copy(e){return this.set(e.min,e.max)}clone(){return new s(this.min.clone(),this.max.clone())}},Ye=class s{center;radius;constructor(e=new y,t=-1){this.center=e,this.radius=t}setFromArray(e){new ne().setFromArray(e).getCenter(this.center);let r=0;for(let n=0;n+2<e.length;n+=3){let i=e[n]-this.center.x,o=e[n+1]-this.center.y,l=e[n+2]-this.center.z;r=Math.max(r,i*i+o*o+l*l)}return this.radius=Math.sqrt(r),this}clone(){return new s(this.center.clone(),this.radius)}};function N(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function Qt(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}function Ar(s){let e=Math.min(Math.max(s,1667),25e3),t=e<=4e3?-266123900/(e*e*e)-234358/(e*e)+877.6956/e+.17991:-3025846900/(e*e*e)+21070379e-1/(e*e)+222.6347/e+.24039,r=e<=2222?-1.1063814*t*t*t-1.3481102*t*t+2.18555832*t-.20219683:e<=4e3?-.9549476*t*t*t-1.37418593*t*t+2.09137015*t-.16748867:3.081758*t*t*t-5.8733867*t*t+3.75112997*t-.37001483,n=t/r,i=1,o=(1-t-r)/r,l=3.2404542*n-1.5371385*i-.4985314*o,a=-.969266*n+1.8760108*i+.041556*o,u=.0556434*n-.2040259*i+1.0572252*o,m=Math.max(l,a,u);return[Math.max(l,0)/m,Math.max(a,0)/m,Math.max(u,0)/m]}var Pr={white:16777215,black:0,red:16711680,green:32768,lime:65280,blue:255,yellow:16776960,cyan:65535,magenta:16711935,orange:16753920,gray:8421504,grey:8421504,gold:16766720,silver:12632256,purple:8388736,pink:16761035,brown:10824234,skyblue:8900331},sn={DEG2RAD:Math.PI/180,RAD2DEG:180/Math.PI,degToRad:s=>s*Math.PI/180,radToDeg:s=>s*180/Math.PI,clamp:(s,e,t)=>Math.min(t,Math.max(e,s)),lerp:(s,e,t)=>s+(e-s)*t};var _r=0,Mt=35044,zr=35048,H=class{isBufferAttribute=!0;name="";array;itemSize;normalized;usage=Mt;version=0;constructor(e,t,r=!1){if(Array.isArray(e))throw new TypeError("BufferAttribute: array should be a typed array (Float32BufferAttribute takes plain arrays)");this.array=e,this.itemSize=t,this.normalized=r,Object.defineProperty(this,"_geometry",{value:void 0,writable:!0})}get count(){return this.array.length/this.itemSize}set needsUpdate(e){e&&(this.version++,this._geometry?.changed())}setUsage(e){return this.usage=e,this}getComponent(e,t){return this.array[e*this.itemSize+t]}setComponent(e,t,r){return this.array[e*this.itemSize+t]=r,this}getX(e){return this.array[e*this.itemSize]}getY(e){return this.array[e*this.itemSize+1]}getZ(e){return this.array[e*this.itemSize+2]}getW(e){return this.array[e*this.itemSize+3]}setX(e,t){return this.array[e*this.itemSize]=t,this}setY(e,t){return this.array[e*this.itemSize+1]=t,this}setZ(e,t){return this.array[e*this.itemSize+2]=t,this}setW(e,t){return this.array[e*this.itemSize+3]=t,this}setXY(e,t,r){let n=e*this.itemSize;return this.array[n]=t,this.array[n+1]=r,this}setXYZ(e,t,r,n){let i=e*this.itemSize;return this.array[i]=t,this.array[i+1]=r,this.array[i+2]=n,this}setXYZW(e,t,r,n,i){return this.setXYZ(e,t,r,n),this.array[e*this.itemSize+3]=i,this}set(e,t=0){return this.array.set(e,t),this}copyArray(e){return this.set(e)}applyMatrix4(e){let t=new y;for(let r=0;r<this.count;r++)t.fromArray(this.array,r*this.itemSize).applyMatrix4(e),this.setXYZ(r,t.x,t.y,t.z);return this}transformDirection(e){let t=new y;for(let r=0;r<this.count;r++)t.fromArray(this.array,r*this.itemSize).transformDirection(e),this.setXYZ(r,t.x,t.y,t.z);return this}clone(){return new this.constructor(this.array.slice(),this.itemSize,this.normalized).setUsage(this.usage)}};var se=class s{isBufferGeometry=!0;uuid=`geom${++_r}`;needsUpdate=!1;version=0;type="BufferGeometry";name="";parameters={};attributes={};index=new Uint32Array;groups=[];boundingBox=null;boundingSphere=null;userData={};get positions(){return this.attributes.position?.array??new Float32Array}set positions(e){this.setAttribute("position",new H(e,3))}get normals(){return this.attributes.normal?.array??new Float32Array}set normals(e){this.setAttribute("normal",new H(e,3))}get uvs(){return this.attributes.uv?.array??new Float32Array}set uvs(e){this.setAttribute("uv",new H(e,2))}setData(e,t,r,n){return this.positions=Float32Array.from(e),this.normals=Float32Array.from(t),this.uvs=Float32Array.from(r),this.index=Uint32Array.from(n),this}changed(){this.needsUpdate=!0,this.version++}setAttribute(e,t){let r=e==="position"||e==="normal"||e==="uv"?Dr(t):t;return r._geometry=this,this.attributes[e]=r,this.changed(),this}getAttribute(e){return this.attributes[e]}deleteAttribute(e){return delete this.attributes[e],this.changed(),this}hasAttribute(e){return this.attributes[e]!==void 0}setIndex(e){return this.index=e===null?new Uint32Array:Uint32Array.from(e instanceof H?e.array:e),this.changed(),this}getIndex(){if(!this.index.length)return null;let e=new H(this.index,1);return e._geometry=this,e}addGroup(e,t,r=0){this.groups.push({start:e,count:t,materialIndex:r}),this.changed()}clearGroups(){this.groups=[],this.changed()}get dynamic(){return Object.values(this.attributes).some(e=>e.usage===zr)}get vertexCount(){return this.positions.length/3}triangleIndices(){if(this.index.length)return this.index;let e=this.vertexCount-this.vertexCount%3;return Uint32Array.from({length:e},(t,r)=>r)}computeVertexNormals(){let e=this.positions,t=new Float32Array(e.length),r=this.triangleIndices(),n=new y,i=new y,o=new y,l=new y,a=new y;for(let m=0;m<r.length;m+=3){let[h,c,d]=[r[m],r[m+1],r[m+2]];n.fromArray(e,h*3),i.fromArray(e,c*3),o.fromArray(e,d*3),l.subVectors(o,i),a.subVectors(n,i),l.cross(a);for(let p of[h,c,d])t[p*3]+=l.x,t[p*3+1]+=l.y,t[p*3+2]+=l.z}for(let m=0;m<t.length;m+=3){let h=Math.hypot(t[m],t[m+1],t[m+2])||1;t[m]/=h,t[m+1]/=h,t[m+2]/=h}let u=this.attributes.normal;return u&&u.array.length===t.length?(u.array.set(t),u.needsUpdate=!0):this.normals=t,this}applyMatrix4(e){let t=this.attributes.position,r=this.attributes.normal;return t&&(t.applyMatrix4(e),t.needsUpdate=!0),r&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox&&this.computeBoundingBox(),this.boundingSphere&&this.computeBoundingSphere(),this.changed(),this}applyQuaternion(e){return this.applyMatrix4(ge().makeRotationFromQuaternion(e))}translate(e,t,r){return this.applyMatrix4(ge().makeTranslation(e,t,r))}rotateX(e){return this.applyMatrix4(ge().makeRotationX(e))}rotateY(e){return this.applyMatrix4(ge().makeRotationY(e))}rotateZ(e){return this.applyMatrix4(ge().makeRotationZ(e))}scale(e,t,r){return this.applyMatrix4(ge().makeScale(e,t,r))}center(){let e=new ne().setFromArray(this.positions).getCenter();return this.translate(-e.x,-e.y,-e.z)}computeBoundingBox(){this.boundingBox=new ne().setFromArray(this.positions)}computeBoundingSphere(){this.boundingSphere=new Ye().setFromArray(this.positions)}setFromPoints(e){return this.positions=Float32Array.from(e.flatMap(t=>[t.x,t.y,t.z??0])),this}dispose(){}copy(e){this.attributes={};for(let[t,r]of Object.entries(e.attributes))this.setAttribute(t,r.clone());return this.index=e.index.slice(),this.groups=e.groups.map(t=>({...t})),this.parameters={...e.parameters},this.name=e.name,this.boundingBox=e.boundingBox?.clone()??null,this.boundingSphere=e.boundingSphere?.clone()??null,this}clone(){return new s().copy(this)}toNonIndexed(){let e=this.triangleIndices(),t=new s;for(let[r,n]of Object.entries(this.attributes)){let i=new Float32Array(e.length*n.itemSize);for(let o=0;o<e.length;o++)for(let l=0;l<n.itemSize;l++)i[o*n.itemSize+l]=n.array[e[o]*n.itemSize+l];t.setAttribute(r,new H(i,n.itemSize,n.normalized))}return t.groups=this.groups.map(r=>({...r})),t}bounds(){let e=[1/0,1/0,1/0],t=[-1/0,-1/0,-1/0];for(let r=0;r<this.positions.length;r+=3)for(let n=0;n<3;n++)e[n]=Math.min(e[n],this.positions[r+n]),t[n]=Math.max(t[n],this.positions[r+n]);return{min:e,max:t}}};function ge(){return new O}function Dr(s){if(s.array instanceof Float32Array)return s;let e=new H(Float32Array.from(s.array),s.itemSize,s.normalized);return e.usage=s.usage,e}var $e=class{p=[];n=[];uv=[];idx=[];finish(e){e.setData(this.p,this.n,this.uv,this.idx),e.needsUpdate=!1}},Ee=class extends se{type="BoxGeometry";constructor(e=1,t=1,r=1,n=1,i=1,o=1){super(),this.parameters={width:e,height:t,depth:r,widthSegments:n,heightSegments:i,depthSegments:o};let l=new $e,a=0,u=[],m=(h,c,d,p,f,b,g,w,v,x)=>{u.push({start:l.idx.length,count:v*x*6,materialIndex:u.length});let P=b/v,I=g/x,S=b/2,ze=g/2,Mr=w/2,De=v+1,kr=x+1,Jt=0,R=[0,0,0];for(let V=0;V<kr;V++){let X=V*I-ze;for(let be=0;be<De;be++){let Qe=be*P-S;R[h]=Qe*p,R[c]=X*f,R[d]=Mr,l.p.push(R[0],R[1],R[2]),R[h]=0,R[c]=0,R[d]=w>0?1:-1,l.n.push(R[0],R[1],R[2]),l.uv.push(be/v,1-V/x),Jt++}}for(let V=0;V<x;V++)for(let X=0;X<v;X++){let be=a+X+De*V,Qe=a+X+De*(V+1),Sr=a+(X+1)+De*(V+1),Zt=a+(X+1)+De*V;l.idx.push(be,Qe,Zt,Qe,Sr,Zt)}a+=Jt};m(2,1,0,-1,-1,r,t,e,o,i),m(2,1,0,1,-1,r,t,-e,o,i),m(0,2,1,1,1,e,r,t,n,o),m(0,2,1,1,-1,e,r,-t,n,o),m(0,1,2,1,-1,e,t,r,n,i),m(0,1,2,-1,-1,e,t,-r,n,i),l.finish(this),this.groups=u,this.needsUpdate=!1}};var Ke=class extends se{type="SphereGeometry";constructor(e=1,t=32,r=16,n=0,i=Math.PI*2,o=0,l=Math.PI){super(),t=Math.max(3,Math.floor(t)),r=Math.max(2,Math.floor(r)),this.parameters={radius:e,widthSegments:t,heightSegments:r,phiStart:n,phiLength:i,thetaStart:o,thetaLength:l};let a=new $e,u=Math.min(o+l,Math.PI),m=0,h=[];for(let c=0;c<=r;c++){let d=[],p=c/r,f=0;c===0&&o===0?f=.5/t:c===r&&u===Math.PI&&(f=-.5/t);for(let b=0;b<=t;b++){let g=b/t,w=-e*Math.cos(n+g*i)*Math.sin(o+p*l),v=e*Math.cos(o+p*l),x=e*Math.sin(n+g*i)*Math.sin(o+p*l);a.p.push(w,v,x);let P=Math.hypot(w,v,x)||1;a.n.push(w/P,v/P,x/P),a.uv.push(g+f,1-p),d.push(m++)}h.push(d)}for(let c=0;c<r;c++)for(let d=0;d<t;d++){let p=h[c][d+1],f=h[c][d],b=h[c+1][d],g=h[c+1][d+1];(c!==0||o>0)&&a.idx.push(p,f,g),(c!==r-1||u<Math.PI)&&a.idx.push(f,b,g)}a.finish(this)}};var vt=class extends se{type="LatheGeometry";constructor(e=[{x:0,y:-.5},{x:.5,y:0},{x:0,y:.5}],t=12,r=0,n=Math.PI*2){super(),t=Math.max(1,Math.floor(t)),this.parameters={segments:t,phiStart:r,phiLength:n};let i=new $e;for(let o=0;o<=t;o++){let l=r+o/t*n,a=Math.sin(l),u=Math.cos(l);for(let m=0;m<e.length;m++)i.p.push(e[m].x*a,e[m].y,e[m].x*u),i.n.push(0,0,0),i.uv.push(o/t,m/(e.length-1))}for(let o=0;o<t;o++)for(let l=0;l<e.length-1;l++){let a=l+o*e.length,u=a,m=a+e.length,h=a+e.length+1,c=a+1;i.idx.push(u,m,c,h,c,m)}i.finish(this),this.computeVertexNormals(),this.needsUpdate=!1}},et=class extends vt{type="CapsuleGeometry";constructor(e=1,t=1,r=4,n=8){let i=[];for(let o=0;o<=r;o++){let l=-Math.PI/2+o/r*(Math.PI/2);i.push({x:e*Math.cos(l),y:-t/2+e*Math.sin(l)})}for(let o=0;o<=r;o++){let l=o/r*(Math.PI/2);i.push({x:e*Math.cos(l),y:t/2+e*Math.sin(l)})}super(i,n),this.parameters={radius:e,length:t,capSegments:r,radialSegments:n}}};var Y=[];function tr(s){return Y.includes(s)||Y.push(s),()=>{Y.includes(s)&&Y.splice(Y.indexOf(s),1)}}function k(s){for(let e=0;e<Y.length;e++)Y[e].objects.add(s)}var Xt=[],Yt=new Set;function he(s,e){let t=`${s}: ${e}`;Xt.length<1e4&&Xt.push(t),!Yt.has(t)&&(Yt.add(t),console.warn(`three.js compatibility, ${t}`))}var ve=[],oe=new Map,rt=null,ie=0,W=null,Kt=-1;function rr(s){rt=s}var $r=null;function de(){return $r}function nr(){ie++}function sr(){return ve.length?ve.splice(0):ve}function xe(s){ve.length>=65536&&ve.shift(),ve.push(s)}function tt(s,e={}){return rt?JSON.parse(rt.physics(s,e)):null}function kt(s,e,t){s.epoch=ie,Kt!==ie&&(Kt=ie,W=rt?.physicsPoses?.()??null);let r=s.slot*7;if(!W||s.slot<0||r+7>W.length)return;let n=s.trs;e._x=n[0]=W[r],e._y=n[1]=W[r+1],e._z=n[2]=W[r+2],t._x=n[3]=W[r+3],t._y=n[4]=W[r+4],t._z=n[5]=W[r+5],t._w=n[6]=W[r+6],s.euler=!0}function ir(s,e){if(Object.defineProperty(s,"_body",{value:e,configurable:!0,writable:!0}),oe.set(e.id,s),e.slot<0)return;let t=s.position,r=s.quaternion,n=s.rotation;Object.defineProperty(s,"position",{configurable:!0,enumerable:!0,get:()=>(e.epoch!==ie&&kt(e,t,r),t)}),Object.defineProperty(s,"quaternion",{configurable:!0,enumerable:!0,get:()=>(e.epoch!==ie&&kt(e,t,r),r)}),Object.defineProperty(s,"rotation",{configurable:!0,enumerable:!0,get:()=>(e.epoch!==ie&&kt(e,t,r),e.euler&&(e.euler=!1,n.setFromQuaternion(r,!1)),n)})}function St(s){let e=s._body;if(e){if(oe.get(e.id)===s&&oe.delete(e.id),e.slot>=0)for(let t of["position","quaternion","rotation"])Object.defineProperty(s,t,{value:s[t],configurable:!0,enumerable:!0,writable:!0});s._body=void 0}}function er(){for(let s of Y)s.structure=!0}var je=class extends y{constructor(e,t=0,r=0,n=0){super(t,r,n),Object.defineProperty(this,"_owner",{value:e})}toJSON(){return{x:this.x,y:this.y,z:this.z}}set(e,t,r){return this._x=e,this._y=t,this._z=r,this._owner&&k(this._owner),this}};for(let s of["x","y","z"]){let e=`_${s}`;Object.defineProperty(je.prototype,s,{get(){return this[e]},set(t){this[e]=t,this._owner&&k(this._owner)}})}var Er=0,Or=new Set(["parent","children","position","quaternion","rotation","scale","up","matrix","matrixWorld","userData","tags","_id","_autoId","uuid","_body","_listeners"]),A=class{isObject3D=!0;type="Object3D";name="";_autoId=++Er;parent=null;children=[];position=new je(this);quaternion=new D;rotation=new Xe;scale=new je(this,1,1,1);up=new y(0,1,0);_visible=!0;_power=1;_custom=[0,0,0,0];_sway=null;_castShadow=!0;_movable=!1;receiveShadow=!0;tags=[];userData={};matrix=new O;matrixAutoUpdate=!0;matrixWorld=new O;get id(){return this._id??this._autoId}get physics(){return this._physics??null}set physics(e){this._physics=e==null?null:Object.freeze(typeof e=="string"?{type:e}:{...e}),k(this)}applyImpulse(e,t){return xe({op:"impulse",object:this,args:{impulse:e.toArray(),...t?{point:t.toArray()}:{}}}),this}applyTorqueImpulse(e){return xe({op:"impulse",object:this,args:{torque:e.toArray()}}),this}applyForce(e){return xe({op:"force",object:this,args:{force:e.toArray()}}),this}applyTorque(e){return xe({op:"force",object:this,args:{torque:e.toArray()}}),this}setLinearVelocity(e){return xe({op:"velocity",object:this,args:{linvel:e.toArray()}}),this}setAngularVelocity(e){return xe({op:"velocity",object:this,args:{angvel:e.toArray()}}),this}getLinearVelocity(e=new y){let t=this._body?tt("state",{body:this._body.id}):null;return t?.linvel?e.fromArray(t.linvel):e.set(0,0,0)}getAngularVelocity(e=new y){let t=this._body?tt("state",{body:this._body.id}):null;return t?.angvel?e.fromArray(t.angvel):e.set(0,0,0)}get sleeping(){return(this._body?tt("state",{body:this._body.id}):null)?.sleeping??!1}addEventListener(e,t){let r=this._listeners??=new Map,n=r.get(e);n?n.includes(t)||n.push(t):r.set(e,[t])}hasEventListener(e,t){return this._listeners?.get(e)?.includes(t)??!1}removeEventListener(e,t){let r=this._listeners?.get(e);r?.includes(t)&&r.splice(r.indexOf(t),1)}dispatchEvent(e){let t=this._listeners?.get(e.type);if(t?.length){e.target=this;for(let r of[...t])r(e)}}set id(e){this._id=e===void 0?void 0:String(e)}get stableId(){return this._id}constructor(){this.rotation._onChange=()=>{this.quaternion.setFromEuler(this.rotation,!1),k(this)},this.quaternion._onChange=()=>{this.rotation.setFromQuaternion(this.quaternion,!1),k(this)}}get visible(){return this._visible}set visible(e){this._visible=e,k(this)}get power(){return this._power}set power(e){this._power=e,k(this)}get customData(){return this._custom}set customData(e){this._custom=[e[0]??0,e[1]??0,e[2]??0,e[3]??0],k(this)}get sway(){return this._sway}set sway(e){this._sway=e?{...e}:null,k(this)}get castShadow(){return this._castShadow}set castShadow(e){this._castShadow=e,k(this)}get movable(){return this._movable}set movable(e){this._movable=e,k(this)}add(...e){for(let t of e){if(t===this)throw new Error("object can't be added as a child of itself");if(t.engineOwned)throw new TypeError(`${t.name||t.type}: the engine draws it; it is in no scene`);t.parent?.remove(t),t.parent=this,this.children.push(t)}return er(),this}remove(...e){for(let t of e){let r=this.children.indexOf(t);r>=0&&(this.children.splice(r,1),t.parent=null)}return er(),this}traverse(e){e(this);for(let t of this.children)t.traverse(e)}getObjectByName(e){if(this.name===e)return this;for(let t of this.children){let r=t.getObjectByName(e);if(r)return r}}updateMatrixWorld(){this.updateWorldMatrix(!1,!0)}updateMatrix(){let e=this.position,t=this.scale,r=this.quaternion;this.matrix.composeComponents(e._x,e._y,e._z,r._x,r._y,r._z,r._w,t._x,t._y,t._z)}updateWorldMatrix(e,t){if(e&&this.parent&&this.parent.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent?this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix):this.matrixWorld.copy(this.matrix),t)for(let r of this.children)r.updateWorldMatrix(!1,!0)}getWorldPosition(e=new y){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}get looksDownNegativeZ(){return!1}lookAt(e,t,r){let n=e instanceof y?e.clone():new y(e,t,r);this.updateWorldMatrix(!0,!1);let i=new y().setFromMatrixPosition(this.matrixWorld),o=new O;if(this.looksDownNegativeZ?o.lookAt(i,n,this.up):o.lookAt(n,i,this.up),this.quaternion.setFromRotationMatrix(o),this.parent){let l=new D;this.parent.matrixWorld.decompose(new y,l,new y);let a=new D(-l.x,-l.y,-l.z,l.w);this.quaternion.premultiply(a)}return this}clone(e=!0){let t;try{t=new this.constructor}catch{throw new Error(`${this.type}.clone(): not supported`)}return t.copy(this,e)}copy(e,t=!0){for(let[r,n]of Object.entries(e))Or.has(r)||(this[r]=n instanceof M||n instanceof y||n instanceof ye?n.clone():n);if(this.position.copy(e.position),this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.up.copy(e.up),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.userData=JSON.parse(JSON.stringify(e.userData)),this.tags=[...e.tags],t)for(let r of e.children)this.add(r.clone());return k(this),this}attach(e){this.updateWorldMatrix(!0,!1),e.updateWorldMatrix(!0,!1);let t=new O().copy(this.matrixWorld).invert().multiply(e.matrixWorld);return e.parent?.remove(e),t.decompose(e.position,e.quaternion,e.scale),this.add(e),e.updateWorldMatrix(!1,!0),this}removeFromParent(){return this.parent?.remove(this),this}clear(){return this.remove(...this.children)}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let r of this.children){let n=r.getObjectByProperty(e,t);if(n)return n}}getObjectsByProperty(e,t,r=[]){this[e]===t&&r.push(this);for(let n of this.children)n.getObjectsByProperty(e,t,r);return r}traverseVisible(e){if(this.visible){e(this);for(let t of this.children)t.traverseVisible(e)}}traverseAncestors(e){this.parent&&(e(this.parent),this.parent.traverseAncestors(e))}rotateOnAxis(e,t){return this.quaternion.multiply(new D().setFromAxisAngle(e,t)),this}rotateOnWorldAxis(e,t){return this.quaternion.premultiply(new D().setFromAxisAngle(e,t)),this}rotateX(e){return this.rotateOnAxis(new y(1,0,0),e)}rotateY(e){return this.rotateOnAxis(new y(0,1,0),e)}rotateZ(e){return this.rotateOnAxis(new y(0,0,1),e)}translateOnAxis(e,t){let r=e.clone().applyQuaternion(this.quaternion);return this.position.set(this.position.x+r.x*t,this.position.y+r.y*t,this.position.z+r.z*t),this}translateX(e){return this.translateOnAxis(new y(1,0,0),e)}translateY(e){return this.translateOnAxis(new y(0,1,0),e)}translateZ(e){return this.translateOnAxis(new y(0,0,1),e)}setRotationFromAxisAngle(e,t){return this.quaternion.setFromAxisAngle(e,t),this}setRotationFromEuler(e){return this.quaternion.setFromEuler(e),this}applyMatrix4(e){return this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this}applyQuaternion(e){return this.quaternion.premultiply(e),this}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(new O().copy(this.matrixWorld).invert())}getWorldQuaternion(e=new D){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(new y,e,new y),e}getWorldScale(e=new y){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(new y,new D,e),e}getWorldDirection(e=new y){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements,r=this.looksDownNegativeZ?-1:1;return e.set(t[8]*r,t[9]*r,t[10]*r).normalize()}};var Ie=class extends A{isJoint=!0;type="Joint";bodyA;bodyB;anchorA=new y;anchorB=new y;broken=!1;constructor(e,t,r={}){super(),this.bodyA=e??null,this.bodyB=t??null,r.anchorA&&this.anchorA.copy(r.anchorA),r.anchorB&&this.anchorB.copy(r.anchorB)}set needsUpdate(e){e&&k(this)}jointDesc(){return{type:"fixed"}}};var nt=class extends A{isScene=!0;type="Scene";gravity=new y(0,-9.81,0);environment=null;background=null;fog=null;wetness=0;rain=0;cloudCover=0},Ce=class{uuid=`tex${++or}`;uri;colorSpace;repeat=[1,1];offset=[0,0];wrap="repeat";data;needsUpdate=!1;constructor(e,t="srgb"){this.uri=e,this.colorSpace=t}},or=0;var jr=1,Ir=2,q=class{isMaterial=!0;isMeshStandardMaterial=!0;uuid=`mat${++or}`;type="standard";needsUpdate=!1;name="";color=new M(16777215);roughness=1;metalness=0;emissive=new M(0);emissiveIntensity=1;opacity=1;map=null;normalMap=null;normalScale=[1,1];roughnessMap=null;metalnessMap=null;aoMap=null;emissiveMap=null;side="front";flatShading=!1;wireframe=!1;vertexColors=!1;userData={};alphaTest=0;transparent=!1;shader=null;constructor(e={}){this.setValues(e)}setValues(e){for(let[t,r]of Object.entries(e))r!==void 0&&(t==="color"||t==="emissive"||t==="specular"?this[t]=new M(r):this[t]=r);return this}get doubleSided(){return this.side==="double"||this.side===Ir||this.side===jr}dispose(){}copy(e){for(let[t,r]of Object.entries(e))t!=="uuid"&&(this[t]=r instanceof M?r.clone():Array.isArray(r)?[...r]:r);return this.needsUpdate=!0,this}clone(){return new this.constructor().copy(this)}},_=class{name;params;textures;code;helpers;constructor(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e))throw new Error(`MaterialFunction name "${e}" must be an identifier`);if(this.name=e,this.params=t.params??{},this.textures=t.textures??[],this.code=t.code,this.helpers=t.helpers??"",this.textures.length>8)throw new Error(`${e}: at most 8 textures`)}with(e={},t={}){return{fn:this,params:e,textures:t}}},ae=class extends q{isMeshPhysicalMaterial=!0;type="physical";clearcoat=0;clearcoatRoughness=0;transmission=0;transmissionMap=null;ior=1.5;specularIntensity=1;constructor(e={}){super(),this.setValues(e)}};var st=class extends q{isMeshBasicMaterial=!0;constructor(e={}){super(),this.setValues(e)}};var $=class extends A{isMesh=!0;type="Mesh";get dynamicGeometry(){return this._dynamicGeometry??!1}set dynamicGeometry(e){this._dynamicGeometry=e,k(this)}constructor(e,t=new q){super(),this.geometry=e,this.material=t}get geometry(){return this._geometry}set geometry(e){this._geometry=e,k(this)}get material(){return this._material}set material(e){this._material=Array.isArray(e)?[...e]:e,k(this)}get materials(){return Array.isArray(this._material)?this._material:[this._material]}},Re=class{name;params;code;helpers;constructor(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e))throw new Error(`ParticleFunction name "${e}" must be an identifier`);this.name=e,this.params=t.params??{},this.code=t.code,this.helpers=t.helpers??""}with(e={}){return{fn:this,params:e}}},Me=class extends A{type="Particles";count;emitter;material;emitterArea;constructor(e){if(super(),!(e.count>=0)||!Number.isInteger(e.count))throw new Error("Particles: count must be a whole number >= 0");if(e.emitterArea!==void 0&&!(e.emitterArea>0))throw new Error("Particles: emitterArea must be > 0");this.count=e.count,this.emitter=e.emitter,this.material=e.material,this.emitterArea=e.emitterArea??0,this.castShadow=!1}};var ke=class extends A{type="GpuParticles";capacity;program;material;rate;collide;emitterArea;pendingSpawns=[];constructor(e){if(super(),!(e.capacity>0)||!Number.isInteger(e.capacity)||e.capacity>1<<21)throw new Error("GpuParticles: capacity must be a whole number from 1 to 2097152");if(e.rate!==void 0&&!(e.rate>=0&&Number.isFinite(e.rate)))throw new Error("GpuParticles: rate must be a finite number >= 0");if(e.emitterArea!==void 0&&!(e.emitterArea>0))throw new Error("GpuParticles: emitterArea must be > 0");if(e.material.transparent)throw new Error("GpuParticles: transparent materials are not supported yet (opaque or alpha-tested)");let t=e.collide??{};if(t.plane!==void 0&&!Number.isFinite(t.plane))throw new Error("GpuParticles: collide.plane must be a finite number");for(let r of["restitution","friction"]){let n=t[r];if(n!==void 0&&!(n>=0&&n<=1))throw new Error(`GpuParticles: collide.${r} must be from 0 to 1`)}this.capacity=e.capacity,this.program=e.program,this.material=e.material,this.rate=e.rate??0,this.collide={...t},this.emitterArea=e.emitterArea??0,this.castShadow=!1}spawn(e){let t=e instanceof Float32Array?e:new Float32Array(e);if(t.length%8!==0)throw new TypeError("GpuParticles.spawn: 8 numbers per particle");if(!t.every(Number.isFinite))throw new TypeError("GpuParticles.spawn: numbers must be finite");t.length&&(this.pendingSpawns.push(t.slice()),k(this))}},K=class{name;params;code;helpers;animated;constructor(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e))throw new Error(`VolumeFunction name "${e}" must be an identifier`);this.name=e,this.params=t.params??{},this.code=t.code,this.helpers=t.helpers??"",this.animated=t.animated??/\bi\.time\b/.test(t.code+this.helpers)}with(e={}){return{fn:this,params:e}}},it=class{name;params;code;helpers;constructor(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e))throw new Error(`GridProgram name "${e}" must be an identifier`);this.name=e,this.params=t.params??{},this.code=t.code,this.helpers=t.helpers??""}with(e={}){return{program:this,params:e}}};var le=class extends A{type="VolumeMesh";shape;volume;majorant;anisotropy;homogeneous;grid;get animated(){return this.volume.fn.animated||!!this.grid?.program}constructor(e){if(super(),!(e.majorant>0&&Number.isFinite(e.majorant)))throw new Error("VolumeMesh: majorant must be a finite number > 0 (1/m)");if(this.grid=e.grid??null,this.grid){if((e.shape??"box")!=="box")throw new Error("VolumeMesh: a density grid needs a box volume");if(this.grid._owner)throw new Error("VolumeMesh: the density grid already belongs to another volume");this.grid._owner=this}this.shape=e.shape??"box",this.volume=e.volume,this.majorant=e.majorant,this.anisotropy=e.anisotropy??0,this.homogeneous=e.homogeneous??!1,this.castShadow=!1}},Te=class{name;code;helpers;constructor(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e))throw new Error(`GeometryFunction name "${e}" must be an identifier`);this.name=e,this.code=t.code,this.helpers=t.helpers??""}},ee=class s{fn;boxes;data;uri=null;needsUpdate=!1;static fromAsset(e,t){let r=new s(e,[]);return r.uri=t,r}constructor(e,t,r=new Uint32Array(0)){if(t.length%6!==0)throw new Error("ProceduralGeometry: boxes are six numbers each (min xyz, max xyz)");this.fn=e,this.boxes=Float32Array.from(t),this.data=r instanceof Float32Array?new Uint32Array(r.buffer.slice(r.byteOffset,r.byteOffset+r.byteLength)):Uint32Array.from(r)}},Se=class extends A{type="ProceduralMesh";constructor(e,t=new q){super(),this.geometry=e,this.materials=Array.isArray(t)?t:[t]}get geometry(){return this._geometry}set geometry(e){this._geometry=e,k(this)}get materials(){return this._materials}set materials(e){if(e.length===0)throw new Error("ProceduralMesh: at least one material");this._materials=[...e],k(this)}},we=class{isInstancedBufferAttribute=!0;array;itemSize;usage=Mt;version=0;constructor(e,t){this.array=e instanceof Float32Array?e:Float32Array.from(e),this.itemSize=t,Object.defineProperty(this,"_owner",{value:void 0,writable:!0})}get count(){return this.array.length/this.itemSize}set needsUpdate(e){e&&(this.version++,this._owner&&k(this._owner))}setUsage(e){return this.usage=e,this}},ue=class s extends A{type="InstancedMesh";isMesh=!0;isInstancedMesh=!0;instanceMatrix;boundingBox=null;boundingSphere=null;constructor(e,t=new q,r=1){if(super(),!Number.isInteger(r)||r<0)throw new Error("InstancedMesh: count must be an integer >= 0");this.geometry=e,this.material=t;let n=new Float32Array(r*16);for(let i=0;i<r;i++)n[i*16]=n[i*16+5]=n[i*16+10]=n[i*16+15]=1;this.instanceMatrix=this.own(new we(n,16)),this._count=r,this._color=null,this._instData=null}get geometry(){return this._geometry}set geometry(e){this._geometry=e,k(this)}get material(){return this._materials[0]}set material(e){let t=Array.isArray(e)?e:[e];if(t.length===0)throw new Error("InstancedMesh: at least one material");this._materials=[...t],k(this)}get materials(){return this._materials}get count(){return this._count}set count(e){this._count=e,k(this)}get instanceColor(){return this._color}set instanceColor(e){this._color=e&&this.own(e),k(this)}get instanceCustomData(){return this._instData}set instanceCustomData(e){this._instData=e&&this.own(e),k(this)}setMatrixAt(e,t){this.instanceMatrix.array.set(t.elements,e*16)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}setColorAt(e,t){this.instanceColor??=new we(new Float32Array(this.instanceMatrix.count*3).fill(1),3),t.toArray(this.instanceColor.array,e*3)}getColorAt(e,t){return this._color?t.fromArray(this._color.array,e*3):t.setRGB(1,1,1)}setCustomDataAt(e,t){if(!this.instanceCustomData){let r=new Float32Array(this.instanceMatrix.count*4);for(let n=0;n<r.length;n+=4)r.set(this.customData,n);this.instanceCustomData=new we(r,4)}for(let r=0;r<4;r++)this.instanceCustomData.array[e*4+r]=t[r]??0}getCustomDataAt(e,t=[]){for(let r=0;r<4;r++)t[r]=this._instData?this._instData.array[e*4+r]:this.customData[r];return t}computeBoundingBox(){}computeBoundingSphere(){}dispose(){return this}copy(e,t=!0){if(super.copy(e,t),e instanceof s){let r=n=>this.own(new we(n.array.slice(),n.itemSize).setUsage(n.usage));this.instanceMatrix=r(e.instanceMatrix),this._color=e._color&&r(e._color),this._instData=e._instData&&r(e._instData)}return this}own(e){return e._owner=this,e}},T=class extends A{type="GLTFModel";uri;nodes;functions;constructor(e,t={}){super(),this.uri=e,this.nodes=t.nodes??null,this.functions=t.functions??null,this.animation=t.animation??null}get animation(){return this._animation}set animation(e){this._animation=e,k(this)}};function Cr(){return{mapSize:new ye(512,512),camera:{near:.5,far:500,left:-5,right:5,top:5,bottom:-5,fov:90,updateProjectionMatrix(){}},bias:0,normalBias:0,radius:1,blurSamples:8}}var E=class extends A{isLight=!0;color;intensity;shadow=Cr();volumetricScattering=1;specularScale=1;constructor(e=16777215,t=1){super(),this.color=new M(e),this.intensity=t}get looksDownNegativeZ(){return!0}},ot=class extends E{target=new A},C=class extends ot{isDirectionalLight=!0;type="DirectionalLight";angularDiameter=.5357;constructor(e=16777215,t=1){super(e,t),this.position.set(0,1,0)}setSunAngles(e,t){let r=e*Math.PI/180,n=t*Math.PI/180;return this.position.set(Math.sin(n)*Math.cos(r),Math.sin(r),Math.cos(n)*Math.cos(r)).multiplyScalar(100),this.target=new A,this}},G=class extends E{isPointLight=!0;type="PointLight";distance;decay;radius=.02;constructor(e=16777215,t=1,r=0,n=2){super(e,t),this.distance=r,this.decay=n}},F=class extends ot{isSpotLight=!0;type="SpotLight";distance;angle;penumbra;decay;radius=.02;constructor(e=16777215,t=1,r=0,n=Math.PI/3,i=0,o=2){super(e,t),this.distance=r,this.angle=n,this.penumbra=i,this.decay=o}},ce=class extends E{type="RectAreaLight";width;height;distance=0;barnDoorAngle=90;card=!0;constructor(e=16777215,t=1,r=10,n=10){super(e,t),this.width=r,this.height=n}},Fe=class extends A{isLight=!0;isAmbientLight=!0;type="AmbientLight";color;intensity;constructor(e=16777215,t=1){super(),this.color=new M(e),this.intensity=t}},Be=class extends A{isLight=!0;isHemisphereLight=!0;type="HemisphereLight";color;groundColor;intensity;constructor(e=16777215,t=16777215,r=1){super(),this.color=new M(e),this.groundColor=new M(t),this.intensity=r}},Oe={mode:"auto",compensation:0,minEv100:-10,maxEv100:20},j=class s extends A{isCamera=!0;isPerspectiveCamera=!0;type="PerspectiveCamera";fov;aspect;near;far;exposure={...Oe};get exposureIsDefault(){let e=this.exposure;return e===this._defaultExposure&&e.mode==="auto"&&e.compensation===Oe.compensation&&e.minEv100===Oe.minEv100&&e.maxEv100===Oe.maxEv100}dof=null;constructor(e=50,t=1,r=.1,n=2e3){super(),this._defaultExposure=this.exposure,this.fov=e,this.aspect=t,this.near=r,this.far=n}get looksDownNegativeZ(){return!0}setManualExposure(e){return this.exposure={mode:"manual",ev100:e},this}setAutoExposure(e=0,t=-10,r=20){return this.exposure={mode:"auto",compensation:e,minEv100:t,maxEv100:r},this}updateProjectionMatrix(){}copy(e,t=!0){return super.copy(e,t),e instanceof s&&(this._defaultExposure={...Oe},this.exposure=e.exposureIsDefault?this._defaultExposure:{...e.exposure},this.dof=e.dof&&{...e.dof}),this}},me=class{kind="atmosphere";sun;groundAlbedo=new M().setRGB(.401978,.401978,.401978);rayleighScale=1;mieScale=1;mieAnisotropy=.8;skyLightIntensity=1;dynamic=!1;glow=new M(7045043);glowIntensity=0;horizonGlow=new M(16757867);horizonGlowIntensity=0;horizonGlowHeight=.06;aerialPerspective=0;constructor(e={}){this.sun=e.sun??null,e.groundAlbedo!==void 0&&(this.groundAlbedo=new M(e.groundAlbedo)),e.skyLightIntensity!==void 0&&(this.skyLightIntensity=e.skyLightIntensity),e.dynamic!==void 0&&(this.dynamic=e.dynamic),e.glow!==void 0&&(this.glow=new M(e.glow)),e.glowIntensity!==void 0&&(this.glowIntensity=e.glowIntensity),e.horizonGlow!==void 0&&(this.horizonGlow=new M(e.horizonGlow)),e.horizonGlowIntensity!==void 0&&(this.horizonGlowIntensity=e.horizonGlowIntensity),e.horizonGlowHeight!==void 0&&(this.horizonGlowHeight=e.horizonGlowHeight),e.aerialPerspective!==void 0&&(this.aerialPerspective=e.aerialPerspective)}},te=class{kind="color";color;intensity;skyLightIntensity=1;constructor(e=16777215,t=1){this.color=new M(e),this.intensity=t}},Ae=class{kind="hdri";texture;intensity;rotation;skyLightIntensity=1;constructor(e,t=1,r=0){this.texture=e,this.intensity=t,this.rotation=r}},at=class{kind="gradient";zenith;horizon;ground;intensity;horizonExponent=null;glow=null;clouds=null;skyLightIntensity=1;constructor(e={}){this.zenith=new M(e.zenith??659488),this.horizon=new M(e.horizon??2763322),this.ground=new M(e.ground??526344),this.intensity=e.intensity??1}setGlow(e,t=1,r=.15,n){return this.glow={color:new M(e),intensity:t,height:r,...n??{}},this}setClouds(e,t,r=1,n=0){return this.clouds={coverage:e,color:new M(t),scale:r,seed:n},this}},lt=class s{density;heightFalloff;color;intensity=1;height=0;startDistance=0;maxOpacity=1;volumetric=null;constructor(e=.02,t=.2,r=16777215){this.density=e,this.heightFalloff=t,this.color=new M(r)}setVolumetric(e=.5,t=.6){return this.volumetric={scattering:e,anisotropy:t},this}static fromUnreal(e){let t=Math.LN2,r=new s(e.fogDensity*t*t/10,e.fogHeightFalloff*t/10,new M().setRGB(...e.inscatteringLuminance));if(r.height=(e.height??0)/100,r.startDistance=(e.startDistance??0)/100,r.maxOpacity=e.maxOpacity??1,e.volumetric){let n=new M((e.volumetric.albedo[0]<<16|e.volumetric.albedo[1]<<8|e.volumetric.albedo[2])>>>0);r.volumetric={scattering:1,anisotropy:e.volumetric.scatteringDistribution,extinctionScale:e.volumetric.extinctionScale/(2*t*t),albedo:[n.r,n.g,n.b],distance:e.volumetric.distance/100}}return r}},Le=class extends lt{isFog=!0;constructor(e=16777215,t=1,r=1e3){super(0,0,e),this._near=t,this.far=r}get near(){return this._near}set near(e){this._near=e,this.update()}get far(){return this._far}set far(e){this._far=e,this.update()}update(){this.density=Math.log(20)/Math.max(this._far-this._near,.001),this.startDistance=Math.max(this._near,0)}},ut=class extends lt{isFogExp2=!0;constructor(e=16777215,t=25e-5){super(t,0,e)}};function z(s){return s instanceof y?[s.x,s.y,s.z]:[s.r,s.g,s.b]}var U=class extends Ce{width;height;pixels;constructor(e,t,r,n="srgb"){if(super(`generated:${e}x${t}`,n),r.length!==e*t*4)throw new RangeError(`DataTexture: ${r.length} bytes are not ${e}x${t} RGBA8 pixels`);this.width=e,this.height=t,this.pixels=r}},ct=class extends U{stream;constructor(e,t,r,n,i="srgb"){if(super(t,r,n??Rr(t,r),i),!e||e.length>64||e.includes("|"))throw new RangeError(`StreamTexture: a stream's name is 1 to 64 characters without "|", not ${JSON.stringify(e)}`);this.stream=e,this.wrap="clamp"}};function Rr(s,e){let t=new Uint8Array(s*e*4);for(let r=3;r<t.length;r+=4)t[r]=255;return t}var Ve=2**30,At=new A;At.name="engine colliders";var mt="broken",We=["map","normalMap","roughnessMap","metalnessMap","aoMap","emissiveMap"],pt=class s{scene;camera;options;engine;nextId=1;objects=new Map;byName=new Map;nameFloor=new Map;geometries=new Map;faceted=new WeakMap;procGeometries=new Map;geometryCode=new Map;textures=new Map;materials=new Map;functions=new Map;functionCode=new Map;particleLayouts=new Map;particleCode=new Map;programLayouts=new Map;programCode=new Map;volumeLayouts=new Map;volumeCode=new Map;gridIds=new Map;gridVersions=new Map;gridLayouts=new Map;gridCode=new Map;lights=new Map;cameras=new Map;envKey="";settingsKey="";trs=new Float32Array(10);scratch=new Float64Array(Math.max(ht,dt));changes={objects:new Set,structure:!0};untrack;epoch=0;nextBody=1;nextSlot=0;freeSlots=[];bodies=0;contactBodies=0;joints=new Map;jointsDirty=!1;engineJoints=new Set;engineEpoch=0;bodyError=null;rescaled=new Set;gravity="0,-9.81,0";constructor(e,t,r,n={}){this.engine=e,this.scene=t,this.camera=r,this.options=n,this.untrack=tr(this.changes)}dispose(){this.untrack()}objectNamed(e){return this.byName.get(e)}nameOf(e){return this.objects.get(e)?.name}boundObjects(){return[...this.byName]}counts(){return{objects:this.objects.size,materials:this.materials.size,geometries:this.geometries.size,textures:this.textures.size}}sync(){let e={created:0,updated:0,removed:0},t=this.changes;if(t.structure||!this.objects.has(this.camera)){t.structure=!1,t.objects.clear();let a=++this.epoch,u=(m,h)=>{let c=this.bindObject(m,h,e);c.epoch=a;for(let d of m.children)u(d,c.id)};for(let m of this.scene.children)u(m,null);this.objects.get(this.camera)?.epoch!==a&&u(this.camera,null);for(let[m,h]of this.objects){if(h.epoch===a)continue;this.dropBody(m,h),m instanceof Ie&&this.dropJoint(m),this.engine.remove(h.id),this.objects.delete(m),this.byName.delete(h.name);let c=h.name.lastIndexOf("_"),d=Number(h.name.slice(c+1));c>0&&Number.isInteger(d)&&d>=1&&d<(this.nameFloor.get(h.name.slice(0,c))??1)&&this.nameFloor.set(h.name.slice(0,c),d),m instanceof E&&this.lights.delete(m),m instanceof j&&this.cameras.delete(m),e.removed++}}else if(t.objects.size){let a=[...t.objects];t.objects.clear();for(let u of a){let m=this.objects.get(u);m&&this.bindObject(u,m.parent,e)}}for(let[a,u]of this.lights){let m=lr(a,this.scratch),h=u.light!==null;for(let c=0;h&&c<dt;c++)h=u.light[c]===m[c];h||(this.kindKey(a)!==u.kind?this.bindObject(a,u.parent,e):(u.light=m.slice(0,dt),this.engine.light(u.id,Pe(a)),e.updated++)),(a instanceof C||a instanceof F)&&a.target&&this.sendTransform(a,u,e)}for(let[a,u]of this.cameras){let m=JSON.stringify(this.cameraDesc(a));m!==u.camera&&(u.camera=m,this.engine.camera(u.id,this.cameraDesc(a)),e.updated++)}for(let a of this.geometries.keys())a.needsUpdate&&this.geometryId(a);for(let a of this.textures.keys())a.needsUpdate&&this.textureId(a);for(let[a,u]of this.materials)this.materialChanged(a,u)&&(this.engine.material(u.id,this.materialDesc(a,u)),e.updated++);let r=this.environmentDesc(),n=JSON.stringify(r);n!==this.envKey&&(this.envKey=n,this.engine.environment(r),e.updated++);for(let a of this.rescaled){let u=this.objects.get(a);u&&(a.physics||u.body)&&this.syncBody(a,u,e)}this.rescaled.clear(),this.syncPhysics(e);let i=this.options,o={name:i.name??(this.scene.name||"scene"),preset:i.preset??"cinematic",width:i.width??1280,height:i.height??720,time:i.time??0,camera:this.objects.get(this.camera).id,...i.overrides?{overrides:i.overrides}:{}},l=JSON.stringify(o);if(l!==this.settingsKey&&(this.settingsKey=l,this.engine.settings(o),e.updated++),this.bodyError!==null){let a=this.bodyError;throw this.bodyError=null,a}return e}uniqueName(e){let t=e.stableId??(e.name&&!this.byName.has(e.name)?e.name:"");if(t&&this.byName.has(t)){if(e.stableId)throw new Error(`duplicate object id "${e.stableId}"`);t=""}if(!t){let r=e.name||e.type.toLowerCase(),n=(this.nameFloor.get(r)??1)-1;do t=`${r}_${++n}`;while(this.byName.has(t));this.nameFloor.set(r,n+1)}return t}bindObject(e,t,r){let n=this.objects.get(e),i=this.kindKey(e);if(!n||n.kind!==i||n.parent!==t){let a=!n;if(!n){let u=this.uniqueName(e);n={id:this.nextId++,name:u,parent:t,kind:i,trs:new Float64Array(10).fill(NaN),visible:!0,power:1,custom:"0,0,0,0",sway:"",light:null,camera:"",anim:null,inst:null,epoch:0,body:null,bodyFailed:null},this.objects.set(e,n),this.byName.set(u,e),e instanceof E&&this.lights.set(e,n),e instanceof j&&this.cameras.set(e,n)}n.parent=t,n.kind=i,this.dropBody(e,n),this.engine.object(n.id,this.objectDesc(e,n)),n.light=e instanceof E?lr(e,this.scratch).slice(0,dt):null,n.camera=e instanceof j?JSON.stringify(this.cameraDesc(e)):"",n.trs.fill(NaN),n.visible=!0,n.power=1,n.custom="0,0,0,0",n.sway="",n.anim=e instanceof T?Pt(e):null,n.inst=null,a?r.created++:r.updated++}if(this.sendTransform(e,n,r)&&this.rescaleBodiesBelow(e),e.visible!==n.visible&&(n.visible=e.visible,this.engine.visible(n.id,e.visible),r.updated++),e.power!==n.power){if(!(e.power>=0)||!Number.isFinite(e.power))throw new TypeError(`${n.name}: power must be a finite number >= 0`);n.power=e.power,this.engine.power(n.id,e.power),r.updated++}let o=e.customData.join(",");if(o!==n.custom){if(!e.customData.every(Number.isFinite))throw new TypeError(`${n.name}: customData must be finite numbers`);n.custom=o,this.engine.customData(n.id,[...e.customData]),r.updated++}let l=e.sway?JSON.stringify(e.sway):"";if(l!==n.sway){let a=e.sway;if(a&&![a.direction,a.strength,a.frequency,a.stiffness,a.phase??0].every(Number.isFinite))throw new TypeError(`${n.name}: sway must be finite numbers`);n.sway=l,this.engine.sway(n.id,a?{...a}:null),r.updated++}if(e instanceof T){let a=Pt(e);Tr(a,n.anim)||(n.anim=a,this.engine.animation(n.id,a),r.updated++)}if((e.physics||n.body)&&this.syncBody(e,n,r),e instanceof Ie&&(this.joints.has(e)||this.joints.set(e,null),this.jointsDirty=!0),e instanceof ue&&this.sendInstances(e,n,r),e instanceof le&&e.grid){let a=e.grid,u=this.gridId(a);if(this.gridVersions.get(a)!==a.version&&(this.gridVersions.set(a,a.version),this.engine.densityGrid(u,this.gridDesc(a),a.data),r.updated++),a.pendingSources.length){let m=new Float32Array(a.pendingSources.reduce((c,d)=>c+d.length,0)),h=0;for(let c of a.pendingSources)m.set(c,h),h+=c.length;a.pendingSources=[],this.engine.gridSources(n.id,m),r.updated++}}if(e instanceof ke&&e.pendingSpawns.length){let a=e.pendingSpawns.reduce((h,c)=>h+c.length,0),u=new Float32Array(a),m=0;for(let h of e.pendingSpawns)u.set(h,m),m+=h.length;e.pendingSpawns=[],this.engine.particlesSpawn(n.id,u),r.updated++}return n}sendInstances(e,t,r){let n=e.instanceMatrix.count;if(!Number.isInteger(e.count)||e.count<0||e.count>n)throw new TypeError(`${t.name}: count must be an integer from 0 to ${n}`);let i=t.inst??={count:-1,m:[null,-1],c:[null,-1],d:[null,-1]},o=(m,h,c,d)=>{if(!m||h[0]===m&&h[1]===m.version)return null;let p=m.array;if(p.length!==n*c)throw new TypeError(`${t.name}: ${d} must have ${c} numbers for each of the ${n} instances`);return h[0]=m,h[1]=m.version,p},l=o(e.instanceMatrix,i.m,16,"instanceMatrix"),a=o(e.instanceColor,i.c,3,"instanceColor"),u=o(e.instanceCustomData,i.d,4,"instanceCustomData");(l||a||u||e.count!==i.count)&&(i.count=e.count,this.engine.instances(t.id,e.count,l,a,u),r.updated++)}sendTransform(e,t,r){let n=Lr(e),i=this.trs;i[0]=e.position.x,i[1]=e.position.y,i[2]=e.position.z,i[3]=n.x,i[4]=n.y,i[5]=n.z,i[6]=n.w,i[7]=e.scale.x,i[8]=e.scale.y,i[9]=e.scale.z;let o=!1,l=!1,a=!1;for(let u=0;u<10;u++)t.trs[u]!==i[u]&&(o=!0,l||=u<7,a||=u>=7&&!Number.isNaN(t.trs[u]),t.trs[u]=i[u]);return o&&(this.engine.transform(t.id,i),l&&t.body&&this.engine.physics("follow",{body:t.body.id}),r.updated++),a}rescaleBodiesBelow(e){if(this.bodies)for(let t of e.children)t.traverse(r=>{let n=this.objects.get(r);(n?.body||n&&r.physics)&&this.rescaled.add(r)})}syncBody(e,t,r){let n=e.physics,i=Br(e),o=e instanceof $?e.geometry:null,l=t.body;if(l&&n===l.desc&&o===l.geometry&&(o?.version??0)===l.version&&i[0]===l.scale[0]&&i[1]===l.scale[1]&&i[2]===l.scale[2])return;if(this.dropBody(e,t),!n){t.bodyFailed=null;return}if(t.bodyFailed===n)return;let a=this.nextBody++,u=n.type??"dynamic",m=u==="fixed"?-1:this.freeSlots.pop()??this.nextSlot++,h=!1;try{let{shape:c,position:d}=this.colliderShape(e,n,i,t.name);for(let[p,f]of Object.entries(n))if(typeof f=="number"&&!Number.isFinite(f))throw new TypeError(`${t.name}: physics.${p} must be a finite number`);rr(this.engine),this.engine.physics("body",{id:a,kind:u,object:t.id,...m>=0?{slot:m}:{},...n.linearDamping!==void 0?{linearDamping:n.linearDamping}:{},...n.angularDamping!==void 0?{angularDamping:n.angularDamping}:{},...n.gravityScale!==void 0?{gravityScale:n.gravityScale}:{},...n.canSleep===!1?{canSleep:!1}:{},...n.ccd?{ccd:!0}:{}}),h=!0,this.engine.physics("collider",{id:a,body:a,shape:c,...d?{position:d}:{},...n.mass!==void 0?{mass:n.mass}:n.density!==void 0?{density:n.density}:{},...n.friction!==void 0?{friction:n.friction}:{},...n.restitution!==void 0?{restitution:n.restitution}:{},...n.sensor?{sensor:!0}:{},...n.contacts?{events:!0}:{}})}catch(c){h&&this.engine.physics("remove",{body:a}),m>=0&&this.freeSlots.push(m),t.bodyFailed=n,this.bodyError??=c;return}t.bodyFailed=null,t.body={id:a,slot:m,epoch:0,trs:t.trs,euler:!1,desc:n,scale:i,geometry:o,version:o?.version??0,contacts:!!n.contacts},ir(e,t.body),this.jointsDirty=!0,this.bodies++,n.contacts&&this.contactBodies++,r.updated++}dropBody(e,t){let r=t.body;r&&(this.engine.physics("remove",{body:r.id}),r.slot>=0&&this.freeSlots.push(r.slot),St(e),t.body=null,this.jointsDirty=!0,this.bodies--,r.contacts&&this.contactBodies--)}dropJoint(e){let t=this.joints.get(e);t&&t.key!==mt&&this.engine.physics("remove",{joint:t.id}),this.joints.delete(e),this.engineJoints.delete(e),e.broken=!1}colliderShape(e,t,r,n){let i=t.type==="fixed",o=[Math.abs(r[0]),Math.abs(r[1]),Math.abs(r[2])],l=Math.abs(o[0]-o[1])<=1e-6*o[0]&&Math.abs(o[0]-o[2])<=1e-6*o[0],a=t.shape;if(a!==void 0&&typeof a!="string"){if(a.type==="box")return{shape:{type:"box",halfExtents:[a.halfExtents[0]*o[0],a.halfExtents[1]*o[1],a.halfExtents[2]*o[2]]}};let b=Math.max(o[0],o[1],o[2]);if(a.type==="sphere")return{shape:{type:"sphere",radius:a.radius*b}};if(a.type==="capsule")return{shape:{type:"capsule",halfHeight:a.halfHeight*o[1],radius:a.radius*Math.max(o[0],o[2])}};throw new TypeError(`${n}: physics.shape must be "box", "sphere", "capsule", "hull", "mesh" or a box / sphere / capsule with sizes`)}if(!(e instanceof $))throw new TypeError(`${n}: physics on an object that is not a mesh needs a shape with sizes ({ type: "box", halfExtents }, ...)`);let u=e.geometry;if(a??=u instanceof Ee?"box":u instanceof Ke&&l?"sphere":u instanceof et&&l?"capsule":i?"mesh":"hull",a==="hull"||a==="mesh"){if(a==="mesh"&&!i)throw new TypeError(`${n}: a "mesh" shape (the geometry's triangles) is for fixed bodies; a body that moves takes "hull" or a box / sphere / capsule`);return{shape:{type:a==="hull"?"convexHull":"trimesh",geometry:this.geometryId(u),scale:r}}}u.boundingBox||u.computeBoundingBox();let{min:m,max:h}=u.boundingBox,c=[(m.x+h.x)/2*r[0],(m.y+h.y)/2*r[1],(m.z+h.z)/2*r[2]],d=[Math.max((h.x-m.x)/2*o[0],.001),Math.max((h.y-m.y)/2*o[1],.001),Math.max((h.z-m.z)/2*o[2],.001)],f=c.every(b=>Math.abs(b)<1e-9)?{}:{position:c};if(a==="box")return{shape:{type:"box",halfExtents:d},...f};if(a==="sphere")return{shape:{type:"sphere",radius:Math.max(d[0],d[1],d[2])},...f};if(a==="capsule"){let b=Math.max(d[0],d[2]);return d[1]-b>1e-6?{shape:{type:"capsule",halfHeight:d[1]-b,radius:b},...f}:{shape:{type:"sphere",radius:b},...f}}throw new TypeError(`${n}: physics.shape must be "box", "sphere", "capsule", "hull", "mesh" or a box / sphere / capsule with sizes`)}syncPhysics(e){let t=this.scene.gravity,r=`${t.x},${t.y},${t.z}`;if(r!==this.gravity){if(![t.x,t.y,t.z].every(Number.isFinite))throw new TypeError("scene.gravity must be finite numbers");this.gravity=r,this.engine.physics("gravity",{gravity:[t.x,t.y,t.z]}),e.updated++}this.engineJoints.size&&this.takeJointChanges();let i=de()?.epoch?.()??0;i!==this.engineEpoch&&(this.engineEpoch=i,this.jointsDirty=!0);let o=this.jointsDirty?this.joints:[];this.jointsDirty=!1;for(let[l,a]of o){let{a:u,b:m,desc:h,key:c,shape:d}=this.jointDescOf(l);if(c!==(a?.key??"")&&a?.key!==mt){if(a&&h&&d===a.shape){let{a:p,b:f,anchor1:b,anchor2:g,axis:w,...v}=h;this.engine.physics("joint_set",{id:a.id,...v}),this.joints.set(l,{id:a.id,key:c,shape:d}),e.updated++;continue}if(a&&this.engine.physics("remove",{joint:a.id}),h){let p=this.nextBody++;this.engine.physics("joint",{id:p,...h}),this.joints.set(l,{id:p,key:c,shape:d}),u.id>=Ve||m.id>=Ve?this.engineJoints.add(l):this.engineJoints.delete(l)}else this.joints.set(l,null),this.engineJoints.delete(l);e.updated++}}for(let l of sr()){let a=this.objects.get(l.object)?.body;a&&(this.engine.physics(l.op,{body:a.id,...l.args}),e.updated++)}this.bodies&&nr()}jointDescOf(e){let t=de(),r=d=>{if(!d)return;let p=t?.bodyOf(d);return p!==void 0?{id:p,scale:[1,1,1]}:this.objects.get(d)?.body},n=r(e.bodyA),i=r(e.bodyB);if(!n||!i)return{desc:null,key:"",shape:""};let[o,l]=[n.scale,i.scale],a={...e.jointDesc(),a:n.id,b:i.id,anchor1:[e.anchorA.x*o[0],e.anchorA.y*o[1],e.anchorA.z*o[2]],anchor2:[e.anchorB.x*l[0],e.anchorB.y*l[1],e.anchorB.z*l[2]]},{limits:u,motor:m,length:h,...c}=a;return{a:n,b:i,desc:a,key:JSON.stringify(a),shape:JSON.stringify(c)}}takeJointChanges(){let e=JSON.parse(this.engine.physics("joint_changes",{}));if(!e?.moved?.length&&!e?.broken?.length)return;let t=new Map;for(let i of this.engineJoints){let o=this.joints.get(i);o&&t.set(o.id,i)}for(let i of e.moved??[]){let o=t.get(i.joint),l=de()?.object(i.body);if(!o||!l)continue;i.end==="a"?(o.bodyA=l,o.anchorA.set(i.anchor[0],i.anchor[1],i.anchor[2])):(o.bodyB=l,o.anchorB.set(i.anchor[0],i.anchor[1],i.anchor[2]));let{key:a,shape:u}=this.jointDescOf(o);a&&this.joints.set(o,{id:i.joint,key:a,shape:u})}let r=[];for(let i of e.broken??[]){let o=t.get(i);o&&(this.joints.set(o,{id:-1,key:mt,shape:mt}),this.engineJoints.delete(o),o.broken=!0,r.push(o))}let n=null;for(let i of r)try{i.dispatchEvent({type:"broken",target:i})}catch(o){n??=o}if(n!==null)throw n}deliverPhysicsEvents(){this.bodies&&this.takeFaults(),this.engineJoints.size&&this.takeJointChanges();let e=de()?.frame()??!1;if(!this.contactBodies&&!e)return;let t=JSON.parse(this.engine.physics("contacts",{}));if(!t?.length)return;let r=[],n=(i,o)=>i!==null?oe.get(i)??(i>=Ve?de()?.object(i):void 0):o!==void 0&&o>=Ve?At:void 0;for(let i of t){let o=n(i.bodyA,i.a),l=n(i.bodyB,i.b);if(!o||!l)continue;r.push({a:o,b:l,started:i.started});let a=i.started?"contactstart":"contactend";o.dispatchEvent({type:a,other:l}),l.dispatchEvent({type:a,other:o})}r.length&&this.scene.dispatchEvent({type:"contacts",contacts:r})}takeFaults(){let e=JSON.parse(this.engine.physics("faults",{}));if(!e?.length)return;let t=[],r=[];for(let n of e){let i=oe.get(n.body),o=i&&this.objects.get(i),l=o?.body;!i||!o||!l||l.id!==n.body||(l.slot>=0&&this.freeSlots.push(l.slot),St(i),o.body=null,o.bodyFailed=i.physics,this.jointsDirty=!0,this.bodies--,l.contacts&&this.contactBodies--,n.kind==="leftWorld"?r.push(i):t.push(`${o.name} (${n.reason})`))}t.length&&(this.bodyError??=new Error(`physics: the engine took out the bodies of ${t.join(", ")}; each stays without one until its physics is set again`));for(let n of r)n.dispatchEvent({type:"outofworld"})}kindKey(e){return`${this.kindOf(e)}${e.movable?":movable":""}${ur(e)?":body":""}`}kindOf(e){if(e instanceof ue)return`instanced:${e.geometry instanceof ee?`p${this.proceduralId(e.geometry)}`:`${this.geometryId(e.geometry)}`}:${e.materials.map(r=>this.materialId(r)).join(",")}:${e.instanceMatrix.count}:${e.castShadow}`;if(e instanceof $)return`mesh:${this.geometryId(this.drawnGeometry(e))}:${this.meshMaterials(e).join(",")}:${e.castShadow}:${e.dynamicGeometry||e.geometry.dynamic}`;if(e instanceof Se)return`procedural:${this.proceduralId(e.geometry)}:${e.materials.map(t=>this.materialId(t)).join(",")}:${e.castShadow}`;if(e instanceof le)return`volume:${e.shape}:${JSON.stringify(this.volumeBinding(e.volume))}:${e.majorant}:${e.anisotropy}:${e.homogeneous}:${e.animated}:${e.grid?this.gridId(e.grid):""}`;if(e instanceof ke)return`gpuParticles:${e.capacity}:${JSON.stringify(this.particleProgram(e.program))}:${this.materialId(e.material)}:${e.castShadow}:${e.emitterArea}:${e.rate}:${JSON.stringify(e.collide)}`;if(e instanceof Me)return`particles:${e.count}:${JSON.stringify(this.particleEmitter(e.emitter))}:${this.materialId(e.material)}:${e.castShadow}:${e.emitterArea}`;if(e instanceof T)return`model:${e.uri}:${e.nodes?.join(",")??""}:${e.castShadow}:${e.functions?JSON.stringify(this.modelFunctions(e)):""}`;if(e instanceof E){let t=Pe(e);return`light:${t.type}:${t.castShadow}:${t.type==="rect"?t.visible!==!1:""}`}return e instanceof j?"camera":`group:${e.castShadow}`}objectDesc(e,t){let r={name:t.name,parent:t.parent,castShadow:e.castShadow,...e.movable?{movable:!0}:{},...ur(e)?{body:!0}:{}};if(e instanceof ue){let n=e.geometry,i=n instanceof ee?this.proceduralId(n):this.geometryId(n);return{...r,kind:"instanced",geometry:i,...n instanceof ee?{procedural:!0}:{},materials:e.materials.map(o=>this.materialId(o)),count:e.instanceMatrix.count}}if(e instanceof $){let n=this.meshMaterials(e);return{...r,kind:"mesh",geometry:this.geometryId(this.drawnGeometry(e)),material:n[0],...n.length>1?{materials:n}:{},...e.dynamicGeometry||e.geometry.dynamic?{dynamicGeometry:!0}:{}}}if(e instanceof Se)return{...r,kind:"procedural",geometry:this.proceduralId(e.geometry),materials:e.materials.map(n=>this.materialId(n))};if(e instanceof le)return{...r,kind:"volume",shape:e.shape,volume:this.volumeBinding(e.volume),majorant:e.majorant,g:e.anisotropy,...e.homogeneous?{homogeneous:!0}:{},...e.animated?{animated:!0}:{},...e.grid?{grid:this.gridId(e.grid)}:{}};if(e instanceof ke)return{...r,kind:"gpuParticles",capacity:e.capacity,program:this.particleProgram(e.program),material:this.materialId(e.material),rate:e.rate,collide:{...e.collide},...e.emitterArea>0?{emitterArea:e.emitterArea}:{}};if(e instanceof Me)return{...r,kind:"particles",count:e.count,emitter:this.particleEmitter(e.emitter),material:this.materialId(e.material),...e.emitterArea>0?{emitterArea:e.emitterArea}:{}};if(e instanceof T){let n=Pt(e);return{...r,kind:"model",uri:e.uri,...e.nodes?{nodes:[...e.nodes]}:{},...n?{animation:n}:{},...e.functions?{functions:this.modelFunctions(e)}:{}}}return e instanceof E?{...r,kind:"light",light:Pe(e)}:e instanceof j?{...r,kind:"camera",camera:this.cameraDesc(e)}:{...r,kind:"group"}}meshMaterials(e){let t=e.materials;return t.length>1&&!e.geometry.groups.length&&he("unsupported","a material array on a geometry without groups (the first is drawn)"),(e.geometry.groups.length?t:t.slice(0,1)).map(r=>this.materialId(r))}drawnGeometry(e){if(!e.materials.some(r=>r.flatShading))return e.geometry;let t=this.faceted.get(e.geometry);if(!t||t.version!==e.geometry.version){let r=e.geometry.toNonIndexed();r.computeVertexNormals(),t={geometry:r,version:e.geometry.version},this.faceted.set(e.geometry,t)}return t.geometry}geometryId(e){let t=this.geometries.get(e);if(t===void 0||e.needsUpdate){t??=this.nextId++,this.geometries.set(e,t),e.needsUpdate=!1;let r=e.vertexCount,n=e.triangleIndices(),i=e.normals.length===r*3?e.normals:(()=>{let a=new se;return a.positions=e.positions,a.index=n,a.computeVertexNormals().normals})(),o=e.uvs.length===r*2?e.uvs:new Float32Array(r*2),l=e.groups.length?Uint32Array.from(e.groups.flatMap(a=>[a.start,Math.min(a.count,n.length-a.start),a.materialIndex])):null;this.engine.geometry(t,e.positions,i,o,n,l,Vr(e))}return t}proceduralId(e){let t=this.procGeometries.get(e);if(t===void 0||e.needsUpdate){let r=e.fn,n=`fn gf_${r.name}(i: GIn) -> GOut {
    var o = GOut(-1.0, vec3<f32>(0.0, 1.0, 0.0), 0u, vec2<f32>(0.0));
${r.code}
    return o;
}
`,i=this.geometryCode.get(r.name);if(i!==void 0&&i!==n)throw new Error(`two different geometry functions named ${r.name}`);i===void 0&&(this.geometryCode.set(r.name,n),this.engine.geometryFunction(r.name,n,r.helpers)),t??=this.nextId++,this.procGeometries.set(e,t),e.needsUpdate=!1,e.uri!==null?this.engine.proceduralAsset(t,r.name,e.uri):this.engine.procedural(t,r.name,e.boxes,e.data)}return t}textureId(e){if(!e)return;let t=this.textures.get(e);if(t===void 0||e.needsUpdate){t??=this.nextId++,this.textures.set(e,t),e.needsUpdate=!1;let r=e instanceof U,n={...r||e.data?{}:{uri:e.uri},...r?{size:[e.width,e.height]}:{},...e instanceof ct?{stream:e.stream}:{},srgb:e.colorSpace==="srgb",wrap:e.wrap!=="clamp",repeat:[...e.repeat],offset:[...e.offset]};this.engine.texture(t,n,r?e.pixels:e.data??null)}return t}materialId(e){let t=this.materials.get(e);return t||(t={id:this.nextId++,hot:new Float64Array(ht),shader:null,maps:[]},this.materials.set(e,t),this.engine.material(t.id,this.materialDesc(e,t))),t.id}materialChanged(e,t){if(e.needsUpdate||e.shader!==t.shader)return!0;let r=ar(e,this.scratch);for(let n=0;n<ht;n++)if(r[n]!==t.hot[n])return!0;for(let n=0;n<We.length;n++)if((e[We[n]]??null)!==t.maps[n])return!0;return e instanceof ae&&e.transmissionMap!==(t.maps[We.length]??null)}materialDesc(e,t){e.needsUpdate=!1,t.hot.set(ar(e,this.scratch).subarray(0,ht)),t.shader=e.shader,t.maps=We.map(n=>e[n]??null),e instanceof ae&&t.maps.push(e.transmissionMap);let r={name:e.name||`material_${t.id}`,color:z(e.color),opacity:e.opacity,metalness:e.metalness,roughness:e.roughness,emissive:z(e.emissive),emissiveIntensity:e.emissiveIntensity,doubleSided:e.doubleSided};e instanceof st&&(r.unlit=!0),e.side===1&&he("unsupported","BackSide (drawn double-sided)"),e.wireframe&&he("unsupported","wireframe materials (drawn solid)"),e.vertexColors&&(r.vertexColors=!0);for(let n of We){let i=this.textureId(e[n]);i!==void 0&&(r[n]=i)}if(e.normalMap&&(r.normalScale=[...e.normalScale]),e.alphaTest>0&&(r.alphaTest=e.alphaTest),e.transparent&&(r.transparent=!0),e.shader&&(r.shader=this.shaderBinding(e.shader)),e instanceof ae){Object.assign(r,{clearcoat:e.clearcoat,clearcoatRoughness:e.clearcoatRoughness,transmission:e.transmission,ior:e.ior,specularIntensity:e.specularIntensity});let n=this.textureId(e.transmissionMap);n!==void 0&&(r.transmissionMap=n)}return r}layoutOf(e){let t=this.functions.get(e);if(t)return t;let r=new Map,n=0,i=null;for(let[u,m]of Object.entries(e.params))typeof m=="number"?((!i||i.used===4)&&(i={slot:n++,used:0}),r.set(u,{slot:i.slot,comp:i.used++,vec:!1})):r.set(u,{slot:n++,comp:0,vec:!0});if(n>8)throw new Error(`material function ${e.name}: parameters exceed 8 vec4`);let o=e.code.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g,(u,m)=>{let h=r.get(m);if(h)return h.vec?`m.mp[${h.slot}]`:`m.mp[${h.slot}].${"xyzw"[h.comp]}`;let c=e.textures.indexOf(m);if(c>=0)return`${c}u`;throw new Error(`material function ${e.name}: unknown $${m}`)}),l=`fn mf_${e.name}(i: MatIn, m: Material, base: MatOut) -> MatOut {
    var o = base;
${o}
    return o;
}
`,a=this.functionCode.get(e.name);if(a!==void 0&&a!==l)throw new Error(`two different material functions named ${e.name}`);return a===void 0&&(this.functionCode.set(e.name,l),this.engine.shader(e.name,l,e.helpers??"")),t={slots:r},this.functions.set(e,t),t}volumeBinding(e){let t=e.fn,r=this.volumeLayouts.get(t);if(!r){let i=new Map,o=0,l=null;for(let[h,c]of Object.entries(t.params))typeof c=="number"?((!l||l.used===4)&&(l={slot:o++,used:0}),i.set(h,{slot:l.slot,comp:l.used++,vec:!1})):i.set(h,{slot:o++,comp:0,vec:!0});if(o>8)throw new Error(`volume function ${t.name}: parameters exceed 8 vec4`);let a=t.code.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g,(h,c)=>{let d=i.get(c);if(!d)throw new Error(`volume function ${t.name}: unknown $${c}`);return d.vec?`p[${d.slot}]`:`p[${d.slot}].${"xyzw"[d.comp]}`}),u=`fn vf_${t.name}(i: VIn, p: array<vec4<f32>, 8>) -> VOut {
    var o = VOut(0.0, vec3<f32>(1.0), vec3<f32>(0.0));
${a}
    return o;
}
`,m=this.volumeCode.get(t.name);if(m!==void 0&&m!==u)throw new Error(`two different volume functions named ${t.name}`);m===void 0&&(this.volumeCode.set(t.name,u),this.engine.volumeFunction(t.name,u,t.helpers)),this.volumeLayouts.set(t,i),r=i}let n=new Array(32).fill(0);for(let[i,o]of r){let l=e.params[i]??t.params[i];o.vec?l.forEach((a,u)=>n[o.slot*4+u]=a):n[o.slot*4+o.comp]=l}return{id:t.name,params:n}}static paramSlots(e,t){let r=new Map,n=0,i=null;for(let[o,l]of Object.entries(t))typeof l=="number"?((!i||i.used===4)&&(i={slot:n++,used:0}),r.set(o,{slot:i.slot,comp:i.used++,vec:!1})):r.set(o,{slot:n++,comp:0,vec:!0});if(n>8)throw new Error(`${e}: parameters exceed 8 vec4`);return r}static substitute(e,t,r){return t.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g,(n,i)=>{let o=r.get(i);if(!o)throw new Error(`${e}: unknown $${i}`);return o.vec?`p[${o.slot}]`:`p[${o.slot}].${"xyzw"[o.comp]}`})}gridDesc(e){return{size:[...e.size],channels:e.channels,...e.program?{program:this.gridProgram(e.program)}:{}}}gridId(e){let t=this.gridIds.get(e);return t===void 0&&(t=this.nextId++,this.gridIds.set(e,t),this.gridVersions.set(e,e.version),this.engine.densityGrid(t,this.gridDesc(e),e.data)),t}gridProgram(e){let t=e.program,r=this.gridLayouts.get(t);if(!r){let i=`grid program ${t.name}`,o=s.paramSlots(i,t.params),l=`fn gp_${t.name}(s_in: Cell, i: CIn, p: array<vec4<f32>, 8>) -> Cell {
    var s = s_in;
${s.substitute(i,t.code,o)}
    return s;
}
`,a=this.gridCode.get(t.name);if(a!==void 0&&a!==l)throw new Error(`two different grid programs named ${t.name}`);a===void 0&&(this.gridCode.set(t.name,l),this.engine.gridProgram(t.name,l,t.helpers)),this.gridLayouts.set(t,o),r=o}let n=new Array(32).fill(0);for(let[i,o]of r){let l=e.params[i]??t.params[i];o.vec?l.forEach((a,u)=>n[o.slot*4+u]=a):n[o.slot*4+o.comp]=l}return{id:t.name,params:n}}particleProgram(e){let t=e.program,r=this.programLayouts.get(t);if(!r){let i=`particle program ${t.name}`,o=s.paramSlots(i,t.params),l=`fn pe_${t.name}(i: EIn, p: array<vec4<f32>, 8>) -> PState {
    var s: PState;
    s.pos = i.at;
    s.life = 1.0;
    s.color = i.color;
    s.size = 0.05;
${s.substitute(i,t.emit,o)}
    return s;
}
`,a=`fn pu_${t.name}(s_in: PState, i: UIn, p: array<vec4<f32>, 8>) -> PState {
    var s = s_in;
${s.substitute(i,t.update,o)}
    return s;
}
`,u=this.programCode.get(t.name);if(u!==void 0&&u!==l+a)throw new Error(`two different particle programs named ${t.name}`);u===void 0&&(this.programCode.set(t.name,l+a),this.engine.particleProgram(t.name,l,a,t.helpers)),this.programLayouts.set(t,o),r=o}let n=new Array(32).fill(0);for(let[i,o]of r){let l=e.params[i]??t.params[i];o.vec?l.forEach((a,u)=>n[o.slot*4+u]=a):n[o.slot*4+o.comp]=l}return{id:t.name,params:n}}particleEmitter(e){let t=e.fn,r=this.particleLayouts.get(t);if(!r){let i=new Map,o=0,l=null;for(let[h,c]of Object.entries(t.params))typeof c=="number"?((!l||l.used===4)&&(l={slot:o++,used:0}),i.set(h,{slot:l.slot,comp:l.used++,vec:!1})):i.set(h,{slot:o++,comp:0,vec:!0});if(o>8)throw new Error(`particle function ${t.name}: parameters exceed 8 vec4`);let a=t.code.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g,(h,c)=>{let d=i.get(c);if(!d)throw new Error(`particle function ${t.name}: unknown $${c}`);return d.vec?`p[${d.slot}]`:`p[${d.slot}].${"xyzw"[d.comp]}`}),u=`fn pf_${t.name}(i: PIn, p: array<vec4<f32>, 8>) -> POut {
    var o = POut(i.pivot, vec3<f32>(0.0), vec3<f32>(0.0), true, vec4<f32>(0.0));
${a}
    return o;
}
`,m=this.particleCode.get(t.name);if(m!==void 0&&m!==u)throw new Error(`two different particle functions named ${t.name}`);m===void 0&&(this.particleCode.set(t.name,u),this.engine.particleFunction(t.name,u,t.helpers)),this.particleLayouts.set(t,i),r=i}let n=new Array(32).fill(0);for(let[i,o]of r){let l=e.params[i]??t.params[i];o.vec?l.forEach((a,u)=>n[o.slot*4+u]=a):n[o.slot*4+o.comp]=l}return{id:t.name,params:n}}modelFunctions(e){return Object.entries(e.functions??{}).map(([t,r])=>({prefix:t,shader:this.shaderBinding(r)}))}shaderBinding(e){let t=this.layoutOf(e.fn),r=new Array(32).fill(0);for(let[n,i]of t.slots){let o=e.params[n]??e.fn.params[n];i.vec?o.forEach((l,a)=>r[i.slot*4+a]=l):r[i.slot*4+i.comp]=o}for(let n of Object.keys(e.textures))if(!e.fn.textures.includes(n))throw new Error(`material function ${e.fn.name}: unknown texture ${n}`);return{id:e.fn.name,params:r,textures:e.fn.textures.map(n=>this.textureId(e.textures[n]??null)??null)}}ambientSky(){let e=[0,0,0],t=[0,0,0],r=[0,0,0],n=!1,i=!1,o=a=>{if(a.visible){a instanceof Fe?(z(a.color).forEach((u,m)=>e[m]+=u*a.intensity),n=!0):a instanceof Be&&(z(a.color).forEach((u,m)=>t[m]+=u*a.intensity),z(a.groundColor).forEach((u,m)=>r[m]+=u*a.intensity),n=i=!0);for(let u of a.children)o(u)}};if(o(this.scene),!n)return null;if(!i)return{type:"color",color:e,intensity:1/Math.PI,skyLightIntensity:1};let l=a=>a.map((u,m)=>u+e[m]);return{type:"gradient",zenith:l(t),horizon:l(t.map((a,u)=>(a+r[u])/2)),ground:l(r),intensity:1/Math.PI,skyLightIntensity:1}}cameraDesc(e){let t=Fr(e);return e.exposureIsDefault&&this.ambientSky()&&(t.exposure={mode:"manual",ev100:0},he("mapped","camera exposure: three.js's (EV 0) in a scene lit by ambient lights")),t}lightLevel(){let e=0;return this.scene.traverse(t=>{t.visible&&(t instanceof Fe||t instanceof Be||t instanceof C)&&(e+=t.intensity)}),Math.max(e,1)/Math.PI}environmentDesc(){let e=this.scene,t={sky:this.skyDesc()};if(e.background?t.background=z(e.background).map(r=>r*this.lightLevel()):!e.environment&&t.sky.type!=="atmosphere"&&this.ambientSky()&&(t.background=[0,0,0]),e.fog){let r=e.fog;t.fog={type:"exponentialHeight",density:r.density,heightFalloff:r.heightFalloff,color:z(r.color)},r.intensity!==1&&(t.fog.intensity=r.intensity),r.height&&(t.fog.height=r.height),r.startDistance&&(t.fog.startDistance=r.startDistance),r.maxOpacity<1&&(t.fog.maxOpacity=r.maxOpacity),r.volumetric&&(t.fog.volumetric={...r.volumetric,...r.volumetric.albedo?{albedo:[...r.volumetric.albedo]}:{}}),(r instanceof Le||r instanceof ut)&&(t.fog.intensity=this.lightLevel()*r.intensity,he("mapped",`${r instanceof Le?"Fog":"FogExp2"}: uniform exponential fog`))}return e.wetness>0&&(t.wetness=e.wetness),e.rain>0&&(t.rain=e.rain),e.cloudCover>0&&(t.cloudCover=Math.min(1,e.cloudCover)),t}skyDesc(){let e=this.scene.environment;if(!e){let t=this.ambientSky();if(t)return t}if(!e){let t=null;this.scene.traverse(r=>{!t&&r instanceof C&&(t=r)}),e=t?new me({sun:t}):new te(0,0)}if(e instanceof me){let t=e.sun?this.objects.get(e.sun)?.id:null;if(e.sun&&t===void 0)throw new Error("SkyAtmosphere.sun must be part of the scene");let r={type:"atmosphere",sun:t??null,groundAlbedo:z(e.groundAlbedo),rayleighScale:e.rayleighScale,mieScale:e.mieScale,mieAnisotropy:e.mieAnisotropy,skyLightIntensity:e.skyLightIntensity};return e.dynamic&&(r.dynamic=!0),e.glowIntensity>0&&(r.glow=z(e.glow).map(n=>n*e.glowIntensity)),e.horizonGlowIntensity>0&&(r.horizonGlow=[...z(e.horizonGlow).map(n=>n*e.horizonGlowIntensity),e.horizonGlowHeight]),e.aerialPerspective>0&&(r.aerial=e.aerialPerspective),r}if(e instanceof te)return{type:"color",color:z(e.color),intensity:e.intensity,skyLightIntensity:e.skyLightIntensity};if(e instanceof at){let t={type:"gradient",zenith:z(e.zenith),horizon:z(e.horizon),ground:z(e.ground),intensity:e.intensity,skyLightIntensity:e.skyLightIntensity};if(e.horizonExponent!==null&&(t.horizonExponent=e.horizonExponent),e.glow){let{color:r,...n}=e.glow;t.glow={color:z(r),...n}}if(e.clouds){let{color:r,map:n,...i}=e.clouds;t.clouds={color:z(r),...i,...n?{map:this.textureId(n)}:{}}}return t}if(e instanceof Ae)return{type:"hdri",texture:this.textureId(e.texture),intensity:e.intensity,rotation:e.rotation,skyLightIntensity:e.skyLightIntensity};throw new Error("unsupported environment")}},ht=11;function ar(s,e){return e[0]=s.color.r,e[1]=s.color.g,e[2]=s.color.b,e[3]=s.emissive.r,e[4]=s.emissive.g,e[5]=s.emissive.b,e[6]=s.emissiveIntensity,e[7]=s.roughness,e[8]=s.metalness,e[9]=s.opacity,e[10]=s.side==="double"?1:0,e}var dt=16;function lr(s,e){let t=s;return e[0]=s.color.r,e[1]=s.color.g,e[2]=s.color.b,e[3]=s.intensity,e[4]=s.castShadow?1:0,e[5]=s.volumetricScattering,e[6]=s.specularScale,e[7]=t.distance??0,e[8]=t.radius??0,e[9]=t.angle??0,e[10]=t.penumbra??0,e[11]=t.width??0,e[12]=t.height??0,e[13]=t.barnDoorAngle??0,e[14]=t.card?1:0,e[15]=t.angularDiameter??0,e}function Pt(s){let e=s.animation;if(!e)return null;let t=s.name||s.uri;if(e.clip!==void 0&&typeof e.clip!="string")throw new TypeError(`${t}: animation's clip is a name`);if(e.time!==void 0&&!Number.isFinite(e.time))throw new TypeError(`${t}: animation's time must be finite`);if(!e.clip&&!e.nodes)throw new TypeError(`${t}: animation needs a clip or nodes`);let r={clip:e.clip??"",time:e.time??0,loop:e.loop??!0};if(e.nodes){let n={};for(let[i,o]of Object.entries(e.nodes)){let l=Array.from(o);if(l.length!==4&&l.length!==7||!l.every(Number.isFinite))throw new TypeError(`${t}: animation node "${i}" needs 4 finite numbers (a rotation) or 7 (a translation, a rotation)`);n[i]=l}r.nodes=n}return r}function Tr(s,e){if(!s||!e)return s===e;if(s.clip!==e.clip||s.time!==e.time||s.loop!==e.loop)return!1;let t=s.nodes,r=e.nodes;if(!t||!r)return t===r;let n=Object.keys(t);if(n.length!==Object.keys(r).length)return!1;for(let i of n){let o=t[i],l=r[i];if(!l||o.length!==l.length)return!1;for(let a=0;a<o.length;a++)if(o[a]!==l[a])return!1}return!0}function Fr(s){return{fov:s.fov,near:s.near,far:s.far,exposure:{...s.exposure},...s.dof?{dof:{...s.dof}}:{}}}function Pe(s){let e={color:z(s.color),castShadow:s.castShadow,...s.volumetricScattering!==1?{volumetricScattering:s.volumetricScattering}:{},...s.specularScale!==1?{specularScale:s.specularScale}:{}};if(s instanceof C)return{...e,type:"directional",intensity:s.intensity,angularDiameter:s.angularDiameter};if((s instanceof F||s instanceof G)&&s.decay!==2&&he("mapped","light decay: always 2 (inverse square, physical)"),s instanceof F)return{...e,type:"spot",intensity:s.intensity,radius:s.radius,range:s.distance,angle:s.angle,penumbra:s.penumbra};if(s instanceof G)return{...e,type:"point",intensity:s.intensity,radius:s.radius,range:s.distance};if(s instanceof ce)return{...e,type:"rect",intensity:s.intensity,width:s.width,height:s.height,...s.distance?{range:s.distance}:{},...s.barnDoorAngle<90?{barnDoorAngle:s.barnDoorAngle}:{},...s.card?{}:{visible:!1}};throw new Error(`unsupported light ${s.type}`)}function ur(s){let e=s.physics;return e!==null&&e.type!=="fixed"}function Br(s){let e=1,t=1,r=1;for(let n=s;n;n=n.parent){let i=n.scale;e*=i.x,t*=i.y,r*=i.z}return[e,t,r]}function Lr(s){if(!((s instanceof C||s instanceof F)&&s.target))return s.quaternion;s.updateWorldMatrix(!0,!1),s.target.parent&&s.target.updateWorldMatrix(!0,!1);let e=new y().setFromMatrixPosition(s.matrixWorld),t=s.target.parent?new y().setFromMatrixPosition(s.target.matrixWorld):s.target.position.clone(),r=new O().lookAt(e,t,Math.abs(new y().subVectors(t,e).normalize().y)>.999?new y(0,0,1):s.up),n=new D().setFromRotationMatrix(r);if(s.parent){let i=new D;s.parent.matrixWorld.decompose(new y,i,new y),n.premultiply(new D(-i.x,-i.y,-i.z,i.w))}return n}function Vr(s){let e=s.attributes.color;if(!e||e.count!==s.vertexCount||e.itemSize<3)return null;let t=e.normalized&&e.array instanceof Uint8Array?1/255:e.normalized&&e.array instanceof Uint16Array?1/65535:1,r=new Float32Array(e.count*3);for(let n=0;n<e.count;n++)for(let i=0;i<3;i++)r[n*3+i]=e.array[n*e.itemSize+i]*t;return r}var _t=`
fn std_h21(p: vec2<f32>) -> f32 { return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453); }
`,zt=(s,e,t)=>new Uint8Array([s,e,t,255]),_n=new U(1,1,zt(255,255,255),"linear"),zn=new U(1,1,zt(0,0,0),"linear"),Dn=new U(1,1,zt(128,128,255),"linear");var $n=new _("std_facade",{params:{P0:[330,260,170,160],P1:[420,.55,90,0],Tint:[1,1,1,1],TexScale:300,Bright:1},textures:["WallD","WallR","WallN","Grime"],helpers:_t,code:`
    let WP = ue_pos(i.wp);
    let N = ue_vec(i.n);
    let OP = ue_pos(i.op);
    let OB = ue_vec(i.ob) * 100.0;
    let an = abs(N);
    var fuv = WP.xz;
    if (an.z > 0.7) { fuv = WP.xy; } else if (an.x > an.y) { fuv = WP.yz; }
    fuv = fuv / $TexScale;
    let uvm = 100.0 / $TexScale;
    let WallC = msample_color(m, i, $WallD, fuv, uvm).rgb;
    let WallR = msample(m, i, $WallR, fuv, uvm).r;
    let Grime = msample(m, i, $Grime, vec2<f32>(WP.x + WP.y, WP.z) / 1700.0, 100.0 / 1700.0).r;
    let Wet = i.wetness;
    let P0 = $P0;
    let P1 = $P1;
    var wall = WallC * $Tint.rgb * mix(1.0, 0.72, Grime);
    var rough = WallR;
    var emis = vec3<f32>(0.0);
    var mask = 0.0;
    if (an.z > 0.7) {
        wall = wall * 0.55 * mix(1.0, 0.6, Wet);
    } else {
        var u: f32;
        var side: f32;
        if (an.x > an.y) { u = WP.y - (OP.y - OB.y * 0.5); side = OB.y; } else { u = WP.x - (OP.x - OB.x * 0.5); side = OB.x; }
        let topZ = OP.z + OB.z * 0.5;
        let floorH = P0.x; let bay = P0.y; let ww = P0.z; let wh = P0.w;
        let groundH = P1.x; let litChance = P1.y; let sill = P1.z;
        let nb = max(1.0, floor(side / bay));
        let bayA = side / nb;
        let cu = floor(u / bayA);
        let lu = fract(u / bayA) * bayA - bayA * 0.5;
        let vv = WP.z - groundH;
        let seed = dot(floor(OP.xy / 100.0), vec2<f32>(0.0131, 0.0173)) + P1.w * 3.7;
        if (vv > 0.0 && WP.z < topZ - floorH * 0.35) {
            let cv = floor(vv / floorH);
            let lv = fract(vv / floorH) * floorH;
            let cell = vec2<f32>(cu, cv) + seed * 11.0;
            let h1 = std_h21(cell);
            let h2 = std_h21(cell * 1.37 + 5.1);
            let h3 = std_h21(cell * 2.11 + 9.7);
            let hf = std_h21(vec2<f32>(cv, seed * 7.0));
            let dd = max(abs(lu) - ww * 0.5, abs(lv - (sill + wh * 0.5)) - wh * 0.5);
            if (dd < 0.0) {
                mask = 1.0;
                let lit = (h1 * 0.6 + hf * 0.4) < litChance;
                let h4 = std_h21(cell * 3.3 + 1.7);
                var c = vec3<f32>(0.4, 0.7, 1.0);
                if (h2 < 0.45) { c = vec3<f32>(1.0, 0.86, 0.66); } else if (h2 < 0.68) { c = vec3<f32>(0.7, 0.82, 1.0); } else if (h2 < 0.82) { c = vec3<f32>(1.0, 0.55, 0.28); } else if (h2 < 0.92) { c = vec3<f32>(0.95, 0.4, 0.75); }
                let yN = saturate((lv - sill) / wh);
                let xN = saturate(lu / ww + 0.5);
                var room = mix(0.18, 1.0, smoothstep(0.15, 0.95, yN)) * mix(0.55, 1.0, 1.0 - abs(xN - 0.5) * 1.6);
                room *= 1.0 - 0.6 * step(yN, 0.32) * step(0.5, fract(xN * (2.0 + floor(h4 * 4.0)) + h4));
                if (h3 < 0.35) { room *= 0.6 + 0.4 * step(0.4, fract(yN * 18.0)); }
                if (h3 > 0.72) { room *= mix(0.1, 1.0, step(0.6 - h4 * 0.3, abs(xN - 0.5) * 2.0)); }
                let mull = 1.0 - step(abs(lu), 1.2) * step(0.5, fract(h2 * 7.0));
                let glass = mix(0.015, 0.04, h3);
                wall = vec3<f32>(glass, glass * 1.1, glass * 1.25);
                rough = 0.035;
                let level = mix(0.35, 1.6, h4 * h4);
                if (lit) { emis = c * room * mull * level * $Bright; }
            } else if (dd < 5.0) {
                wall = vec3<f32>(0.09, 0.09, 0.1);
                rough = 0.3;
            }
            if (lv < 10.0) { wall *= 0.6; }
        }
        wall *= mix(1.0, 0.62, Wet * (1.0 - mask));
        rough = mix(rough, min(rough, 0.2), Wet * (1.0 - mask));
    }
    o.base = wall;
    o.roughness = rough;
    o.metallic = 0.0;
    o.specular = 0.5;
    o.emissive = emis * i.power;
    let tn = msample(m, i, $WallN, fuv, uvm).xyz * 2.0 - 1.0;
    o.normal = tangent_normal(i, normalize(mix(tn, vec3<f32>(0.0, 0.0, 1.0), saturate(mask + Wet * 0.4))));`});var En=new _("std_wet_ground",{params:{Tint:[1,1,1,1],TexScale:250,PuddleScale:1100,PuddleAmount:1,RoughMul:1},textures:["D","R","N","Puddle"],helpers:_t,code:`
    let WP = ue_pos(i.wp);
    let uv = WP.xy / $TexScale;
    let uvm = 100.0 / $TexScale;
    let D = msample_color(m, i, $D, uv, uvm).rgb;
    let R = msample(m, i, $R, uv, uvm).r;
    let Nt = msample(m, i, $N, uv, uvm).xyz * 2.0 - 1.0;
    let Puddle = msample(m, i, $Puddle, WP.xy / $PuddleScale, 100.0 / $PuddleScale).r;
    let Wet = i.wetness;
    let th = mix(0.98, 0.5, Wet * $PuddleAmount);
    let pud = smoothstep(th, th + 0.035, Puddle);
    let damp = smoothstep(th - 0.12, th, Puddle);
    let wetAll = saturate(Wet);
    var nrm = vec2<f32>(0.0);
    if (i.rain > 0.01 && i.depth == 0u) {
        for (var L = 0; L < 2; L++) {
            let pl = WP.xy / select(19.0, 26.0, L == 0) + f32(L) * 3.7;
            let ci = floor(pl);
            for (var j = -1; j <= 1; j++) {
                for (var k = -1; k <= 1; k++) {
                    let c = ci + vec2<f32>(f32(k), f32(j));
                    let h = std_h21(c);
                    let h2 = std_h21(c + 19.19);
                    let ctr = c + vec2<f32>(h, h2) * 0.8 + 0.1;
                    let t = fract(i.time * 1.1 + h * 7.0);
                    let dv = pl - ctr;
                    let dist = length(dv);
                    let x = (dist - t * 0.85) * 22.0;
                    let env = exp(-x * x * 0.35) * (1.0 - t) * (1.0 - t) * step(h2, i.rain);
                    if (dist > 1e-4) { nrm += dv / dist * cos(x) * env; }
                }
            }
        }
    }
    // Normals in world space (UE's are tangent space of an unrotated ground plane = world XY).
    var n = normalize(mix(tangent_normal(i, Nt), i.ng, saturate(wetAll * 0.55 + pud)));
    n = normalize(mix(n, from_ue_vec(normalize(vec3<f32>(-nrm * 0.55, 1.0))), pud));
    n = normalize(n + from_ue_vec(vec3<f32>(-nrm * 0.12 * wetAll * (1.0 - pud), 0.0)));
    o.normal = n;
    var r = mix(R * $RoughMul, R * $RoughMul * 0.32, wetAll);
    r = mix(r, 0.13, damp * wetAll * 0.5);
    o.roughness = mix(r, 0.015, pud);
    var col = D * $Tint.rgb;
    col *= mix(1.0, 0.42, wetAll);
    col = mix(col, col * 0.35, damp * wetAll);
    o.base = mix(col, col * 0.18, pud);
    o.metallic = 0.0;
    o.specular = 0.5;`});var On=new _("std_triplanar",{params:{Tint:[1,1,1,1],TexScale:200,RoughMul:1,WetScale:1,Metallic:0},textures:["D","R","N"],code:`
    let WP = ue_pos(i.wp);
    let N = ue_vec(i.n);
    let an = abs(N);
    var uv = WP.xz;
    if (an.z > 0.6) { uv = WP.xy; } else if (an.x > an.y) { uv = WP.yz; }
    uv = uv / $TexScale;
    let uvm = 100.0 / $TexScale;
    let D = msample_color(m, i, $D, uv, uvm).rgb;
    let R = msample(m, i, $R, uv, uvm).r;
    let Nt = msample(m, i, $N, uv, uvm).xyz * 2.0 - 1.0;
    let up = saturate(N.z);
    let w = i.wetness * $WetScale * mix(0.6, 1.0, up);
    o.roughness = mix(R * $RoughMul, R * $RoughMul * 0.35, w);
    o.normal = tangent_normal(i, normalize(mix(Nt, vec3<f32>(0.0, 0.0, 1.0), w * 0.5)));
    o.base = D * $Tint.rgb * mix(1.0, 0.5, w);
    o.metallic = $Metallic;
    o.specular = 0.5;`});var jn=new _("std_paint",{params:{Color:[.3,.3,.32,1],Roughness:.45,GrimeAmt:.6,WetScale:1,Metallic:0},textures:["Grime"],code:`
    let WP = ue_pos(i.wp);
    let G = msample(m, i, $Grime, (WP.xy + WP.zz) / 300.0, 100.0 / 300.0).r;
    let wet = i.wetness * $WetScale;
    o.roughness = mix($Roughness, $Roughness * 0.4, wet) * mix(1.0, 1.3, G * $GrimeAmt);
    o.base = $Color.rgb * mix(1.0, 0.7, G * $GrimeAmt) * mix(1.0, 0.75, wet);
    o.metallic = $Metallic;
    o.specular = 0.5;`});var In=new _("std_sign",{params:{UVTile:[1,1,0,0],UVOffsetPan:[0,0,0,0],Intensity:12,Power:1,Flicker:0,BaseDim:.08,Roughness:.22,Blink:0,BlinkPhase:0},textures:["SignTex"],helpers:_t,code:`
    let uv = i.uv * $UVTile.xy + $UVOffsetPan.xy + $UVOffsetPan.zw * i.time;
    let t = msample_color(m, i, $SignTex, uv, exp2(i.uvd) * max($UVTile.x, $UVTile.y));
    let OP = ue_pos(i.op);
    let h = std_h21(OP.xy * 0.0137 + OP.z * 0.0071);
    let tt = i.time * (5.0 + h * 9.0) + h * 100.0;
    let n = std_h21(vec2<f32>(floor(tt), h * 31.0));
    let n2 = std_h21(vec2<f32>(floor(tt * 0.13), h * 17.0));
    let drop = step(1.0 - 0.3, n) * step(0.55, n2);
    let buzz = 0.94 + 0.06 * sin(i.time * 113.0 + h * 10.0);
    let f = mix(1.0, buzz * (1.0 - drop * 0.97), saturate($Flicker));
    let blink = select(1.0, step(0.5, fract(i.time * $Blink + $BlinkPhase)), $Blink > 0.0);
    o.emissive = t.rgb * $Intensity * $Power * f * blink * i.power;
    o.base = t.rgb * $BaseDim;
    o.roughness = $Roughness;
    o.metallic = 0.0;
    o.specular = 0.5;
    o.opacity = t.a;`});var Cn=new _("std_led_screen",{params:{LedRes:[320,160,0,0],Cycle:7,Seed:0,PlasmaAmt:1,LedAmt:.6,Intensity:10,Power:1},textures:["ScreenTex"],code:`
    let UV = i.uv;
    let t = i.time;
    let Tex = msample_color(m, i, $ScreenTex, UV, exp2(i.uvd)).rgb;
    let seg = floor(t / $Cycle + $Seed);
    let mode = step(0.5, fract(seg * 0.5));
    var plasma = 0.5 + 0.5 * cos(6.2831 * (vec3<f32>(0.0, 0.33, 0.67) * 0.6 + UV.x * 0.5 + sin(UV.y * 2.0 + t * 0.4) * 0.25 + t * 0.05 + $Seed));
    plasma = mix(vec3<f32>(dot(plasma, vec3<f32>(0.33))), plasma, 0.65);
    let bars = step(0.5, fract(UV.y * 6.0 - t * 0.4));
    plasma *= mix(0.6, 1.0, bars);
    let sweep = pow(saturate(1.0 - abs(fract(UV.x * 0.5 - t * 0.21 + $Seed) * 2.0 - 1.0) * 5.0), 2.0);
    let c = mix(Tex, Tex * 0.5 + plasma * 0.5, mode * $PlasmaAmt) + sweep * 0.18;
    let g = fract(UV * $LedRes.xy);
    let led = smoothstep(0.0, 0.2, g.x) * smoothstep(1.0, 0.8, g.x) * smoothstep(0.0, 0.2, g.y) * smoothstep(1.0, 0.8, g.y);
    o.emissive = c * mix(1.0, led * 1.7, $LedAmt) * $Intensity * $Power * i.power;
    o.base = vec3<f32>(0.01, 0.01, 0.012);
    o.roughness = 0.12;
    o.metallic = 0.0;
    o.specular = 0.5;`});var Rn=new _("std_light",{params:{Color:[1,.9,.7,1],Intensity:20,Power:1,Blink:0,Rate:.7,Phase:0},code:`
    let blink = mix(1.0, step(0.5, fract(i.time * $Rate + $Phase)), $Blink);
    o.emissive = $Color.rgb * $Intensity * $Power * blink * i.power;
    o.base = vec3<f32>(0.05);
    o.roughness = 0.3;
    o.metallic = 0.0;
    o.specular = 0.5;`});var Tn=new _("std_shop_window",{params:{Intensity:4,Power:1},textures:["InteriorTex"],code:`
    // BumpOffset(HeightRatio 0.06, ReferencePlane 0.5, Height 0): uv + CameraVector_tangent.xy * -0.03.
    let off = vec2<f32>(dot(i.view, i.t), -dot(i.view, i.b)) * -0.03;
    let Tex = msample_color(m, i, $InteriorTex, i.uv + off, exp2(i.uvd)).rgb;
    o.emissive = Tex * $Intensity * $Power * i.power;
    o.base = vec3<f32>(0.015, 0.015, 0.017);
    o.roughness = 0.04;
    o.specular = 0.7;
    o.metallic = 0.0;`});var Fn=new _("std_road_marking",{params:{Color:[.75,.75,.72,1],UseMask:1},textures:["Mask"],code:`
    let M = msample(m, i, $Mask, i.uv, exp2(i.uvd)).r;
    o.roughness = mix(0.55, 0.12, i.wetness);
    o.opacity = select(1.0, M, $UseMask > 0.5);
    o.base = $Color.rgb * mix(1.0, 0.6, i.wetness);
    o.metallic = 0.0;
    o.specular = 0.5;`});var Wr=`
fn std_pcg(v: u32) -> u32 {
    let s = v * 747796405u + 2891336453u;
    let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
    return (w >> 22u) ^ w;
}
fn std_hashi(x: i32, y: i32, z: i32) -> f32 {
    return f32(std_pcg((bitcast<u32>(x) * 73856093u) ^ (bitcast<u32>(y) * 19349663u) ^ (bitcast<u32>(z) * 83492791u)) >> 8u) * (1.0 / 16777216.0);
}
fn std_vnoise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = p - i;
    let u = f * f * (3.0 - 2.0 * f);
    let x = i32(i.x);
    let y = i32(i.y);
    return mix(mix(std_hashi(x, y, 0), std_hashi(x + 1, y, 0), u.x), mix(std_hashi(x, y + 1, 0), std_hashi(x + 1, y + 1, 0), u.x), u.y);
}
fn std_fbm(p: vec2<f32>) -> f32 {
    var a = 0.5;
    var q = p;
    var s = 0.0;
    for (var o = 0; o < 4; o++) {
        s += a * std_vnoise(q);
        q = mat2x2<f32>(1.6, 1.2, -1.2, 1.6) * q + vec2<f32>(17.1, 9.3);
        a *= 0.5;
    }
    return s / 0.9375;
}
// Blotches (up-facing: dirt patches) + vertical rain streaks on walls, 0..1.
fn std_grime(p: vec3<f32>, ng: vec3<f32>, scale: f32) -> f32 {
    if (abs(ng.y) > 0.5) {
        return smoothstep(0.5, 0.85, std_fbm(p.xz / scale));
    }
    let hx = dot(p, vec3<f32>(ng.z, 0.0, -ng.x));
    let blot = smoothstep(0.52, 0.85, std_fbm(vec2<f32>(hx, p.y) / scale));
    let streak = smoothstep(0.55, 0.9, std_vnoise(vec2<f32>(hx * 7.0, p.y * 0.35) / scale));
    return max(blot, streak * 0.85);
}
// Rain ripples: expanding rings in a jittered 0.35 m grid; the height gradient (xz).
fn std_ripples(x: vec2<f32>, t: f32) -> vec2<f32> {
    let q = x / 0.35;
    let c = floor(q);
    var g = vec2<f32>(0.0);
    // The 2x2 cells nearest to the point (rings stay within ~0.6 cell of their centre).
    let o = vec2<i32>(select(-1, 0, q.x - c.x >= 0.5), select(-1, 0, q.y - c.y >= 0.5));
    for (var j = 0; j <= 1; j++) {
        for (var i = 0; i <= 1; i++) {
            let ci = vec2<i32>(i32(c.x) + o.x + i, i32(c.y) + o.y + j);
            // One drop per cell and cycle (random phase), in ~45 % of cycles.
            let ph = t * 0.9 + std_hashi(ci.x, ci.y, 13);
            let age = fract(ph);
            let cyc = i32(floor(ph));
            if (std_hashi(ci.x * 31 + cyc, ci.y, 17) > 0.45) { continue; }
            let dv = q - (vec2<f32>(ci) + vec2<f32>(std_hashi(ci.x + cyc, ci.y, 7), std_hashi(ci.x, ci.y + cyc, 11)));
            let dist = length(dv);
            let xr = (dist - age * 0.6) * 22.0;
            if (abs(xr) < 6.2831853 && dist > 1e-4) {
                let amp = (1.0 - age) * (1.0 - age) * (1.0 - abs(xr) / 6.2831853);
                g += dv / dist * (cos(xr) * amp);
            }
        }
    }
    return g;
}
// Facade windows with fake room interiors (interior mapping), floors x bays on a vertical face. kind 0 = wall,
// 1 = frame, 2 = glass (emit = the lit room seen through it). w0 = floor height, bay, window width, height;
// w1 = ground height, lit chance, sill, brightness (nits).
struct StdWin { kind: u32, emit: vec3<f32> };
fn std_window(p: vec3<f32>, ng: vec3<f32>, d: vec3<f32>, w0: vec4<f32>, w1: vec4<f32>, top: f32, seed: f32) -> StdWin {
    var r = StdWin(0u, vec3<f32>(0.0));
    let fh = w0.x;
    let bay = w0.y;
    let ww = w0.z;
    let wh = w0.w;
    let sill = w1.z;
    if (fh <= 0.0 || bay <= 0.0 || p.y < w1.x || p.y > top) { return r; }
    let tx = normalize(vec3<f32>(ng.z, 0.0, -ng.x));
    let hx = dot(p, tx);
    let fy = (p.y - w1.x) / fh;
    let fi = floor(fy);
    let ly = (fy - fi) * fh;
    let bi = floor(hx / bay);
    let lx = hx - (bi + 0.5) * bay;
    if (abs(lx) > ww * 0.5 || ly < sill || ly > sill + wh) { return r; }
    // Wall identity (orientation + plane offset + seed) so neighbouring facades differ.
    let wid = i32(floor(dot(p, ng) * 1.7)) * 3 + i32(round(atan2(ng.z, ng.x) * 2.0)) * 101 + i32(seed * 131.0);
    let cf = i32(fi);
    let cb = i32(bi);
    let fr = 0.045;
    let style = std_hashi(cf, wid, 3);
    let mullion = style < 0.5 && abs(lx) < fr * 0.6;
    let transom = style > 0.75 && abs(ly - (sill + wh * 0.72)) < fr * 0.6;
    if (min(ww * 0.5 - abs(lx), min(ly - sill, sill + wh - ly)) < fr || mullion || transom) {
        r.kind = 1u;
        return r;
    }
    r.kind = 2u;
    // Whole floors (offices) tend to be lit or dark together.
    let on = std_hashi(cf * 7 + cb, wid, 9) < w1.y + (std_hashi(cf, wid, 5) - 0.5) * 0.7;
    if (!on) { return r; }
    let hp = std_hashi(cb, cf, wid + 17);
    var col = vec3<f32>(1.0, 0.76, 0.5);
    if (hp < 0.35) { col = vec3<f32>(0.8, 0.92, 1.0); } else if (hp < 0.5) { col = vec3<f32>(1.0, 0.92, 0.8); } else if (hp > 0.96) { col = vec3<f32>(1.0, 0.45, 0.65); }
    // View ray vs the room box behind the glass: x across the bay, y floor to ceiling, z into the building.
    let dl = vec3<f32>(dot(d, tx), d.y, -dot(d, ng));
    let depth = 3.0 + 2.0 * std_hashi(cb, cf, wid + 23);
    var room = 0.5;
    if (dl.z > 1e-4) {
        var tmin = depth / dl.z;
        var face = 0u;
        if (abs(dl.x) > 1e-5) {
            let t = (select(-0.5, 0.5, dl.x > 0.0) * bay - lx) / dl.x;
            if (t < tmin) { tmin = t; face = 1u; }
        }
        if (abs(dl.y) > 1e-5) {
            let t = (select(0.0, fh, dl.y > 0.0) - ly) / dl.y;
            if (t < tmin) { tmin = t; face = select(3u, 2u, dl.y > 0.0); }
        }
        let q = vec3<f32>(lx, ly, 0.0) + dl * tmin;
        // Lit from a ceiling panel: walls fall off with distance from it, furniture silhouettes on the back wall.
        let lz = depth * 0.45;
        if (face == 0u) {
            room = 0.32 * (0.6 + 0.4 * smoothstep(0.0, fh, q.y));
            let fx0 = (std_hashi(cb, cf, wid + 29) - 0.5) * bay * 0.6;
            if (q.y < 0.8 + 0.9 * std_hashi(cb, cf, wid + 31) && abs(q.x - fx0) < 0.3 + 0.5 * std_hashi(cb, cf, wid + 37)) { room = 0.05; }
        } else if (face == 1u) {
            room = 0.22 * (0.4 + 0.6 * exp(-abs(q.z - lz) * 0.5)) * (0.5 + 0.5 * smoothstep(0.0, fh, q.y));
        } else if (face == 2u) {
            room = select(0.12, 4.0, abs(q.x) < 0.4 && abs(q.z - lz) < 0.65);
        } else {
            room = 0.08 + 0.1 * exp(-abs(q.z - lz));
        }
    }
    let blind = std_hashi(cb, cf, wid + 41);
    if (blind > 0.55 && ly > sill + wh * (1.0 - (blind - 0.55) * 1.8)) {
        room = 0.45 * (0.8 + 0.2 * sin(ly * 90.0));
    }
    let k = std_hashi(cb, cf, wid + 43);
    r.emit = col * room * w1.w * (0.35 + 1.1 * k * k);
    return r;
}
`,Bn=new _("std_surface",{params:{WorldScale:0,NormalScale:1,Wet:0,Flags:0,PuddleScale:1,PuddleAmount:0,GrimeAmount:0,GrimeScale:1,WinTop:1e4,WinSeed:0,UV:[1,1,0,0],Win0:[3.2,2.4,1.5,1.6],Win1:[4,.45,.9,40]},textures:["Map","RoughnessMap","MetalnessMap","NormalMap","EmissiveMap"],helpers:Wr,code:`
    let p = i.wp;
    let ng = i.ng;
    let fl = u32($Flags);
    var n = o.normal;
    // Texture coordinates and tangent frame: mesh UVs, or world-aligned planar mapping on the dominant axis.
    var uv: vec2<f32>;
    var upm: f32;
    var tg = i.t;
    var bt = vec3<f32>(0.0);
    let world = $WorldScale > 0.0;
    if (world) {
        let k = 1.0 / $WorldScale;
        let an = abs(ng);
        if (an.y >= an.x && an.y >= an.z) {
            uv = vec2<f32>(p.x, p.z) * k;
            tg = vec3<f32>(1.0, 0.0, 0.0);
            bt = vec3<f32>(0.0, 0.0, -1.0);
        } else if (an.x >= an.z) {
            let sg = select(-1.0, 1.0, ng.x >= 0.0);
            uv = vec2<f32>(-p.z * sg, -p.y) * k;
            tg = vec3<f32>(0.0, 0.0, -sg);
            bt = vec3<f32>(0.0, 1.0, 0.0);
        } else {
            let sg = select(-1.0, 1.0, ng.z >= 0.0);
            uv = vec2<f32>(p.x * sg, -p.y) * k;
            tg = vec3<f32>(sg, 0.0, 0.0);
            bt = vec3<f32>(0.0, 1.0, 0.0);
        }
        uv += $UV.zw;
        upm = k;
    } else {
        uv = i.uv * $UV.xy + $UV.zw;
        upm = exp2(i.uvd) * sqrt(abs($UV.x * $UV.y));
    }
    var col = o.base;
    var rough = o.roughness;
    var metal = o.metallic;
    var spec = o.specular;
    var em = o.emissive;
    if ((fl & 1u) != 0u) { col *= msample_color(m, i, $Map, uv, upm).rgb; }
    if ((fl & 2u) != 0u) { rough *= msample(m, i, $RoughnessMap, uv, upm).g; }
    if ((fl & 4u) != 0u) { metal *= msample(m, i, $MetalnessMap, uv, upm).b; }
    if ((fl & 16u) != 0u && any(em > vec3<f32>(0.0))) { em *= msample_color(m, i, $EmissiveMap, uv, upm).rgb; }
    // Detail that only shows where seen directly or in mirror-like reflections (puddles, glass, chrome).
    if ((fl & 8u) != 0u && i.near) {
        let tn = msample(m, i, $NormalMap, uv, upm).xyz * 2.0 - 1.0;
        let tp = tg - n * dot(n, tg);
        if (dot(tp, tp) > 1e-12) {
            let t = normalize(tp);
            var b = i.b;
            if (world) { b = normalize(bt - n * dot(n, bt) - t * dot(t, bt)); }
            let pn = t * (tn.x * $NormalScale) + b * (tn.y * $NormalScale) + n * tn.z;
            if (dot(pn, pn) > 1e-12 && dot(pn, ng) > 0.0) { n = normalize(pn); }
        }
    }
    if ($GrimeAmount > 0.0 && i.near) {
        let g = std_grime(p, ng, $GrimeScale) * $GrimeAmount;
        col *= 1.0 - 0.6 * g;
        rough = mix(rough, 1.0, 0.35 * g);
    }
    // Wetness (Lagarde): damp surfaces darken and gloss up; puddles are a mirror-flat water layer with rain ripples.
    let wet = clamp($Wet * i.wetness, 0.0, 1.0);
    if (wet > 0.0) {
        var pud = 0.0;
        if ($PuddleAmount > 0.0 && ng.y > 0.6 && i.near) {
            // Water pools where the noise height field is low; darker (recessed / cracked) texels flood first.
            let hgt = std_fbm(p.xz / $PuddleScale) + 0.35 * (dot(col, vec3<f32>(0.2126, 0.7152, 0.0722)) - 0.1);
            let level = 0.32 + 0.22 * $PuddleAmount * i.wetness;
            pud = 1.0 - smoothstep(level - 0.03, level + 0.03, hgt);
        }
        let damp = max(wet, pud);
        col *= mix(1.0, 0.5, damp * (1.0 - metal));
        rough = mix(rough, min(rough, 0.14), wet);
        n = normalize(mix(n, ng, 0.5 * wet));
        rough = mix(rough, 0.02, pud);
        col = mix(col, col * 0.6, pud);
        metal = mix(metal, 0.0, pud);
        spec = mix(spec, 0.5, pud);
        n = normalize(mix(n, ng, pud));
        if (i.rain > 0.0 && ng.y > 0.6 && i.depth == 0u) {
            let g = std_ripples(p.xz, i.time) * i.rain * (0.015 + 0.1 * pud);
            n = normalize(n - vec3<f32>(g.x, 0.0, g.y));
        }
    }
    if ((fl & 32u) != 0u && abs(ng.y) < 0.4 && i.near) {
        let wv = std_window(p, ng, -i.view, $Win0, $Win1, $WinTop, $WinSeed);
        if (wv.kind == 1u) {
            col = vec3<f32>(0.035);
            rough = 0.35;
            metal = 0.8;
            n = ng;
        } else if (wv.kind == 2u) {
            col = vec3<f32>(0.01);
            rough = 0.04;
            metal = 0.0;
            spec = 0.5;
            n = ng;
            em += wv.emit * i.power;
        }
    }
    o.base = col;
    o.roughness = rough;
    o.metallic = metal;
    o.specular = spec;
    o.emissive = em;
    o.normal = n;`});var Gr=`
fn std_wl_hash(x: i32, y: i32, z: i32) -> f32 {
    let v = (bitcast<u32>(x) * 73856093u) ^ (bitcast<u32>(y) * 19349663u) ^ (bitcast<u32>(z) * 83492791u);
    let s = v * 747796405u + 2891336453u;
    let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
    return f32(((w >> 22u) ^ w) >> 8u) * (1.0 / 16777216.0);
}
fn std_wl_vnoise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = p - i;
    let u = f * f * (3.0 - 2.0 * f);
    let x = i32(i.x);
    let y = i32(i.y);
    return mix(mix(std_wl_hash(x, y, 0), std_wl_hash(x + 1, y, 0), u.x), mix(std_wl_hash(x, y + 1, 0), std_wl_hash(x + 1, y + 1, 0), u.x), u.y);
}
fn std_wl_fbm(p: vec2<f32>) -> f32 {
    var a = 0.5;
    var q = p;
    var s = 0.0;
    for (var o = 0; o < 4; o++) {
        s += a * std_wl_vnoise(q);
        q = mat2x2<f32>(1.6, 1.2, -1.2, 1.6) * q + vec2<f32>(17.1, 9.3);
        a *= 0.5;
    }
    return s / 0.9375;
}
fn std_wl_ripples(x: vec2<f32>, t: f32) -> vec2<f32> {
    let q = x / 0.35;
    let c = floor(q);
    var g = vec2<f32>(0.0);
    let o = vec2<i32>(select(-1, 0, q.x - c.x >= 0.5), select(-1, 0, q.y - c.y >= 0.5));
    for (var j = 0; j <= 1; j++) {
        for (var i = 0; i <= 1; i++) {
            let ci = vec2<i32>(i32(c.x) + o.x + i, i32(c.y) + o.y + j);
            let ph = t * 0.9 + std_wl_hash(ci.x, ci.y, 13);
            let age = fract(ph);
            let cyc = i32(floor(ph));
            if (std_wl_hash(ci.x * 31 + cyc, ci.y, 17) > 0.45) { continue; }
            let dv = q - (vec2<f32>(ci) + vec2<f32>(std_wl_hash(ci.x + cyc, ci.y, 7), std_wl_hash(ci.x, ci.y + cyc, 11)));
            let dist = length(dv);
            let xr = (dist - age * 0.6) * 22.0;
            if (abs(xr) < 6.2831853 && dist > 1e-4) {
                let amp = (1.0 - age) * (1.0 - age) * (1.0 - abs(xr) / 6.2831853);
                g += dv / dist * (cos(xr) * amp);
            }
        }
    }
    return g;
}
`,Ln=new _("std_wet_layer",{params:{Wet:1,PuddleAmount:1,PuddleScale:6},helpers:Gr,code:`
    let p = i.wp;
    let ng = i.ng;
    var col = base.base;
    var rough = base.roughness;
    var metal = base.metallic;
    var spec = base.specular;
    var n = base.normal;
    // SurfaceMaterial's wetness (Lagarde), on the material's own shading.
    let wet = clamp($Wet * i.wetness, 0.0, 1.0);
    if (wet > 0.0) {
        var pud = 0.0;
        if ($PuddleAmount > 0.0 && ng.y > 0.6 && i.near) {
            let hgt = std_wl_fbm(p.xz / $PuddleScale) + 0.35 * (dot(col, vec3<f32>(0.2126, 0.7152, 0.0722)) - 0.1);
            let level = 0.32 + 0.22 * $PuddleAmount * i.wetness;
            pud = 1.0 - smoothstep(level - 0.03, level + 0.03, hgt);
        }
        let damp = max(wet, pud);
        col *= mix(1.0, 0.5, damp * (1.0 - metal));
        rough = mix(rough, min(rough, 0.14), wet);
        n = normalize(mix(n, ng, 0.5 * wet));
        rough = mix(rough, 0.02, pud);
        col = mix(col, col * 0.6, pud);
        metal = mix(metal, 0.0, pud);
        spec = mix(spec, 0.5, pud);
        n = normalize(mix(n, ng, pud));
        if (i.rain > 0.0 && ng.y > 0.6 && i.depth == 0u) {
            let g = std_wl_ripples(p.xz, i.time) * i.rain * (0.015 + 0.1 * pud);
            n = normalize(n - vec3<f32>(g.x, 0.0, g.y));
        }
    }
    o.base = col;
    o.roughness = rough;
    o.metallic = metal;
    o.specular = spec;
    o.normal = n;`});var Qn=new Re("rain_curtain",{params:{Box:[32,22,32,0],Wind:[.9,.4,0,0],Speed:9.5,Length:.55,Width:.009,Opacity:.32},code:`
    // Fixed per drop: its start in the box, its speed and length, whether it shows at this rain.
    let r3 = unit(pcg(bitcast<u32>(i.rand.z) ^ 0x9e3779b9u));
    let start = vec3<f32>(i.rand.z, i.rand.w, r3) * $Box.xyz;
    let speed = $Speed * (0.85 + 0.3 * i.rand.x);
    let vel = vec3<f32>($Wind.x, -speed, $Wind.y);
    let origin = i.cam - $Box.xyz * 0.5;
    var rel = start + vel * i.time - origin;
    rel = rel - floor(rel / $Box.xyz) * $Box.xyz;
    let c = origin + rel;
    let up = normalize(-vel);
    let right = normalize(cross(up, normalize(i.cam - c)));
    let len = $Length * (0.7 + 0.6 * i.rand.y);
    let d = distance(c, i.cam);
    // M_Rain's opacity without its streak profile (the material applies that): fades in from 0.25 m, out from 9 m.
    let fade = smoothstep(0.25, 1.1, d) * (1.0 - smoothstep(9.0, 15.5, d));
    o.center = c;
    o.u = right * ($Width * 0.5);
    o.v = up * (len * 0.5);
    // Fully faded streaks are left out (no ray needs to find them), and so are the ones behind the camera: the
    // translucency pass draws what the camera sees (no reflections, no GI), so they only cost the streaks' BLAS.
    o.visible = i.rand.x < i.rain && fade > 0.0 && dot(c - i.cam, i.fwd) > -0.5;
    o.custom = vec4<f32>($Opacity * fade * clamp(i.rain * 3.0, 0.0, 1.0), 0.0, 0.0, 0.0);`}),Xn=new _("rain_streak",{params:{Color:[.55,.58,.62,0],Emissive:[.025,.025,.03,0]},code:`
    let prof = pow(clamp(sin(i.uv.y * 3.14159265), 0.0, 1.0), 0.8) * clamp(1.0 - abs(i.uv.x - 0.5) * 2.0, 0.0, 1.0);
    o.opacity = clamp(prof * i.custom.x, 0.0, 1.0);
    o.base = $Color.rgb;
    o.emissive = $Emissive.rgb;`});var Yn=new Re("spark_burst",{params:{Speed:6,Spread:.9,Gravity:9.81,Drag:1.2,Life:1.2,Width:.008,Streak:.025,Period:0},code:`
    var age = i.time - i.custom.x;
    // Repeats from the first burst on (before it, nothing).
    if ($Period > 0.0 && age >= 0.0) { age = age - floor(age / $Period) * $Period; }
    let life = $Life * (0.55 + 0.45 * i.rand.w);
    // Direction: uniform in a cone of half-angle Spread around up; speed 40-100 %.
    let ct = 1.0 - i.rand.x * (1.0 - cos($Spread));
    let st = sqrt(max(0.0, 1.0 - ct * ct));
    let ph = 6.2831853 * i.rand.y;
    let v0 = vec3<f32>(st * cos(ph), ct, st * sin(ph)) * ($Speed * (0.4 + 0.6 * i.rand.z));
    // Linear drag k toward the terminal velocity g / k.
    let k = max($Drag, 1e-3);
    let vt = vec3<f32>(0.0, -$Gravity / k, 0.0);
    let e = exp(-k * max(age, 0.0));
    let vel = vt + (v0 - vt) * e;
    o.center = i.pivot + vt * age + (v0 - vt) * ((1.0 - e) / k);
    let sp = length(vel);
    let along = select(vec3<f32>(0.0, 1.0, 0.0), vel / sp, sp > 1e-4);
    let side = cross(along, normalize(i.cam - o.center));
    let right = select(vec3<f32>(1.0, 0.0, 0.0), normalize(side), dot(side, side) > 1e-12);
    o.u = right * ($Width * 0.5);
    o.v = along * (max(sp * $Streak, $Width) * 0.5);
    o.visible = age >= 0.0 && age < life;
    // Cooling: white, yellow, orange, red; brightness falls with age.
    let t = clamp(age / life, 0.0, 1.0);
    var c = mix(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 0.8, 0.35), smoothstep(0.0, 0.25, t));
    c = mix(c, vec3<f32>(1.0, 0.42, 0.08), smoothstep(0.2, 0.55, t));
    c = mix(c, vec3<f32>(0.75, 0.1, 0.02), smoothstep(0.5, 1.0, t));
    o.custom = vec4<f32>(c * (1.0 - t) * (1.0 - t), 0.0);`}),Kn=new _("spark_streak",{code:`
    o.base = vec3<f32>(0.0);
    o.emissive = base.emissive * i.custom.rgb;`});var es=new K("local_fog",{params:{Radial:1,Height:1,Falloff:1e3,Offset:0,Albedo:[1,1,1,0],Emissive:[0,0,0,0]},code:`
    let u = i.lp * 2.0;
    let fade = clamp(1.0 - length(u), 0.0, 1.0);
    var ext = 0.0;
    if (fade > 0.0) {
        let height = select(0.0, $Height * exp(min(-$Falloff * (u.y - $Offset), 80.0)), $Height > 0.0);
        let a = exp(-height);
        let b = exp(-$Radial * pow(fade, 0.82));
        ext = max(-log(max(a - a * b + b, 1e-30)), 0.0);
    }
    o.extinction = ext;
    o.albedo = $Albedo.rgb;
    o.emission = $Emissive.rgb * ext;`});var cr=`
fn vn_hash(p: vec3<f32>) -> f32 {
    let q = fract(p * vec3<f32>(0.1031, 0.1030, 0.0973));
    let r = q + dot(q, q.yxz + 33.33);
    return fract((r.x + r.y) * r.z);
}
fn vn_noise(p: vec3<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);
    let a = mix(mix(vn_hash(i), vn_hash(i + vec3<f32>(1.0, 0.0, 0.0)), u.x), mix(vn_hash(i + vec3<f32>(0.0, 1.0, 0.0)), vn_hash(i + vec3<f32>(1.0, 1.0, 0.0)), u.x), u.y);
    let b = mix(mix(vn_hash(i + vec3<f32>(0.0, 0.0, 1.0)), vn_hash(i + vec3<f32>(1.0, 0.0, 1.0)), u.x), mix(vn_hash(i + vec3<f32>(0.0, 1.0, 1.0)), vn_hash(i + vec3<f32>(1.0, 1.0, 1.0)), u.x), u.y);
    return mix(a, b, u.z);
}
fn vn_fbm(p: vec3<f32>) -> f32 {
    var s = 0.0;
    var a = 0.5;
    var q = p;
    for (var k = 0; k < 3; k++) {
        s += a * vn_noise(q);
        q = q * 2.03 + vec3<f32>(1.7, 9.2, 4.1);
        a *= 0.5;
    }
    return s;
}`,ts=new K("smoke_column",{params:{Density:2,Scale:1.5,Rise:.6,Albedo:[.55,.55,.58,0]},helpers:cr,code:`
    let r = length(i.lp.xz) * 2.0;
    let h = i.lp.y + 0.5;
    let n = vn_fbm(i.p * $Scale - vec3<f32>(0.0, i.time * $Rise * $Scale, 0.0));
    let shape = max(1.0 - r * r * (1.0 + h), 0.0) * (1.0 - smoothstep(0.6, 1.0, h));
    o.extinction = $Density * shape * smoothstep(0.35, 0.75, n);
    o.albedo = $Albedo.rgb;`});var rs=new K("fireball",{params:{Life:1.6,Period:0,Intensity:40,Density:6,Scale:3},helpers:cr,code:`
    var age = i.time - i.custom.x;
    // Repeats from the first fireball on (before it, nothing).
    if ($Period > 0.0 && age >= 0.0) { age = age - floor(age / $Period) * $Period; }
    let t = clamp(age / $Life, 0.0, 1.0);
    let grow = sqrt(t);
    let r = length(i.lp) * 2.0 / max(grow, 1e-3);
    let n = vn_fbm(i.p * $Scale + vec3<f32>(0.0, -age * 1.5, 0.0));
    let body = max(1.0 - r, 0.0) * smoothstep(0.25, 0.7, n + 0.3 * (1.0 - r));
    let alive = select(0.0, 1.0, age >= 0.0 && age < $Life);
    o.extinction = $Density * body * alive;
    // Temperature: high at the core and early, falling outward and with age.
    let temp = clamp((1.0 - r) * 1.6 - t * 1.2, 0.0, 1.0);
    var c = mix(vec3<f32>(0.6, 0.06, 0.01), vec3<f32>(1.0, 0.45, 0.08), smoothstep(0.1, 0.5, temp));
    c = mix(c, vec3<f32>(1.0, 0.9, 0.6), smoothstep(0.5, 0.95, temp));
    o.albedo = vec3<f32>(0.08);
    o.emission = c * $Intensity * temp * temp * o.extinction;`});var ns=new it("grid_smoke",{params:{Wind:[0,0,0,0],Buoyancy:6,Weight:.5,Drag:.4,Diffusion:.02,Viscosity:.05,Cooling:.5,Dissipation:.25,Turbulence:15},code:`
    let back = to_uvw(i.p - s.b.xyz * i.dt);
    let e = 1.0 / vec3<f32>(i.dims);
    let ex = vec3<f32>(e.x, 0.0, 0.0);
    let ey = vec3<f32>(0.0, e.y, 0.0);
    let ez = vec3<f32>(0.0, 0.0, e.z);
    var a = ga(back);
    let c = gb(back);
    let bl = gb(back - ex);
    let br = gb(back + ex);
    let bd = gb(back - ey);
    let bu = gb(back + ey);
    let bb = gb(back - ez);
    let bf = gb(back + ez);
    var v = c.xyz;
    let h = i.size.x;
    // Pressure (b.w, scaled so that the velocity loses its gradient): one Jacobi step of laplacian(p) = div(v).
    let div = (br.x - bl.x + bu.y - bd.y + bf.z - bb.z) / (2.0 * h);
    var pr = (bl.w + br.w + bd.w + bu.w + bb.w + bf.w - div * h * h) / 6.0;
    v -= vec3<f32>(br.w - bl.w, bu.w - bd.w, bf.w - bb.w) / (2.0 * h);
    // Explicit diffusion: D dt x the Laplacian, 6 (mean - value) / h^2 (kept stable).
    let k = 6.0 * i.dt / (h * h);
    let na = (ga(back + ex) + ga(back - ex) + ga(back + ey) + ga(back - ey) + ga(back + ez) + ga(back - ez)) / 6.0;
    a = mix(a, na, clamp($Diffusion * k, 0.0, 0.9));
    v = mix(v, (bl.xyz + br.xyz + bd.xyz + bu.xyz + bb.xyz + bf.xyz) / 6.0, clamp($Viscosity * k, 0.0, 0.9));
    v.y += ($Buoyancy * a.y - $Weight * a.x) * i.dt;
    // Turbulence: a random push where there is smoke (the viscosity smooths it into eddies).
    v += (i.rand.xyz - 0.5) * ($Turbulence * a.x * i.dt);
    // The wind: the parameter plus the node's customData.xyz (set live), which the air is dragged toward.
    v = mix(v, $Wind.xyz + i.custom.xyz, 1.0 - exp(-$Drag * i.dt));
    a.y *= exp(-$Cooling * i.dt);
    a.x *= exp(-$Dissipation * i.dt);
    // Sources: density and temperature (a.xy) set inside the sphere, the air pushed by b.xyz and outward at b.w m/s.
    for (var j = 0u; j < i.sources; j++) {
        let src = source(j);
        let d = i.p - src.p;
        let r = length(d);
        let w = 1.0 - smoothstep(0.5, 1.0, r / max(src.radius, 1e-3));
        a = max(a, src.a * w);
        v += (src.b.xyz + d / max(r, 1e-3) * src.b.w) * w;
    }
    // Open sides: smoke that reaches the border leaves, and the air there is at rest pressure.
    if (any(i.cell == vec3<u32>(0u)) || any(i.cell + vec3<u32>(1u) >= i.dims)) {
        a = vec4<f32>(0.0);
        pr = 0.0;
    }
    s.a = a;
    s.b = vec4<f32>(v, pr);`}),ss=new K("grid_smoke_medium",{params:{Albedo:[.6,.6,.62,0],Glow:[0,0,0,0],Density:4},code:`
    let g = vgrid(i, i.lp);
    o.extinction = $Density * g.x;
    o.albedo = $Albedo.rgb;
    o.emission = $Glow.rgb * g.y * o.extinction;`});var is=new K("homogeneous",{params:{Coeff:[1,1,1,1],Emission:[0,0,0,0]},code:`
    o.extinction = $Coeff.w;
    o.albedo = $Coeff.rgb;
    o.emission = $Emission.rgb;`});var os=new _("std_water",{params:{Tint:[1,1,1,0],Wavelength:1.2,Steepness:.06,Speed:1,Direction:.6,Roughness:.04},code:`
    let xz = vec2<f32>(i.wp.x, i.wp.z);
    var g = vec2<f32>(0.0);
    for (var k = 0; k < 4; k++) {
        let fk = f32(k);
        let ang = $Direction + fk * 1.7;
        let dir = vec2<f32>(cos(ang), sin(ang));
        let wk = 6.2831853 / ($Wavelength * pow(0.5, fk));
        let ph = wk * dot(dir, xz) - sqrt(9.81 * wk) * i.time * $Speed;
        g += dir * ($Steepness * pow(0.7, fk) * cos(ph));
    }
    o.normal = normalize(i.ng + vec3<f32>(-g.x, 0.0, -g.y) * i.ng.y);
    o.base = $Tint.rgb;
    o.roughness = $Roughness;
    // Moving waves: the live view keeps a short history here (long, the reflections smeared into streaks).
    o.animated = $Speed != 0.0 && $Steepness > 0.0;`});var us=new Te("analytic_sphere",{code:`
    let k = i.data + i.prim * 5u;
    let c = vec3<f32>(gdataf(k), gdataf(k + 1u), gdataf(k + 2u));
    let r = gdataf(k + 3u);
    let oc = i.o - c;
    let a = dot(i.d, i.d);
    let b = dot(oc, i.d);
    let disc = b * b - a * (dot(oc, oc) - r * r);
    if (disc >= 0.0) {
        let q = sqrt(disc);
        var t = (-b - q) / a;
        if (t <= i.tmin) { t = (-b + q) / a; }
        if (t > i.tmin && t < i.tmax) {
            o.t = t;
            o.normal = i.o + i.d * t - c;
            o.material = gdata(k + 4u);
        }
    }`}),cs=new Te("analytic_box",{code:`
    let inv = 1.0 / i.d;
    let t0 = (i.lo - i.o) * inv;
    let t1 = (i.hi - i.o) * inv;
    let tn = min(t0, t1);
    let tf = max(t0, t1);
    let a = max(max(tn.x, tn.y), tn.z);
    let b = min(min(tf.x, tf.y), tf.z);
    // From outside the entry face, from inside the exit face.
    let enter = a > i.tmin;
    let t = select(b, a, enter);
    if (a <= b && t > i.tmin && t < i.tmax) {
        o.t = t;
        let f = select(tf, tn, enter);
        let axis = select(select(vec3<f32>(0.0, 0.0, 1.0), vec3<f32>(0.0, 1.0, 0.0), f.y == t), vec3<f32>(1.0, 0.0, 0.0), f.x == t);
        o.normal = axis * select(sign(i.d), -sign(i.d), enter);
        o.material = gdata(i.data + i.prim);
    }`});function Dt(){let s=new nt,e=new T("assets/courtyard.glb");e.name="OSC winter workshop courtyard",s.add(e),s.environment=new Ae(new Ce("assets/winter-sky.hdr","linear"),100);let t=new C(12374015,18);t.name="Blue-hour moon",t.setSunAngles(30,-53),s.add(t);for(let n of[-1,1]){let i=[[4.98,12],[6.48,-4],[11.28,-11],[25,-22+n*.72],[36.72,-3],[21,6-n*.72]];for(let[o,l]of i){let a=new G(16763522,115,15);a.name=`Lantern ${n*o}, ${l}`,a.position.set(n*o,2.37,l),a.radius=.12,s.add(a)}}let r=new j(60,16/9,.08,300);return r.name="South approach",r.position.set(0,2.35,43),r.lookAt(0,14.5,0),r.setManualExposure(5.2),s.add(r),{scene:s,camera:r,options:{name:"osc-starlit-courtyard"}}}function $t(s){let e=2166136261;for(let t=0;t<s.length;t++)e=Math.imul(e^s.charCodeAt(t),16777619);return e>>>0}function mr(s){return s=Math.imul(s^s>>>16,2246822507),s=Math.imul(s^s>>>13,3266489909),(s^s>>>16)>>>0}function J(s,e=0){let t=mr(s>>>0^mr((e>>>0)+2654435769));return()=>{t=t+1831565813|0;let r=Math.imul(t^t>>>15,1|t);return r=r+Math.imul(r^r>>>7,61|r)^r,((r^r>>>14)>>>0)/4294967296}}function re(s,e,t){let r=Math.random,n=globalThis.Date;class i extends n{constructor(...l){super(...l.length?l:[s])}static now(){return s}}Math.random=e,globalThis.Date=i;try{return t()}finally{Math.random=r,globalThis.Date=n}}function Hr(s){return s.replace(/~/g,"~0").replace(/\//g,"~1")}function qr(s){return s.replace(/~1/g,"/").replace(/~0/g,"~")}function B(s,e){return`${s}/${Hr(String(e))}`}function L(s){return s.split("/").map(qr)}function ft(s){let e=[];for(let t=s.indexOf("/");t>=0;t=s.indexOf("/",t+1))e.push(s.slice(0,t));return e}function Et(s){return[...ft(s),s]}function bt(s,e){return{seq:0,seed:e,state:s.state,versions:{}}}function yt(s,e){let t=s[e]?.tree??0;for(let r of ft(e))t=Math.max(t,s[r]?.own??0);return t}function hr(s,e){return Object.entries(e).filter(([t,r])=>yt(s,t)!==r).map(([t])=>t)}function jt(s,e){if(e.status==="error")throw new Error("error results cannot be committed");let t=hr(s.versions,e.reads);if(t.length)return{ok:!1,conflicts:t};let r=s.seq+1,n=[];return e.status==="ok"?n=Ge(s,e.writes,r):s.seq=r,{ok:!0,seq:r,applied:n}}function Ge(s,e,t){let{world:r,applied:n}=dr(s,e);s.state=r.state;for(let i of n){s.versions[i.path]={own:t,tree:t};for(let o of ft(i.path))s.versions[o]={own:s.versions[o]?.own??0,tree:t}}return s.seq=t,n}function dr(s,e){let{state:t}=s;for(let r of e){let[n,...i]=L(r.path);if(n!=="state")throw new Error(`unknown path root in "${r.path}" (the world is the game state)`);let o=Ot(t,i,r.op==="set"?r.value:void 0,r.path);if(o===null||typeof o!="object"||Array.isArray(o))throw new Error("state must stay a JSON object");t=o}return{world:{state:t},applied:e.slice()}}function Ot(s,e,t,r){if(e.length===0){if(t===void 0)throw new Error(`"${r}" cannot be deleted`);return t}let[n,...i]=e;if(Array.isArray(s)){let l=Number(n);if(!/^\d+$/.test(n)||l>s.length||i.length&&l===s.length)throw new Error(`${r}: bad array index ${n}`);let a=s.slice();return i.length===0&&t===void 0?a.splice(l,1):a[l]=Ot(s[l],i,t,r),a}if(s===null||typeof s!="object")throw new Error(`cannot write "${r}": parent is not an object`);let o=s;if(i.length===0&&t===void 0){let{[n]:l,...a}=o;return a}return{...o,[n]:Ot(Object.hasOwn(o,n)?o[n]:void 0,i,t,r)}}function It(s,e){let[t,...r]=L(e);return t==="state"?gt(s.state,r):void 0}function gt(s,e){let t=s;for(let r of e){if(t===null||typeof t!="object")return;Array.isArray(t)?t=/^\d+$/.test(r)?t[Number(r)]:void 0:t=Object.hasOwn(t,r)?t[r]:void 0}return t}function _e(s){return JSON.stringify(s,(e,t)=>t&&typeof t=="object"&&!Array.isArray(t)?Object.fromEntries(Object.entries(t).sort(([r],[n])=>r<n?-1:r>n?1:0)):t)}var He=class extends Error{name="Failure"};function xt(s){return s instanceof He||s instanceof Error&&s.name==="Failure"}var Z=Symbol("deleted");function pr(s){if(s!=="state"&&!s.startsWith("state/"))throw new TypeError(`"${s}": gameplay reads and writes the game state only ("state/...")`)}var qe=class{event;now;random;base;readSet=new Map;writeSet=new Map;emitted=[];renderRequests=[];proxies=new Map;constructor(e,t){this.base=e,this.event=t,this.now=t.ts,this.random=J(e.seed,t.id)}get state(){return this.proxy("state",!1)}set state(e){if(e===null||typeof e!="object"||Array.isArray(e))throw new TypeError("state must be a JSON object");this.writeAt("state",Ne(e,"state"))}decide(e,t="decide failed"){if(!e)throw new He(t);return e}attempt(e){let t={writes:new Map([...this.writeSet].map(([r,n])=>[r,n===Z?n:structuredClone(n)])),emitted:this.emitted.length,renders:this.renderRequests.length};try{return e(),!0}catch(r){if(!xt(r))throw r;return this.writeSet=t.writes,this.emitted.length=t.emitted,this.renderRequests.length=t.renders,!1}}emit(e,t={}){if(typeof e!="string"||!e)throw new TypeError("emit: event type must be a non-empty string");let r=Ne(t,`emit(${e})`);this.emitted.push({type:e,payload:r===Z?{}:r})}requestRender(e={}){this.renderRequests.push(fr(e))}read(e){pr(e);let t=this.lookup(e);return this.recordRead(e),t===void 0?void 0:structuredClone(t)}write(e,t){pr(e),this.writeAt(e,Ne(t,e))}result(){return{reads:Object.fromEntries(this.readSet),writes:[...this.writeSet].map(([e,t])=>t===Z?{op:"del",path:e}:{op:"set",path:e,value:t}),emits:this.emitted.slice(),renders:this.renderRequests.slice()}}lookup(e){let t=this.peek(e);if(t===null||typeof t!="object"||this.ownerOf(e)!==void 0)return t;let r,n=e+"/";for(let[i,o]of this.writeSet)i.startsWith(n)&&(r??=structuredClone(t),Ct(r,L(i.slice(n.length)),o,i));return r??t}peek(e){let t=this.ownerOf(e);if(t!==void 0){let r=this.writeSet.get(t);return r===Z?void 0:gt(r,L(e).slice(L(t).length))}return It(this.base,e)}ownerOf(e){for(let t of Et(e))if(this.writeSet.has(t))return t}granule(e){for(let t of Et(e))if(Array.isArray(this.peek(t)))return t;return e}recordRead(e){let t=this.granule(e);this.readSet.has(t)||this.readSet.set(t,yt(this.base.versions,t))}writeAt(e,t){if(L(e).includes("__proto__"))throw new TypeError(`"${e}": __proto__ is not a valid key`);let r=this.granule(e);if(r===e)return this.writeExact(e,t);let n=structuredClone(this.lookup(r));Ct(n,L(e.slice(r.length+1)),t,e),this.writeExact(r,n)}writeExact(e,t){this.recordRead(e);let r=this.ownerOf(e);if(r!==void 0&&r!==e){let i=this.writeSet.get(r);if(i===Z)throw new TypeError(`cannot write "${e}": "${r}" was deleted`);Ct(i,L(e.slice(r.length+1)),t,e);return}if(L(e).length>1){let i=this.peek(e.slice(0,e.lastIndexOf("/")));if(i===null||typeof i!="object")throw new TypeError(`cannot write "${e}": parent does not exist`)}for(let i of[...this.writeSet.keys()])i.startsWith(e+"/")&&this.writeSet.delete(i);this.writeSet.set(e,t)}proxy(e,t){let r=(t?"[]":"{}")+e,n=this.proxies.get(r);if(n)return n;let i=this,o=()=>{let a=i.lookup(e);if(a===null||typeof a!="object")throw new TypeError(`"${e}" is no longer an object`);return a},l={get(a,u,m){if(typeof u=="symbol"||t&&!/^\d+$/.test(u)&&u!=="length")return Reflect.get(a,u,m);if(t&&u==="length")return i.recordRead(e),i.peek(e).length;let h=B(e,u),c=i.peek(h);return c!==null&&typeof c=="object"?i.proxy(h,Array.isArray(c)):(i.recordRead(h),c===void 0?Reflect.get(a,u,m):c)},set(a,u,m){return typeof u=="symbol"?!1:(i.writeAt(B(e,u),Ne(m,B(e,u))),!0)},deleteProperty(a,u){return typeof u=="symbol"?!1:(i.writeAt(B(e,u),Z),!0)},has(a,u){return typeof u=="symbol"||t&&u==="length"?Reflect.has(a,u):(i.recordRead(B(e,u)),i.peek(B(e,u))!==void 0||Reflect.has(a,u))},ownKeys(){i.recordRead(e);let a=Object.keys(o());return t?[...a,"length"]:a},getOwnPropertyDescriptor(a,u){if(typeof u=="symbol")return Reflect.getOwnPropertyDescriptor(a,u);if(t&&u==="length")return{value:i.peek(e).length,writable:!0,enumerable:!1,configurable:!1};if(i.peek(B(e,u))===void 0){i.recordRead(B(e,u));return}return{value:l.get(a,u,n),writable:!0,enumerable:!0,configurable:!0}},defineProperty(a,u,m){if(typeof u=="symbol"||!("value"in m))throw new TypeError("state only holds plain JSON data properties");return i.writeAt(B(e,u),Ne(m.value,B(e,u))),!0},setPrototypeOf:()=>!1,preventExtensions:()=>!1};return n=new Proxy(t?[]:{},l),this.proxies.set(r,n),n}};function Ne(s,e){if(s===void 0)return Z;if(s===null||typeof s=="string"||typeof s=="boolean")return s;if(typeof s=="number"){if(!Number.isFinite(s))throw new TypeError(`${e}: ${s} is not representable in JSON`);return s}if(typeof s=="object")return JSON.parse(JSON.stringify(s));throw new TypeError(`${e}: ${typeof s} values cannot be stored`)}function Ct(s,e,t,r){let n=s;for(let l of e.slice(0,-1))n=gt(n,[l]);let i=e[e.length-1];if(n===null||typeof n!="object")throw new TypeError(`cannot write "${r}": parent does not exist`);if(Array.isArray(n)){if(i==="length"){if(typeof t!="number"||!Number.isInteger(t)||t<0)throw new TypeError(`${r}: invalid array length`);for(;n.length<t;)n.push(null);n.length=t;return}if(!/^\d+$/.test(i))throw new TypeError(`${r}: arrays only take index keys`);let l=Number(i);for(;n.length<l;)n.push(null);n[l]=t===Z?null:t;return}let o=n;t===Z?delete o[i]:o[i]=t}function fr(s){let e={};if(s.preset!==void 0){if(s.preset!=="preview"&&s.preset!=="cinematic")throw new TypeError(`unknown render preset "${s.preset}"`);e.preset=s.preset}if(s.format!==void 0){if(s.format!=="png"&&s.format!=="jpeg")throw new TypeError(`unknown render format "${s.format}"`);e.format=s.format}for(let[t,r]of[["spp",65536],["width",8192],["height",8192]]){let n=s[t];if(n!==void 0){if(!Number.isInteger(n)||n<1||n>r)throw new TypeError(`render ${t} must be an integer in [1, ${r}]`);e[t]=n}}return e}function wt(s){return s.keys?{...s.keys}:Object.fromEntries(Object.entries({L:"lights",R:"rain",V:"viewpoint"}).filter(([,t])=>typeof s.handlers[t]=="function"||typeof s.on?.[t]=="function"))}function Rt(s){if(!s||typeof s.setup!="function")throw new TypeError("defineGame: setup(ctx) is required");if(s.on!==void 0&&(!s.on||typeof s.on!="object"))throw new TypeError("defineGame: on must be an object of world handlers");for(let[t,r]of Object.entries(s.on??{}))if(typeof r!="function")throw new TypeError(`defineGame: world handler "${t}" is not a function`);s.handlers===void 0&&s.on&&(s.handlers={});let e=s;if(!e.handlers||typeof e.handlers!="object")throw new TypeError("defineGame: handlers are required");for(let[t,r]of Object.entries(e.handlers))if(typeof r!="function")throw new TypeError(`defineGame: handler "${t}" is not a function`);if(e.frame!==void 0&&typeof e.frame!="function")throw new TypeError("defineGame: frame must be a function");if(e.pointer!==void 0&&e.pointer!=="look"&&e.pointer!=="free")throw new TypeError('defineGame: pointer must be "look" or "free"');for(let[t,r]of Object.entries(e.keys??{}))if(!e.handlers[r]&&!e.on?.[r])throw new TypeError(`defineGame: key "${t}" maps to unknown handler "${r}"`);if(_e(e.state)!==_e(JSON.parse(JSON.stringify(e.state??{}))))throw new TypeError("defineGame: state must be plain JSON");return e}function Tt(s){return{handlers:Object.keys(s.handlers),on:Object.keys(s.on??{}),tick:typeof s.tick=="function",frame:typeof s.frame=="function",keys:wt(s),seed:s.seed??null,pointer:s.pointer??null}}function br(s,e,t){return(t??s.seed??$t(e))>>>0}function Ft(s){return{state:JSON.parse(JSON.stringify(s.state??{}))}}function Bt(s,e){let t=br(s,e.roomId,e.seed),r=J(t,0),n=re(e.ts??0,r,()=>s.setup({roomId:e.roomId,seed:t,random:r}));if(typeof n?.then=="function")throw new Error("setup must be synchronous: it returns { scene, camera }, not a promise (setup is not awaited; build the scene, and add what arrives later to it)");return{...n,seed:t}}function Lt(s,e,t){let r=new qe(e,t),n=s.tick,i=s.handlers[t.type]??(t.type==="tick"&&n?(l,a)=>n(l,Number(a?.dt)||0):void 0),o={writes:[],emits:[],renders:[]};if(!i){let l=s.on?.[t.type]?`"${t.type}" has a world handler (on) only: it runs on the node that owns the scene, not as a state transaction`:`no handler for event type "${t.type}"`;return{status:"error",reads:{},...o,failure:l}}try{return re(t.ts,r.random,()=>{if(typeof i(r,structuredClone(t.payload))?.then=="function")throw new Error("handlers must be synchronous: a transaction cannot span an await")}),{status:"ok",...r.result()}}catch(l){let{reads:a}=r.result();return xt(l)?{status:"failed",reads:a,...o,failure:l.message}:{status:"error",reads:a,...o,failure:l instanceof Error?l.stack??l.message:String(l)}}}var pe=(s,e=0)=>typeof s=="number"&&Number.isFinite(s)?s:e,Vt=s=>Array.isArray(s)?s.filter(e=>typeof e=="string"&&e.length>0&&e.length<=32):[],fe=class{keys=new Set;buttons=new Set;held=new Set;went=new Set;left=new Set;stick=null;look={dx:0,dy:0};pointer={u:.5,v:.5};wheel=0;captured=!1;down(e){return this.held.has(e)}pressed(e){return this.went.has(e)}released(e){return this.left.has(e)}axis(e,t){return(this.held.has(t)?1:0)-(this.held.has(e)?1:0)}button(e){return this.held.has(`Mouse${e}`)}get move(){let[e,t]=this.stick??[this.axis("A","D"),this.axis("S","W")],r=Math.hypot(e,t);return r>1&&([e,t]=[e/r,t/r]),{x:e,y:t}}apply(e){if(e.keys!==void 0&&(this.keys=new Set(Vt(e.keys))),e.buttons!==void 0&&(this.buttons=new Set((Array.isArray(e.buttons)?e.buttons:[]).filter(t=>Number.isInteger(t)&&t>=0&&t<16).map(t=>`Mouse${t}`))),e.keys!==void 0||e.buttons!==void 0){let t=new Set([...this.keys,...this.buttons]);if(e.pressed===void 0)for(let r of t)this.held.has(r)||this.went.add(r);if(e.released===void 0)for(let r of this.held)t.has(r)||this.left.add(r);this.held=t}for(let t of Vt(e.pressed))this.went.add(t);for(let t of Vt(e.released))this.left.add(t);this.look={dx:this.look.dx+pe(e.dx),dy:this.look.dy+pe(e.dy)},this.wheel+=pe(e.wheel),(e.u!==void 0||e.v!==void 0)&&(this.pointer={u:pe(e.u,this.pointer.u),v:pe(e.v,this.pointer.v)}),e.captured!==void 0&&(this.captured=e.captured===!0),this.stick=Array.isArray(e.move)?[Math.max(-1,Math.min(1,pe(e.move[0]))),Math.max(-1,Math.min(1,pe(e.move[1])))]:null}endFrame(){this.went.size&&(this.went=new Set),this.left.size&&(this.left=new Set),(this.look.dx!==0||this.look.dy!==0)&&(this.look={dx:0,dy:0}),this.wheel=0}reset(){this.keys=new Set,this.buttons=new Set,this.held=new Set,this.stick=null,this.captured=!1,this.pointer={u:.5,v:.5},this.endFrame()}};var Ue=class{random;time=0;frozen=null;fn;store;scene;camera;ids=new Map;input;constructor(e,t,r,n,i,o=new fe){this.input=o,this.fn=e,this.store=t,this.scene=n,this.camera=i,this.random=J(r,2135587861)}get enabled(){return typeof this.fn=="function"}object(e){let t=this.ids.get(e);return t&&Jr(t,this.scene)?t:(this.ids=new Map,this.scene.traverse(r=>{r.stableId!==void 0&&!this.ids.has(r.stableId)&&this.ids.set(r.stableId,r),r.name&&!this.ids.has(r.name)&&this.ids.set(r.name,r)}),this.ids.get(e))}get clock(){return this.time}committed(){return(this.frozen?.seq!==this.store.seq||this.frozen.src!==this.store.state)&&(this.frozen={seq:this.store.seq,src:this.store.state,state:yr(structuredClone(this.store.state))}),this.frozen.state}seek(e){this.time=Math.max(e,0)}run(e,t,r=!1){e=Math.min(Math.max(e,0),.1),this.time+=e,this.fn&&this.fn({time:this.time,dt:e,snap:r,now:t,state:this.committed(),scene:this.scene,camera:this.camera,object:n=>this.object(n),random:this.random,input:this.input})}};function Jr(s,e){let t=s;for(;t&&t!==e;)t=t.parent;return t===e}function yr(s){if(s&&typeof s=="object"&&!Object.isFrozen(s)){Object.freeze(s);for(let e of Object.keys(s))yr(s[e])}return s}function Zr(){let s=new Map,e=Object.freeze({}),t=Object.freeze([]);return{post(r){if(!r||typeof r!="object"||typeof r.t!="string"||!r.t)throw new TypeError('host.post: a message is an object with a string "t"');let n=JSON.stringify(r);if(n===void 0)throw new TypeError(`host.post(${r.t}): the message must be plain JSON`);let i=globalThis.__host_post;return typeof i=="function"?i(n)!==!1:!1},on(r,n){if(typeof r!="string"||!r)throw new TypeError("host.on: the message type must be a non-empty string");if(typeof n!="function")throw new TypeError(`host.on(${r}): the listener must be a function`);let i=s.get(r)??[];return s.set(r,[...i,n]),()=>{let o=s.get(r)??[],l=o.indexOf(n);l>=0&&s.set(r,[...o.slice(0,l),...o.slice(l+1)])}},get launch(){return e},get caps(){return t},listens:r=>(s.get(r)?.length??0)>0,deliver(r,n){let i=[];for(let o of s.get(r.t)??[])try{if(typeof o(r,n)?.then=="function")throw new Error("host listeners must be synchronous: the engine's next tick does not wait for an await")}catch(l){i.push(l instanceof Error?l.stack??l.message:String(l))}return i},setLaunch(r,n){e=Object.freeze(r&&typeof r=="object"&&!Array.isArray(r)?{...r}:{}),t=Object.freeze(Array.isArray(n)?[...new Set(n.filter(i=>typeof i=="string"))]:[])}}}var Qr=globalThis,Je=Qr.__threert_host??=Zr(),Ze=Je;var gr=["top-left","top","top-right","left","center","right","bottom-left","bottom","bottom-right"],xr=["text","bar","list","table"];function Xr(s){if(!s||typeof s!="object")throw new TypeError("hud.set: the HUD is an object ({ crosshair, items, message })");for(let[t,r]of(s.items??[]).entries()){if(!r||!xr.includes(r.type))throw new TypeError(`hud.set: items[${t}].type must be one of ${xr.join(", ")}`);if(!gr.includes(r.anchor))throw new TypeError(`hud.set: items[${t}].anchor must be one of ${gr.join(", ")}`);if(r.type==="table"){if(!Array.isArray(r.columns)||!Array.isArray(r.rows)||!r.rows.every(n=>Array.isArray(n)))throw new TypeError(`hud.set: items[${t}]: a table has columns and rows (arrays)`);if(r.selectable!==void 0&&typeof r.selectable!="boolean")throw new TypeError(`hud.set: items[${t}].selectable is true or false`);if(r.id!==void 0&&(typeof r.id!="string"||r.id===""))throw new TypeError(`hud.set: items[${t}].id is a non-empty string`);if(r.highlight!==void 0&&!Number.isInteger(r.highlight))throw new TypeError(`hud.set: items[${t}].highlight is a row's index`)}}let e=(s.items??[]).flatMap(t=>t.type==="table"&&t.id!==void 0?[t.id]:[]);if(new Set(e).size!==e.length)throw new TypeError("hud.set: two tables have the same id")}var Wt=class{sent=null;flashed=null;last={};set(e){Xr(e),this.last=e;let t=this.flashed?{...e,flash:this.flashed}:e,r=_e(t);return r===this.sent?!1:(this.sent=r,Ze.post({t:"hud",hud:JSON.parse(r)}),!0)}flash(e,t){this.flashed={kind:e,...t===void 0?{}:{angle:t},n:(this.flashed?.n??0)+1},this.set(this.last)}clear(){this.set({})}reset(){this.sent=null,this.last={}}},Gt=new Wt;var Yr=1073741824;function Nt(s,e,t){let r=[],n=!1,i=J(e,t.id+Yr>>>0);return{world:{scene:s.scene,camera:s.camera,state:s.committed(),time:s.clock,now:t.ts,object:l=>s.object(l),random:i,emit(l,a={}){if(typeof l!="string"||!l)throw new TypeError("emit: event type must be a non-empty string");if(n)throw new Error(`emit(${l}): the handler or listener this world was given to has returned (code after an await runs when its entry is over); emit while it runs, or from a host listener`);let u=JSON.stringify(a);if(u===void 0)throw new TypeError(`emit(${l}): the payload must be plain JSON`);r.push({type:l,payload:JSON.parse(u)})},input:s.input},emits:r,random:i,close:()=>{n=!0}}}function Ht(s,e,t,r){let{world:n,emits:i,random:o,close:l}=Nt(e,t,r);try{return re(r.ts,o,()=>{if(typeof s(n,structuredClone(r.payload))?.then=="function")throw new Error("world handlers must be synchronous: the engine's next tick does not wait for an await")}),{emits:i}}catch(a){return{emits:[],error:a instanceof Error?a.stack??a.message:String(a)}}finally{l()}}function Ut(s,e){let t=null,r=null,n=null,i=0,o=new fe,l=()=>{if(!t||!r||!n)throw new Error("setup() has not run");return{store:t,frames:r,binding:n}},a=(c,d=!1)=>{let{frames:p,binding:f}=l();f.deliverPhysicsEvents(),p.run(0,c,d),f.sync()},u=(c,d,p,f)=>{let{store:b}=l();for(;c.length;){let g=c.shift(),w=Lt(s,b,{id:g.id??++i,type:g.type,payload:g.payload,ts:d});if(w.status==="error"){f.push(`\u2717 ${g.type}: error ${w.failure?.split(`
`)[0]}`);continue}let v=jt(b,w);if(!v.ok){f.push(`\u2717 ${g.type}: conflict on ${v.conflicts.join(", ")}`);continue}p.push(...v.applied),c.push(...w.emits.map(x=>({type:x.type,payload:x.payload}))),g.type!=="tick"&&f.push(`${w.status==="ok"?"\u2713":"\u2717"} seq ${v.seq} ${g.type}${w.failure?` \u2014 ${w.failure}`:""} \xB7 ${Object.keys(w.reads).length}R/${w.writes.length}W`)}},m=c=>{let d=l().binding.objectNamed(c);if(!d)throw new Error(`no object "${c}"`);return d},h={describe:()=>JSON.stringify({...Tt(s),keys:wt(s)}),setup(c,d){let p=Date.now(),f=Bt(s,{roomId:c,seed:d??void 0});t=bt(Ft(s),f.seed),r=new Ue(s.frame,t,f.seed,f.scene,f.camera,o),Gt.reset();let b=e??globalThis.__engine;if(!b)throw new Error("no engine: run the bundle in the renderer (threert-render play / live / render)");n=new pt(b,f.scene,f.camera,f.options),r.run(0,p,!0);let g=n.sync();return JSON.stringify({seed:f.seed,objects:g.created})},event(c,d,p){let{store:f,frames:b,binding:g}=l(),w=[],v=[],x={type:c,payload:JSON.parse(d),id:++i},P=[],I=s.on?.[c],S=typeof s.handlers[c]=="function"||c==="tick"&&typeof s.tick=="function";if((!I||S)&&P.push(x),I){let ze=Ht(I,b,f.seed,{id:x.id,type:c,payload:x.payload,ts:p});v.push(ze.error===void 0?`\u2713 ${c} (world)`:`\u2717 ${c} (world): error ${ze.error.split(`
`)[0]}`),P.push(...ze.emits)}return P.length?(u(P,p,w,v),a(p),JSON.stringify({writes:w,log:v,seq:f.seq})):(g.sync(),JSON.stringify({writes:w,log:v,seq:f.seq}))},commit(c,d){Ge(l().store,JSON.parse(c),d),a(Date.now())},setState(c,d){let p=l().store;p.state=JSON.parse(c),p.seq=d,a(Date.now(),!0)},state(){let c=l().store;return JSON.stringify({state:c.state,seq:c.seq})},frame(c,d){let{frames:p,binding:f}=l();f.deliverPhysicsEvents();let b=null;try{p.run(c,d)}catch(g){b={error:g}}o.endFrame();try{f.sync()}catch(g){if(!b)throw g;console.error(g)}if(b)throw b.error},hostMessages(c,d){let{store:p,frames:f,binding:b}=l(),g=JSON.parse(c);if(!Array.isArray(g))throw new TypeError("hostMessages: a JSON array of messages");let w=null;for(let x of g){if(!x||typeof x!="object"||typeof x.t!="string")continue;if(x.t==="input"){o.apply(x);continue}if(x.t==="launch"&&Je.setLaunch(x.params,x.caps),!Je.listens(x.t))continue;w??=Nt(f,p.seed,{id:++i,ts:d});let{world:P,random:I}=w;for(let S of re(d,I,()=>Je.deliver(x,P)))console.error(`host message ${x.t}: ${S}`)}if(!w)return;if(w.close(),!w.emits.length){b.sync();return}let v=[];u(w.emits.splice(0),d,[],v);for(let x of v)x.startsWith("\u2717")&&console.error(x);a(d)},sync(){n?.sync()},seek(c,d){l().frames.seek(c),a(d,!0)},outline(){let{binding:c}=l(),d=c.boundObjects().map(([p,f])=>({name:p,label:f.name||p,kind:vr(f),parent:f.parent?c.nameOf(f.parent)??null:null,visible:f.visible,active:f===c.camera}));return JSON.stringify(d)},inspect(c){let{binding:d}=l();return JSON.stringify(c?en(d,c,m(c)):tn(d))},edit(c,d,p){let{binding:f}=l();rn(f,c,c?m(c):null,d,JSON.parse(p)),f.sync()}};return globalThis.__threert=h,h}var Q=s=>Math.round(s*1e4)/1e4,wr=s=>s*180/Math.PI,qt=s=>[Q(s.r),Q(s.g),Q(s.b)],Kr={directional:"lux",point:"cd",spot:"cd",rect:"nits"};function vr(s){return s instanceof j?"camera":s instanceof C?"sun":s instanceof E?`${Pe(s).type}light`:s instanceof T?"model":s.type==="InstancedMesh"?"instanced":s instanceof $?"mesh":"group"}function en(s,e,t){let r=t instanceof $?t.material:null,n=r?s.boundObjects().filter(([,o])=>o instanceof $&&o.material===r).length:0,i=t instanceof E?Pe(t):null;return{node:{id:e,name:t.name||e,kind:vr(t),parent:t.parent?s.nameOf(t.parent)??null:null,tags:[...t.tags],location:t.position.toArray().map(Q),rotation:[t.rotation.x,t.rotation.y,t.rotation.z].map(o=>Math.round(wr(o)*100)/100),scale:t.scale.toArray().map(Q),visible:t.visible,castShadow:t.castShadow,geometry:t instanceof $?{id:t.geometry.type,triangles:t.geometry.index.length/3}:null,model:t instanceof T?t.uri:null,material:r&&{id:r.name,name:r.name||"material",users:n,color:qt(r.color),roughness:Q(r.roughness),metalness:Q(r.metalness),opacity:Q(r.opacity),emissive:qt(r.emissive),emissiveIntensity:Math.round(r.emissiveIntensity*100)/100,textured:!!(r.map||r.normalMap||r.roughnessMap)},light:i&&{type:i.type,unit:Kr[i.type],color:i.color.map(Q),intensity:Math.round(i.intensity*100)/100,castShadow:i.castShadow,radius:"radius"in i?i.radius:null,range:"range"in i?i.range??null:null,angle:"angle"in i?Math.round(wr(i.angle)*100)/100:null,penumbra:"penumbra"in i?i.penumbra:null,width:"width"in i?i.width:null,height:"height"in i?i.height:null,angularDiameter:"angularDiameter"in i?i.angularDiameter:null},camera:t instanceof j?{fov:t.fov,exposure:t.exposure.mode==="manual"?t.exposure.ev100:null,active:t===s.camera}:null}}}function tn(s){let{scene:e,options:t}=s,r=e.environment,n=e.fog,i=s.counts();return{world:{name:t.name??(e.name||"scene"),preset:t.preset??"cinematic",resolution:[t.width??1280,t.height??720],sky:r?.kind??"atmosphere",skyLight:r?.skyLightIntensity??1,skyIntensity:r&&"intensity"in r?r.intensity:null,skyColor:r instanceof te?qt(r.color):null,sun:r instanceof me&&r.sun?s.nameOf(r.sun)??null:null,fog:n?{density:n.density,heightFalloff:n.heightFalloff,scattering:n.volumetric?.scattering??null}:null,wetness:e.wetness,rain:e.rain,counts:{nodes:i.objects,materials:i.materials,geometries:i.geometries,textures:i.textures}}}}function rn(s,e,t,r,n){let[i,o,l]=r.split("."),a=l===void 0?-1:Number(l),u=()=>{throw new Error(`${e||"world"}: cannot edit ${r}`)},m=(c=-1/0,d=1/0)=>{if(typeof n!="number"||!Number.isFinite(n))throw new TypeError(`${r} must be a number`);return Math.min(d,Math.max(c,n))},h=c=>{a>=0&&a<3||u(),c.setRGB(...[c.r,c.g,c.b].map((d,p)=>p===a?m(0):d))};if(i==="world"){let{scene:c}=s,d=c.environment;o==="wetness"?c.wetness=m(0,1):o==="rain"?c.rain=m(0,1):o==="skyLight"&&d?d.skyLightIntensity=m(0):o==="skyIntensity"&&d&&"intensity"in d?d.intensity=m(0):o==="skyColor"&&d instanceof te?h(d.color):o==="fogDensity"&&c.fog?c.fog.density=m(0):o==="fogFalloff"&&c.fog?c.fog.heightFalloff=m(0):o==="fogScattering"&&c.fog?.volumetric?c.fog.volumetric.scattering=m(0):u();return}if(!t)return u();switch(i){case"node":{if(o==="visible")t.visible=!!n;else if(o==="castShadow")t.castShadow=!!n;else if(o==="location"&&a>=0&&a<3)t.position.setComponent(a,m());else if(o==="scale"&&a>=0&&a<3)t.scale.setComponent(a,Math.abs(m())<1e-4?1e-4:m());else if(o==="rotation"&&a>=0&&a<3){let c=[t.rotation.x,t.rotation.y,t.rotation.z];c[a]=m()*Math.PI/180,t.rotation.set(c[0],c[1],c[2])}else u();return}case"material":{let c=t instanceof $?t.material:u();o==="color"||o==="emissive"?h(c[o]):o==="roughness"||o==="metalness"||o==="opacity"?c[o]=m(0,1):o==="emissiveIntensity"?c.emissiveIntensity=m(0):u();return}case"light":{let c=t instanceof E?t:u();o==="color"?h(c.color):o==="intensity"?c.intensity=m(0):o==="castShadow"?c.castShadow=!!n:o==="angle"&&c instanceof F?c.angle=m(1,89)*Math.PI/180:o==="penumbra"&&c instanceof F?c.penumbra=m(0,1):o==="range"&&(c instanceof G||c instanceof F||c instanceof ce)?c.distance=m(0):o==="radius"&&(c instanceof G||c instanceof F)?c.radius=m(0):(o==="width"||o==="height")&&c instanceof ce?c[o]=m(0):o==="angularDiameter"&&c instanceof C?c.angularDiameter=m(0):u();return}case"camera":{let c=t instanceof j?t:u();o==="fov"?c.fov=m(5,150):o==="exposure"&&c.exposure.mode==="manual"?c.exposure={mode:"manual",ev100:m(-6,22)}:u();return}default:u()}}var pi=64<<20;var nn=globalThis,fi=nn.__threert_requests??={n:0,pending:new Map,listening:new Set};var bi=(()=>{let s=globalThis.performance;if(s&&typeof s.now=="function")return()=>s.now();let e=Date.now;return()=>e()})();Ut(Rt({state:{},setup:Dt,handlers:{}}));})();
