import * as THREE from 'three'; 
import * as FocalControls from '/Scripts/FocalControls.js';

class LinearControls {	
	constructor(_cam, _scene, startPos,  direction) {
		const speed = 50;
		let dir = false;

		const camera = _cam;
		const scene = _scene;

		this.cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
		this.cube.visible = false;

		var euler = new THREE.Euler(0, 0, 0, "XYZ");
		this.cube.setRotationFromEuler(euler);
		this.cube.position.copy(startPos);
		scene.add(this.cube);

		this.enableDamping = true;
		this.dampingMousePos = new THREE.Vector3();
		this.dampingPrevMousePos = new THREE.Vector3();
	
		const mousePos = new THREE.Vector3();
		const mousePosPrev = new THREE.Vector3();
		let newPos = new THREE.Vector3();
	
		camera.position.set( 0, 0, 1);

		this.cube.add(camera);
		this.cube.lookAt(startPos.sub(direction));

		var startingCubeAngle = new THREE.Euler();
		startingCubeAngle.copy(this.cube.rotation);

		var click = false;
		var mouseDown = false;

		var velocity = new THREE.Vector3();
		var currentRotation = new THREE.Vector3();

		let distance = 0;

		let transition = false;
		let transitionElapsed = 0;
		let transitionDuration = 2;
		let transitionStartPos = new THREE.Vector3();
		let transitionEndPos = new THREE.Vector3(0, 100, 0	);

		let transitionStartRot = new THREE.Vector3();
		let transitionEndRot = new THREE.Vector3(- Math.PI *1.5, 1.5 * Math.PI, Math.PI * 1.5);

		let focalControls;

		this.Update = function (deltaTime) {

			if (transition) {	
				if (transitionElapsed < transitionDuration) {
					transitionElapsed += deltaTime;
					let normalised = transitionElapsed / transitionDuration;

					let rotDiff = new THREE.Vector3();
					rotDiff.subVectors(transitionStartRot, transitionEndRot);
					let newRot = transitionStartRot.clone();
					newRot.add(rotDiff.multiplyScalar(normalised));
					camera.rotation.set(0, newRot.y, 0, "XYZ");

					let posDiff = new THREE.Vector3();
					posDiff.subVectors(transitionEndPos, transitionStartPos);
					let newPos = transitionStartPos.clone();
					newPos.add(posDiff.multiplyScalar(normalised));

					camera.position.copy(newPos);
				}
				else {
					if (focalControls == null) {
						let focalPos = new THREE.Vector3(0, 0, -50);
						let distance = _cam.position.sub(focalPos).length();
						focalControls = new FocalControls.FocalControls(_cam, _scene);
						focalControls.cube.position.copy(focalPos);
						_cam.position.set(0, 0, distance);
						_cam.rotation.set(0, 0, 0, "XYZ");
					}
					focalControls.Update(deltaTime);

				}
			}
			else {
				// Camera movements
				this.cube.position.addScaledVector(velocity, deltaTime);

				if (this.GetDir())
					distance += velocity.length();
				else
					distance -= velocity.length();

				if (distance > 15000) {
					transition = true;

					let pos = camera.position.clone();
					pos.add(this.cube.position);
					transitionStartPos.copy(pos);
					transitionEndPos.add(this.cube.position);

					transitionStartRot.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);
					camera.removeFromParent();

				}

				

			}

			let dir = new THREE.Vector3();
			dir.copy(velocity);
			dir.normalize();
			dir.multiplyScalar(speed * deltaTime);
			// Dampen the velocity
			//if (velocity.length() < speed * deltaTime)
			//	velocity.set(0, 0, 0);
			//else
			//	velocity.copy(velocity.sub(dir));


			var mouseDiff = new THREE.Vector3();
			var widthHalf = window.innerWidth / 2, heightHalf = window.innerHeight / 2;

			mouseDiff.set(mousePos.x - widthHalf, mousePos.y - heightHalf, 0);
			
			var rotationDiff = new THREE.Vector3();
			rotationDiff.subVectors(mouseDiff, currentRotation);
			var rotationDiffLen = rotationDiff.length();
			rotationDiff.normalize();

			let step = 2.5 * deltaTime * rotationDiffLen;

			// If the new position overshoots the target position, 
			// then simply set the new position as the target position
			if (rotationDiffLen > step)
				currentRotation.addScaledVector(rotationDiff, step);
			else
				currentRotation.copy(mouseDiff);
			this.cube.setRotationFromEuler(startingCubeAngle);

			this.cube.rotateX(-currentRotation.y / 5000);
			this.cube.rotateY(-currentRotation.x / 5000);


		}

		this.GetVelocity = function()
		{
			return velocity;
		}

		this.GetDir = function () {
			return dir;
		}

		document.addEventListener("wheel", (event) => {
			let normalised = new THREE.Vector3();
			normalised.copy(velocity);
			normalised.normalize();
			velocity.set(0, 0, 0);
			velocity.addScaledVector(direction, event.deltaY/ 2);
			if (event.deltaY < 0)
				dir = false;
			else
				dir = true;

			if (velocity.length() > speed)
				velocity.copy(normalised.multiplyScalar(speed));
		
		});

		window.addEventListener('mousemove', (event) => {
			mousePos.set(event.clientX, event.clientY, 0);
			
		});

		document.addEventListener("mousedown", (event) => {
			click = true;
			mouseDown = true;

		});

		document.addEventListener("mouseup", (event) => {
			mouseDown = false;

		});

		

	}
}

export { LinearControls };

