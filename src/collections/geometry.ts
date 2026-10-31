import * as THREE from "three";
import { extend, type ThreeElement } from "@react-three/fiber";

/** A plane bent along a circular arc so the cards curve around the ring. `radius` is the bow depth. */
export class BentPlaneGeometry extends THREE.PlaneGeometry {
  constructor(radius: number, width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    super(width, height, widthSegments, heightSegments);
    const hw = width * 0.5;
    const a = new THREE.Vector2(-hw, 0);
    const b = new THREE.Vector2(0, radius);
    const c = new THREE.Vector2(hw, 0);
    const ab = new THREE.Vector2().subVectors(a, b);
    const bc = new THREE.Vector2().subVectors(b, c);
    const ac = new THREE.Vector2().subVectors(a, c);
    const r = (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));
    const center = new THREE.Vector2(0, radius - r);
    const baseAngle = new THREE.Vector2().subVectors(a, center).angle() - Math.PI * 0.5;
    const arc = baseAngle * 2;
    const uv = this.attributes.uv;
    const pos = this.attributes.position;
    const v = new THREE.Vector2();
    for (let i = 0; i < uv.count; i++) {
      const uvRatio = 1 - uv.getX(i);
      const y = pos.getY(i);
      v.copy(c).rotateAround(center, arc * uvRatio);
      pos.setXYZ(i, v.x, y, -v.y);
    }
    pos.needsUpdate = true;
  }
}

/** Basic material whose vertices ripple on a sine wave driven by `time`. */
export class MeshSineMaterial extends THREE.MeshBasicMaterial {
  time = { value: 0 };

  onBeforeCompile(shader: THREE.WebGLProgramParametersWithUniforms) {
    shader.uniforms.time = this.time;
    shader.vertexShader = `uniform float time;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      "vec3 transformed = vec3(position.x, position.y + sin(time + uv.x * PI * 4.0) / 4.0, position.z);",
    );
  }
}

extend({ BentPlaneGeometry, MeshSineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    bentPlaneGeometry: ThreeElement<typeof BentPlaneGeometry>;
    meshSineMaterial: ThreeElement<typeof MeshSineMaterial>;
  }
}
