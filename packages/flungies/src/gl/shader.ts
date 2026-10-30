// The body shader. The body is a distance field of the same outline the SVG draws, lifted into a dome, lit from the
// top left, with a velvet sheen and fibres that break the edge into fuzz.

export const VERT = `#version 300 es
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2. - 1., 0., 1.); }`

export const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform sampler2D uSdf;    // signed distance to the outline, in units (100 per side), negative inside
uniform float uMirror;
uniform vec2 uAnchor;      // where the breathing squash is pinned: the bottom of the body
uniform vec2 uBreath;      // x and y scale
uniform vec3 uBase, uLight, uShade;
uniform float uSeed, uDarkBody;
out vec4 o;

float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
float sdf(vec2 p) { return texture(uSdf, p / 100.).r; }

void main() {
  vec2 w = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes * 100.;
  float upp = 100. / uRes.x;
  vec2 p = w;
  if (uMirror > .5) p.x = 100. - p.x;
  p = uAnchor + (p - uAnchor) / uBreath;

  float d = sdf(p);
  if (d > 4.) { o = vec4(0); return; }
  vec2 e = vec2(.4, 0.);
  vec2 g = vec2(sdf(p + e.xy) - sdf(p - e.xy), sdf(p + e.yx) - sdf(p - e.yx));
  g = g / max(length(g), 1e-4);

  // Fuzz: fibres run outward along the normal, so the noise is stretched across the edge, not along it.
  vec2 tng = vec2(-g.y, g.x);
  float along = dot(p, tng), across = dot(p, g);
  float fib = noise(vec2(along * 2.6, across * .45) + uSeed);
  float fluff = fbm(p * .9 + uSeed * 1.7);
  float edge = smoothstep(-3., .5, d);
  float df = d + ((fib - .5) * 1.5 + (fluff - .5) * 1.1) * edge;
  float a = clamp(.5 - df / (upp * 1.1), 0., 1.);
  float halo = smoothstep(1.4, -.2, df) * (1. - a) * (.25 + .75 * fib) * .6;

  // A dome: height rises fast at the edge, flat on top.
  float t = clamp(-d / 13., 0., 1.);
  float h = sqrt(1. - (1. - t) * (1. - t));
  vec2 gs = uMirror > .5 ? vec2(-g.x, g.y) : g;
  vec3 n = normalize(vec3(gs * (1. - t) * 1.9, h + .18));
  // bump the normal with the fibre noise for a felted surface
  n = normalize(n + vec3((noise(p * 3.1 + uSeed) - .5) * .22, (noise(p * 3.1 + 41.) - .5) * .22, 0.));
  vec3 L = normalize(vec3(-.5, -.72, .8));
  float dif = clamp(dot(n, L) * .62 + .42, 0., 1.);
  float sheen = pow(1. - clamp(n.z, 0., 1.), 2.4);
  float spec = pow(max(dot(reflect(-L, n), vec3(0, 0, 1)), 0.), 14.);

  vec3 col = mix(uShade, uBase, smoothstep(.12, .78, dif));
  col = mix(col, uLight, smoothstep(.8, 1., dif) * .7);
  col += uLight * sheen * mix(.28, .45, uDarkBody) * (.5 + .5 * fib);
  col += vec3(1.) * spec * mix(.12, .06, uDarkBody);
  // occlusion along the lower edge, where it turns away from the light
  col *= 1. - .22 * edge * smoothstep(.1, -.7, dot(gs, normalize(vec2(-.5, -.72))));
  // fine fibre grain
  col *= .955 + .09 * noise(p * 7.5 + uSeed * 3.);

  float A = clamp(a + halo, 0., 1.);
  vec3 C = mix(col, mix(uBase, uLight, .3), (1. - a) * .5);
  o = vec4(C * A, A);
}`
