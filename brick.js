import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import './cannon.min.js';

// Physics constants
let ball_x_speed = 0.2;
let ball_y_speed = 0.4;
const paddle_speed = 0.3;
let ball_vel_mag = Math.sqrt( Math.pow(ball_x_speed,2) + Math.pow(ball_y_speed,2) );

// Cannonjs and Threejs globals
let world;
let scene;

let world_time_step = 0.5;
let gaming = true;
let start_game = false;
let current_tiles = 1;
let level = 1;

let textShapes = [];
let shapes = [];
let tiles = [];
let shape_physics = [];
let tile_physics = [];


// dimensions
const board_width = 25;
const board_height = 25;
const paddle_width = 4;
const ball_rad = 0.5;
const paddle_location = -8;
const tile_row_height = 0.5;
const ballMass = 1;
const sideWidth = 1;
const sideHeight = board_height;
const sideDepth = 1;

const topWidth = board_width + 1;
const topHeight = 1;
const topDepth = 1;

const brickWidth = 2;
const brickHeight = 0.5;
const brickDepth = 1;

const paddleWidth = paddle_width;
const paddleHeight = 0.5;
const paddleDepth = 1;

// Geometries
const sideGeo = new THREE.BoxGeometry(sideWidth, sideHeight, sideDepth);  
const topGeo = new THREE.BoxGeometry(topWidth, topHeight, topDepth);
const brickGeo = new THREE.BoxGeometry(brickWidth, brickHeight, brickDepth);
const paddleGeo = new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth);
const ballGeo = new THREE.SphereGeometry( ball_rad, 32, 32 );
const Fontloader = new THREE.FontLoader();
const Textureloader = new THREE.TextureLoader();

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
  ballBody.angularDamping = 0;
  ballBody.position.copy(position);
  ballBody.material.friction = 0;
  ballBody.material.restitution = 1.0;

  return ballBody;
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
}

// Create a floating line of text starting at given coords
function textInstance(text, x, y, z){
    
  Fontloader.load( 'node_modules/three/examples/fonts/optimer_regular.typeface.json', function (font) {
    
    var geometry = new THREE.TextGeometry( text, {
    	font: font,
    	size: 1.2,
    	height: .1,
    	curveSegments: 2,
    	bevelEnabled: true,
    	bevelThickness: .05,
    	bevelSize: .1,
    	bevelOffset: 0,
    	bevelSegments: 2
    } );
    var textMaterial = new THREE.MeshStandardMaterial( 
      { color: 0xffffff }
    );
    
    var mesh = new THREE.Mesh( geometry, textMaterial );

    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    
    textShapes.push(mesh)
    scene.add(mesh);
  } );
}

// Remove any text that might be on the screen
function removeText() {
  textShapes.forEach(element => scene.remove(element));
}

// Create a THREE object to represent a brick
function makeBrickInstance(geometry, color, x, y, z) {
    const material = new THREE.MeshPhongMaterial({
      map: Textureloader.load('./VP_Rysum_08_diffuse_webpreview.jpeg'),
    });

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  cube.position.x = x;
  cube.position.y = y;
  cube.position.z = z;

  return cube;
}

// Create a THREE object to represent a paddle
function makePaddleInstance(geometry, color, x, y, z) {
    const material = new THREE.MeshPhongMaterial({
      map: Textureloader.load('https://previews.123rf.com/images/rakratchada/rakratchada1401/rakratchada140100310/25358311-close-up-old-wooden-purple-wood-texture.jpg'),
    });

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  cube.position.x = x;
  cube.position.y = y;
  cube.position.z = z;

  return cube;
}

// Create a THREE object to represent a wall
function makeWallInstance(geometry, color, x, y, z) {
    const material = new THREE.MeshStandardMaterial({
      map: Textureloader.load('https://media.istockphoto.com/photos/walnut-wood-texture-super-long-walnut-planks-texture-background-picture-id1077486660?k=6&m=1077486660&s=170667a&w=0&h=R6uA-E8tnj_gH-EG2jc-gDsgbqJosLBJHfq1Gd-4kVA='),
    });

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  cube.position.x = x;
  cube.position.y = y;
  cube.position.z = z;

  return cube;
}

// Create a THREE object to represent the ball
function makeInstance(geometry, color, x, y, z) {
  const material = new THREE.MeshPhongMaterial({color});

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  cube.position.x = x;
  cube.position.y = y;
  cube.position.z = z;

  return cube;
}

