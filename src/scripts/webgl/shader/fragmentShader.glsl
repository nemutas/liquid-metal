precision highp float;

#define m4v3Vec(m4, v3) normalize((m4 * vec4(v3, 0.0)).xyz)
#define m4v3Coord(m4, v3) (m4 * vec4(v3, 1.0)).xyz

struct Model {
  int shape;
  mat4 matrix;
};

uniform vec3 uCameraPosition;
uniform mat4 uProjectionMatrixInverse;
uniform mat4 uViewMatrixInverse;
uniform mat4 uNormalMatrix;
uniform Model uModel[ModelCount];
uniform samplerCube tEnv;

varying vec2 vUv;

const int MAX_STEPS = 70;
const float MAX_DIST = 100.0;

#include './modules/primitives.glsl'
#include './modules/combinations.glsl'

float sdf(vec3 p) {
  float final = 100.0;

  for (int i = 0; i < ModelCount; i++) {
    vec3 p = m4v3Coord(uModel[i].matrix, p);
    float shape = sdSphere(p, 0.25);
    final = opSmoothUnion(final, shape, 0.6);
  }

  float inner = sdSphere(vec3(p), 0.8);
  final = opSmoothIntersection(final, -inner, 0.3);

  float outer = sdSphere(vec3(p), 1.0);
  final = opSmoothIntersection(final, outer, 0.3);

  return final;
}

#include './modules/normal.glsl'

void main() {
  vec3 ro = uCameraPosition;
  vec2 p = vUv * 2.0 - 1.0;
  vec4 ndcRay = vec4(p, 1.0, 1.0);
  vec4 target = uViewMatrixInverse * uProjectionMatrixInverse * ndcRay;
  vec3 ray = normalize(target.xyz / target.w - ro);

  float totalDist = 0.0;

  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 rayPos = ro + totalDist * ray;
    float dist = sdf(rayPos);
    if (abs(dist) < 0.001 || MAX_DIST < totalDist) break;
    totalDist += dist;
  }

  vec3 color = vec3(0);

  if (totalDist < MAX_DIST) {
    vec3 p = ro + totalDist * ray;
    vec3 normal = calcNormal(p);
    vec3 reflection = reflect(ray, normal);
    vec3 env = textureCube(tEnv, reflection).rgb;

    float fresnel = pow(1.0 + dot(ray, normal), 1.5);
    fresnel = smoothstep(-0.1, 1.0, fresnel);
    
    float speculer = dot(reflection, normalize(vec3(1.0, 1.0, 0.5)));
    speculer = clamp(speculer, 0.0, 1.0);
    speculer = pow(speculer, 50.0);

    color = mix(env, vec3(0.05), fresnel - speculer);

    float depth = smoothstep(-1.5, 1.0, p.z);
    color *= depth;

    // color = vec3(speculer);
  }

  gl_FragColor = vec4(color, 1.0);
}