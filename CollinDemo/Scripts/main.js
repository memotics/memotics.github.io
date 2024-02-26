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
import { SpaceMan } from '/Scripts/SpaceMan.js';

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

// Spaceman


// Initialise the scene, camera, etc
const scene = new THREE.Scene();
//scene.fog = new THREE.Fog(0xcccccc, 20, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 9999);
camera.position.set(0, 0, 100);
const loader = new GLTFLoader();

let mixer;

loader.load("Models/TestAnimation.glb", function (mesh) {
	// Create an AnimationMixer, and get the list of AnimationClip instances
	mixer = new THREE.AnimationMixer(mesh.scene);
	const clips = mesh.animations;
	scene.add(mesh.scene);
	mesh.scene.scale.set(100, 100, 100);
	// Play a specific animation
	const clip = THREE.AnimationClip.findByName(clips, 'mercury.001.Animation');
	const action = mixer.clipAction(clip);
	//action.play();

	//mesh.position.set(0, 10, 0);

	//Play all animations
	clips.forEach(function (clip) {
		mixer.clipAction(clip).play();
	});

	mesh.scene.traverse(function (object) {
		if (object.isMesh) {
			object.material.emissiveIntensity = 0;
		}
	})
}, onProgress, function (error) {

	console.error(error);

});

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
//const helper2 = new THREE.CameraHelper(directionalLight.shadow.camera);
//scene.add(helper2);

const aLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(aLight);

// Clock for delta time
const clock = new Clock(true);
clock.i;

// Post Processing
THREE.ColorManagement.legacyMode = false

const target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
	type: THREE.HalfFloatType,
	format: THREE.RGBAFormat,
	encoding: THREE.sRGBEncoding,
})
target.samples = 8
const composer = new EffectComposer(renderer, target)
composer.addPass(new RenderPass(scene, camera))
composer.addPass(new ShaderPass(GammaCorrectionShader))
composer.addPass(new UnrealBloomPass(undefined, 1, 1, 1)) 

// Particle Effects
import json from "/ParticleEffects/my-particle-system.json"  assert { type: "json" };
const particleSystem = new System();
const emitter = new Emitter();
const spriteRenderer = new SpriteRenderer(scene, THREE);


System.fromJSONAsync(json, THREE).then(loaded => {

	loaded.emitters.forEach(emitter => {
		particleSystem.addEmitter(emitter);
		console.log(emitter.scale);
	})

	const nebulaRenderer = new SpriteRenderer(scene, THREE);
	//const nebula = loaded.addRenderer(nebulaRenderer);

	particleSystem.addRenderer(nebulaRenderer);
}); 

// Load map
var MapModelList = [
	'Models/HomePageRoom_V1.glb',
	'Models/AsteraGlow.glb',
]
	
var LoadMap = 1;

// Declare the controls variable, but determine which type of control class later
var controls;
let spaceMan;
let worldButtonManager;
const sbLoader = new THREE.CubeTextureLoader();

loader.load(MapModelList[LoadMap], function (gltf) {

	// Loop through every mesh in the loaded scne
	gltf.scene.traverse(function (object) {
		//Turn on shadows
		object.castShadow = true;
		object.receiveShadow = true;

		//Turn on glow for the glowing orbs
		if (object.isMesh) {
			if (object.userData.glow) {
				object.material = new THREE.MeshStandardMaterial({
					toneMapped: false,
					emissive: "white",
					emissiveIntensity: 1.8,
					fog: false
				});
			}
		}
	})

	scene.add(gltf.scene);

	switch (LoadMap) {
		case 0: //Collin's Pad
			console.log("Loading Collin's Pad");
			controls = new FocalControls.FocalControls(camera, scene);

			worldButtonManager = new WB.WorldButtonManager(camera, renderer, controls)
			worldButtonManager.AddButton(new THREE.Vector3(36.75, 30, 26), new THREE.Vector3(36.75, 30, 42), "collinSidebar", "Collin's Pad");
			worldButtonManager.AddButton(new THREE.Vector3(107.237, 35.341, 43.701), new THREE.Vector3(97.237, 35.341, 43.701), "testSideBar", "Test1");
			worldButtonManager.AddButton(new THREE.Vector3(-93, 38, -92), new THREE.Vector3(-93, 38, -82), "testSideBar2", "Test2");

			const pLight1 = new THREE.PointLight(0xFFA500, 7500);
			pLight1.position.set(-85, 60, 0);
			pLight1.castShadow = true;
			scene.add(pLight1);

			pLight1.shadow.mapSize.width = 2048; // default
			pLight1.shadow.mapSize.height = 2048; // default
			pLight1.shadow.camera.near = 0.5; // default
			pLight1.shadow.camera.far = 500; // default

			const pLight2 = new THREE.PointLight(0xFFA500, 7500);
			pLight2.position.set(-85, 60, -60);
			pLight2.castShadow = true;
			scene.add(pLight2);

			pLight2.shadow.mapSize.width = 2048; // default
			pLight2.shadow.mapSize.height = 2048; // default
			pLight2.shadow.camera.near = 0.5; // default
			pLight2.shadow.camera.far = 500; // default

			break;

		case 1: //Astera
			console.log("Loading Astera");
			//controls = new FocalControls.FocalControls(camera, scene);
			worldButtonManager = new WB.WorldButtonManager(camera, renderer, controls)

			worldButtonManager.AddButton(new THREE.Vector3(36.75, 30, 26), new THREE.Vector3(36.75, 30, 42), "collinSidebar", "Collin's Pad");
			worldButtonManager.AddButton(new THREE.Vector3(107.237, 35.341, 43.701), new THREE.Vector3(97.237, 35.341, 43.701), "testSideBar", "Test1");
			worldButtonManager.AddButton(new THREE.Vector3(-93, 38, -92), new THREE.Vector3(-93, 38, -82), "testSideBar2", "Test2");
			
			controls = new LinearControls.LinearControls(camera, scene, new THREE.Vector3(-40.150, 44, -49.510), new THREE.Vector3(1, 0, 0));

			const waterGeometry = new THREE.PlaneGeometry(2048, 2048);

			const water = new Water.Water(waterGeometry, {
				color: '#ffffff',
				scale: 4,
				flowDirection: new THREE.Vector2(0.3, 0.3),
				textureWidth: 2048,
				textureHeight: 2048
			});

			water.position.y = 39;
			water.rotation.x = Math.PI * - 0.5;
			scene.add(water);

			// SpaceMan
			spaceMan = new SpaceMan(camera, scene, controls);
			break;
		case 2: //Physics test
			camera.position.set(0, 0, 10);
			
			break;
	}

	// Skybox
	sbLoader.setPath('/Public/skybox/sea/');
	const textureCube = sbLoader.load([
		'ft.jpg', 'bk.jpg',
		'up.jpg', 'dn.jpg',
		'rt.jpg', 'lf.jpg',

	]);

	scene.background = textureCube;

	progressScreen.style.visibility = "hidden";

	// Once loading is done, begin the main loop
	main();

}, onProgress, function (error) {

	console.error(error);

});

