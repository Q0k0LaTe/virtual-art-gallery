// public/js/exhibition3D.js
let scene, camera, renderer, controls;
let artworks = [];
let wallMeshes = [];
let originalCameraPosition;

// Initialize the 3D scene
function init(exhibitionData) {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(exhibitionData.sceneData.backgroundColor || '#f0f0f0');

  // Create camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.6, 5); // Position camera at eye level
  originalCameraPosition = camera.position.clone();

  // Create renderer
  const container = document.getElementById('exhibition-container');
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // Add orbit controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2;

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Create gallery room
  createGalleryRoom(exhibitionData.sceneData);

  // Load artwork textures and create artwork planes
  loadArtworks(exhibitionData.artworks);

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Start animation loop
  animate();
}

// Create gallery walls and floor
function createGalleryRoom(sceneData) {
  const roomWidth = sceneData.roomWidth || 20;
  const roomHeight = sceneData.roomHeight || 4;
  const roomDepth = sceneData.roomDepth || 20;

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: sceneData.floorColor || 0xaaaaaa,
    roughness: 0.8,
    metalness: 0.2
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Create walls
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: sceneData.wallColor || 0xffffff,
    roughness: 0.9,
    metalness: 0.1
  });

  // Back wall
  const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
  const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
  backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
  backWall.receiveShadow = true;
  scene.add(backWall);
  wallMeshes.push(backWall);

  // Front wall
  const frontWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
  const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
  frontWall.position.set(0, roomHeight / 2, roomDepth / 2);
  frontWall.rotation.y = Math.PI;
  frontWall.receiveShadow = true;
  scene.add(frontWall);
  wallMeshes.push(frontWall);

  // Left wall
  const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
  const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
  leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  scene.add(leftWall);
  wallMeshes.push(leftWall);

  // Right wall
  const rightWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
  const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
  rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  scene.add(rightWall);
  wallMeshes.push(rightWall);
}

// Load artworks and place them on walls
function loadArtworks(artworksData) {
  const textureLoader = new THREE.TextureLoader();
  const wallPositions = calculateWallPositions(artworksData.length);

  artworksData.forEach((artwork, index) => {
    const imageUrl = `/uploads/${artwork.image}`;
    
    textureLoader.load(imageUrl, function(texture) {
      // Calculate aspect ratio to maintain proper dimensions
      const aspectRatio = texture.image.width / texture.image.height;
      const width = 1.5;
      const height = width / aspectRatio;

      // Create material with artwork texture
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide
      });

      // Create frame material
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.2
      });

      // Create artwork mesh (with frame)
      const frameWidth = width + 0.1;
      const frameHeight = height + 0.1;
      const frameDepth = 0.05;

      // Create frame geometry
      const frameGeometry = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth);
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);

      // Create artwork canvas geometry
      const artGeometry = new THREE.PlaneGeometry(width, height);
      const artCanvas = new THREE.Mesh(artGeometry, material);
      artCanvas.position.z = frameDepth / 2 + 0.001; // Slightly in front of frame

      // Create artwork group
      const artworkGroup = new THREE.Group();
      artworkGroup.add(frame);
      artworkGroup.add(artCanvas);

      // Position artwork on wall
      const position = wallPositions[index];
      artworkGroup.position.set(position.x, position.y, position.z);
      artworkGroup.rotation.y = position.rotation;

      // Add metadata for raycasting/interaction
      artworkGroup.userData = {
        id: artwork._id,
        title: artwork.title,
        artist: artwork.artist.name,
        description: artwork.description,
        price: artwork.price
      };

      // Add to scene and tracking array
      scene.add(artworkGroup);
      artworks.push(artworkGroup);
    });
  });
}

// Calculate positions on walls for artworks
function calculateWallPositions(artworkCount) {
  const positions = [];
  const wallCount = wallMeshes.length;
  const artworksPerWall = Math.ceil(artworkCount / wallCount);
  
  let artworkIndex = 0;
  
  for (let wallIndex = 0; wallIndex < wallCount; wallIndex++) {
    const wall = wallMeshes[wallIndex];
    const wallDirection = new THREE.Vector3();
    wall.getWorldDirection(wallDirection);
    
    // Calculate wall width and height
    const wallWidth = wall.geometry.parameters.width;
    const wallHeight = wall.geometry.parameters.height;
    
    // Calculate spacing between artworks
    const spacing = wallWidth / (artworksPerWall + 1);
    
    for (let i = 0; i < artworksPerWall; i++) {
      if (artworkIndex >= artworkCount) break;
      
      // Calculate position on wall
      const x = wall.position.x + ((i + 1) * spacing - wallWidth / 2) * -wallDirection.z;
      const y = wallHeight * 0.5; // Center vertically
      const z = wall.position.z + ((i + 1) * spacing - wallWidth / 2) * wallDirection.x;
      
      positions.push({
        x: x,
        y: y,
        z: z,
        rotation: wall.rotation.y + Math.PI
      });
      
      artworkIndex++;
    }
  }
  
  return positions;
}

// Handle window resize
function onWindowResize() {
  const container = document.getElementById('exhibition-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Raycasting for artwork interaction
function setupInteraction() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  renderer.domElement.addEventListener('click', function(event) {
    // Calculate mouse position in normalized device coordinates
    const containerRect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - containerRect.left) / containerRect.width) * 2 - 1;
    mouse.y = -((event.clientY - containerRect.top) / containerRect.height) * 2 + 1;
    
    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with artworks
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      // Find the parent group (artwork)
      let artworkGroup = intersects[0].object;
      while (artworkGroup.parent && artworkGroup.parent !== scene) {
        artworkGroup = artworkGroup.parent;
      }
      
      // Display artwork information if this is an artwork
      if (artworkGroup.userData && artworkGroup.userData.id) {
        showArtworkDetails(artworkGroup.userData);
      }
    }
  });
}

// Show artwork details in UI
function showArtworkDetails(artwork) {
  const detailsElement = document.getElementById('artwork-details');
  
  if (detailsElement) {
    detailsElement.innerHTML = `
      <button type="button" class="btn-close float-end" onclick="document.getElementById('artwork-details').style.display='none'"></button>
      <div id="artwork-content">
        <h3>${artwork.title}</h3>
        <p><strong>Artist:</strong> ${artwork.artist}</p>
        <p>${artwork.description}</p>
        <p><strong>Price:</strong> $${artwork.price ? artwork.price.toFixed(2) : 'N/A'}</p>
        <a href="/artworks/${artwork.id}" class="btn btn-primary">View Details</a>
      </div>
    `;
    
    detailsElement.style.display = 'block';
  }
}

// Get camera for external controls
function getCamera() {
  return camera;
}

// Reset camera to original position
function resetCamera() {
  if (originalCameraPosition) {
    camera.position.copy(originalCameraPosition);
    controls.target.set(0, 0, 0);
    controls.update();
  }
}

// Export functions for use in exhibition view
window.Exhibition3D = {
  init,
  setupInteraction,
  getCamera,
  resetCamera
};