import * as THREE from '/node_modules/three';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { Clock } from '/node_modules/three/src/core/Clock.js';
import * as Water from '/node_modules/three/examples/jsm/objects/Water2.js';
import Jolt from '/node_modules/jolt-physics/asm';

// Custom Scripts
import * as WB from '/Scripts/WorldButton.js';
import * as FocalControls from '/Scripts/FocalControls.js';
import * as LinearControls from '/Scripts/LinearControls.js';

// Post Processing
import { EffectComposer } from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '/node_modules/three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GammaCorrectionShader } from '/node_modules/three/examples/jsm/shaders/GammaCorrectionShader.js';

// Particle System
const { Nebula, System, Emitter,
	Rate,
	Span,
	Position,	
	Mass,
	Radius,
	Life,
	RadialVelocity,
	PointZone,
	Vector3D,
	Alpha,
	Scale,
	Color, SpriteRenderer } = window.Nebula;


// Initialise the scene, camera, etc
const scene = new THREE.Scene();
// We use an invisible cube to handle rotating the camera
//scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)));
//scene.fog = new THREE.Fog(0xcccccc, 20, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 9999);
camera.position.set(0, 0, 10);
const loader = new GLTFLoader();

let mixer;

// Initialise renderer
const renderer = new THREE.WebGLRenderer({
	powerPreference: "high-performance",
	antialias: false,
	stencil: false,
	depth: false
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.zIndex = "-1";

renderer.domElement.style.display = "relative";
renderer.domElement.id = "viewport";
document.getElementById("body").insertBefore(renderer.domElement, document.getElementById("body").firstChild);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

var controls = new FocalControls.FocalControls(camera, scene);



loader.load("Models/Homie_Astronaut_Animation_V2.glb", function (mesh) {
	// Create an AnimationMixer, and get the list of AnimationClip instances
	mixer = new THREE.AnimationMixer(mesh.scene);
	const clips = mesh.animations;
	scene.add(mesh.scene);
	mesh.scene.scale.set(10, 10, 10);
	// Play a specific animation
	//const clip = THREE.AnimationClip.findByName(clips, 'Armature');
	//const action = mixer.clipAction(clip);
	//action.play();

	mesh.scene.position.set(0, 0, 0);

	//Play all animations
	clips.forEach(function (clip) {
		mixer.clipAction(clip).play();
	});
	const sbLoader = new THREE.CubeTextureLoader();

	// Skybox
	sbLoader.setPath('/Public/skybox/sea/');
	const textureCube = sbLoader.load([
		'ft.jpg', 'bk.jpg',
		'up.jpg', 'dn.jpg',
		'rt.jpg', 'lf.jpg',

	]);

	scene.background = textureCube;
	main();

}, function () { }, function (error) {

	console.error(error);

});

// Add light
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
directionalLight.target.position.set(-100, 50, 0);
scene.add(directionalLight.target);
directionalLight.position.set(-150, 100, 0);
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

const aLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(aLight);

// Clock for delta time
const clock = new Clock(true);
clock.i;

// Declare the controls variable, but determine which type of control class later
var controls;
let worldButtonManager;

var progressScreen = document.getElementById("loading");
var progressText = document.getElementById("loadingText");
progressScreen.style.visibility = "hidden";


function main() {
	update();
	render();
	requestAnimationFrame(main);
}

function render() {
	renderer.render(scene, camera);
	//composer.render();
}

function update() {
	//mixer.update(clock.getDelta() * 120);
	controls.Update(clock.getDelta());
}

// This resizes the viewport whenever the browser window is resized
function onWindowResize(event) {

	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
}
window.addEventListener('resize', onWindowResize);