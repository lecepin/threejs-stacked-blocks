import * as TWEEN from "tween.js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function init({
  container,
  onClickBlock,
  autoRotate = false,
  cameraRotationSpeed = 0.001,
}: InitProps) {
  let _timer: number | null = null;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.z = 5;
  camera.position.y = 1;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI / 2 - 0.1;

  const gridHelper = new THREE.GridHelper(1000, 1000, 0x888888, 0x888888);
  scene.add(gridHelper);

  const geometry = new THREE.BoxGeometry(1, 0.5, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
  });

  const cubes: THREE.Group[] = [];
  let lastCube: THREE.Group | null = null;
  let selectedCube: THREE.Mesh | null = null;
  const centerPoint = new THREE.Vector3(0, 0, 0);
  function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();

    if (autoRotate) {
      camera.position.sub(centerPoint);
      camera.position.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        cameraRotationSpeed
      );
      // camera.position.add(centerPoint);
      // camera.lookAt(centerPoint);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  container.addEventListener("click", (event) => {
    if (!onClickBlock) {
      return;
    }

    let _index = null;

    const pointer = new THREE.Vector2();
    let raycaster = new THREE.Raycaster();

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(cubes, true);

    let currentCube: THREE.Mesh | null = null;
    if (intersects.length > 0) {
      for (let i = 0; i < intersects.length; i++) {
        const item = intersects[i];
        if (item.object instanceof THREE.Mesh) {
          currentCube = item.object;
          _index = i;
          break;
        }
      }

      cubes.forEach((cube) => {
        // @ts-ignore
        cube.children[1].material.color.set(0xffff00);
      });

      if (selectedCube !== currentCube) {
        // @ts-ignore
        currentCube.material.color.set(0xff0000);
        selectedCube = currentCube;
        onClickBlock({
          index: _index,
          selected: true,
          cube: currentCube,
          cubes: cubes,
        });
      } else {
        selectedCube = null;
        onClickBlock({
          index: _index,
          selected: false,
          cube: currentCube,
          cubes: cubes,
        });
      }
    }
  });
  animate();
  window.addEventListener("resize", onWindowResize);

  return {
    addBlock: () => {
      if (_timer) {
        return;
      }
      const newCube = new THREE.Mesh(geometry, material.clone());
      const edgesClone = new THREE.LineSegments(edges, lineMaterial.clone());

      const group = new THREE.Group();
      group.add(edgesClone);
      group.add(newCube);

      if (lastCube) {
        const lastCubeWorldPosition = new THREE.Vector3();
        lastCube.getWorldPosition(lastCubeWorldPosition);
        group.position.copy(lastCubeWorldPosition);
        group.position.y += 0.5;
      } else {
        group.position.y += 0.25;
      }

      scene.add(group);
      cubes.push(group);

      lastCube = group;
    },
    clearBlock: () => {
      if (_timer) {
        return;
      }
      const duration = 1000;
      const easing = TWEEN.Easing.Quadratic.Out;
      const initialRotation = { y: 0 };
      const targetRotation = { y: -Math.PI };
      let removeIndex = cubes.length - 1;

      const tween = new TWEEN.Tween(initialRotation)
        .to(targetRotation, duration)
        .easing(easing)
        .onUpdate(() => {
          cubes.forEach((cube, index) => {
            cube.rotation.y = initialRotation.y + (index * Math.PI) / 30;
          });
        })
        .start();

      _timer = setInterval(() => {
        if (removeIndex < 0) {
          clearInterval(_timer!);
          _timer = null;
          return;
        }
        scene.remove(cubes[removeIndex--]);
      }, duration / cubes.length);

      tween.onComplete(() => {
        cubes.forEach((cube) => {
          scene.remove(cube);
        });

        cubes.length = 0;
        lastCube = null;
        clearInterval(_timer!);
        _timer = null;
      });
    },
  };
}