// Place all the tiles on the board
var create_tiles = function(rows, columns) {
  var tile_row_space = (board_width) / (columns+1);
  for(var row = 0; row < rows; row++ ) {
      for(var tile_index = 0; tile_index < columns; tile_index++ ) {
          // Make a THREE object
          tiles.push(makeBrickInstance(brickGeo, 0xff0000, -board_width/2 + tile_row_space *(tile_index+1), board_height/2 - 1 - brickHeight - (tile_row_height+1)*row, 0));
          // Make a Cannon object
          tile_physics.push(initCannonBox(1,brickWidth/2,brickHeight/2,brickDepth,tiles[tiles.length-1].position));
      }
  }
  tile_physics.forEach(element => world.addBody(element));
  if(current_tiles<10) {
    level += 1;
    current_tiles += 1;
  } else {
    level += 1;
    ball_x_speed +=0.1;
    ball_y_speed +=0.1;
    ball_vel_mag = Math.sqrt( Math.pow(ball_x_speed,2) + Math.pow(ball_y_speed,2) )
  }
  tiles.forEach( element => element.out = false);
}

// Remove all tiles from board
var remove_tiles = function() {
  for(var i = 0; i < tiles.length; i++) {
    scene.remove(tiles[i]);
    world.remove(tile_physics[i]);
  }
  tile_physics.forEach(element => world.remove(element));
  tiles.forEach(element => world.remove(element));
  tiles = [];
  tile_physics = [];
}

// Tear down any existing levels and build a new one
var new_level = function(rows, columns) {
  // reset ball and paddle positions
  shape_physics[5].velocity.set(ball_x_speed,ball_y_speed,0);
  shape_physics[5].position.x = 0;
  shape_physics[5].position.y = paddle_location +1;
  shape_physics[5].quaternion.set(0,0,0,0);
  shapes[shapes.length-1].position.copy(shape_physics[5].position);


  shape_physics[4].position.x = 0;
  shape_physics[4].position.y = paddle_location;
  shapes[shapes.length-2].position.copy(shape_physics[4].position);

  //reset tiles
  remove_tiles();
  create_tiles(rows,columns);
}

var get_magnitude = function(a,b) {
  return Math.sqrt( Math.pow(a,2) + Math.pow(b,2) );
}

