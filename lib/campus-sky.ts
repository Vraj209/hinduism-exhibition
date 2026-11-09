import * as THREE from "three";
import { CAMPUS_WIND_DIRECTION } from "./campus-environment";

// Original periodic density field. Its broad forms and fine edges are generated
// once; animation only changes sampling coordinates, with no per-frame texture upload.
function makeCloudField(size: number) {
  const data = new Uint8Array(size * size * 4);
  const hash = (x: number, y: number, period: number) => {
    let n = ((x + period) % period) * 374761393 + ((y + period) % period) * 668265263 + 19341;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const noise = (x: number, y: number, period: number) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const sx = THREE.MathUtils.smootherstep(x - ix, 0, 1);
    const sy = THREE.MathUtils.smootherstep(y - iy, 0, 1);
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(hash(ix, iy, period), hash(ix + 1, iy, period), sx),
      THREE.MathUtils.lerp(hash(ix, iy + 1, period), hash(ix + 1, iy + 1, period), sx), sy,
    );
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let value = 0, amplitude = 0.52, period = 4;
      for (let octave = 0; octave < 5; octave++) {
        value += noise((x / size) * period, (y / size) * period, period) * amplitude;
        amplitude *= 0.5;
        period *= 2;
      }
      const index = (y * size + x) * 4;
      data[index] = Math.round(value * 255);
      data[index + 1] = data[index];
      data[index + 2] = data[index];
      data[index + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  const sample = (u: number, v: number) => {
    const x = THREE.MathUtils.euclideanModulo(u * size - 0.5, size);
    const y = THREE.MathUtils.euclideanModulo(v * size - 0.5, size);
    const ix = Math.floor(x), iy = Math.floor(y);
    const value = (dx: number, dy: number) => data[(((iy + dy) % size) * size + (ix + dx) % size) * 4] / 255;
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(value(0, 0), value(1, 0), x - ix), THREE.MathUtils.lerp(value(0, 1), value(1, 1), x - ix), y - iy);
  };
  return { texture, sample };
}

