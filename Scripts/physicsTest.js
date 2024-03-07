import Ammo from '/node_modules/Ammo.js-main/builds/Ammo.js';
import * as THREE from '/node_modules/three'; 
import { Clock } from '/node_modules/three/src/core/Clock.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import * as FocalControls from '/Scripts/FocalControls.js';
import { Color, Vector3 } from 'three';

// fetch('/Video/index.html')
//   .then(response => {
//     // Handle the response here, if needed
//     console.log('Response received');
//   })
//   .catch(error => {
//     // Handle any errors here
//     console.error('Error:', error);
//   });


// Initialise the scene, camera, etc
const scene = new THREE.Scene();
//scene.background = new THREE.color(#707070);
const video = document.getElementById("360VideoElement");
console.log(video);
const videoTexture = new THREE.VideoTexture( video );
var RunPhysics = true;
var HomieHeads = [];


const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.0001, 10000);
camera.position.set(0, 0, 3);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();


const clock = new Clock();

// Initialise renderer
const renderer = new THREE.WebGLRenderer({
    powerPreference: "high-performance",
    antialias: false,
    stencil: false,
    depth: false,
    alpha: true
});


renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.zIndex = "-1";

renderer.domElement.style.display = "relative";
renderer.domElement.id = "viewport";
document.getElementById("body").insertBefore(renderer.domElement, document.getElementById("body").firstChild);
const orbit = new OrbitControls(camera, renderer.domElement); //create the camera controls
const canvas = renderer.domElement;
orbit.enableZoom = false;
orbit.enableRotate = false;

renderer.outputEncoding = THREE.sRGBEncoding;
//renderer.outputColorSpace = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const pointLight = new THREE.PointLight(0xffffff, 100, 0, 1);
pointLight.position.set(0, 10, 10);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 2048; // default
pointLight.shadow.mapSize.height = 2048; // default
pointLight.shadow.camera.near = 0.5; // default
pointLight.shadow.camera.far = 500; // default
const f = 200;

pointLight.shadow.camera.left = - f;
pointLight.shadow.camera.right = f;
pointLight.shadow.camera.top = f;
pointLight.shadow.camera.bottom = -f;
scene.add(pointLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 10);
directionalLight.target.position.set(-100, 50, 0);
directionalLight.position.set(0, 10, 0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048; // default
directionalLight.shadow.mapSize.height = 2048; // default
directionalLight.shadow.camera.near = 0.5; // default
directionalLight.shadow.camera.far = 500; // default
const d = 200;

directionalLight.shadow.camera.left = - d;
directionalLight.shadow.camera.right = d;
directionalLight.shadow.camera.top = d;
directionalLight.shadow.camera.bottom = - d;
scene.add(directionalLight);

// Add ambient light
const aLight = new THREE.AmbientLight(0x404040); // soft white light
aLight.intensity = 60;
scene.add(aLight);

// Add point light (light that follows the mouse)
const pLight1 = new THREE.PointLight(0x7265ff, 1);
pLight1.position.set(0, 0, 0);
pLight1.castShadow = true;
pLight1.intensity = 2;
scene.add(pLight1);

pLight1.shadow.mapSize.width = 2048; // default
pLight1.shadow.mapSize.height = 2048; // default
pLight1.shadow.camera.near = 0.5; // default
pLight1.shadow.camera.far = 500; // default

// Add background
//var textureLoader = new THREE.TextureLoader();
// var material = new THREE.MeshLambertMaterial({
//     map: textureLoader.load("https://i.imgur.com/FRrM5Ki.jpg")
// });
const material = new THREE.MeshBasicMaterial( { color: 0x1b1e3c } );
var geometry = new THREE.PlaneGeometry(10, 10 * .75);
var mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 0, -1)
scene.add(mesh);

// Variables needed for AMMO.js
let rigidBodies = [], physicsTrans;
let AMMO;

const loader = new GLTFLoader();
//var controls = new FocalControls.FocalControls(camera, scene);

