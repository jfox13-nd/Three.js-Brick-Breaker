import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});

  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 50;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 20;

  const scene = new THREE.Scene();

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  const sideWidth = 1;
  const sideHeight = 20;
  const sideDepth = 1;
  const sideGeo = new THREE.BoxGeometry(sideWidth, sideHeight, sideDepth);

  const topWidth = 11;
  const topHeight = 1;
  const topDepth = 1;
  const topGeo = new THREE.BoxGeometry(topWidth, topHeight, topDepth);

  const paddleWidth = 2;
  const paddleHeight = 0.5;
  const paddleDepth = 1;
  const paddleGeo = new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth);

  const ballGeo = new THREE.SphereGeometry( 0.5, 32, 32 );


  function makeInstance(geometry, color, x, y, z) {
    const material = new THREE.MeshPhongMaterial({color});

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;

    return cube;
  }

  const cubes = [
    makeInstance(sideGeo, 0x44aa88, -5, 0, 0),
    makeInstance(sideGeo, 0x44aa88, 5, 0, 0),
    makeInstance(topGeo, 0x44aa88, 0, 10, 0),
    makeInstance(topGeo, 0x44aa88, 0, -10, 0),
    makeInstance(paddleGeo, 0xff0000, 0, -8, 0),
    makeInstance(ballGeo, 0x0000FF, 0, -7, 0),
  ];

  function render(time) {
    time *= 0.001;  // convert time to seconds
    
    cubes.forEach((cube, ndx) => {
      //const speed = 1 + ndx * .1;
      //const rot = time * speed;
      //cube.rotation.x = rot;
      //cube.rotation.y = rot;
    });

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}

main();
