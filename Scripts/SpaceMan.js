import * as THREE from '/node_modules/three'; 
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import * as LinearControls from '/Scripts/LinearControls.js';

class SpaceMan {	
	constructor(_cam, _scene, linearControls) {
		const speed = 100;

		const camera = _cam;
		const scene = _scene;

		let isReady = false;
		const loader = new GLTFLoader();	
		let mesh;
		let rotateDirection = new THREE.Vector3(0, 10, 30);
		let mixer;
		loader.load(/*'Models/HomieHead20.glb'*/"Models/Homie_Astronaut_Animation_V3.glb", function (gltf) {
			mesh = gltf.scene.children[0];
			mesh.scale.set(0.25, 0.25, 0.25);
			mesh.rotation.set(90, 0, 90, "XYZ");

			gltf.scene.traverse(function (object) {
				//Turn on shadows
				object.castShadow = true;
				object.receiveShadow = true;

				if (object.isMesh) {
					object.material.emissiveIntensity = 0;
				}
			});
				

			mixer = new THREE.AnimationMixer(gltf.scene);
			const clips = gltf.animations;
			scene.add(gltf.scene);
		
			clips.forEach(function (clip) {
				mixer.clipAction(clip).play();
				console.log(clip.name);
			});
			let	tLoader = new THREE.TextureLoader().load("Public/skybox/sea/up.jpg", function (texture) {
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				texture.repeat.set(4, 4);
				texture.mapping = THREE.EquirectangularReflectionMapping;

				//mesh.material = new THREE.MeshStandardMaterial({
				//	color: 0x858585,
				//	metalness: 1,   // between 0 and 1
				//	roughness: 0, // between 0 and 1

				//	//shininess: 1,
				//	//specular: 100,
				//	envMap: texture
				//});

				isReady = true;
			});


		}, function () { }, function (error) {
			console.error(error);
		});

		var euler = new THREE.Euler(0, 0, 0, "XYZ");
		//this.mesh.setRotationFromEuler(euler);
		var distance = 0;
		this.Update = function (deltaTime) {
			if (!isReady)
				return;
			
			mixer.update(linearControls.GetVelocity().length() * deltaTime / 10);
		
			let rotation = new THREE.Euler();
			rotation.copy(mesh.rotation);
			let velocity;

			if (linearControls.GetDir())
				velocity = linearControls.GetVelocity().length() * deltaTime / 300;
			else
				velocity = -linearControls.GetVelocity().length() * deltaTime / 300;

			mesh.position.copy(linearControls.cube.position);
			mesh.position.setX(mesh.position.x + Math.sin(distance*5)/5 - 0.25);
			distance += velocity;
			rotation.set(rotation.x + rotateDirection.x * velocity, rotation.y + rotateDirection.y * velocity, rotation.z + rotateDirection.z * velocity, "XYZ");

			mesh.rotation.copy(rotation);	

		}

		document.addEventListener("wheel", (event) => {
		
		});

		window.addEventListener('mousemove', (event) => {
			
		});

		document.addEventListener("mousedown", (event) => {

		});

		document.addEventListener("mouseup", (event) => {

		});

		

	}
}

export { SpaceMan };

