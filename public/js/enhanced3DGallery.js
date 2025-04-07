// public/js/enhanced3DGallery.js
class Gallery3D {
    constructor(container, options = {}) {
      this.container = container;
      this.options = Object.assign({
        roomWidth: 20,
        roomHeight: 4,
        roomDepth: 20,
        wallColor: '#ffffff',
        floorColor: '#aaaaaa',
        backgroundColor: '#f0f0f0',
        lightIntensity: 0.8,
        enableShadows: true,
        enableFirstPerson: true,
        artworkSpacing: 1.5
      }, options);
      
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
      this.artworks = [];
      this.wallMeshes = [];
      this.originalCameraPosition = null;
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.isFirstPerson = false;
      this.moveForward = false;
      this.moveBackward = false;
      this.moveLeft = false;
      this.moveRight = false;
      this.velocity = new THREE.Vector3();
      this.direction = new THREE.Vector3();
      this.clock = new THREE.Clock();
      this.textureLoader = new THREE.TextureLoader();
      this.textureLoader.setCrossOrigin('anonymous');
      
      this.init();
    }
    
    init() {
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(this.options.backgroundColor);
      
      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        75,
        this.container.clientWidth / this.container.clientHeight,
        0.1,
        1000
      );
      this.camera.position.set(0, 1.6, 5);
      this.originalCameraPosition = this.camera.position.clone();
      
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      if (this.options.enableShadows) {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      this.container.appendChild(this.renderer.domElement);
      
      // Add orbit controls
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2; // Don't go below the floor
      
      // Add lights
      this.addLights();
      
      // Create room
      this.createRoom();
      
      // Add event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
    
    if (this.options.enableFirstPerson) {
      document.addEventListener('keydown', this.onKeyDown.bind(this));
      document.addEventListener('keyup', this.onKeyUp.bind(this));
    }
    
    // Start animation loop
    this.animate();
  }
  
  addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, this.options.lightIntensity);
    directionalLight.position.set(5, 10, 7.5);
    if (this.options.enableShadows) {
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      
      // Set shadow camera frustum
      const d = 20;
      directionalLight.shadow.camera.left = -d;
      directionalLight.shadow.camera.right = d;
      directionalLight.shadow.camera.top = d;
      directionalLight.shadow.camera.bottom = -d;
    }
    this.scene.add(directionalLight);
    
    // Add point lights at corners for better illumination
    const cornerPositions = [
      [this.options.roomWidth/2 - 2, this.options.roomHeight - 1, this.options.roomDepth/2 - 2],
      [-this.options.roomWidth/2 + 2, this.options.roomHeight - 1, this.options.roomDepth/2 - 2],
      [this.options.roomWidth/2 - 2, this.options.roomHeight - 1, -this.options.roomDepth/2 + 2],
      [-this.options.roomWidth/2 + 2, this.options.roomHeight - 1, -this.options.roomDepth/2 + 2]
    ];
    
    cornerPositions.forEach(position => {
      const cornerLight = new THREE.PointLight(0xffffff, 0.3, 0);
      cornerLight.position.set(position[0], position[1], position[2]);
      if (this.options.enableShadows) {
        cornerLight.castShadow = true;
        cornerLight.shadow.mapSize.width = 512;
        cornerLight.shadow.mapSize.height = 512;
      }
      this.scene.add(cornerLight);
    });
  }
  
  createRoom() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(this.options.roomWidth, this.options.roomDepth);
    const floorTexture = this.textureLoader.load('/img/floor-texture.jpg');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);
    
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      color: this.options.floorColor,
      roughness: 0.8
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = this.options.enableShadows;
    this.scene.add(floor);
    
    // Create walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: this.options.wallColor,
      roughness: 0.9
    });
    
    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.options.roomWidth, this.options.roomHeight),
      wallMaterial
    );
    backWall.position.set(0, this.options.roomHeight / 2, -this.options.roomDepth / 2);
    backWall.receiveShadow = this.options.enableShadows;
    this.scene.add(backWall);
    this.wallMeshes.push(backWall);
    
    // Front wall
    const frontWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.options.roomWidth, this.options.roomHeight),
      wallMaterial
    );
    frontWall.position.set(0, this.options.roomHeight / 2, this.options.roomDepth / 2);
    frontWall.rotation.y = Math.PI;
    frontWall.receiveShadow = this.options.enableShadows;
    this.scene.add(frontWall);
    this.wallMeshes.push(frontWall);
    
    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.options.roomDepth, this.options.roomHeight),
      wallMaterial
    );
    leftWall.position.set(-this.options.roomWidth / 2, this.options.roomHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = this.options.enableShadows;
    this.scene.add(leftWall);
    this.wallMeshes.push(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.options.roomDepth, this.options.roomHeight),
      wallMaterial
    );
    rightWall.position.set(this.options.roomWidth / 2, this.options.roomHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = this.options.enableShadows;
    this.scene.add(rightWall);
    this.wallMeshes.push(rightWall);
    
    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(this.options.roomWidth, this.options.roomDepth),
      wallMaterial
    );
    ceiling.position.set(0, this.options.roomHeight, 0);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.receiveShadow = this.options.enableShadows;
    this.scene.add(ceiling);
    
    // Add decorative elements
    this.addRoomDecorations();
  }
  
  addRoomDecorations() {
    // Add a central pedestal
    const pedestalGeometry = new THREE.BoxGeometry(2, 1, 2);
    const pedestalMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x888888,
      roughness: 0.7
    });
    const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
    pedestal.position.set(0, 0.5, 0);
    pedestal.castShadow = this.options.enableShadows;
    pedestal.receiveShadow = this.options.enableShadows;
    this.scene.add(pedestal);
    
    // Add a sculpture on the pedestal
    const sculptureGeometry = new THREE.TorusKnotGeometry(0.5, 0.2, 64, 8);
    const sculptureMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf5f5f5,
      metalness: 0.5,
      roughness: 0.2
    });
    const sculpture = new THREE.Mesh(sculptureGeometry, sculptureMaterial);
    sculpture.position.set(0, 1.5, 0);
    sculpture.castShadow = this.options.enableShadows;
    this.scene.add(sculpture);
    
    // Add a info plaque
    const plaqueGeometry = new THREE.PlaneGeometry(1, 0.5);
    const plaqueCanvas = document.createElement('canvas');
    plaqueCanvas.width = 256;
    plaqueCanvas.height = 128;
    const plaqueContext = plaqueCanvas.getContext('2d');
    plaqueContext.fillStyle = '#8B4513';
    plaqueContext.fillRect(0, 0, 256, 128);
    plaqueContext.strokeStyle = '#5C2E0D';
    plaqueContext.lineWidth = 10;
    plaqueContext.strokeRect(0, 0, 256, 128);
    plaqueContext.fillStyle = '#FFD700';
    plaqueContext.font = 'bold 24px Arial';
    plaqueContext.textAlign = 'center';
    plaqueContext.fillText('Gallery Center', 128, 50);
    plaqueContext.font = '18px Arial';
    plaqueContext.fillText('Featured Sculpture', 128, 80);
    
    const plaqueTexture = new THREE.CanvasTexture(plaqueCanvas);
    const plaqueMaterial = new THREE.MeshBasicMaterial({ map: plaqueTexture });
    const plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial);
    plaque.position.set(0, 1, 1.1);
    plaque.rotation.x = -Math.PI / 10;
    this.scene.add(plaque);
  }
  
  loadArtworks(artworks) {
    if (!artworks || artworks.length === 0) {
      console.warn('No artworks to display');
      return Promise.resolve();
    }
    
    const wallPositions = this.calculateWallPositions(artworks.length);
    const loadPromises = [];
    
    artworks.forEach((artwork, index) => {
      const position = wallPositions[index];
      const promise = this.loadArtwork(artwork, position);
      loadPromises.push(promise);
    });
    
    return Promise.all(loadPromises);
  }
  
  loadArtwork(artwork, position) {
    return new Promise((resolve, reject) => {
      // Create a placeholder
      const placeholderGeometry = new THREE.PlaneGeometry(1.5, 1);
      const placeholderMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xdddddd,
        side: THREE.DoubleSide
      });
      const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
      
      // Position placeholder
      placeholder.position.set(position.x, position.y, position.z);
      placeholder.rotation.y = position.rotation;
      
      // Add loading text
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      context.fillStyle = '#f0f0f0';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = '24px Arial';
      context.fillStyle = '#666666';
      context.textAlign = 'center';
      context.fillText('Loading...', canvas.width/2, canvas.height/2);
      
      const loadingTexture = new THREE.CanvasTexture(canvas);
      placeholder.material.map = loadingTexture;
      placeholder.material.needsUpdate = true;
      
      // Add to scene temporarily
      this.scene.add(placeholder);
      
      // Load the artwork texture
      this.textureLoader.load(
        artwork.imageUrl,
        // Success callback
        (texture) => {
          // Remove placeholder
          this.scene.remove(placeholder);
          
          const aspectRatio = texture.image.width / texture.image.height;
          const width = 1.5;
          const height = width / aspectRatio;
          
          // Create frame
          const frameGeometry = new THREE.BoxGeometry(width + 0.1, height + 0.1, 0.05);
          const frameMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.2
          });
          const frame = new THREE.Mesh(frameGeometry, frameMaterial);
          frame.castShadow = this.options.enableShadows;
          
          // Create artwork
          const artGeometry = new THREE.PlaneGeometry(width, height);
          const artMaterial = new THREE.MeshStandardMaterial({ 
            map: texture,
            side: THREE.DoubleSide
          });
          const art = new THREE.Mesh(artGeometry, artMaterial);
          art.position.z = 0.026; // Slightly in front of frame
          
          // Group them
          const artworkGroup = new THREE.Group();
          artworkGroup.add(frame);
          artworkGroup.add(art);
          
          // Position on wall
          artworkGroup.position.set(position.x, position.y, position.z);
          artworkGroup.rotation.y = position.rotation;
          
          // Add metadata
          artworkGroup.userData = {
            id: artwork.id,
            title: artwork.title,
            artist: artwork.artist,
            description: artwork.description,
            price: artwork.price,
            forSale: artwork.forSale,
            imageUrl: artwork.imageUrl
          };
          
          // Add to scene
          this.scene.add(artworkGroup);
          this.artworks.push(artworkGroup);
          
          // Add a spotlight for this artwork
          this.addSpotlightForArtwork(artworkGroup, position);
          
          resolve(artworkGroup);
        },
        // Progress callback
        undefined,
        // Error callback
        (error) => {
          console.error(`Error loading artwork: ${artwork.title}`, error);
          
          // Update placeholder with error message
          const errorCanvas = document.createElement('canvas');
          errorCanvas.width = 256;
          errorCanvas.height = 256;
          const errorContext = errorCanvas.getContext('2d');
          errorContext.fillStyle = '#f8d7da';
          errorContext.fillRect(0, 0, canvas.width, canvas.height);
          errorContext.font = '24px Arial';
          errorContext.fillStyle = '#721c24';
          errorContext.textAlign = 'center';
          errorContext.fillText('Image Not Found', canvas.width/2, canvas.height/2);
          errorContext.fillText('🖼️', canvas.width/2, canvas.height/2 + 40);
          
          const errorTexture = new THREE.CanvasTexture(errorCanvas);
          placeholder.material.map = errorTexture;
          placeholder.material.needsUpdate = true;
          
          // Store in artworks array
          this.artworks.push(placeholder);
          
          resolve(placeholder);
        }
      );
    });
  }
  
  addSpotlightForArtwork(artwork, position) {
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.copy(position);
    spotLight.position.y += 2;
    
    // Position the light based on the wall orientation
    if (Math.abs(position.z) > Math.abs(position.x)) {
      // Artwork is on front or back wall
      if (position.z < 0) {
        spotLight.position.z += 2; // Back wall
      } else {
        spotLight.position.z -= 2; // Front wall
      }
    } else {
      // Artwork is on left or right wall
      if (position.x < 0) {
        spotLight.position.x += 2; // Left wall
      } else {
        spotLight.position.x -= 2; // Right wall
      }
    }
    
    spotLight.target = artwork;
    spotLight.angle = Math.PI / 8;
    spotLight.penumbra = 0.3;
    spotLight.decay = 2;
    spotLight.distance = 10;
    
    if (this.options.enableShadows) {
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 512;
      spotLight.shadow.mapSize.height = 512;
    }
    
    this.scene.add(spotLight);
    
    return spotLight;
  }
  
  calculateWallPositions(artworkCount) {
    const positions = [];
    let artworksPerWall = Math.ceil(artworkCount / this.wallMeshes.length);
    
    this.wallMeshes.forEach((wall) => {
      // Skip if we've placed all artworks
      if (positions.length >= artworkCount) return;
      
      const wallWidth = wall.geometry.parameters.width;
      const wallHeight = wall.geometry.parameters.height;
      
      // Calculate how many artworks can fit on this wall
      const availableWidth = wallWidth - (this.options.artworkSpacing * 2);
      const maxArtworksOnWall = Math.floor(availableWidth / this.options.artworkSpacing);
      const actualArtworksOnWall = Math.min(maxArtworksOnWall, artworkCount - positions.length);
      
      // Calculate spacing for even distribution
      const spacing = availableWidth / (actualArtworksOnWall + 1);
      
      for (let i = 0; i < actualArtworksOnWall; i++) {
        if (positions.length >= artworkCount) break;
        
        const wallDirection = new THREE.Vector3(0, 0, -1);
        wallDirection.applyQuaternion(wall.quaternion);
        
        const x = wall.position.x + ((i + 1) * spacing - wallWidth / 2) * -wallDirection.z;
        const y = wallHeight * 0.5; // Center on wall
        const z = wall.position.z + ((i + 1) * spacing - wallWidth / 2) * wallDirection.x;
        
        positions.push({
          x: x,
          y: y,
          z: z,
          rotation: wall.rotation.y + Math.PI
        });
      }
    });
    
    return positions;
  }
  
  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }
  
  onMouseClick(event) {
    // Get mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Raycasting
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      let object = intersects[0].object;
      
      // Find the parent group (artwork)
      while (object.parent && object.parent !== this.scene) {
        object = object.parent;
      }
      
      // Check if this is an artwork with metadata
      if (object.userData && object.userData.id) {
        // Trigger callback if provided
        if (typeof this.options.onArtworkClick === 'function') {
          this.options.onArtworkClick(object.userData);
        }
      }
    }
  }
  
  onKeyDown(event) {
    if (!this.isFirstPerson) return;
    
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = true; 
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = true;
        break;
    }
  }
  
  onKeyUp(event) {
    if (!this.isFirstPerson) return;
    
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = false;
        break;
    }
  }
  
  toggleFirstPersonMode(enabled) {
    this.isFirstPerson = enabled;
    
    if (this.isFirstPerson) {
      // Disable orbit controls
      this.controls.enabled = false;
      document.body.style.cursor = 'none';
    } else {
      // Enable orbit controls
      this.controls.enabled = true;
      document.body.style.cursor = 'auto';
    }
  }
  
  updateFirstPersonControls() {
    if (!this.isFirstPerson) return;
    
    const delta = this.clock.getDelta();
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;
    
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();
    
    if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 15.0 * delta;
    if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 15.0 * delta;
    
    // Move the camera
    this.camera.translateX(this.velocity.x * delta);
    this.camera.translateZ(this.velocity.z * delta);
    
    // Keep the camera at eye level
    this.camera.position.y = 1.6;
    
    // Boundary checks - keep inside the room
    const halfWidth = this.options.roomWidth / 2 - 1;
    const halfDepth = this.options.roomDepth / 2 - 1;
    
    this.camera.position.x = Math.max(-halfWidth, Math.min(halfWidth, this.camera.position.x));
    this.camera.position.z = Math.max(-halfDepth, Math.min(halfDepth, this.camera.position.z));
  }
  
  resetCamera() {
    this.camera.position.copy(this.originalCameraPosition);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    if (this.isFirstPerson) {
      this.updateFirstPersonControls();
    } else {
      this.controls.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  dispose() {
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener('click', this.onMouseClick);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    
    // Dispose of ThreeJS resources
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        } else {
          if (object.material.map) object.material.map.dispose();
          object.material.dispose();
        }
      }
    });
    
    this.renderer.dispose();
    this.controls.dispose();
    
    // Remove renderer from container
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}