var main = function () {

  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.setSize( 1000,500 )

  scene = new THREE.Scene();

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
    const light2 = new THREE.DirectionalLight(color, intensity);
    light2.position.set(1, -2, -4);
    scene.add(light2);
  }  

  initCannon();
  
  textInstance("Rotate Board: Mouse", -6, 9,-3);
  textInstance("Paddle Directions:", -6, 5,-3);
  textInstance("AWSD", -6, 3,-3);
  textInstance("Paddle Rotation:", -6, -1,-3);
  textInstance("Left Right Arrow", -6, -3,-3);
  textInstance("Start: Enter", -6, -7,-3);

  // This array holds Three.js shapes
  shapes = [
    makeWallInstance(sideGeo, 0x44aa88, -board_width/2, 0, 0),
    makeWallInstance(sideGeo, 0x44aa88, board_width/2, 0, 0),
    makeWallInstance(topGeo, 0x44aa88, 0, board_height/2, 0),
    makeWallInstance(topGeo, 0x44aa88, 0, -board_height/2, 0),
    makePaddleInstance(paddleGeo, 0xff0000, 0, paddle_location, 0),
    makeInstance(ballGeo, 0xEEEBD9, 0, paddle_location+1, 0)

  ];

  // Makes objects in the physics simulator in the exact same positions
  shape_physics.push(initCannonBox(0,sideWidth/2,sideHeight,sideDepth,shapes[0].position));
  shape_physics.push(initCannonBox(0,sideWidth/2,sideHeight,sideDepth,shapes[1].position));
  shape_physics.push(initCannonBox(0,topWidth/2,topHeight/2,topDepth,shapes[2].position));
  shape_physics.push(initCannonBox(0,topWidth/2,topHeight/2,topDepth,shapes[3].position));
  shape_physics.push(initCannonBox(5,paddleWidth/2,paddleHeight,paddleDepth,shapes[4].position));
  shape_physics.push(initCannonBall(shapes[5].position));

  //Code I haven't figured out to get collisions
  shape_physics[5].addEventListener("collide",function(event){
    console.log(event);
    shapes[5].material.color.setHex(Math.random() * 0xffffff);
  })

  // ball initial speed
  shape_physics[5].velocity.set(0.4,0.8,0);

  // Add all the physics objects to the world
  shape_physics.forEach(element => world.addBody(element))


  //create_tiles(tiles_per_row,tile_rows);
  create_tiles(current_tiles,current_tiles);


  // Implement controls
  document.addEventListener("keydown", function(event) {
    if(event.keyCode == 65) {
      shape_physics[4].velocity.set(-paddle_speed,shape_physics[4].velocity.y,shape_physics[4].velocity.z)
    }
    if(event.keyCode == 68) {
      shape_physics[4].velocity.set(paddle_speed,shape_physics[4].velocity.y,shape_physics[4].velocity.z)
    }
    if(event.keyCode == 87) {
      shape_physics[4].velocity.set(shape_physics[4].velocity.x,paddle_speed,shape_physics[4].velocity.z)
    }
    if(event.keyCode == 83) {
      shape_physics[4].velocity.set(shape_physics[4].velocity.x,-paddle_speed,shape_physics[4].velocity.z)
    }
    if(event.keyCode == 37) {
      shape_physics[4].angularVelocity.set(shape_physics[4].angularVelocity.x,shape_physics[4].angularVelocity.y,paddle_speed)
    }
    if(event.keyCode == 39) {
      shape_physics[4].angularVelocity.set(shape_physics[4].angularVelocity.x,shape_physics[4].angularVelocity.y,-paddle_speed)
    }
    if(event.keyCode == 38) {
      shape_physics[4].angularVelocity.set(-paddle_speed,shape_physics[4].angularVelocity.y,shape_physics[4].angularVelocity.z)
    }
    if(event.keyCode == 40) {
      shape_physics[4].angularVelocity.set(paddle_speed,shape_physics[4].angularVelocity.y,shape_physics[4].angularVelocity.z)
    }
    // enter key to start game and each level
    if(event.keyCode == 13) {
      start_game = true;
      removeText();
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
      shape_physics[4].angularVelocity.set(shape_physics[4].angularVelocity.x,shape_physics[4].angularVelocity.y,0)
    }
    if(event.keyCode == 39) {
      shape_physics[4].angularVelocity.set(shape_physics[4].angularVelocity.x,shape_physics[4].angularVelocity.y,0)
    }
    if(event.keyCode == 38) {
      shape_physics[4].angularVelocity.set(0,shape_physics[4].angularVelocity.y,shape_physics[4].angularVelocity.z)
    }
    if(event.keyCode == 40) {
      shape_physics[4].angularVelocity.set(0,shape_physics[4].angularVelocity.y,shape_physics[4].angularVelocity.z)
    }
  });

  function render(time) {
    time *= 0.001;  // convert time to seconds
    if(gaming && start_game) {
      world.step(world_time_step);
    } else {
      if(!gaming) {
        alert("Failure");
        level = 1;
        current_tiles = 1;
        new_level(current_tiles,current_tiles);
        location.reload();
        gaming = true;
      }
    }

    let current_mag = get_magnitude(shape_physics[5].velocity.x,shape_physics[5].velocity.y)
    let mag_factor = 1;
      mag_factor = mag_factor = ball_vel_mag / current_mag;

    // ball position
    shape_physics[5].velocity.set(mag_factor * shape_physics[5].velocity.x, mag_factor * shape_physics[5].velocity.y,0);
    shape_physics[5].quaternion.set(0,0,0,0);
    shape_physics[5].position.z = 0;
    shapes[shapes.length-1].position.copy(shape_physics[5].position);
    shapes[shapes.length-1].quaternion.copy(shape_physics[5].quaternion);
    if(shapes[shapes.length-1].position.y < -board_height/2 +1) {
      gaming = false;
    }

    // paddle position
    shape_physics[4].angularVelocity.set(shape_physics[4].angularVelocity.x,0,shape_physics[4].angularVelocity.z);
    shape_physics[4].velocity.set(shape_physics[4].velocity.x,shape_physics[4].velocity.y,0);
    shape_physics[4].quaternion.set(0,0,shape_physics[4].quaternion.z,shape_physics[4].quaternion.w);
    shapes[shapes.length-2].position.copy(shape_physics[4].position);
    shapes[shapes.length-2].quaternion.copy(shape_physics[4].quaternion);

    // brick positions
    let tiles_removed = 0;
    for(var i = 0; i < tiles.length; i++) {
      tiles[i].position.copy(tile_physics[i].position);
      tiles[i].quaternion.copy(tile_physics[i].quaternion);
      if (tiles[i].position.z > 1 || tiles[i].position.z < -1 || tiles[i].position.y < -board_height/2 +2 || tiles[i].out == true ) {
        tiles[i].out = true;
        tiles_removed += 1;
        tiles[i].material.color.setHex(0x00ff00);
      }
    }

    // Game lose logic
    if(tiles_removed >= tiles.length) {
      let current_level = level -1;
      start_game = false;
      textInstance("Level "+ current_level + " Clear!", -5, 5,-3);
      textInstance("Press Enter to Continue", -8, 3,-3);
      new_level(current_tiles,current_tiles);
    }
    
    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}

main();