//Asynchonously load Ammo library
Ammo().then(function (Ammo) {

    physicsTrans = new Ammo.btTransform();

    AMMO = Ammo;
    var progressScreen = document.getElementById("loading");
    progressScreen.style.visibility = "hidden"; 

    //Once AMMO.js library is done loading, set up physics world and then begin the animation loop
    setupPhysicsWorld();
    animate();

    // Only add event listener after setting up the world to prevent errors
    window.addEventListener('pointermove', onPointerMove);
});
let x = 1;

let physicsWorld;
function setupPhysicsWorld() {

    let collisionConfiguration = new AMMO.btDefaultCollisionConfiguration();
    let dispatcher = new AMMO.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache = new AMMO.btDbvtBroadphase(),
        solver = new AMMO.btSequentialImpulseConstraintSolver();

    physicsWorld = new AMMO.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new AMMO.btVector3(0, 0, 0));

    // model path for the homie head
    let path = 'Models/HomieHead20.glb'

    addHomieHead(path);
}

// Number of homie heads to spawn
let numHomies = 12;

// create custom meshes with custom physics collision bodies
function addHomieHead(model) {
    // if there are no more homie heads to spawn, then return, thus exiting the loop
    if (numHomies == 0) {
        return;
    }
    loader.load(model, function (gltf) {

        let customMesh = gltf.scene.children[0];
        let quat = { x: 0, y: 0, z: 0, w: 1 };
        let mass = 1;

        // Randomise the position
        let x = Math.floor(Math.random() * 4 - 2);
        let y = Math.floor(Math.random() * 4 - 2);
        let z = 0;
   
        // Set up the THREE.js rendering model
        customMesh.position.set(x, y, z);
        customMesh.castShadow = true;
        customMesh.receiveShadow = true;
        //customMesh.material = new THREE.MeshLambertMaterial({ color: 'white', transparent:false });

        let meshColor = new THREE.Color(0x8a8a8a);
        if (numHomies % 3 == 0) meshColor = new THREE.Color(0x0a0078);
        else if (numHomies % 3 == 1) meshColor = new THREE.Color(0x0e0e0e);

        let meshRough = 0;
        if (numHomies % 2 == 0) meshRough = 1;

        customMesh.material = new THREE.MeshStandardMaterial({ color: meshColor, transparent:false, roughness: meshRough, metalness: 0.3 });
        customMesh.material.depthWrite = true;
        customMesh.material.depthTest = true;
        customMesh.material.transparent = false;
        customMesh.material.opacity = 1;

        scene.add(customMesh);
        HomieHeads.push(customMesh);

        // Set up the AMMO.js collision
        let transform = new AMMO.btTransform();
        transform.setIdentity();
        transform.setOrigin(new AMMO.btVector3(x, y, z));
        transform.setRotation(new AMMO.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let headMotionState = new AMMO.btDefaultMotionState(transform);

        let localInertia = new AMMO.btVector3(0, 0, 0);

        let verticesPos = customMesh.geometry.getAttribute('position').array;
        let triangles = [];
        for (let i = 0; i < verticesPos.length; i += 3) {
            triangles.push({
                // Need to divide by 20 as the collision is scaled up compared to the model for some reason
                x: verticesPos[i] / 20,
                y: verticesPos[i + 1] / 20,
                z: verticesPos[i + 2] / 20,
            })
        }

        let triangle;
        let triangle_mesh = new AMMO.btTriangleMesh();
        let vecA = new AMMO.btVector3(0, 0, 0);
        let vecB = new AMMO.btVector3(0, 0, 0);
        let vecC = new AMMO.btVector3(0, 0, 0);

        for (let i = 0; i < triangles.length - 3; i += 3) {

            vecA.setX(triangles[i].x);
            vecA.setY(triangles[i].y);
            vecA.setZ(triangles[i].z);

            vecB.setX(triangles[i + 1].x);
            vecB.setY(triangles[i + 1].y);
            vecB.setZ(triangles[i + 1].z);

            vecC.setX(triangles[i + 2].x);
            vecC.setY(triangles[i + 2].y);
            vecC.setZ(triangles[i + 2].z);

            triangle_mesh.addTriangle(vecA, vecB, vecC, true);
        }

        AMMO.destroy(vecA);
        AMMO.destroy(vecB);
        AMMO.destroy(vecC);

        const shape = new AMMO.btConvexTriangleMeshShape(triangle_mesh, true);
        customMesh.geometry.verticesNeedUpdate = true;
        shape.getMargin(0.05);

        shape.calculateLocalInertia(mass, localInertia);

        let rbInfo = new AMMO.btRigidBodyConstructionInfo(mass, headMotionState, shape, localInertia);
        let body = new AMMO.btRigidBody(rbInfo);
        var DISABLE_DEACTIVATION = 4;

        body.setActivationState(DISABLE_DEACTIVATION);

        physicsWorld.addRigidBody(body);
        customMesh.userData.physicsBody = body;
        rigidBodies.push(customMesh);
        numHomies--;

        // Call function again to create loop
        addHomieHead(model)

    }, null, function (error) {

        console.error(error);
    });
   
}

function updatePhysics(deltaTime) {

    for (let i = 0; i < rigidBodies.length; i++) {
        let pb = rigidBodies[i].userData.physicsBody;
        let currentPosition = rigidBodies[i].position;
        let diff = new THREE.Vector3();

        // Set gravity direction to the middle of the world, at (0,0,0)
        diff.subVectors(new THREE.Vector3(0, 0, 0), currentPosition);
        let dist = diff.length();
        let diff2d = new THREE.Vector3();
        diff2d.copy(diff);
        diff2d.z = 0;
        diff.normalize();

        // Gravitational force
        diff.multiplyScalar(5);
        let dir = new AMMO.btVector3();

        pb.applyForce(new AMMO.btVector3(diff.x, diff.y, diff.z));

        // Drag force
        let force = 5;
        let vec = new AMMO.btVector3();

        vec.setX(pb.getLinearVelocity().x());
        vec.setY(pb.getLinearVelocity().y());
        vec.setZ(pb.getLinearVelocity().z());

        vec.setX(vec.x() * -force);
        vec.setY(vec.y() * -force);
        vec.setZ(vec.z() * -force);
        pb.applyForce(vec);

    }

    physicsWorld.stepSimulation(deltaTime, 10);

    // Update rigid bodies
    for (let i = 0; i < rigidBodies.length; i++) {
        let objThree = rigidBodies[i];
        let objAmmo = objThree.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if (ms) {

            ms.getWorldTransform(physicsTrans);
            let p = physicsTrans.getOrigin();
            let q = physicsTrans.getRotation();
            objThree.position.set(p.x(), p.y(), p.z());
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

        }
    }
}

// Main loop
function animate() {
    let deltaTime = clock.getDelta();
    //controls.Update(clock.getDelta());
    orbit.update();
    if (RunPhysics) //only update the physics if being used
    {
        updatePhysics(deltaTime);

    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Make the homie heads disperse from the centre on click
window.onclick = onClick;
var limit = 1;
function onClick(event) {
    // Calculate mouse position in normalized device coordinates
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Create a raycaster
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Perform the raycast against the scene
    var intersects = raycaster.intersectObjects(scene.children, true);

    // Check if there's any intersection
    if (intersects.length > limit) {
        if (limit < 2)
        {
            // The first object in the intersects array is the closest one
            var clickedObject = intersects[0].object;

            // var mainCanvas = document.getElementById("viewport");
            // mainCanvas.style.display = "none";

            HomieHeads.forEach(element => {
                scene.remove(element);
            });


            limit++;

            //Create Sphere
            const sphereGeometry = new THREE.SphereGeometry(4);
            const sphereMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide});
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.castShadow = true;
            scene.add(sphere);
            sphere.scale.x = -10;
            sphere.scale.y = 10;
            sphere.scale.z = 10;
            orbit.enableZoom = false;
            orbit.enableRotate = true;
            RunPhysics = false;

            // Perform additional action based on the clicked object
            // For example, you can log the name of the clicked object
            console.log("Clicked on:", clickedObject.name);
            // Or you can trigger a specific function based on the clicked object
            // triggerObjectAction(clickedObject);
        }
        
    } else {
        // If no object was clicked, apply forces to all rigid bodies as before
        for (let i = 0; i < rigidBodies.length; i++) {
            let pb = rigidBodies[i].userData.physicsBody;
            let currentPosition = rigidBodies[i].position;

            let diff = new THREE.Vector3();
            diff.subVectors(currentPosition, new THREE.Vector3());
           
            diff.normalize();
            diff.multiplyScalar(500);
           
            pb.applyForce(new AMMO.btVector3(diff.x, diff.y, 0));
        }
    }
}


// Push the homie heads away from the mouse
function onPointerMove(event) {

    let pointer = new THREE.Vector3();
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // var vector = new THREE.Vector3(pointer.x, pointer.y, 0.99995).unproject(camera);
    var vector = new THREE.Vector3(pointer.x, pointer.y, 0.99995).unproject(camera);
    var lightvector = new THREE.Vector3(pointer.x, pointer.y, 0.5).unproject(camera);
    
    let transform = new AMMO.btTransform();
    vector.z = 1;

    pLight1.position.copy(lightvector);

    for (let i = 0; i < rigidBodies.length; i++) {
        let pb = rigidBodies[i].userData.physicsBody;
        let currentPosition = rigidBodies[i].position;

        let diff = new THREE.Vector3();
        diff.subVectors(currentPosition, vector);
        diff.z = 0;
        let dist = diff.length();
        diff.normalize();
        diff.multiplyScalar(25);
        if (dist < 0.5) {
            pb.applyForce(new AMMO.btVector3(diff.x, diff.y, 0));
        }
    }
  
}


let lastScrollPos = 0;
let isTouchDevice = false;

// Check if the device supports touch events
if ('ontouchstart' in window || navigator.maxTouchPoints) {
    isTouchDevice = true;
}

// Add event listeners based on device type
if (isTouchDevice) {
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
} else {
    document.addEventListener('wheel', handleWheel, { passive: false });
}

function handleWheel(event) {
    // Determine the direction of scroll
    const scrollDirection = event.deltaY > 0 ? 'down' : 'up';

    // Update the last scroll position
    lastScrollPos += event.deltaY;

    updateVideoPlayback(scrollDirection);
}

function handleTouchMove(event) {
    // Get the touch position
    const touchY = event.touches[0].clientY;

    // Determine the direction of touch move
    const touchDirection = touchY > lastScrollPos ? 'up' : 'down';

    // Update the last touch position
    lastScrollPos = touchY;

    updateVideoPlayback(touchDirection);
}

function updateVideoPlayback(direction) {
    // Adjust the video playback based on the scroll direction
    if (direction === 'down') {
        video.currentTime += 0.5; // Forward playback
        if (video.currentTime == 58.653583)
        {
            console.log('End of video reached!');
            canvas.style.display = 'none';
            canvas.style.pointerEvents = "none";
            // canvas.parentElement.style.pointerEvents = "none";
            document.getElementById("buttons").style.display = "none";
        }
    } else if (direction === 'up') {
        video.currentTime -= 0.5; // Backward playback
    }
}

document.addEventListener('contextmenu', function(event) {
    // Prevent the default right-click context menu
    event.preventDefault();
    
    // Log a message to the console indicating that the user right-clicked
    console.log('Right-click detected!');
    console.log('End of video reached!');
    canvas.style.display = 'none';
    canvas.style.pointerEvents = "none";
    canvas.parentElement.style.pointerEvents = "none";
});