export const PI = Math.PI;
export const rnd = (a, b) => a + Math.random() * (b - a);
export const angDiff = (a, b) => { let d = a - b; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; return d };
export const lerpPose = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k, t: a.t + (b.t - a.t) * k });
export const tmp = new THREE.Vector3();
