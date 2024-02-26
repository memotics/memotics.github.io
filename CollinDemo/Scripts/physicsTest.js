import Ammo from '/node_modules/Ammo.js-main/builds/Ammo.js';
import * as THREE from '/node_modules/three'; 
import { Clock } from '/node_modules/three/src/core/Clock.js';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import * as FocalControls from '/Scripts/FocalControls.js';
import { Vector3 } from 'three';


// Initialise the scene, camera, etc
const scene = new THREE.Scene();

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
    depth: false
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.zIndex = "-1";

renderer.domElement.style.display = "relative";
renderer.domElement.id = "viewport";
document.getElementById("body").insertBefore(renderer.domElement, document.getElementById("body").firstChild);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
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
aLight.intensity = 20;
scene.add(aLight);

// Add point light (light that follows the mouse)
const pLight1 = new THREE.PointLight(0xFFA500, 7500);
pLight1.position.set(0, 0, 0);
pLight1.castShadow = true;
pLight1.intensity = 2;
scene.add(pLight1);

pLight1.shadow.mapSize.width = 2048; // default
pLight1.shadow.mapSize.height = 2048; // default
pLight1.shadow.camera.near = 0.5; // default
pLight1.shadow.camera.far = 500; // default

// Add background
var textureLoader = new THREE.TextureLoader();
var material = new THREE.MeshLambertMaterial({
    map: textureLoader.load('https://s3.amazonaws.com/duhaime/blog/tsne-webgl/assets/cat.jpg')
});
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
let numHomies = 10;

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
        customMesh.material = new THREE.MeshLambertMaterial({ color: 'white', transparent:false });
        customMesh.material.depthWrite = true;
        customMesh.material.depthTest = true;
        customMesh.material.transparent = true;
        customMesh.material.opacity = 1;

        scene.add(customMesh);

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

    updatePhysics(deltaTime);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Make the homie heads disperse from the centre on click
window.onclick = onClick;
function onClick() {
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

// Push the homie heads away from the mouse
function onPointerMove(event) {

    let pointer = new THREE.Vector3();
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    var vector = new THREE.Vector3(pointer.x, pointer.y, 0.99995).unproject(camera);
    let transform = new AMMO.btTransform();
    vector.z = 1;

    pLight1.position.copy(vector);

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
