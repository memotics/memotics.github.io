import * as THREE from '/node_modules/three'; 

class WorldButtonManager {
	constructor(cam, renderer, controls) {

		var buttonList = [];
		var camera = cam;

		// Calculate the screen coordinates of each world button
		this.Update = function () {
			for (var i = 0; i != buttonList.length; i++)
			{
				var width = window.innerWidth, height = window.innerHeight;
				var widthHalf = width / 2, heightHalf = height / 2;

				const pos = new THREE.Vector3();
				pos.copy(buttonList[i].vec3Position);
				pos.project(camera);
				
				pos.x = (pos.x * widthHalf) + widthHalf;
				pos.y = - (pos.y * heightHalf) + heightHalf;
				
				buttonList[i].button.style.top = `${pos.y - buttonList[i].button.offsetHeight /2}px`;
				buttonList[i].button.style.left = `${pos.x - buttonList[i].button.offsetWidth/2}px`;

			}
		}

		this.CloseSideBar = function () {
			var currentSideBar = document.getElementById(openButton.sideBarID);
			currentSideBar.classList.add('sidebarOpen');
			currentSideBar.classList.remove('sidebarClose');
			currentSideBar.style.transform = "translate(100%)";

			openButton = null;
		}

		var openButton;

		this.AddButton = function (vec3Pos, vec3CameraPos, sideBarID, buttonName) {
			
			var newButton = new WorldButton();
			buttonList.push(newButton);
			newButton.vec3Position = vec3Pos.clone();
			newButton.vec3CameraPosition = vec3CameraPos.clone();
			newButton.button = document.createElement("button");
			newButton.name = document.createElement("p");
			newButton.name.innerHTML = buttonName;

			newButton.name.classList.add("worldButtonText");
			newButton.name.style.visibility = "hidden";

			newButton.sideBarID = sideBarID;

			// Create the html button and add it to the document
			document.getElementById("buttonHolder").appendChild(newButton.button);
			var image = document.createElement("img");
			image.src = "Public/images/PlusSign.png";
			image.setAttribute('draggable', false);
			image.classList.add("worldButtonImage");

			newButton.button.appendChild(image);
			newButton.button.appendChild(newButton.name);
			newButton.button.classList.add("worldButton");
			newButton.button.onclick = function onClick() {

				if (openButton != newButton) {
					try {

						var currentSideBar = document.getElementById(openButton.sideBarID);
						currentSideBar.classList.add('sidebarOpen');
						currentSideBar.classList.remove('sidebarClose');
						currentSideBar.style.transform = "translate(100%)";

					}
					catch { };
				
					try {

						var prevSideBar = document.getElementById(newButton.sideBarID);
						prevSideBar.classList.remove('sidebarOpen');
						prevSideBar.classList.add('sidebarClose');
						prevSideBar.style.transform = "translate(0%)";

					}
					catch { };

					openButton = newButton;

					// Controls might not be focalControls, so try and catch
					try {
						controls.startFocus(newButton.vec3Position, newButton.vec3CameraPosition, 1);

					} catch { };

				}
			}

			newButton.button.onmouseover = function onHover() {
				newButton.name.style.visibility = "visible";
			}

			newButton.button.onmouseout = function onUnhover() {
				newButton.name.style.visibility = "hidden";
			}
		}
	}
}

export { WorldButtonManager };

class WorldButton {
    constructor() {
		var vec3Position = new THREE.Vector3();
		var vec3CameraPosition = new THREE.Vector3();

		var button;
		var sideBarID = "";
		var name = "";
    }
}

export { WorldButton };
