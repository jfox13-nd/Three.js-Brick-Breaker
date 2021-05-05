import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import './cannon.min.js';

let ball_x_speed = 0.2;
let ball_y_speed = 0.4;
const paddle_speed = 0.3;

const board_width = 25;
const board_height = 25;
const paddle_width = 4;
const ball_rad = 0.5;
const paddle_location = -8;
const paddle_increment = 0.5;

const tile_rows = 3;
const tile_row_height = 0.5;
const tiles_per_row = 3;

let world, ballShape;
const ballMass = 1;

let world_time_step = 0.5;
let gaming = true;
let start_game = false;
let current_tiles = 1;
let level = 1;
const max_level = 12;

let paddleBody;

let ball_vel_mag = Math.sqrt( Math.pow(ball_x_speed,2) + Math.pow(ball_y_speed,2) );

let shapes = [];
let tiles = [];
let shape_physics = [];
let tile_physics = [];

//let testThis = this;
const global = this;
let scene;


// dimensions
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

const sideGeo = new THREE.BoxGeometry(sideWidth, sideHeight, sideDepth);  
const topGeo = new THREE.BoxGeometry(topWidth, topHeight, topDepth);
const brickGeo = new THREE.BoxGeometry(brickWidth, brickHeight, brickDepth);
const paddleGeo = new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth);
const ballGeo = new THREE.SphereGeometry( ball_rad, 32, 32 );

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
const Textureloader = new THREE.TextureLoader();

function makeBrickInstance(geometry, color, x, y, z) {
  //console.log(typeof color)


    const material = new THREE.MeshPhongMaterial({
      map: Textureloader.load('https://cosmiccharity.org.uk/wp-content/uploads/2017/09/block.php_.png'),
    });

  //const material = new THREE.MeshPhongMaterial({color});
  

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  cube.position.x = x;
  cube.position.y = y;
  cube.position.z = z;

  return cube;
}

function makeWallInstance(geometry, color, x, y, z) {
  //console.log(typeof color)


    const material = new THREE.MeshStandardMaterial({
      map: Textureloader.load('https://media.istockphoto.com/photos/walnut-wood-texture-super-long-walnut-planks-texture-background-picture-id1077486660?k=6&m=1077486660&s=170667a&w=0&h=R6uA-E8tnj_gH-EG2jc-gDsgbqJosLBJHfq1Gd-4kVA='),
    });

  //const material = new THREE.MeshPhongMaterial({color});
  

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  cube.position.x = x;
  cube.position.y = y;
  cube.position.z = z;

  return cube;
}

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
          tiles.push(makeBrickInstance(brickGeo, 0xff0000, -board_width/2 + tile_row_space *(tile_index+1), board_height/2 - 1 - brickHeight - (tile_row_height+1)*row, 0));
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
}

// Remove all tiles from board
var remove_tiles = function() {
  for(var i = 0; i < tiles.length; i++) {
    scene.remove(tiles[i]);
    world.remove(tile_physics[i]);
  }
  tile_physics.forEach(element => world.remove(element))
  tiles.forEach(element => world.remove(element))
  tiles = []
  tile_physics = []
}

// Tear down any existing levels and build a new one
var new_level = function(rows, columns) {
  // reset ball and paddle positions
  shape_physics[5].velocity.set(ball_x_speed,ball_y_speed,0);
  shape_physics[5].position.x = 0;
  shape_physics[5].position.y = paddle_location +1;
  shape_physics[5].quaternion.set(0,0,0,0);
  shapes[shapes.length-1].position.copy(shape_physics[5].position);

  //shape_physics[4].velocity.set(0,0,0);
  //shape_physics[4].angularVelocity.set(0,0,0);
  shape_physics[4].position.x = 0;
  shape_physics[4].position.y = paddle_location;
  //shape_physics[4].quaternion.set(0,0,0,0);
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
  //renderer.setSize( window.innerWidth, window.innerHeight )
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

  

  const Fontloader = new THREE.FontLoader();
  

  initCannon();


  

  function textInstance(text){
    
    Fontloader.load( 'fonts/helvetiker_regular.typeface.json', function (font) {
    
    	var geometry = new THREE.TextGeometry( text, {
    		font: font,
    		size: 180,
    		height: 5,
    		curveSegments: 12,
    		bevelEnabled: true,
    		bevelThickness: 10,
    		bevelSize: 8,
    		bevelOffset: 0,
    		bevelSegments: 5
    	} );
      var textMaterial = new THREE.MeshPhongMaterial( 
        { color: 0x0000ff }
      );
    
      var mesh = new THREE.Mesh( geometry, textMaterial );
    
      scene.add(mesh);
    } );

    
  }

  // This array holds Three.js shapes
  shapes = [
    makeWallInstance(sideGeo, 0x44aa88, -board_width/2, 0, 0),
    makeWallInstance(sideGeo, 0x44aa88, board_width/2, 0, 0),
    makeWallInstance(topGeo, 0x44aa88, 0, board_height/2, 0),
    makeWallInstance(topGeo, 0x44aa88, 0, -board_height/2, 0),
    makeBrickInstance(paddleGeo, 0xff0000, 0, paddle_location, 0),
    makeInstance(ballGeo, 0xEEEBD9, 0, paddle_location+1, 0)

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
    if(event.keyCode == 13) {
      start_game = true;
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
    // remove the y
    //shape_physics[4].angularVelocity.set(shape_physics[4].angularVelocity.x,shape_physics[4].angularVelocity.y,shape_physics[4].angularVelocity.z);
    shape_physics[4].angularVelocity.set(shape_physics[4].angularVelocity.x,0,shape_physics[4].angularVelocity.z);
    shape_physics[4].velocity.set(shape_physics[4].velocity.x,shape_physics[4].velocity.y,0);
    //shape_physics[4].quaternion.set(shape_physics[4].quaternion.x,0,shape_physics[4].quaternion.z,shape_physics[4].quaternion.w);
    // consider changing
    shape_physics[4].quaternion.set(0,0,shape_physics[4].quaternion.z,shape_physics[4].quaternion.w);
    shapes[shapes.length-2].position.copy(shape_physics[4].position);
    shapes[shapes.length-2].quaternion.copy(shape_physics[4].quaternion);

    // brick positions
    // tiles_removed could be a boolean, but that didn't seem to work, possibly a hoisting issue
    let tiles_removed = 0;
    for(var i = 0; i < tiles.length; i++) {
      tiles[i].position.copy(tile_physics[i].position);
      tiles[i].quaternion.copy(tile_physics[i].quaternion);
      if (tiles[i].position.z > 1 || tiles[i].position.z < -1 || tiles[i].position.y < -board_height/2 +2 ) {
        tiles_removed += 1;
        tiles[i].material.color.setHex(0x00ff00);
      }
    }

    // Game lose logic
    if(tiles_removed >= tiles.length) {
      let current_level = level -1;
      alert("Level "+ current_level + " Clear!")
      new_level(current_tiles,current_tiles);
    }
    
    textInstance("Win");
    
    

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}

main();
