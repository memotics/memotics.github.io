import * as THREE from '/node_modules/three'; 

//import { BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';
//import * as PP from "/node_modules/postprocessing/dist/index.js";
//import * as PP2 from "/node_modules/postprocessing/dist/types/index.d.ts";

import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { Clock } from '/node_modules/three/src/core/Clock.js';
import * as WB from '/public/WorldButton.js';
import * as FocalControls from '/public/FocalControls.js';
import * as LinearControls from '/public/LinearControls.js';
import * as Water from '/node_modules/three/examples/jsm/objects/Water2.js';

import { EffectComposer } from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '/node_modules/three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '/node_modules/three/examples/jsm/postprocessing/OutputPass.js';

//import Jolt from './node_modules/jolt-physics/asm';

// Initialise the scene, camera, etc
const loader = new GLTFLoader();
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 9999);
camera.position.set(0, 0, 100);

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

//const dLight = new THREE.DirectionalLight(0xFFFFFF, 1);
//dLight.position.set(-85, 60,0);
//dLight.castShadow = true;
//scene.add(dLight);
//const helper = new THREE.DirectionalLightHelper(dLight, 5);
//scene.add(helper);

const dLight4 = new THREE.DirectionalLight(0xFFFFFF, 1.5);
dLight4.target.position.set(-100, 50, 0);
scene.add(dLight4.target);
dLight4.position.set(-150, 100, 0);
dLight4.castShadow = true;
dLight4.shadow.mapSize.width = 2048; // default
dLight4.shadow.mapSize.height = 2048; // default
dLight4.shadow.camera.near = 0.5; // default
dLight4.shadow.camera.far = 500; // default
const d = 200;

dLight4.shadow.camera.left = - d;
dLight4.shadow.camera.right = d;
dLight4.shadow.camera.top = d;
dLight4.shadow.camera.bottom = - d;
scene.add(dLight4);
const helper2 = new THREE.CameraHelper(dLight4.shadow.camera);
scene.add(helper2);

const aLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(aLight);

// Built in Orbital Controls
//const controls = new OrbitControls(camera, renderer.domElement);
//controls.rollSpeed = 0;
//controls.autoRotate = false;
//controls.autoRotateSpeed = 0.1;
//controls.target = new THREE.Vector3(0, 0, 0);

// Raycast testing
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const red = [];

// Clock for delta time
const clock = new Clock(true);
clock.i

// Skybox
const sbLoader = new THREE.CubeTextureLoader();
sbLoader.setPath('/Public/skybox/sea/');
const textureCube = sbLoader.load([
	'ft.jpg', 'bk.jpg',
	'up.jpg', 'dn.jpg',
	'rt.jpg', 'lf.jpg',

]);

scene.background = textureCube;

// PP
const BLOOM_SCENE = 1;

const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE);

const params = {
	threshold: 0,
	strength: 50,
	radius: 50,
	exposure: 51
};

const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
const materials = {};

const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

const mixPass = new ShaderPass(
	new THREE.ShaderMaterial({
		uniforms: {
			baseTexture: { value: null },
			bloomTexture: { value: bloomComposer.renderTarget2.texture }
		},
		vertexShader: document.getElementById('vertexshader').textContent,
		fragmentShader: document.getElementById('fragmentshader').textContent,
		defines: {}
	}), 'baseTexture'
);
mixPass.needsSwap = true;

const outputPass = new OutputPass();

const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(renderScene);
finalComposer.addPass(mixPass);
finalComposer.addPass(outputPass);

function onPointerMove(event) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
	pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

}
window.addEventListener('pointermove', onPointerMove);


var MapModelList = [
	'HomePageRoom_V1.glb',
	'glowTest.glb',
	'AsteraNewNewOptimised2.glb',

	'AsteraNewNew.glb',
]
	
var LoadMap = 1;

var progressScreen = document.getElementById("loading");
var progressText = document.getElementById("loadingText");

function onProgress(progress) {
	//console.log(progress.loaded / progress.total);
	progressText.textContent = "Progress: " + (progress.loaded / progress.total) * 100 + "%";
}

var controls;
const worldButtonManager = new WB.WorldButtonManager(camera, renderer, controls);