var progressScreen = document.getElementById("loading");
var progressText = document.getElementById("loadingText");
function onProgress(progress) {
	//console.log(progress.loaded / progress.total);
	progressText.textContent = "Progress: " + (progress.loaded / progress.total) * 100 + "%";
}	

// Raycast debugging tools
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const red = [];

function main() {
	update();
	render();
	requestAnimationFrame(main);
}

function render() {
	//renderer.render();
	composer.render();
}

function update() {

	let dt = clock.getDelta();
	particleSystem.update();
	controls.Update(dt);
	worldButtonManager.Update();
	mixer.update(dt * 120);
	spaceMan.Update(dt);
	// Raycast debugging tools
	//raycaster.setFromCamera(pointer, camera);
	//const intersects = raycaster.intersectObjects(scene.children);
	//for (let i = red.length - 1; i > -1 ; i--) {
	//	red[i].material.color.set(0xffffff);
	//}
	//red.length = 0
	//for (let i = 0; i < intersects.length; i++) {

	//	intersects[i].object.material.color.set(0xff0000);
	//	red.push(intersects[i].object);
	//	console.log(intersects[i].object.position);
	//	break;
	//}	
}

// Keeps track of the mouse position
function onPointerMove(event) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
	pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

}
window.addEventListener('pointermove', onPointerMove);

// This resizes the viewport whenever the browser window is resized
function onWindowResize(event) {

	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
}
window.addEventListener('resize', onWindowResize);

//Old interaction code
//window.onclick = onClick;
//function onClick() {
//	return;
//	if (red.length > 0) {

//		return;
//		switch (red[0].name) {
//			case "Monitor004_Monitor&Mouse_0001":
//				window.open("https://collinseow.com");

//				break;
//			case "Monitor004_Monitor&Mouse_0002":
//				var sideBar = document.getElementById('collinSidebar');
//				if (sideBar.classList.contains('sidebarOpen')) {
//					sideBar.style.transform = "translate(100%)";
//					sideBar.classList.remove('sidebarOpen');
//				}
//				else {
//					sideBar.style.transform = "translate(0%)";
//					sideBar.classList.add('sidebarOpen');
//				}
//				//document.getElementById('collinSidebar').classList.remove("animationClassIdle");

//				//document.getElementById('collinSidebar').classList.add("animationClassSlideIn");
//				var pos = new THREE.Vector3();
//				/*controls.target = red[0].getWorldPosition(pos);*/
//				controls.autoRotate = false;

//				controls.startFocus(controls.target, red[0].getWorldPosition(pos), 2);

//				break;
//			case "Surveillance_Camera_Camera_0":
//			case "Chair001_Chair_0":		
//			case "ChineseSoldier_low_ChineseSoldier_0":
//				var pos = new THREE.Vector3();	
//				controls.target = red[0].getWorldPosition(pos);
//				controls.autoRotate = false;

//				controls.startFocus(controls.target, red[0].getWorldPosition(pos), 2);
//				break;
//		}
//	}
//}

window.addEventListener('keydown', function (e) {
	if (e.key == "Escape") {
		try {
			controls.relenquishFocus();
			worldButtonManager.CloseSideBar();
		}
		catch { };
	}
}, false);
