import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

type ColorName = 'lavender' | 'silver' | 'lime';
export type SculptureControls = {
  setColor: (color: ColorName) => void;
  setMotion: (enabled: boolean) => void;
  nextShape: () => string;
  setExpanded: (enabled: boolean) => void;
  setVisible: (visible: boolean) => void;
  setScroll: (progress: number) => void;
  dispose: () => void;
};

type Pose = { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 };
type Current = { mesh: THREE.Mesh; material: THREE.MeshPhysicalMaterial; color: THREE.Color; pose: Pose; target: Pose; arrival: Pose };

/** Three continuous, hand-shaped currents of metal gather around a luminous heart. */
export function createSculpture(container: HTMLElement, initialMotion: boolean): SculptureControls {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, innerWidth < 700 ? 1.45 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 50);
  camera.position.set(0, .06, 7.4);
  camera.lookAt(0, .03, 0);
  function makeEnvironment() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    room.traverse(object => {
      if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) object.material.color.setHex(0x676771);
    });
    const result = pmrem.fromScene(room, .035);
    room.dispose();
    pmrem.dispose();
    return result;
  }
  let environment = makeEnvironment();
  scene.environment = environment.texture;
  scene.add(new THREE.AmbientLight(0xf1f0ff, .25));
  const key = new THREE.DirectionalLight(0xfff0df, 3.7);
  key.position.set(-4, 5, 6);
  scene.add(key);
  const lilac = new THREE.DirectionalLight(0xcac5ff, 2.5);
  lilac.position.set(4, 2, 2);
  scene.add(lilac);
  const copper = new THREE.DirectionalLight(0xffb084, 2.7);
  copper.position.set(-2, -3, 1);
  scene.add(copper);
  const rim = new THREE.DirectionalLight(0xf7f4ff, 2.4);
  rim.position.set(2, 1, -4);
  scene.add(rim);

  const assembly = new THREE.Group();
  scene.add(assembly);
  const sculpture = new THREE.Group();
  sculpture.rotation.set(.18, -.32, -.18);
  assembly.add(sculpture);

  // A closed asymmetric centreline carries a broad, swelling cross-section.
  // The section slowly turns through a full revolution: each current has
  // shoulders, narrow waists, and an uninterrupted polished metal surface.
  const center = new THREE.Vector3();
  const before = new THREE.Vector3();
  const after = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const axisZ = new THREE.Vector3(0, 0, 1);
  function centerline(angle: number, target: THREE.Vector3) {
    const radius = 1.35 + .16 * Math.cos(angle * 3 + .3) + .08 * Math.sin(angle * 2);
    target.set(
      radius * Math.cos(angle) + .09 * Math.sin(angle * 2),
      radius * Math.sin(angle) * 1.08,
      .28 * Math.sin(angle * 2 + .3) + .12 * Math.cos(angle * 3),
    );
  }
  const currentGeometry = new ParametricGeometry((u, v, target) => {
    const angle = u * Math.PI * 2;
    const section = v * Math.PI * 2;
    centerline(angle, center);
    centerline(angle - .001, before);
    centerline(angle + .001, after);
    tangent.subVectors(after, before).normalize();
    normal.crossVectors(tangent, axisZ).normalize();
    binormal.crossVectors(normal, tangent).normalize();
    const turn = angle + .38 * Math.sin(angle * 2) + .22 * Math.cos(angle * 3);
    const width = .31 + .15 * (.5 + .5 * Math.sin(angle * 3 + .6));
    const depth = .2 + .055 * (.5 + .5 * Math.cos(angle * 2 - .3));
    const across = width * Math.cos(section);
    const above = depth * Math.sin(section);
    target.copy(center)
      .addScaledVector(normal, across * Math.cos(turn) - above * Math.sin(turn))
      .addScaledVector(binormal, across * Math.sin(turn) + above * Math.cos(turn));
  }, 168, 32);
  currentGeometry.computeTangents();

  const finishes: Record<ColorName, number[]> = {
    silver: [0xb8bec9, 0xb6b3c1, 0xc5b9b0],
    lavender: [0xa7a0c9, 0xc3b8da, 0xa5a8c4],
    lime: [0xbdc7a0, 0xc8c7b4, 0xa9b4a4],
  };
  const makePose = (): Pose => ({ position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), scale: new THREE.Vector3(1, 1, 1) });
  const currents: Current[] = Array.from({ length: 3 }, (_, index) => {
    const material = new THREE.MeshPhysicalMaterial({
      color: finishes.silver[index], metalness: 1, roughness: .17 + index * .015,
      clearcoat: .75, clearcoatRoughness: .1, envMapIntensity: 1.55,
      anisotropy: .16, iridescence: .13, iridescenceIOR: 1.3,
      iridescenceThicknessRange: [160, 300],
    });
    const mesh = new THREE.Mesh(currentGeometry, material);
    sculpture.add(mesh);
    return { mesh, material, color: new THREE.Color(finishes.silver[index]), pose: makePose(), target: makePose(), arrival: makePose() };
  });

  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf5e5d7, metalness: .35, roughness: .12,
    clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.7,
    iridescence: .35, iridescenceIOR: 1.3, iridescenceThicknessRange: [110, 270],
    emissive: 0xf2ba91, emissiveIntensity: .15,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(.42, 48, 32), coreMaterial);
  core.position.set(.04, -.025, .18);
  sculpture.add(core);
  const coreLight = new THREE.PointLight(0xffcfb2, 1.5, 3.5, 2);
  coreLight.position.copy(core.position);
  sculpture.add(coreLight);

  const orbitMaterial = new THREE.MeshPhysicalMaterial({ color: 0xaeb8ce, metalness: 1, roughness: .23, envMapIntensity: 1.4 });
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.28, .008, 6, 180), orbitMaterial);
  orbit.rotation.set(.77, -.44, -.32);
  sculpture.add(orbit);
  const satellites = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), orbitMaterial, 7);
  satellites.frustumCulled = false;
  const satelliteTransform = new THREE.Object3D();
  for (let index = 0; index < 7; index++) {
    const angle = index / 7 * Math.PI * 2 + .3;
    const radius = 2.15 + (index % 3) * .13;
    satelliteTransform.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(angle * 2) * .5);
    satelliteTransform.scale.setScalar(index === 0 ? .092 : index % 2 ? .035 : .058);
    satelliteTransform.updateMatrix();
    satellites.setMatrixAt(index, satelliteTransform.matrix);
  }
  sculpture.add(satellites);
  const dustPositions = new Float32Array(32 * 3);
  for (let index = 0; index < 32; index++) {
    const angle = index * 2.39996323;
    const radius = 2.22 + (Math.sin(index * 1.7) + 1) * .25;
    dustPositions[index * 3] = Math.cos(angle) * radius;
    dustPositions[index * 3 + 1] = Math.sin(angle) * radius;
    dustPositions[index * 3 + 2] = Math.sin(index * .8) * .65;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({ color: 0xc8c3db, size: .018, transparent: true, opacity: .55, depthWrite: false });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  sculpture.add(dust);

  const formations = ['Mercury study', 'Magnetic orbit', 'Open current'];
  let shapeIndex = 0;
  let expanded = false;
  let motion = initialMotion;
  let visible = true;
  let onScreen = true;
  let disposed = false;
  let lostContext = false;
  let dragging = false;
  let previousX = 0;
  let previousY = 0;
  let dragX = 0;
  let dragY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let elapsed = 0;
  let lastTime = 0;
  let scrollProgress = 0;
  let arrivalTime = initialMotion ? 0 : 1.8;
  let expansion = 0;
  const euler = new THREE.Euler();
  const extraRotation = new THREE.Quaternion();
  const axisY = new THREE.Vector3(0, 1, 0);

  function canAnimate() { return motion && visible && onScreen && !document.hidden && !disposed && !lostContext; }
  function updateTargets() {
    const orientations = [
      [[.2, -.16, -.35], [1.03, .37, .7], [-.8, .83, -1.08]],
      [[.92, .14, -.2], [-.48, 1.09, .48], [.28, -.94, -.67]],
      [[.37, -.37, -.7], [-.55, .51, .48], [.66, .6, 1.2]],
    ];
    currents.forEach((current, index) => {
      const angle = index / 3 * Math.PI * 2 + .25;
      const spread = (shapeIndex === 2 ? .52 : .13) + (expanded ? .64 : 0);
      const values = orientations[shapeIndex][index];
      current.target.position.set(Math.cos(angle) * spread, Math.sin(angle) * spread, (index - 1) * (expanded ? .28 : .14));
      current.target.quaternion.setFromEuler(euler.set(values[0] + (expanded ? .35 : 0), values[1] - (expanded ? .22 : 0), values[2]));
      const size = (index === 0 ? 1.02 : index === 1 ? .95 : .9) * (shapeIndex === 2 ? .88 : 1) * (expanded ? .88 : 1);
      current.target.scale.set(size, size * (shapeIndex === 1 ? 1.11 : 1), size);
    });
    container.dataset.formation = formations[shapeIndex];
    container.dataset.expanded = String(expanded);
  }
  function copyPose(target: Pose, source: Pose) {
    target.position.copy(source.position);
    target.quaternion.copy(source.quaternion);
    target.scale.copy(source.scale);
  }
  function updateCurrents(amount: number, animate: boolean) {
    currents.forEach((current, index) => {
      if (animate && arrivalTime < 1.8) {
        const fraction = Math.min(1, arrivalTime / 1.8);
        const ease = 1 - Math.pow(1 - fraction, 3);
        copyPose(current.pose, current.arrival);
        current.pose.position.lerp(current.target.position, ease);
        current.pose.quaternion.slerp(current.target.quaternion, ease);
        current.pose.scale.lerp(current.target.scale, ease);
      } else {
        current.pose.position.lerp(current.target.position, amount);
        current.pose.quaternion.slerp(current.target.quaternion, amount);
        current.pose.scale.lerp(current.target.scale, amount);
      }
      current.mesh.position.copy(current.pose.position);
      current.mesh.quaternion.copy(current.pose.quaternion);
      current.mesh.scale.copy(current.pose.scale);
      if (animate) current.mesh.quaternion.multiply(extraRotation.setFromAxisAngle(axisY, Math.sin(elapsed * .34 + index * 1.9) * .09));
    });
  }
  function renderStill() { if (!disposed && !lostContext) renderer.render(scene, camera); }
  function settle() {
    arrivalTime = 1.8;
    expansion = expanded ? 1 : 0;
    updateCurrents(1, false);
    currents.forEach(current => current.material.color.copy(current.color));
    core.scale.setScalar(1 + expansion * .08);
    renderStill();
  }
  function resize() {
    if (disposed) return;
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.position.z = camera.aspect < 1 ? 7.4 / Math.max(camera.aspect, .68) : 7.4;
    camera.updateProjectionMatrix();
    renderStill();
  }
  function frame(time: number) {
    if (disposed || lostContext) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .045) : 0;
    lastTime = time;
    elapsed += delta;
    arrivalTime = Math.min(1.8, arrivalTime + delta);
    const follow = 1 - Math.exp(-delta * 4.4);
    const gentle = 1 - Math.exp(-delta * 3.5);
    assembly.position.y = Math.sin(elapsed * .6) * .065 - scrollProgress * .13;
    assembly.rotation.y += (dragX + pointerX * .16 + scrollProgress * .45 - assembly.rotation.y) * gentle;
    assembly.rotation.x += (dragY + pointerY * .1 - assembly.rotation.x) * gentle;
    sculpture.rotation.y = -.32 + elapsed * .09;
    sculpture.rotation.z = -.18 + Math.sin(elapsed * .22) * .11;
    sculpture.rotation.x = .18 + Math.sin(elapsed * .17) * .1;
    expansion += ((expanded ? 1 : 0) - expansion) * follow;
    core.scale.setScalar(1 + expansion * .08 + Math.sin(elapsed * .6) * .015);
    orbit.rotation.z = -.32 + elapsed * .04;
    satellites.rotation.y = elapsed * -.045;
    dust.rotation.z = elapsed * .025;
    currents.forEach(current => current.material.color.lerp(current.color, follow));
    updateCurrents(follow, true);
    renderer.render(scene, camera);
  }
  function updateLoop() {
    lastTime = 0;
    renderer.setAnimationLoop(canAnimate() ? frame : null);
    if (!canAnimate()) renderStill();
  }

  updateTargets();
  currents.forEach((current, index) => {
    copyPose(current.arrival, current.target);
    const angle = index / 3 * Math.PI * 2 + .25;
    current.arrival.position.add(new THREE.Vector3(Math.cos(angle) * .54, Math.sin(angle) * .54, (index - 1) * .35));
    current.arrival.quaternion.multiply(extraRotation.setFromAxisAngle(axisY, index % 2 ? -.6 : .55));
    current.arrival.scale.multiplyScalar(.8);
    copyPose(current.pose, initialMotion ? current.arrival : current.target);
  });
  updateCurrents(initialMotion ? 0 : 1, false);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const visibilityObserver = new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; updateLoop(); }, { rootMargin: '80px' });
  visibilityObserver.observe(container);
  function pointerMove(event: PointerEvent) {
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerX = ((event.clientX - rect.left) / rect.width - .5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - .5) * 2;
    if (!dragging) return;
    dragX += (event.clientX - previousX) * .008;
    dragY = THREE.MathUtils.clamp(dragY + (event.clientY - previousY) * .005, -1, 1);
    previousX = event.clientX;
    previousY = event.clientY;
    if (!canAnimate()) { assembly.rotation.set(dragY, dragX, 0); renderStill(); }
  }
  function pointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    dragging = true;
    previousX = event.clientX;
    previousY = event.clientY;
    container.setPointerCapture(event.pointerId);
  }
  function pointerUp(event: PointerEvent) {
    dragging = false;
    if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId);
  }
  function pointerLeave() { pointerX = 0; pointerY = 0; }
  function contextLost(event: Event) {
    event.preventDefault();
    lostContext = true;
    renderer.setAnimationLoop(null);
    container.classList.remove('ready');
  }
  function contextRestored() {
    if (disposed) return;
    environment.dispose();
    environment = makeEnvironment();
    scene.environment = environment.texture;
    lostContext = false;
    container.classList.add('ready');
    settle();
    updateLoop();
  }
  container.addEventListener('pointermove', pointerMove);
  container.addEventListener('pointerdown', pointerDown);
  container.addEventListener('pointerup', pointerUp);
  container.addEventListener('pointercancel', pointerUp);
  container.addEventListener('pointerleave', pointerLeave);
  document.addEventListener('visibilitychange', updateLoop);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  resize();
  updateLoop();
  return {
    setColor(color) {
      currents.forEach((current, index) => current.color.setHex(finishes[color][index]));
      if (!canAnimate()) settle();
    },
    setMotion(enabled) { motion = enabled; if (!enabled) settle(); updateLoop(); },
    nextShape() {
      shapeIndex = (shapeIndex + 1) % formations.length;
      arrivalTime = 1.8;
      updateTargets();
      if (!canAnimate()) settle();
      return formations[shapeIndex];
    },
    setExpanded(enabled) {
      expanded = enabled;
      arrivalTime = 1.8;
      updateTargets();
      if (!canAnimate()) settle();
    },
    setVisible(nextVisible) { visible = nextVisible; updateLoop(); },
    setScroll(progress) { scrollProgress = THREE.MathUtils.clamp(progress, 0, 1); },
    dispose() {
      if (disposed) return;
      disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', updateLoop);
      container.removeEventListener('pointermove', pointerMove);
      container.removeEventListener('pointerdown', pointerDown);
      container.removeEventListener('pointerup', pointerUp);
      container.removeEventListener('pointercancel', pointerUp);
      container.removeEventListener('pointerleave', pointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
        if (object instanceof THREE.InstancedMesh) object.dispose();
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      delete container.dataset.formation;
      delete container.dataset.expanded;
    },
  };
}