loader.load(MapModelList[LoadMap], function (gltf) {

	gltf.scene.traverse(function (object) {
		object.castShadow = true;
		object.receiveShadow = true;
		if (object.isMesh) {
			object.layers.toggle(BLOOM_SCENE);

			if (object.userData.glow) {
				object.layers.toggle(BLOOM_SCENE);
				//object.material = new THREE.MeshBasicMaterial("0x404040");
				console.log("meow");
			}
		}
	})

	gltf.scene.scale.set(1, 1, 1);
	scene.add(gltf.scene);

	

	switch (LoadMap) {
		case 0: //Collin's Pad
			console.log("Loading Collin's Pad");
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

			controls = new FocalControls.FocalControls(camera, scene);
			break;

		case 1: //Astera
			console.log("Loading Astera");
			controls = new FocalControls.FocalControls(camera, scene);
			worldButtonManager.AddButton(new THREE.Vector3(36.75, 30, 26), new THREE.Vector3(36.75, 30, 42), "collinSidebar", "Collin's Pad");
			worldButtonManager.AddButton(new THREE.Vector3(107.237, 35.341, 43.701), new THREE.Vector3(97.237, 35.341, 43.701), "testSideBar", "Test1");
			worldButtonManager.AddButton(new THREE.Vector3(-93, 38, -92), new THREE.Vector3(-93, 38, -82), "testSideBar2", "Test2");

			//controls = new LinearControls.LinearControls(camera, scene, new THREE.Vector3(-40.150, 44, -49.510), new THREE.Vector3(1, 0, 0));

			//const waterGeometry = new THREE.PlaneGeometry(2048, 2048);

			//const water = new Water.Water(waterGeometry, {
			//	color: '#ffffff',
			//	scale: 4,
			//	flowDirection: new THREE.Vector2(1, 1),
			//	textureWidth: 1024,
			//	textureHeight: 1024
			//});

			//water.position.y = 39;
			//water.rotation.x = Math.PI * - 0.5;
			//scene.add(water);

			break;
	}



	progressScreen.style.visibility = "hidden";
	main();

}, onProgress, function (error) {

	console.error(error);

});

function main() {

	update();
	render();
	requestAnimationFrame(main);
}

function render() {
	//renderer.render();
	scene.traverse(darkenNonBloomed);
	bloomComposer.render();
	scene.traverse(restoreMaterial);

	finalComposer.render();
}

function darkenNonBloomed(obj) {

	if (obj.isMesh && bloomLayer.test(obj.layers) === false) {

		materials[obj.uuid] = obj.material;
		obj.material = darkMaterial;

	}

}

function restoreMaterial(obj) {

	if (materials[obj.uuid]) {

		obj.material = materials[obj.uuid];
		delete materials[obj.uuid];

	}

}
function update() {
	controls.Update(clock.getDelta());
	worldButtonManager.Update();

	//cube.rotation.x += 0.01;
	//cube.rotation.y += 0.01;

	raycaster.setFromCamera(pointer, camera);

	const intersects = raycaster.intersectObjects(scene.children);

	for (let i = red.length - 1; i > -1 ; i--) {
		red[i].material.color.set(0xffffff);
	}
	red.length = 0


	//for (let i = 0; i < intersects.length; i++) {

	//	intersects[i].object.material.color.set(0xff0000);
	//	intersects[i].object.castShadow = true;
	//	red.push(intersects[i].object);
	//	console.log(intersects[i].object.position);
	//	break;
	//}	
}

function onWindowResize(event) {

	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
}
window.addEventListener('resize', onWindowResize);

window.onclick = myFunction;

function myFunction() {
	return;
	if (red.length > 0) {

		return;
		switch (red[0].name) {
			case "Monitor004_Monitor&Mouse_0001":
				window.open("https://collinseow.com");

				break;
			case "Monitor004_Monitor&Mouse_0002":
				var sideBar = document.getElementById('collinSidebar');
				if (sideBar.classList.contains('sidebarOpen')) {
					sideBar.style.transform = "translate(100%)";
					sideBar.classList.remove('sidebarOpen');
				}
				else {
					sideBar.style.transform = "translate(0%)";
					sideBar.classList.add('sidebarOpen');
				}
				//document.getElementById('collinSidebar').classList.remove("animationClassIdle");

				//document.getElementById('collinSidebar').classList.add("animationClassSlideIn");
				var pos = new THREE.Vector3();
				/*controls.target = red[0].getWorldPosition(pos);*/
				controls.autoRotate = false;

				controls.startFocus(controls.target, red[0].getWorldPosition(pos), 2);

				break;
			case "Surveillance_Camera_Camera_0":
			case "Chair001_Chair_0":
			case "ChineseSoldier_low_ChineseSoldier_0":
				var pos = new THREE.Vector3();
				controls.target = red[0].getWorldPosition(pos);
				controls.autoRotate = false;

				controls.startFocus(controls.target, red[0].getWorldPosition(pos), 2);
				break;
		}
	}
}

//document.getElementById("PlayButtonCollin").addEventListener("click", PlayButton, false);
var myLink = document.getElementById('PlayButtonCollin');

myLink.onclick = function () {
	location.href = "build/index.html";
}

window.addEventListener('keydown', function (e) {
	if (e.key == "Escape") {
		controls.relenquishFocus();
		worldButtonManager.CloseSideBar();
	}
}, false);


//var a = document.getElementById('chinaButton');

//a.onclick = function () {
//	console.log("Meow");
//}