/** World-space cloud layers and matching soft shadows, driven by the garden clock. */
export function makeCampusSky(mobile: boolean) {
  const textureSize = mobile ? 256 : 512;
  const field = makeCloudField(textureSize);
  const uniforms = {
    cloudTexture: { value: field.texture },
    cloudOffset: { value: new THREE.Vector2() },
    cloudTime: { value: 0 },
  };
  const group = new THREE.Group();
  group.name = "Open daylight sky with drifting cloud layers";
  const cloudLayers = mobile ? 2 : 3;
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `varying vec3 skyWorld;
      void main() { vec4 p = modelMatrix * vec4(position, 1.); skyWorld = p.xyz;
        gl_Position = projectionMatrix * viewMatrix * p; }`,
    fragmentShader: `
      uniform sampler2D cloudTexture;
      uniform vec2 cloudOffset;
      varying vec3 skyWorld;
      float density(vec2 uv, float threshold) {
        float broad = texture2D(cloudTexture, uv).r;
        float detail = texture2D(cloudTexture, uv * 3.7 + vec2(.27, .41)).r;
        return smoothstep(threshold, threshold + .16, broad + (detail - .5) * .12);
      }
      void main() {
        vec3 ray = normalize(skyWorld - cameraPosition);
        float elevation = max(0., ray.y);
        vec3 horizon = vec3(.82, .85, .81);
        vec3 zenith = vec3(.32, .52, .66);
        vec3 color = mix(horizon, zenith, pow(clamp(elevation, 0., 1.), .58));
        // Different altitudes, scales and densities give perspective depth.
        // The haze band around the horizon leaves the mandir silhouette clear.
        if (ray.y > .035) {
          for (int layer = ${cloudLayers - 1}; layer >= 0; layer--) {
            float l = float(layer);
            float altitude = 56. + l * 66.;
            vec2 world = cameraPosition.xz + ray.xz * ((altitude - cameraPosition.y) / ray.y);
            vec2 uv = (world - cloudOffset * (1. + l * .18)) / (210. + l * 105.) + vec2(.14 + l * .31, .35 - l * .19);
            float d = density(uv, .57 + l * .025);
            float neighbor = density(uv + vec2(-.012, .016), .57 + l * .025);
            float edgeLight = clamp(.66 + (d - neighbor) * .65, .32, 1.);
            vec3 cloudColor = mix(vec3(.61, .69, .72), vec3(1., .97, .89), edgeLight);
            float opacity = d * (.82 - l * .14) * smoothstep(.035, .18, ray.y);
            color = mix(color, cloudColor, opacity);
          }
        }
        gl_FragColor = vec4(color, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(380, 32, 16), material);
  sky.name = "Soft multi-altitude daylight clouds";
  sky.renderOrder = -100;
  sky.frustumCulled = false;
  group.add(sky);

  // The same world-space field shades actual surfaces; no floating shadow plane
  // or recurring shadow-map pass is needed for cloud movement.
  function attachShadows(root: THREE.Object3D) {
    const seen = new Set<THREE.Material>();
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const surface of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!(surface instanceof THREE.MeshStandardMaterial) || surface.transparent || seen.has(surface)) continue;
        seen.add(surface);
        const previous = surface.onBeforeCompile;
        const previousKey = surface.customProgramCacheKey();
        surface.onBeforeCompile = function (shader, renderer) {
          previous.call(this, shader, renderer);
          shader.uniforms.cloudTexture = uniforms.cloudTexture;
          shader.uniforms.cloudOffset = uniforms.cloudOffset;
          shader.vertexShader = `varying vec3 cloudSurfaceWorld;\n` + shader.vertexShader.replace(
            "#include <worldpos_vertex>",
            `#include <worldpos_vertex>
             vec4 cloudWorld = vec4(transformed, 1.);
             #ifdef USE_INSTANCING
               cloudWorld = instanceMatrix * cloudWorld;
             #endif
             cloudSurfaceWorld = (modelMatrix * cloudWorld).xyz;`,
          );
          shader.fragmentShader = `uniform sampler2D cloudTexture; uniform vec2 cloudOffset; varying vec3 cloudSurfaceWorld;\n` + shader.fragmentShader.replace(
            "#include <lights_fragment_end>",
            `#include <lights_fragment_end>
             vec2 shadowUV = (cloudSurfaceWorld.xz + vec2(-.84, .84) * (56. - cloudSurfaceWorld.y) - cloudOffset) / 210. + vec2(.14, .35);
             float cloudShade = smoothstep(.57, .73, texture2D(cloudTexture, shadowUV).r);
             reflectedLight.directDiffuse *= 1. - cloudShade * .095;
             reflectedLight.directSpecular *= 1. - cloudShade * .095;`,
          );
        };
        surface.customProgramCacheKey = () => `${previousKey}-soft-cloud-shadows-v1`;
        surface.needsUpdate = true;
      }
    });
  }
  let sunFactor = 1;
  function update(seconds: number) {
    uniforms.cloudTime.value = seconds;
    uniforms.cloudOffset.value.set(CAMPUS_WIND_DIRECTION.x * seconds * .24, CAMPUS_WIND_DIRECTION.z * seconds * .24);
    const offset = uniforms.cloudOffset.value;
    const sunCover = THREE.MathUtils.smoothstep(field.sample((-47.04 - offset.x) / 210 + .14, (47.04 - offset.y) / 210 + .35), .57, .73);
    sunFactor = 1 - sunCover * .025;
    return sunFactor;
  }
  update(0);
  return {
    group,
    attachShadows,
    update,
    diagnostics: { cloudLayers, textureSize, shadowTextureSamples: 1, cloudDriftUnitsPerSecond: .24 },
    snapshot: () => ({ time: uniforms.cloudTime.value, offset: uniforms.cloudOffset.value.toArray(), shadowOffset: uniforms.cloudOffset.value.toArray(), sunFactor }),
    dispose() { field.texture.dispose(); sky.geometry.dispose(); material.dispose(); },
  };
}
