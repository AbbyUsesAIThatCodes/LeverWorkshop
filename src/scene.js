import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
const PALETTE = {
  beam: 0xa9b6b6,
  base: 0x677777,
  connector: 0x3f5858,
  pin: 0x176bc2,
  gear: 0x92a6b1,
  left: 0x3b9a94,
  right: 0x9b79bf,
  metal: 0xaab7bb,
};
export class WorkshopScene {
  constructor(host) {
    this.host = host;
    this.labelObjects = [];
    this.labels = true;
    this.targetAngle = 0;
    this.reduced = false;
    this.physical = false;
    this.active = true;
    this.dirty = true;
  }
  async init() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.24;
    this.host.replaceChildren(this.renderer.domElement);
    this.renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.active = false;
      this.host.dispatchEvent(new Event("scene-unavailable"));
    });
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe0e7d9);
    this.scene.fog = new THREE.Fog(0xe0e7d9, 65, 145);
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 220);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 3, 0);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 57;
    this.controls.minPolarAngle = 0.6;
    this.controls.maxPolarAngle = 1.56;
    this.controls.minAzimuthAngle = -0.65;
    this.controls.maxAzimuthAngle = 0.65;
    this.scene.add(new THREE.HemisphereLight(0xfff9e4, 0x788d78, 2.3));
    const sun = new THREE.DirectionalLight(0xfff4dd, 3.1);
    sun.position.set(-15, 24, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -25,
      right: 25,
      top: 20,
      bottom: -20,
      near: 1,
      far: 75,
    });
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xdcecec, 1.8);
    fill.position.set(16, 10, -10);
    this.scene.add(fill);
    this.materials = {};
    for (const [k, v] of Object.entries(PALETTE))
      this.materials[k] = new THREE.MeshStandardMaterial({
        color: v,
        roughness: k === "metal" ? 0.3 : 0.53,
        metalness: k === "metal" ? 0.7 : 0.08,
      });
    this.makeRoom();
    const [meta, bin] = await Promise.all([
      fetch("./assets/parts.json").then((r) => {
        if (!r.ok) throw Error("Part catalog unavailable");
        return r.json();
      }),
      fetch("./assets/parts.bin.gz").then((r) => {
        if (!r.ok) throw Error("Part meshes unavailable");
        return new Response(
          r.body.pipeThrough(new DecompressionStream("gzip")),
        ).arrayBuffer();
      }),
    ]);
    this.geometries = {};
    for (const [name, m] of Object.entries(meta)) {
      const geo = new THREE.BufferGeometry();
      const data = new THREE.InterleavedBuffer(
        new Float32Array(bin, m.offset, m.count * 6),
        6,
      );
      geo.setAttribute(
        "position",
        new THREE.InterleavedBufferAttribute(data, 3, 0),
      );
      geo.setAttribute(
        "normal",
        new THREE.InterleavedBufferAttribute(data, 3, 3),
      );
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
      this.geometries[name] = geo;
    }
    // The collar's source OBJ is in inches and has a translated origin.
    this.geometries.collar = this.geometries.collar.clone();
    this.geometries.collar.center();
    this.moving = new THREE.Group();
    this.base = new THREE.Group();
    this.scene.add(this.moving, this.base);
    this.ruler = new THREE.Group();
    this.scene.add(this.ruler);
    this.resetCamera();
    this.resize();
    new ResizeObserver(() => this.resize()).observe(this.host);
    document.addEventListener("visibilitychange", () => {
      this.active = !document.hidden;
    });
    this.renderer.setAnimationLoop(() => {
      if (!this.active) return;
      const oldAngle = this.moving.rotation.z;
      this.moving.rotation.z =
        this.reduced || Math.abs(oldAngle - this.targetAngle) < 0.0001
          ? this.targetAngle
          : THREE.MathUtils.lerp(oldAngle, this.targetAngle, 0.09);
      const cameraChanged = this.controls.update();
      if (this.dirty || cameraChanged || oldAngle !== this.moving.rotation.z) {
        this.renderer.render(this.scene, this.camera);
        this.dirty = false;
      }
    });
  }
  mesh(name, material = "beam") {
    const m = new THREE.Mesh(this.geometries[name], this.materials[material]);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  box(w, h, d, color, x, y, z) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
    );
    m.position.set(x, y, z);
    m.receiveShadow = true;
    m.castShadow = true;
    this.scene.add(m);
    return m;
  }
  makeRoom() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0xe0e7d9, roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.3;
    floor.receiveShadow = true;
    this.scene.add(floor);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#bda684";
    ctx.fillRect(0, 0, 512, 512);
    let seed = 74;
    for (let i = 0; i < 250; i++) {
      seed = (seed * 16807) % 2147483647;
      const y = seed % 512;
      ctx.strokeStyle = `rgba(109,76,38,${0.025 + (i % 7) * 0.005})`;
      ctx.lineWidth = 0.4 + (i % 3) * 0.3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(120, y + 3, 330, y - 3, 512, y + 1);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 1);
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(49, 0.8, 27),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 }),
    );
    table.position.set(0, -0.52, -1.5);
    table.castShadow = true;
    table.receiveShadow = true;
    this.scene.add(table);
    const mat = new THREE.Mesh(
      new THREE.BoxGeometry(29, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0x426663, roughness: 1 }),
    );
    mat.position.set(0, -0.07, 0);
    mat.receiveShadow = true;
    this.scene.add(mat);
    // Fine, quiet cutting-mat lines, beneath the lever.
    const points = [];
    for (let x = -14; x <= 14; x++)
      points.push(x, -0.022, -5.5, x, -0.022, 5.5);
    for (let z = -5; z <= 5; z++) points.push(-14, -0.022, z, 14, -0.022, z);
    const grid = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(points, 3),
      ),
      new THREE.LineBasicMaterial({
        color: 0xa1bdb0,
        transparent: true,
        opacity: 0.13,
      }),
    );
    this.scene.add(grid);
    this.box(4, 0.13, 4.9, 0xece8d6, -18, 0.02, -3);
    this.box(3.8, 0.06, 4.7, 0xfffae9, -18, 0.13, -3);
    const pencil = this.box(0.17, 0.17, 4, 0xd4aa56, -16, 0.28, -2);
    pencil.rotation.y = 0.4;
    this.box(4.7, 0.7, 3, 0x829891, 17, 0.04, -5);
    this.box(4.4, 0.1, 2.7, 0x526e69, 17, 0.45, -5);
    // A few calm workshop props at the back of the table.
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 0.8, 1.6, 20),
      new THREE.MeshStandardMaterial({ color: 0xc79069, roughness: 1 }),
    );
    pot.position.set(-18, 0.5, -10);
    pot.castShadow = true;
    this.scene.add(pot);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 10, 8),
        new THREE.MeshStandardMaterial({
          color: i % 2 ? 0x5f8668 : 0x789474,
          roughness: 1,
        }),
      );
      leaf.scale.set(0.4, 1.8, 0.6);
      leaf.position.set(
        -18 + Math.cos(i) * 0.7,
        2 + Math.sin(i) * 0.4,
        -10 + Math.sin(i) * 0.5,
      );
      leaf.rotation.z = Math.cos(i) * 0.6;
      this.scene.add(leaf);
    }
  }
  label(text, color = 0xf6f3e7, width = 3) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const x = c.getContext("2d");
    x.fillStyle = "#163e3bd9";
    x.beginPath();
    x.roundRect(0, 0, 512, 128, 24);
    x.fill();
    x.font = `bold ${text.length > 10 ? 60 : 76}px "Comic Sans MS", "Comic Neue", sans-serif`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#" + new THREE.Color(color).getHexString();
    x.fillText(text, 256, 65);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }),
    );
    m.scale.set(width, width / 4, 1);
    m.renderOrder = 10;
    this.labelObjects.push(m);
    return m;
  }
  clear(group) {
    const sharedGeo = new Set(Object.values(this.geometries));
    const sharedMat = new Set(Object.values(this.materials));
    for (const child of [...group.children]) {
      child.traverse((o) => {
        if (o.geometry && !sharedGeo.has(o.geometry)) o.geometry.dispose();
        if (o.material && !sharedMat.has(o.material) && !o.isSprite)
          o.material.dispose();
      });
      group.remove(child);
    }
  }
  disposeLabels() {
    for (const l of this.labelObjects) {
      l.material.map.dispose();
      l.material.dispose();
    }
    this.labelObjects = [];
  }
  setup(
    s,
    {
      physical = false,
      leftRecipe = 2,
      rightRecipe = 2,
      leftHole = 1,
      rightHole = 20,
      labels = true,
      reduced = false,
    } = {},
  ) {
    this.dirty = true;
    this.state = { ...s };
    this.physical = physical;
    this.labels = labels;
    this.reduced = reduced;
    this.targetAngle = 0;
    this.moving.rotation.z = 0;
    this.disposeLabels();
    this.clear(this.moving);
    this.clear(this.base);
    this.clear(this.ruler);
    const pivotX = s.pivot * 2 + (physical ? 0.5 : 0),
      shaftY = 1.49,
      beamY = shaftY + 2.24;
    this.moving.position.set(pivotX, shaftY, 0);
    this.base.position.set(pivotX, shaftY, 0);
    const beam = this.mesh("beam");
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(-pivotX + (physical ? 0 : 0.5), beamY - shaftY, 0);
    this.moving.add(beam);
    for (const z of [-1.25, 1.25]) {
      const a = this.mesh("angle", "base");
      a.rotation.z = (-Math.PI * 5) / 6;
      a.position.z = z;
      this.base.add(a);
    }
    for (const x of [-Math.sqrt(3), Math.sqrt(3)]) {
      const st = this.mesh("standoff", "pin");
      st.position.set(x, -1, 1);
      this.base.add(st);
    }
    const shaft = this.mesh("shaft", "metal");
    shaft.position.z = -0.83;
    this.base.add(shaft);
    const collar = this.mesh("collar", "connector");
    collar.position.z = 1.77;
    this.base.add(collar);
    for (const z of [-0.5, 0.5]) {
      const off = this.mesh("offset", "connector");
      off.rotation.x = -Math.PI / 2;
      off.position.set(-1, 2, z);
      this.moving.add(off);
    }
    const axisBasis = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(1, 0, 0),
    );
    for (const side of ["left", "right"]) {
      const dir = side === "left" ? -1 : 1,
        anchor = physical
          ? (side === "left" ? leftHole : rightHole) - 10.5
          : s[side + "Pos"] * 2;
      const group = new THREE.Group();
      group.position.set(anchor - pivotX, beamY - shaftY, 0);
      this.moving.add(group);
      // Built-in pins enter the two outer rows; bracket face points out along the beam.
      const corner = this.mesh("corner", "connector");
      const cornerBasis = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(0, 0, dir),
        new THREE.Vector3(-dir, 0, 0),
        new THREE.Vector3(0, -1, 0),
      );
      corner.setRotationFromMatrix(cornerBasis);
      corner.position.set(0, 0.24, -dir * 0.5);
      group.add(corner);
      const upright = this.mesh("upright");
      upright.setRotationFromMatrix(axisBasis);
      upright.position.set(dir * 0.49, 2.24, 0);
      group.add(upright);
      for (const [y, z] of [
        [3.74, -0.5],
        [3.74, 0.5],
        [3.24, 0],
        [0.74, -0.5],
        [0.74, 0.5],
      ]) {
        const pin = this.mesh("pin", "pin");
        pin.rotation.y = Math.PI / 2;
        pin.position.set(dir * 0.72, y, z);
        group.add(pin);
      }
      if (physical) {
        const large = this.mesh("largeGear", "gear");
        large.rotation.y = Math.PI / 2;
        large.position.set(dir * 0.98, 4.24, 0);
        group.add(large);
        if ((side === "left" ? leftRecipe : rightRecipe) === 2) {
          const small = this.mesh("smallGear", "gear");
          small.rotation.y = Math.PI / 2;
          small.position.set(dir * 1.49, 4.24, 0);
          group.add(small);
        }
        for (const [y, z] of [
          [4.74, -0.5],
          [4.74, 0.5],
          [5.24, 0],
        ]) {
          const pin = this.mesh("pin", "pin");
          pin.rotation.y = Math.PI / 2;
          pin.position.set(dir * 1.23, y, z);
          group.add(pin);
        }
        if ((side === "left" ? leftRecipe : rightRecipe) === 2)
          for (const [y, z] of [
            [3.74, -0.5],
            [3.74, 0.5],
            [3.24, 0],
          ]) {
            const pin = this.mesh("pin", "pin");
            pin.rotation.y = Math.PI / 2;
            pin.position.set(dir * 1.74, y, z);
            group.add(pin);
          }
      } else {
        // Equal practice discs deliberately differ from the real 60/36-tooth recipe.
        for (let n = 0; n < s[side + "Mass"]; n++) {
          const disc = new THREE.Mesh(
            new THREE.CylinderGeometry(1.13, 1.13, 0.35, 48),
            this.materials[side],
          );
          disc.rotation.z = Math.PI / 2;
          disc.position.set(dir * (1.15 + n * 0.39), 4.24, 0);
          disc.castShadow = true;
          disc.receiveShadow = true;
          group.add(disc);
          const hub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.22, 0.37, 16),
            this.materials.connector,
          );
          hub.rotation.z = Math.PI / 2;
          hub.position.copy(disc.position);
          group.add(hub);
        }
      }
      const count = this.label(
        physical
          ? (side === "left" ? leftRecipe : rightRecipe) === 2
            ? "Large + small"
            : "Large gear"
          : `${s[side + "Mass"]} unit${s[side + "Mass"] === 1 ? "" : "s"}`,
        side === "left" ? 0xa4eee0 : 0xe3c9ff,
        physical ? 5 : 3.2,
      );
      count.position.set(0, physical ? 7.6 : 6.4, 0);
      group.add(count);
    }
    // Distance markers are attached to the moving beam so pivot changes are visible.
    if (!physical) {
      for (let p = -4; p <= 4; p++) {
        const dot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.07, 12),
          this.materials[p === s.pivot ? "pin" : "connector"],
        );
        dot.position.set(p * 2 - pivotX, beamY - shaftY + 0.3, 0.87);
        this.moving.add(dot);
      }
      for (const side of ["left", "right"]) {
        const end = s[side + "Pos"] * 2;
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, beamY - shaftY + 0.5, 1.7),
            new THREE.Vector3(end - pivotX, beamY - shaftY + 0.5, 1.7),
          ]),
          new THREE.LineBasicMaterial({
            color: side === "left" ? 0x8ee4d1 : 0xe2bfff,
          }),
        );
        line.userData.transient = true;
        this.moving.add(line);
        const l = this.label(
          `${Math.abs(s[side + "Pos"] - s.pivot)} space${Math.abs(s[side + "Pos"] - s.pivot) === 1 ? "" : "s"}`,
          0xfff4cd,
          3.2,
        );
        l.position.set(
          side === "left"
            ? Math.min(-2.2, (end - pivotX) / 2)
            : Math.max(2.2, (end - pivotX) / 2),
          beamY - shaftY + 0.2,
          3.6,
        );
        l.userData.distance = true;
        this.moving.add(l);
      }
    }
    const fulcrum = this.label("PIVOT", 0xf8d498, 2.5);
    fulcrum.position.set(0, 0.1, 2.6);
    this.base.add(fulcrum);
    this.setLabels(labels);
  }
  setLabels(value) {
    this.dirty = true;
    this.labels = value;
    for (const l of this.labelObjects)
      if (l.userData.distance) l.visible = value;
    for (const o of this.moving.children) if (o.isLine) o.visible = value;
  }
  tilt(result) {
    this.dirty = true;
    this.targetAngle =
      result === "left" ? 0.13 : result === "right" ? -0.13 : 0;
  }
  resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.dirty = true;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.previousWidth !== w) {
      this.previousWidth = w;
      this.resetCamera();
    }
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
  }
  resetCamera() {
    this.dirty = true;
    const fit = Math.max(
      1,
      1.6 / (this.host.clientWidth / this.host.clientHeight),
    );
    this.camera.position.set(8 * fit, 4 + 8 * fit, 24 * fit);
    this.controls.maxDistance = Math.max(57, 52 * fit);
    this.controls.target.set(0, 5.2, 0);
    this.controls.update();
  }
  sideCamera() {
    this.dirty = true;
    const fit = Math.max(
      1,
      1.6 / (this.host.clientWidth / this.host.clientHeight),
    );
    this.camera.position.set(0, 6.4, 29 * fit);
    this.controls.target.set(0, 4.8, 0);
    this.controls.update();
  }
}
