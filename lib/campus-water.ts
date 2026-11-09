import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { campusLayout } from "./campus";
import { CAMPUS_WIND_DIRECTION, sampleCampusWind } from "./campus-environment";

// Landscape dimensions are calibrated at 3.134032258 m per scene unit.
// Water sits below the .17-unit coping; all jets remain below .65 units (~2 m).
const waterHeight = 0.145;
const nozzleHeight = 0.2;
const jetRise = 0.4;
const impactRadius = 1.28;
const jetAngles = 8;

/** Orderly ballistic arcs, moving droplets and their matching basin impacts. */
export function makeCampusWater(mobile: boolean) {
  const group = new THREE.Group();
  group.name = "Continuous flowing fountain water";
  const uniforms = {
    gardenTime: { value: 0 },
    gardenWind: { value: 0.3 },
    gardenReflection: { value: null as THREE.CubeTexture | null },
    gardenHasReflection: { value: 0 },
  };
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec3 gardenPosition;
      void main() { vec4 world = modelMatrix * vec4(position, 1.); gardenPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world; }`,
    fragmentShader: `
      uniform float gardenTime; uniform float gardenWind;
      uniform samplerCube gardenReflection; uniform float gardenHasReflection;
      varying vec3 gardenPosition;
      float wave(vec2 p) {
        float t = gardenTime;
        vec2 wind = vec2(${CAMPUS_WIND_DIRECTION.x.toFixed(4)}, ${CAMPUS_WIND_DIRECTION.z.toFixed(4)});
        float height = sin(dot(p, wind) * 8. - t * 1.8) * (.003 + gardenWind * .004);
        height += sin(p.x * 13. - p.y * 4. + t * 1.1) * .002;
        // The next fountain is eleven units away; impact waves decay before it.
        // Evaluate only the closest eight impacts, including on mobile.
        float center = -25. + clamp(floor((p.y + 25.) / 11. + .5), 0., 4.) * 11.;
        for (int j = 0; j < 8; j++) {
            float angle = float(j) * .785398;
            vec2 impact = vec2(cos(angle) * ${impactRadius}, center + sin(angle) * ${impactRadius});
            float d = distance(p, impact);
            height += sin(d * 17. - t * 5. + float(j) * .31) * exp(-d * 2.1) * .003;
        }
        return height;
      }
      void main() {
        vec2 p = gardenPosition.xz;
        float h = wave(p);
        vec3 n = normalize(vec3((h - wave(p + vec2(.035, 0.))) / .035, 1., (h - wave(p + vec2(0., .035))) / .035));
        vec3 view = normalize(cameraPosition - gardenPosition);
        vec3 reflection = reflect(-view, n);
        vec3 reflected = textureCube(gardenReflection, reflection).rgb;
        float fresnel = .09 + .21 * pow(1. - max(0., dot(view, n)), 3.);
        vec3 base = mix(vec3(.19, .32, .29), vec3(.29, .44, .37), .5 + h * 3.);
        vec3 color = mix(base, reflected, fresnel * gardenHasReflection);
        vec3 light = normalize(vec3(-42., 50., 42.));
        float glint = pow(max(0., dot(reflect(-light, n), view)), 85.) * .23;
        float foam = 0.;
        // The next fountain is eleven units away; impact waves decay before it.
        // Evaluate only the closest eight impacts, including on mobile.
        float center = -25. + clamp(floor((p.y + 25.) / 11. + .5), 0., 4.) * 11.;
        for (int j = 0; j < 8; j++) {
            float angle = float(j) * .785398;
            float d = distance(p, vec2(cos(angle) * ${impactRadius}, center + sin(angle) * ${impactRadius}));
            foam += exp(-d * 22.) * (.15 + .035 * sin(gardenTime * 5. + float(j)));
        }
        color += vec3(.82,.88,.77) * (glint + foam);
        gl_FragColor = vec4(color, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(4.16, 51.96),
    waterMaterial,
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, waterHeight, -3);
  water.name = "Wind ripples and captured architectural reflections";
  group.add(water);

  const jetParts: THREE.BufferGeometry[] = [];
  for (const center of campusLayout.fountains) {
    for (let j = 0; j < jetAngles; j++) {
      const angle = (j / jetAngles) * Math.PI * 2;
      const points = Array.from({ length: 25 }, (_, index) => {
        const t = index / 24;
        return new THREE.Vector3(
          Math.cos(angle) * impactRadius * t,
          nozzleHeight +
            4 * jetRise * t * (1 - t) -
            (nozzleHeight - waterHeight) * t,
          center + Math.sin(angle) * impactRadius * t,
        );
      });
      jetParts.push(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(points),
          mobile ? 16 : 24,
          0.0075,
          5,
          false,
        ),
      );
    }
    // The central upward stream narrows naturally above its nozzle.
    jetParts.push(
      new THREE.CylinderGeometry(0.006, 0.012, 0.42, 8, 10, true).translate(
        0,
        nozzleHeight + 0.21,
        center,
      ),
    );
  }
  const jetGeometry = mergeGeometries(jetParts);
  jetParts.forEach((geometry) => geometry.dispose());
  const jetMaterial = new THREE.MeshStandardMaterial({
    color: "#d8e8de",
    roughness: 0.23,
    metalness: 0.12,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  jetMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.gardenTime = uniforms.gardenTime;
    shader.uniforms.gardenWind = uniforms.gardenWind;
    shader.vertexShader =
      `uniform float gardenTime; uniform float gardenWind; varying vec2 flowUv;\n` +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
      flowUv = uv;
      float lift = max(0., position.y - ${waterHeight});
      transformed.x += ${CAMPUS_WIND_DIRECTION.x.toFixed(4)} * gardenWind * lift * .035;
      transformed.z += ${CAMPUS_WIND_DIRECTION.z.toFixed(4)} * gardenWind * lift * .035;
      transformed.y += sin(gardenTime * .8 + position.z * .12) * .017 * lift;
    `,
      );
    shader.fragmentShader =
      `uniform float gardenTime; varying vec2 flowUv;\n` +
      shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
      float flow = .84 + .16 * sin(flowUv.x * 75. - gardenTime * 12.);
      diffuseColor.rgb *= flow;
      diffuseColor.a *= .82 + .18 * sin(flowUv.x * 44. - gardenTime * 9.);
    `,
      );
  };
  jetMaterial.customProgramCacheKey = () => "garden-flowing-jets-v1";
  const jets = new THREE.Mesh(jetGeometry!, jetMaterial);
  jets.name = "Five fountains with eight continuous parabolic streams";
  group.add(jets);

  const jetDroplets = mobile ? 80 : 200;
  const splashDroplets = mobile ? 40 : 120;
  const dropletGeometry = new THREE.SphereGeometry(1, 5, 3);
  const dropletMaterial = new THREE.MeshStandardMaterial({
    color: "#d7e8df",
    roughness: 0.22,
    metalness: 0.12,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const droplets = new THREE.InstancedMesh(
    dropletGeometry,
    dropletMaterial,
    jetDroplets + splashDroplets,
  );
  droplets.name = "Falling edge droplets and impact splashes";
  droplets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  droplets.frustumCulled = false;
  group.add(droplets);
  // Damp stone around nozzle feet has a lower roughness and a deeper tone.
  const wetMaterial = new THREE.MeshStandardMaterial({
    color: "#b4a98d",
    roughness: 0.42,
    metalness: 0.02,
  });
  const wetParts = campusLayout.fountains.map((z) =>
    new THREE.CylinderGeometry(0.2, 0.2, 0.004, 24).translate(0, 0.182, z),
  );
  const wet = new THREE.Mesh(mergeGeometries(wetParts)!, wetMaterial);
  wetParts.forEach((geometry) => geometry.dispose());
  wet.name = "Damp stone around fountain nozzles";
  group.add(wet);

  const reflectionTarget = new THREE.WebGLCubeRenderTarget(mobile ? 64 : 128, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.05, 650, reflectionTarget);
  cubeCamera.position.set(0, waterHeight + 0.03, -3);
  let reflectionCaptured = false;
  const dummy = new THREE.Object3D();
  const update = (time: number) => {
    const wind = sampleCampusWind(time);
    uniforms.gardenTime.value = time;
    uniforms.gardenWind.value = wind.strength;
    for (let i = 0; i < jetDroplets; i++) {
      const fountain = i % campusLayout.fountains.length;
      const j = Math.floor(i / campusLayout.fountains.length) % jetAngles;
      const angle = (j * Math.PI * 2) / jetAngles;
      const t = (time * 0.69 + i * 0.618034) % 1;
      const fringe = Math.sin(i * 4.3) * 0.06 * t;
      const radius = impactRadius * t + fringe;
      const height =
        nozzleHeight +
        4 * jetRise * t * (1 - t) -
        (nozzleHeight - waterHeight) * t;
      const windPush =
        wind.strength * Math.max(0, height - waterHeight) * 0.035;
      dummy.position.set(
        Math.cos(angle) * radius + CAMPUS_WIND_DIRECTION.x * windPush,
        height,
        campusLayout.fountains[fountain] +
          Math.sin(angle) * radius +
          CAMPUS_WIND_DIRECTION.z * windPush,
      );
      const size = 0.004 + (i % 3) * 0.0016;
      dummy.scale.set(size, size * 1.65, size);
      dummy.updateMatrix();
      droplets.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i < splashDroplets; i++) {
      const fountain = i % campusLayout.fountains.length;
      const angle =
        ((Math.floor(i / campusLayout.fountains.length) % jetAngles) *
          Math.PI *
          2) /
        jetAngles;
      const p = (time * 1.7 + i * 0.618034) % 1;
      const spreadAngle = i * 2.39996;
      const spread = 0.1 * p;
      dummy.position.set(
        Math.cos(angle) * impactRadius + Math.cos(spreadAngle) * spread,
        waterHeight + 4 * 0.04 * p * (1 - p),
        campusLayout.fountains[fountain] +
          Math.sin(angle) * impactRadius +
          Math.sin(spreadAngle) * spread,
      );
      dummy.scale.setScalar(0.004 * (1 - p * 0.6));
      dummy.updateMatrix();
      droplets.setMatrixAt(jetDroplets + i, dummy.matrix);
    }
    droplets.instanceMatrix.needsUpdate = true;
  };
  update(0);
  return {
    group,
    update,
    diagnostics: {
      jetDroplets,
      splashDroplets,
      reflectionSize: mobile ? 64 : 128,
      fountainJets: campusLayout.fountains.length * jetAngles,
    },
    captureReflection(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
      if (reflectionCaptured) return;
      const background = scene.background;
      const visible = group.visible;
      const target = renderer.getRenderTarget();
      try {
        group.visible = false;
        scene.background = new THREE.Color("#efe5d2");
        cubeCamera.update(renderer, scene);
        uniforms.gardenReflection.value = reflectionTarget.texture;
        uniforms.gardenHasReflection.value = 1;
        reflectionCaptured = true;
      } finally {
        group.visible = visible;
        scene.background = background;
        renderer.setRenderTarget(target);
      }
    },
    dispose() {
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      [waterMaterial, jetMaterial, dropletMaterial, wetMaterial].forEach(
        (material) => material.dispose(),
      );
      reflectionTarget.dispose();
    },
  };
}
