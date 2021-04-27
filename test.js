import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
var ball_x_speed = 0.1;
var ball_y_speed = 0.1;
var paddle_x = 0;

const board_width = 20;
const board_height = 20;
const paddle_width = 2;
const ball_rad = 0.5;
const paddle_location = -8;
const paddle_increment = 0.5;

const tile_rows = 2;
const tile_row_height = 0.5;
const tiles_per_row = 5;


function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  //renderer.setSize( window.innerWidth, window.innerHeight )
  renderer.setSize( 1000,500 )

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


  function makeInstance(geometry, color, x, y, z) {
    const material = new THREE.MeshPhongMaterial({color});

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;

    return cube;
  }

  const shapes = [
    makeInstance(sideGeo, 0x44aa88, -board_width/2, 0, 0),
    makeInstance(sideGeo, 0x44aa88, board_width/2, 0, 0),
    makeInstance(topGeo, 0x44aa88, 0, board_height/2, 0),
    makeInstance(topGeo, 0x44aa88, 0, -board_height/2, 0),
    makeInstance(paddleGeo, 0xff0000, 0, paddle_location, 0),
    makeInstance(ballGeo, 0x0000FF, 0, paddle_location+1, 0)
  ];

  const tiles = []

    // here is where we would generate tiles
    var tile_row_space = (board_width) / (tiles_per_row+1);
    for(var row = 0; row < tile_rows; row++ ) {
        for(var tile_index = 0; tile_index < tiles_per_row; tile_index++ ) {
            tiles.push(makeInstance(brickGeo, 0xff0000, -board_width/2 + tile_row_space *(tile_index+1), board_height/2 - 1 - brickHeight - (tile_row_height+1)*row, 0));
        }
    }

    document.addEventListener("keydown", function(event) {
        if (event.keyCode == 37 && shapes[shapes.length-2].position.x > -board_width/2 + ball_rad + 1) {
            shapes[shapes.length-2].position.x = shapes[shapes.length-2].position.x - paddle_increment;
        }
        if (event.keyCode == 39 && shapes[shapes.length-2].position.x < board_width/2 - ball_rad - 1) {
            shapes[shapes.length-2].position.x = shapes[shapes.length-2].position.x + paddle_increment;
        }
    });

  function render(time) {
    time *= 0.001;  // convert time to seconds
    
    /*
    cubes.forEach((cube, ndx) => {
      const speed = 1 + ndx * .1;
      //const rot = time * speed;
      //cube.rotation.x = rot;
      //cube.rotation.y = rot;
    });
    */
   shapes[shapes.length-1].position.x = shapes[shapes.length-1].position.x + ball_x_speed
   shapes[shapes.length-1].position.y = shapes[shapes.length-1].position.y + ball_y_speed

   var x_pos = shapes[shapes.length-1].position.x;
   var y_pos = shapes[shapes.length-1].position.y;
   var paddle_x = shapes[shapes.length-2].position.x;
   var paddle_y = shapes[shapes.length-2].position.x;

    // make sure it's within board bounds
    if(x_pos > board_width/2 - ball_rad || x_pos < -board_width/2 + ball_rad) {
        ball_x_speed = - ball_x_speed;
        shapes[shapes.length-1].position.x = shapes[shapes.length-1].position.x + 2*ball_x_speed
    }
    if(y_pos > board_height/2 - ball_rad || y_pos < -board_height/2 + ball_rad) {
        ball_y_speed = - ball_y_speed;
        shapes[shapes.length-1].position.y = shapes[shapes.length-1].position.y + 2*ball_y_speed
    }

    if(x_pos < paddle_x + paddleWidth/2 - ball_rad && x_pos > paddle_x + -paddleWidth/2 + ball_rad
        && y_pos < paddle_location + paddleHeight/2 + ball_rad && y_pos > paddle_location - paddleHeight/2 - ball_rad) {
        ball_y_speed = - ball_y_speed;
        shapes[shapes.length-1].position.y = shapes[shapes.length-1].position.y + 2*ball_y_speed
    }

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}

main();
