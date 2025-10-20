import * as THREE from 'three';

export class Render {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private animationId: number | null = null;
  private objects: THREE.Object3D[] = [];
  private onRender?: () => void;

  constructor(container: HTMLElement, fov = 75, near = 0.1, far = 1000) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      fov,
      container.clientWidth / container.clientHeight,
      near,
      far
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x87ceeb);
    container.appendChild(this.renderer.domElement);
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  public setOnRender(cb: () => void) {
    this.onRender = cb;
  }

  public addObject(obj: THREE.Object3D) {
    this.scene.add(obj);
    this.objects.push(obj);
  }

  public removeObject(obj: THREE.Object3D) {
    this.scene.remove(obj);
    this.objects = this.objects.filter((o) => o !== obj);
  }

  public setCameraPosition(x: number, y: number, z: number) {
    this.camera.position.set(x, y, z);
  }

  public lookAt(x: number, y: number, z: number) {
    this.camera.lookAt(x, y, z);
  }

  private handleResize() {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  public render = () => {
    if (this.onRender) this.onRender();
    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.render);
  };

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.objects = [];
  }

  public getScene() {
    return this.scene;
  }

  public getCamera() {
    return this.camera;
  }

  public getRenderer() {
    return this.renderer;
  }
}
