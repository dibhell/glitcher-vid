// name: Core: Bump-Map Shine
// params: bump, lightAng
precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform vec2 u_resolution; uniform float u_time; uniform float u_audio; uniform float u_dryWet;
uniform float u_bump; uniform float u_lightAng;
void main(){
  vec3 baseCol = texture2D(u_tex, v_uv).rgb;
  if (u_dryWet < 0.01) { gl_FragColor = vec4(baseCol, 1.0); return; }
  vec2 texel = 1.0 / u_resolution.xy;
  float hL = dot(texture2D(u_tex, v_uv - vec2(texel.x,0.0)).rgb, vec3(0.299,0.587,0.114));
  float hR = dot(texture2D(u_tex, v_uv + vec2(texel.x,0.0)).rgb, vec3(0.299,0.587,0.114));
  float hD = dot(texture2D(u_tex, v_uv - vec2(0.0,texel.y)).rgb, vec3(0.299,0.587,0.114));
  float hU = dot(texture2D(u_tex, v_uv + vec2(0.0,texel.y)).rgb, vec3(0.299,0.587,0.114));
  float k = mix(0.0, 3.5, u_bump + u_audio*0.8);
  vec3 N = normalize(vec3((hL - hR)*k, (hD - hU)*k, 1.0));
  vec3 L = normalize(vec3(cos(u_lightAng), sin(u_lightAng), 0.6));
  float lambert = max(dot(N, L), 0.0);
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 R = reflect(-L, N);
  float spec = pow(max(dot(R, V), 0.0), 24.0) * (0.3 + 0.7*u_audio);
  vec3 col = baseCol * (0.35 + 0.75*lambert) + spec;
  gl_FragColor = vec4(mix(baseCol, col, u_dryWet), 1.0);
}
