/// <reference types="vite/client" />
declare module "tween.js";

interface InitProps {
  container: HTMLElement;
  onClickBlock?: (IClickBlock) => void;
  autoRotate?: boolean;
  cameraRotationSpeed?: number;
}

interface IClickBlock {
  index: number;
  selected: boolean;
  cube: THREE.Mesh;
  cubes: THREE.Group[];
}
