import * as THREE from '/node_modules/three';

class FocalControls {
	constructor(_cam, _scene, startRotation) {

		const camera = _cam;
		const scene = _scene;

		// We use an invisible cube to handle rotating the camera
		this.cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
		this.cube.visible = false;

		// Set the cube to rotation (0,0,0)
		var euler = new THREE.Euler(0, 0, 0, "XYZ");
		this.cube.setRotationFromEuler(euler);

		scene.add(this.cube);
		_cam.lookAt(this.cube.position);
		this.cube.lookAt(_cam.position);
		this.cube.add(camera);

		// Starting rotation
		//this.cube.lookAt(new THREE.Vector3(-180, 190, 145));

		// Damping
		this.enableDamping = true;
		this.dampingMousePos = new THREE.Vector3();
		this.dampingPrevMousePos = new THREE.Vector3();

		const mousePos = new THREE.Vector3();
		const mousePosPrev = new THREE.Vector3();

		// Set rotation to (0,0,0)
		camera.setRotationFromEuler(euler);

		// Variables for tracking inputs
		var click = false;
		var mouseDown = false;

		// Variables for tracking focus
		var focusElapsed = 0;
		var focusDuration = 0;

		var focusTarget = new THREE.Vector3();
		var focusStart = new THREE.Vector3();

		var focusCameraStart = new THREE.Vector3();
		var focusCameraPos = new THREE.Vector3();
		var focusEnd = true;

		var isFocused = false;
		var unfocusPos = new THREE.Vector3();

		// Store the current camera position as the unfocus position
		camera.getWorldPosition(unfocusPos);

		// End focus, reset camera to previous position
		this.relenquishFocus = function () {
			if (isFocused) {
				this.startFocus(new THREE.Vector3(0, 0, 0), unfocusPos, 1);
				isFocused = false;

			}

		}

		// Start focus
		this.startFocus = function (focusPosition, cameraPos, duration) {
			if (!isFocused) {
				var oldPos = new THREE.Vector3();
				camera.getWorldPosition(oldPos);
				unfocusPos.copy(oldPos);
			}

			focusTarget.copy(focusPosition);
			var pos = new THREE.Vector3();
			this.cube.getWorldPosition(pos);
			focusStart.copy(pos);

			focusDuration = duration;
			focusElapsed = 0;

			// Copy the current position of the camera into focusCameraStart
			var vec = new THREE.Vector3();
			camera.getWorldPosition(vec);
			focusCameraStart.copy(vec);

			// Unparent the camera from the cube as it is easier to interpolate this way
			this.cube.remove(camera);

			focusCameraPos.copy(cameraPos);

			focusEnd = false;
			isFocused = true;

		}

		this.Update = function (deltaTime) {

			focusElapsed += deltaTime;

			if (focusElapsed < focusDuration) {

				// Normalise elapsed to 1
				let progress = focusElapsed / focusDuration;

				let diff = new THREE.Vector3();
				diff.subVectors(focusTarget, focusStart);

				// Interpolate the cube
				let vec = new THREE.Vector3();
				vec.copy(focusStart);
				vec.addScaledVector(diff, progress);
				this.cube.position.copy(vec);

				// Interpolate the camera position
				vec.copy(focusCameraStart);
				diff.subVectors(focusCameraPos, focusCameraStart);
				vec.addScaledVector(diff, progress);
				camera.position.copy(vec);

				// Interpolate the camera rotation by making it look towards the cube
				let pos = new THREE.Vector3();
				this.cube.getWorldPosition(pos);
				camera.lookAt(pos);
			}
			else {

				if (!focusEnd) {

					var diff = new THREE.Vector3();
					diff.subVectors(camera.position, this.cube.position);
					this.cube.lookAt(focusCameraPos);

					this.cube.add(camera);
					camera.position.set(0, 0, diff.length());

					camera.lookAt(this.cube.position);
					focusEnd = true;

				}

				var diff = new THREE.Vector3();

				// Camera damping update
				if (this.enableDamping) {

					// Update the target position for every frame that the mouse button is held down
					if (mouseDown) {
						this.dampingMousePos.copy(mousePos);
					}
					// Snap the delayed mouse position to the current mouse position for the first frame that the mouse button is down
					if (click) {
						this.dampingPrevMousePos.copy(mousePos);
					}
					diff.subVectors(this.dampingPrevMousePos, this.dampingMousePos);
					let len = diff.length()

					// If the distance between the actual mouse position and the damping mouse position is larger than 1, 
					// then interpolate the dampinig mouse position towards the actual mouse position
					if (diff.length() > 1) {
						let diff2 = new THREE.Vector3();
						diff2.copy(diff);
						diff2.normalize();
						diff2.multiplyScalar(-len * 5 * deltaTime);

						this.dampingPrevMousePos.add(diff2);

					}
					// If the distance is less than 1, then simply snap the damping position to the actual position
					// This is to prevent the camera from jittering back and forth
					else {
						this.dampingPrevMousePos.copy(this.dampingMousePos);
					}

					// Use the movement of the delayed mouse position to rotate the camera accordingly
					var x = diff.y / 2500;
					var y = diff.x / 5000;

					var euler = new THREE.Euler(x, y, 0, "XYZ");

					var rot = new THREE.Vector3();
					rot.copy(this.cube.rotation);
					this.cube.rotateX(x);

					this.cube.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), y);

				}

				// Regular, non-damping update
				else {
					diff.subVectors(mousePosPrev, mousePos);

					var x = diff.y / 500;
					var y = diff.x / 500;
					var euler = new THREE.Euler(x, y, 0, "XYZ");

					if (mouseDown) {
						this.cube.rotateX(x);
						this.cube.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), y);

					}

					mousePosPrev.copy(mousePos);

				}

			}

			click = false;

		}

		window.addEventListener('mousemove', (event) => {
			mousePos.set(event.clientX, event.clientY, 0);

		});

		document.addEventListener("mousedown", (event) => {
			click = true;
			mouseDown = true;

		});

		document.addEventListener("mouseup", (event) => {
			click = false;
			mouseDown = false;

		});

		document.addEventListener("wheel", (event) => {
			camera.position.z += event.deltaY / 2;
		});

	}
}

export { FocalControls };

