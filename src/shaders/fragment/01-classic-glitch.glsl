// name: Core: Classic Glitch
// params: amount, glitch
precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_time; uniform float u_audio; uniform float u_dryWet;
uniform float u_amount; uniform float u_glitch;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
void main(){
  vec3 baseCol = texture2D(u_tex, v_uv).rgb;
  if (u_dryWet < 0.01) { gl_FragColor = vec4(baseCol, 1.0); return; }
  
  float px = mix(1.0, 120.0, clamp(u_amount*0.85, 0.0, 1.0));
  vec2 uvPix = floor(v_uv * px) / px;
  float tear = step(fract(v_uv.y*mix(40.,400.,u_glitch)+u_time*(2.+u_audio*6.)),u_glitch*.7+.5);
  vec2 uvGlitch=uvPix+vec2(tear*(hash(vec2(v_uv.y*100.,u_time))-.5)*(0.06*u_glitch),0.);
  float w=(u_amount*.8); uvGlitch.x+=.015*w*sin(uvGlitch.y*20.+u_time*2.5); uvGlitch.y+=.01*w*cos(uvGlitch.x*18.+u_time*2.);
  float off=.007*(u_amount*.7); vec2 dir=normalize(vec2(.8,.6));
  vec3 col; col.r=texture2D(u_tex,uvGlitch+dir*off).r; col.g=texture2D(u_tex,uvGlitch).g; col.b=texture2D(u_tex,uvGlitch-dir*off).b;
  gl_FragColor = vec4(mix(baseCol, col, u_dryWet), 1.0);
}
