import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import './cannon.min.js';

var ball_x_speed = 0.1;
var ball_y_speed = 0.1;
var paddle_x = 0;

const board_width = 20;
const board_height = 20;
const paddle_width = 2;
const ball_rad = 0.5;
const paddle_location = -8;
const paddle_increment = 0.5;

const tile_rows = 3;
const tile_row_height = 0.5;
const tiles_per_row = 2;

let world, ballShape;
const ballMass = 1;

let paddleBody;

const ball_vel_mag = Math.sqrt( Math.pow(0.1,2) + Math.pow(0.1,2) );

let shape_physics = [];
let tile_physics = [];

//let testThis = this;
const global = this;

// setup world physics
var initCannon = function() {

  world = new CANNON.World();
  world.gravity.set(0,0,0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

}

// setup physicas for the ball
var initCannonBall = function(position) {

  let ballBody = new CANNON.Body({
    mass: ballMass,
    shape: new CANNON.Sphere(0.5),
    material: new CANNON.Material("bouncy")
  });

  ballBody.angularVelocity.set(0,0,0);
  ballBody.linearDamping = 0;
  ballBody.position.copy(position);
  ballBody.material.friction = 0;
  ballBody.material.restitution = 1.0;

  return ballBody;
  //world.addBody(ballBody);
}

// setup physics for a rectangle
var initCannonBox = function(mass, l, w, h, position) {

  let ballBody = new CANNON.Body({
    mass: mass,
    shape: new CANNON.Box(new CANNON.Vec3(l,w,h)),
    material: new CANNON.Material("bouncy")
  });
  ballBody.angularVelocity.set(0,0,0);
  ballBody.linearDamping = 0;
  ballBody.position.copy(position)
  ballBody.material.friction = 0;
  ballBody.material.restitution = 1.0;

  return ballBody;
  //world.addBody(ballBody);
}

var main = function () {

  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  //renderer.setSize( window.innerWidth, window.innerHeight )
  renderer.setSize( 1000,500 )

  const scene = new THREE.Scene();

  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 50;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 20;

  const controls = new OrbitControls( camera, renderer.domElement );


  {
    const color = 0xFFFFFF;
    const intensity = 2;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  const sideWidth = 1;
  const sideHeight = board_height;
  const sideDepth = 1;
  const sideGeo = new THREE.BoxGeometry(sideWidth, sideHeight, sideDepth);

  const topWidth = board_width + 1;
  const topHeight = 1;
  const topDepth = 1;
  const topGeo = new THREE.BoxGeometry(topWidth, topHeight, topDepth);

  const brickWidth = 2;
  const brickHeight = 0.5;
  const brickDepth = 1;
  const brickGeo = new THREE.BoxGeometry(brickWidth, brickHeight, brickDepth);

  const paddleWidth = paddle_width;
  const paddleHeight = 0.5;
  const paddleDepth = 1;
  const paddleGeo = new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth);

  const ballGeo = new THREE.SphereGeometry( ball_rad, 32, 32 );

  initCannon();

  function makeInstance(geometry, color, x, y, z) {
    const material = new THREE.MeshPhongMaterial({color});

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;

    return cube;
  }

  // This array holds Three.js shapes
  const shapes = [
    makeInstance(sideGeo, 0x44aa88, -board_width/2, 0, 0),
    makeInstance(sideGeo, 0x44aa88, board_width/2, 0, 0),
    makeInstance(topGeo, 0x44aa88, 0, board_height/2, 0),
    makeInstance(topGeo, 0x44aa88, 0, -board_height/2, 0),
    makeInstance(paddleGeo, 0xff0000, 0, paddle_location, 0),
    makeInstance(ballGeo, 0x0000FF, 0, paddle_location+1, 0)
  ];

  // Makes objects in the physics simulator in the exact same positions
  shape_physics.push(initCannonBox(0,sideWidth/2,sideHeight,sideDepth,shapes[0].position));
  shape_physics.push(initCannonBox(0,sideWidth/2,sideHeight,sideDepth,shapes[1].position));
  shape_physics.push(initCannonBox(0,topWidth/2,topHeight/2,topDepth,shapes[2].position));
  shape_physics.push(initCannonBox(0,topWidth/2,topHeight/2,topDepth,shapes[3].position));
  shape_physics.push(initCannonBox(5,paddleWidth/2,paddleHeight,paddleDepth,shapes[4].position));
  shape_physics.push(initCannonBall(shapes[5].position));

  // Code I haven't figured out to get collisions
  //shape_physics[5].addEventListener("collide",function(event){
  //  console.log(event);
  //})

  // ball initial speed
  shape_physics[5].velocity.set(0.1,0.2,0);

  const tiles = []

    // here is where we would generate tiles and make matching physics objects
    var tile_row_space = (board_width) / (tiles_per_row+1);
    for(var row = 0; row < tile_rows; row++ ) {
        for(var tile_index = 0; tile_index < tiles_per_row; tile_index++ ) {
            tiles.push(makeInstance(brickGeo, 0xff0000, -board_width/2 + tile_row_space *(tile_index+1), board_height/2 - 1 - brickHeight - (tile_row_height+1)*row, 0));
            tile_physics.push(initCannonBox(1,brickWidth/2,brickHeight/2,brickDepth,tiles[tiles.length-1].position));
        }
    }

    // Add all the physics objects to the world
    shape_physics.forEach(element => world.addBody(element))
    tile_physics.forEach(element => world.addBody(element))

    // Implement controls
    document.addEventListener("keydown", function(event) {
        if(event.keyCode == 65) {
          shape_physics[4].velocity.set(-0.1,shape_physics[4].velocity.y,shape_physics[4].velocity.z)
        }
        if(event.keyCode == 68) {
          shape_physics[4].velocity.set(0.1,shape_physics[4].velocity.y,shape_physics[4].velocity.z)
        }
        if(event.keyCode == 87) {
          shape_physics[4].velocity.set(shape_physics[4].velocity.x,0.1,shape_physics[4].velocity.z)
        }
        if(event.keyCode == 83) {
          shape_physics[4].velocity.set(shape_physics[4].velocity.x,-0.1,shape_physics[4].velocity.z)
        }
        if(event.keyCode == 37) {
          shape_physics[4].angularVelocity.set(shape_physics[4].velocity.x,shape_physics[4].velocity.y,0.1)
        }
        if(event.keyCode == 39) {
          shape_physics[4].angularVelocity.set(shape_physics[4].velocity.x,shape_physics[4].velocity.y,-0.1)
        }
    });
    document.addEventListener("keyup", function(event) {
      if(event.keyCode == 65) {
        shape_physics[4].velocity.set(0,shape_physics[4].velocity.y,shape_physics[4].velocity.z)
      }
      if(event.keyCode == 68) {
        shape_physics[4].velocity.set(0,shape_physics[4].velocity.y,shape_physics[4].velocity.z)
      }
      if(event.keyCode == 87) {
        shape_physics[4].velocity.set(shape_physics[4].velocity.x,0,shape_physics[4].velocity.z)
      }
      if(event.keyCode == 83) {
        shape_physics[4].velocity.set(shape_physics[4].velocity.x,0,shape_physics[4].velocity.z)
      }
      if(event.keyCode == 37) {
        shape_physics[4].angularVelocity.set(shape_physics[4].velocity.x,shape_physics[4].velocity.y,0)
      }
      if(event.keyCode == 39) {
        shape_physics[4].angularVelocity.set(shape_physics[4].velocity.x,shape_physics[4].velocity.y,0)
      }
    });

  function render(time) {
    time *= 0.001;  // convert time to seconds
    world.step(0.5)

    // ball position
    shape_physics[5].velocity.set(shape_physics[5].velocity.x,shape_physics[5].velocity.y,0);
    shape_physics[5].quaternion.set(0,0,0,0)
    shapes[shapes.length-1].position.copy(shape_physics[5].position);
    shapes[shapes.length-1].quaternion.copy(shape_physics[5].quaternion);

    // paddle position
    shape_physics[4].angularVelocity.set(0,0,shape_physics[4].angularVelocity.z);
    shape_physics[4].velocity.set(shape_physics[4].velocity.x,shape_physics[4].velocity.y,0);
    shape_physics[4].quaternion.set(0,0,shape_physics[4].quaternion.z,shape_physics[4].quaternion.w);
    shapes[shapes.length-2].position.copy(shape_physics[4].position);
    shapes[shapes.length-2].quaternion.copy(shape_physics[4].quaternion);


    // brick positions
    for(var i = 0; i < tiles.length; i++) {
      tiles[i].position.copy(tile_physics[i].position);
      tiles[i].quaternion.copy(tile_physics[i].quaternion);
    }

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}

main();
