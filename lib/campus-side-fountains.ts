import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { campusLayout } from "./campus";
import { CAMPUS_WIND_DIRECTION, sampleCampusWind } from "./campus-environment";

type Palette = Record<string, THREE.MeshStandardMaterial>;
type StoneBatch = Map<string, THREE.BufferGeometry[]>;

const surfaceY = 0.205;
const bowlY = 0.76;
const jetPeakY = 3.3;
const ringJetRise = 1.22;
const ringJets = 12;
const impactRadius = 0.42;
// Ballistic coefficient keeps the broken central plume's crest at jetPeakY,
// while its falling fringe lands in the lower basin rather than vanishing at
// the upper bowl's height.
const plumeDrop = bowlY - surfaceY;
const plumeB = 4 * (jetPeakY - bowlY) + 2 * plumeDrop;
const plumeArc = (plumeB + Math.sqrt(plumeB * plumeB - 4 * plumeDrop * plumeDrop)) / 2;

/** Original carved-stone garden fountains, in the campus's calibrated scale.
 * All animation uses the caller's shared clock; pause/reduced motion have no
 * independent timers to stop. No pavilion selection IDs are assigned here. */
export function makeCampusSideFountains(palette: Palette, mobile: boolean) {
  const group = new THREE.Group();
  group.name = "Twin carved-stone side fountains";
  const waterGroup = new THREE.Group();
  waterGroup.name = "Side fountain streams, falling water and spray";
  group.add(waterGroup);
  const sites = campusLayout.sideFountains;
  const geometryBounds = new Map(sites.map(site => [site.id, { stone: new THREE.Box3(), all: new THREE.Box3() }]));
  const segments = mobile ? 48 : 80;
  const stone: StoneBatch = new Map();
  const materials: THREE.Material[] = [];
  const time = { value: 0 };
  const wind = { value: 0.3 };
  const reflectionSize = mobile ? 32 : 64;
  const reflections: {
    camera: THREE.CubeCamera;
    target: THREE.WebGLCubeRenderTarget;
    uniforms: { reflection: { value: THREE.CubeTexture | null }; hasReflection: { value: number } };
  }[] = [];

  function addStone(key: string, geometry: THREE.BufferGeometry, x: number, z: number) {
    geometry.translate(x, 0, z);
    geometry.computeBoundingBox();
    const site = sites.find(site => site.x === x && site.z === z)!;
    geometryBounds.get(site.id)!.stone.union(geometry.boundingBox!);
    geometryBounds.get(site.id)!.all.union(geometry.boundingBox!);
    const parts = stone.get(key) ?? [];
    parts.push(geometry);
    stone.set(key, parts);
  }
  function lathe(profile: number[][]) {
    return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments);
  }
  function ring(radius: number, tube: number, y: number, detail = segments) {
    return new THREE.TorusGeometry(radius, tube, mobile ? 5 : 7, detail).rotateX(Math.PI / 2).translate(0, y, 0);
  }
  const streamParts: THREE.BufferGeometry[] = [];
  const cascadeParts: THREE.BufferGeometry[] = [];
  function recordWaterGeometry(siteId: (typeof sites)[number]["id"], geometry: THREE.BufferGeometry) {
    geometry.computeBoundingBox();
    geometryBounds.get(siteId)!.all.union(geometry.boundingBox!);
    return geometry;
  }
  for (const site of sites) {
    const { x, z, radius } = site;
    const innerRadius = radius - 0.27;
    // Several shallow courses, a scooped inner face, and a rolled coping give
    // the basin a believable stone section rather than a solid cylinder.
    addStone("rose", lathe([
      [0, 0.015], [radius, 0.015], [radius, 0.065], [radius - 0.07, 0.095],
      [radius - 0.07, 0.15], [radius - 0.13, 0.18], [0, 0.18],
    ]), x, z);
    addStone("ivory", lathe([
      [radius - 0.1, 0.11], [radius - 0.04, 0.16], [radius - 0.04, 0.24],
      [radius - 0.12, 0.30], [radius - 0.10, 0.34], [innerRadius - 0.02, 0.34],
      [innerRadius - 0.04, 0.30], [innerRadius, 0.22], [innerRadius - 0.02, 0.18],
      [radius - 0.1, 0.11],
    ]), x, z);
    addStone("pale", ring(radius - 0.145, 0.035, 0.325), x, z);
    addStone("roseDark", ring(radius - 0.045, 0.012, 0.16), x, z);
    addStone("pale", ring(radius - 0.045, 0.015, 0.255), x, z);
    // Paired floral petals and recessed rosettes around the frieze. These are
    // original nonfigurative motifs, not copies of sacred architectural relief.
    const rosetteCount = mobile ? 24 : 36;
    for (let i = 0; i < rosetteCount; i++) {
      const angle = (i / rosetteCount) * Math.PI * 2;
      const r = radius - 0.031;
      const rosette = new THREE.TorusGeometry(0.047, 0.012, 5, 8);
      rosette.rotateY(angle).translate(Math.sin(angle) * r, 0.205, Math.cos(angle) * r);
      addStone("rose", rosette, x, z);
      for (const turn of [-0.6, 0.6]) {
        const petal = new THREE.SphereGeometry(1, 5, 4);
        petal.scale(0.018, 0.056, 0.011).rotateZ(turn).rotateY(angle)
          .translate(Math.sin(angle) * (r + 0.008), 0.21, Math.cos(angle) * (r + 0.008));
        addStone("pale", petal, x, z);
      }
    }
    // Low lotus pedestal and shallow upper bowl feed a continuous veil into
    // the main basin. The stone stays below the pavilion and label sightlines.
    addStone("ivory", lathe([
      [0, 0.18], [0.36, 0.18], [0.4, 0.23], [0.34, 0.29], [0.25, 0.34],
      [0.21, 0.50], [0.30, 0.56], [0.49, 0.61], [0.60, 0.71],
      [0.61, 0.76], [0.55, 0.76], [0.49, 0.69], [0, 0.64],
    ]), x, z);
    addStone("pale", ring(0.58, 0.024, 0.747), x, z);
    addStone("gold", new THREE.CylinderGeometry(0.04, 0.07, 0.1, 12).translate(0, 0.77, 0), x, z);
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const petal = new THREE.SphereGeometry(1, 7, 5).scale(0.07, 0.17, 0.025)
        .rotateX(-0.6).rotateY(angle).translate(Math.sin(angle) * 0.43, 0.62, Math.cos(angle) * 0.43);
      addStone("pale", petal, x, z);
    }

    const waterUniforms = {
      fountainTime: time,
      fountainWind: wind,
      reflection: { value: null as THREE.CubeTexture | null },
      hasReflection: { value: 0 },
    };
    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      vertexShader: `varying vec3 fountainWorld; varying vec2 fountainLocal;
        void main() { fountainLocal = position.xz;
          vec4 world = modelMatrix * vec4(position, 1.); fountainWorld = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world; }`,
      fragmentShader: `
        uniform float fountainTime; uniform float fountainWind;
        uniform samplerCube reflection; uniform float hasReflection;
        varying vec3 fountainWorld; varying vec2 fountainLocal;
        float wave(vec2 p) {
          vec2 breeze = vec2(${CAMPUS_WIND_DIRECTION.x}, ${CAMPUS_WIND_DIRECTION.z});
          float h = sin(dot(p, breeze) * 10. - fountainTime * 1.6) * (.002 + fountainWind * .003);
          h += sin(length(p) * 18. - fountainTime * 5.) * exp(-length(p) * 1.3) * .006;
          float veil = abs(length(p) - .89);
          h += sin(veil * 22. - fountainTime * 6.) * exp(-veil * 5.) * .006;
          for (int j = 0; j < ${ringJets}; j++) {
            float a = float(j) * ${((Math.PI * 2) / ringJets).toFixed(6)};
            float d = distance(p, vec2(cos(a), sin(a)) * ${impactRadius});
            h += sin(d * 24. - fountainTime * 5.2 + float(j) * .7) * exp(-d * 5.) * .002;
          }
          return h;
        }
        void main() {
          vec2 p = fountainLocal; float h = wave(p);
          vec3 n = normalize(vec3((h-wave(p+vec2(.025,0.)))/.025,1.,(h-wave(p+vec2(0.,.025)))/.025));
          vec3 view = normalize(cameraPosition-fountainWorld);
          vec3 reflected = textureCube(reflection,reflect(-view,n)).rgb;
          float fresnel = .10 + .35 * pow(1.-max(0.,dot(view,n)),3.);
          vec3 color = mix(vec3(.20,.36,.33), reflected, fresnel * hasReflection);
          float glint = pow(max(0.,dot(reflect(-normalize(vec3(-42.,50.,42.)),n),view)),90.);
          float foam = exp(-abs(length(p)-.89)*55.) * (.055+.018*sin(fountainTime*6.+atan(p.y,p.x)*19.));
          color += vec3(.82,.89,.85) * (glint*.35+foam);
          gl_FragColor = vec4(color,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    materials.push(waterMaterial);
    const surface = new THREE.Mesh(new THREE.CircleGeometry(innerRadius - 0.04, segments).rotateX(-Math.PI / 2), waterMaterial);
    surface.position.set(x, surfaceY, z);
    surface.name = `${site.id} basin: wind ripples and expanding impact rings`;
    waterGroup.add(surface);
    const bowlSurface = new THREE.Mesh(new THREE.CircleGeometry(0.55, segments / 2).rotateX(-Math.PI / 2), waterMaterial);
    bowlSurface.position.set(x, bowlY, z);
    waterGroup.add(bowlSurface);
    const target = new THREE.WebGLCubeRenderTarget(reflectionSize, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    const cube = new THREE.CubeCamera(0.04, 650, target);
    cube.position.set(x, surfaceY + 0.035, z);
    reflections.push({ camera: cube, target, uniforms: waterUniforms });

    for (let j = 0; j < ringJets; j++) {
      const angle = (j / ringJets) * Math.PI * 2;
      const nozzleRadius = radius - 0.49;
      addStone("gold", new THREE.CylinderGeometry(0.017, 0.03, 0.06, 7)
        .translate(Math.cos(angle) * nozzleRadius, 0.265, Math.sin(angle) * nozzleRadius), x, z);
      const points = Array.from({ length: 25 }, (_, i) => {
        const t = i / 24;
        const r = THREE.MathUtils.lerp(nozzleRadius, impactRadius, t);
        return new THREE.Vector3(x + Math.cos(angle) * r, 0.3 + 4 * ringJetRise * t * (1 - t) - (0.3 - surfaceY) * t, z + Math.sin(angle) * r);
      });
      streamParts.push(recordWaterGeometry(site.id, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), mobile ? 16 : 24, 0.013, 5, false)));
    }
    streamParts.push(recordWaterGeometry(site.id, new THREE.CylinderGeometry(0.025, 0.075, jetPeakY - bowlY, 12, 24, true).translate(x, (jetPeakY + bowlY) / 2, z)));
    cascadeParts.push(recordWaterGeometry(site.id, lathe([[0.585, bowlY], [0.61, 0.72], [0.65, 0.63], [0.72, 0.48], [0.81, 0.32], [0.89, surfaceY + 0.005]]).translate(x, 0, z)));
  }

  for (const [key, parts] of stone) {
    const normalized = parts.map(part => part.index ? part.toNonIndexed() : part);
    const geometry = mergeGeometries(normalized);
    normalized.forEach(part => part.dispose());
    parts.forEach(part => part.dispose());
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, palette[key]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `Side fountain carved ${key} stone`;
    group.add(mesh);
  }

  function movingWaterMaterial(opacity: number, cascade: boolean) {
    const material = new THREE.MeshStandardMaterial({ color: "#c3e5e4", roughness: 0.1, metalness: 0.08, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
    material.onBeforeCompile = shader => {
      shader.uniforms.fountainTime = time;
      shader.uniforms.fountainWind = wind;
      shader.vertexShader = `uniform float fountainTime; uniform float fountainWind; varying vec2 fountainUv;\n` + shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
        fountainUv = uv;
        float lift = max(0., position.y - ${surfaceY});
        float push = lift * fountainWind * .026;
        transformed.x += push * ${CAMPUS_WIND_DIRECTION.x};
        transformed.z += push * ${CAMPUS_WIND_DIRECTION.z};
        transformed.y += sin(fountainTime*1.3 + position.x*1.7 + position.z)*.006*lift;
      `);
      shader.fragmentShader = `uniform float fountainTime; varying vec2 fountainUv;\n` + shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
        float stream = .82 + .18 * sin(fountainUv.${cascade ? "y" : "x"}*105. + fountainUv.y*39. + fountainTime*11.);
        diffuseColor.rgb *= stream;
        diffuseColor.a *= ${cascade ? ".34 + .66*pow(.5+.5*sin(fountainUv.x*251. + sin(fountainUv.y*17.+fountainTime*4.)),2.)" : ".68 + .32*sin(fountainUv.x*63. - fountainUv.y*27. - fountainTime*13.)"};
      `);
    };
    material.customProgramCacheKey = () => `side-fountain-flow-${cascade ? "curtain" : "jets"}-v1`;
    materials.push(material);
    return material;
  }
  const streamGeometry = mergeGeometries(streamParts)!;
  streamParts.forEach(part => part.dispose());
  const streams = new THREE.Mesh(streamGeometry, movingWaterMaterial(0.78, false));
  streams.name = "Twin central plumes and 24 inward flowing arc jets";
  waterGroup.add(streams);
  const cascadeGeometry = mergeGeometries(cascadeParts)!;
  cascadeParts.forEach(part => part.dispose());
  const cascades = new THREE.Mesh(cascadeGeometry, movingWaterMaterial(0.40, true));
  cascades.name = "Continuous falling water veils from lotus bowls";
  waterGroup.add(cascades);

  const jetDroplets = mobile ? 220 : 560;
  const splashDroplets = mobile ? 56 : 144;
  const dropletMaterial = new THREE.MeshStandardMaterial({ color: "#e1f5f0", roughness: 0.075, metalness: 0.12, transparent: true, opacity: 0.79, depthWrite: false });
  materials.push(dropletMaterial);
  const droplets = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 5, 3), dropletMaterial, jetDroplets + splashDroplets);
  droplets.name = "Fine side fountain spray and gentle splashes";
  droplets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  droplets.frustumCulled = false;
  waterGroup.add(droplets);
  const dummy = new THREE.Object3D();
  const measuredBounds = sites.map(site => {
    const bounds = geometryBounds.get(site.id)!;
    return {
      id: site.id, x: site.x, z: site.z,
      radius: Math.max(site.x - bounds.all.min.x, bounds.all.max.x - site.x, site.z - bounds.all.min.z, bounds.all.max.z - site.z),
      groundMinY: bounds.stone.min.y, stoneMaxY: bounds.stone.max.y,
      waterPeakY: bounds.all.max.y,
      minX: bounds.all.min.x, maxX: bounds.all.max.x,
      minZ: bounds.all.min.z, maxZ: bounds.all.max.z,
      staticGeometryMin: bounds.all.min.toArray(), staticGeometryMax: bounds.all.max.toArray(),
    };
  });
  const animatedBounds = sites.map(site => geometryBounds.get(site.id)!.all.clone());
  const dropletMin = new THREE.Vector3(), dropletMax = new THREE.Vector3();
  function includeDroplet(index: number) {
    const bounds = animatedBounds[index % sites.length];
    bounds.expandByPoint(dropletMin.copy(dummy.position).sub(dummy.scale));
    bounds.expandByPoint(dropletMax.copy(dummy.position).add(dummy.scale));
  }
  function update(seconds: number) {
    const weather = sampleCampusWind(seconds);
    time.value = seconds;
    wind.value = weather.strength;
    sites.forEach((site, index) => animatedBounds[index].copy(geometryBounds.get(site.id)!.all));
    for (let i = 0; i < jetDroplets; i++) {
      const site = sites[i % sites.length];
      const phase = (seconds * 0.39 + i * 0.618034) % 1;
      const centralPlume = Math.floor(i / sites.length) % 2 === 0;
      const angle = centralPlume ? i * 2.399963 : (Math.floor(i / (sites.length * 2)) % ringJets) * Math.PI * 2 / ringJets;
      let y: number;
      let radius: number;
      if (centralPlume) {
        // A narrow central plume travels up, opens gently, then falls into the
        // lower basin. Speeds derive from a continuous ballistic parabola.
        y = bowlY + plumeArc * phase * (1 - phase) - plumeDrop * phase;
        radius = 0.025 + 0.86 * phase * phase;
      } else {
        const t = (seconds * 0.66 + i * 0.618034) % 1;
        y = 0.3 + 4 * ringJetRise * t * (1 - t) - (0.3 - surfaceY) * t;
        radius = THREE.MathUtils.lerp(site.radius - 0.49, impactRadius, t);
      }
      const push = Math.max(0, y - surfaceY) * weather.strength * 0.033;
      dummy.position.set(site.x + Math.cos(angle) * radius + CAMPUS_WIND_DIRECTION.x * push, y, site.z + Math.sin(angle) * radius + CAMPUS_WIND_DIRECTION.z * push);
      const size = centralPlume ? 0.010 + (i % 5) * 0.002 : 0.006 + (i % 4) * 0.0018;
      dummy.scale.set(size, size * (centralPlume ? 1.8 : 1.4), size);
      includeDroplet(i);
      dummy.updateMatrix();
      droplets.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i < splashDroplets; i++) {
      const site = sites[i % sites.length];
      const phase = (seconds * 1.35 + i * 0.618034) % 1;
      const angle = i * 2.399963;
      const radius = (i % 3 === 0 ? impactRadius : 0.89) + 0.13 * phase;
      dummy.position.set(site.x + Math.cos(angle) * radius + weather.x * phase * 0.02, surfaceY + 0.23 * phase * (1 - phase), site.z + Math.sin(angle) * radius + weather.z * phase * 0.02);
      dummy.scale.setScalar(0.006 * (1 - phase * 0.6));
      includeDroplet(i);
      dummy.updateMatrix();
      droplets.setMatrixAt(jetDroplets + i, dummy.matrix);
    }
    droplets.instanceMatrix.needsUpdate = true;
    measuredBounds.forEach((bounds, index) => {
      const actual = animatedBounds[index];
      // The vertical shader displacement is bounded by .006 * height. Its
      // horizontal wind deflection is much smaller than the stone outer rim.
      bounds.waterPeakY = actual.max.y + 0.006 * (jetPeakY - surfaceY);
      bounds.minX = actual.min.x; bounds.maxX = actual.max.x;
      bounds.minZ = actual.min.z; bounds.maxZ = actual.max.z;
    });
  }
  update(0);
  let captured = false;
  return {
    group,
    update,
    diagnostics: {
      sideFountainCount: sites.length,
      sideFountainJets: sites.length * (ringJets + 1),
      sideJetDroplets: jetDroplets,
      sideSplashDroplets: splashDroplets,
      sideReflectionSize: reflectionSize,
      sideFountainBounds: measuredBounds,
    },
    captureReflection(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
      if (captured) return;
      const background = scene.background;
      const visible = waterGroup.visible;
      const target = renderer.getRenderTarget();
      try {
        waterGroup.visible = false;
        if (!scene.background) scene.background = new THREE.Color("#dfe8e4");
        for (const reflection of reflections) {
          reflection.camera.update(renderer, scene);
          reflection.uniforms.reflection.value = reflection.target.texture;
          reflection.uniforms.hasReflection.value = 1;
        }
        captured = true;
      } finally {
        waterGroup.visible = visible;
        scene.background = background;
        renderer.setRenderTarget(target);
      }
    },
    dispose() {
      group.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
      materials.forEach(material => material.dispose());
      reflections.forEach(reflection => reflection.target.dispose());
    },
  };
}
