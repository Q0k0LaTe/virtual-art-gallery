// public/js/galleryViewComponent.jsx
class GalleryView extends React.Component {
    constructor(props) {
      super(props);
      
      this.state = {
        isLoading: true,
        selectedArtwork: null,
        isFirstPerson: false
      };
      
      this.containerRef = React.createRef();
      this.gallery = null;
    }
    
    componentDidMount() {
      this.initGallery();
    }
    
    componentWillUnmount() {
      if (this.gallery) {
        this.gallery.dispose();
      }
    }
    
    initGallery() {
      // Initialize the 3D gallery
      const container = this.containerRef.current;
      
      if (!container) return;
      
      this.gallery = new Gallery3D(container, {
        roomWidth: this.props.roomWidth || 20,
        roomHeight: this.props.roomHeight || 4,
        roomDepth: this.props.roomDepth || 20,
        wallColor: this.props.wallColor || '#ffffff',
        floorColor: this.props.floorColor || '#aaaaaa',
        backgroundColor: this.props.backgroundColor || '#f0f0f0',
        enableShadows: true,
        enableFirstPerson: true,
        onArtworkClick: this.handleArtworkClick.bind(this)
      });
      
      // Load artworks
      this.gallery.loadArtworks(this.props.artworks)
        .then(() => {
          this.setState({ isLoading: false });
        })
        .catch(error => {
          console.error('Error loading artworks:', error);
          this.setState({ isLoading: false });
        });
    }
    
    handleArtworkClick(artwork) {
      this.setState({ selectedArtwork: artwork });
    }
    
    handleCloseArtworkDetails() {
      this.setState({ selectedArtwork: null });
    }
    
    handleToggleFirstPerson(e) {
      const isFirstPerson = e.target.checked;
      this.setState({ isFirstPerson });
      
      if (this.gallery) {
        this.gallery.toggleFirstPersonMode(isFirstPerson);
      }
    }
    
    handleResetCamera() {
      if (this.gallery) {
        this.gallery.resetCamera();
      }
    }
    
    handleZoomIn() {
      if (this.gallery && this.gallery.camera.position.z > 2) {
        this.gallery.camera.position.z -= 1;
      }
    }
    
    handleZoomOut() {
      if (this.gallery && this.gallery.camera.position.z < 20) {
        this.gallery.camera.position.z += 1;
      }
    }
    
    render() {
      const { isLoading, selectedArtwork, isFirstPerson } = this.state;
      
      return (
        <div className="gallery-view-component">
          {/* 3D Gallery Container */}
          <div 
            ref={this.containerRef} 
            className="gallery-container"
            style={{ 
              width: '100%', 
              height: '600px', 
              backgroundColor: '#f0f0f0', 
              position: 'relative' 
            }}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner-container">
                <div className="spinner"></div>
                <p>Loading 3D Gallery...</p>
              </div>
            </div>
          )}
          
          {/* First Person Mode Toggle */}
          <div className="first-person-mode-toggle">
            <div className="form-check form-switch">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="firstPersonToggle"
                checked={isFirstPerson}
                onChange={this.handleToggleFirstPerson.bind(this)}
              />
              <label className="form-check-label" htmlFor="firstPersonToggle">
                First Person Mode
              </label>
            </div>
          </div>
          
          {/* Controls Panel */}
          <div className="gallery-controls">
            <button 
              className="btn btn-sm btn-light me-2" 
              onClick={this.handleZoomIn.bind(this)}
            >
              <i className="fas fa-search-plus"></i> Zoom In
            </button>
            <button 
              className="btn btn-sm btn-light me-2" 
              onClick={this.handleZoomOut.bind(this)}
            >
              <i className="fas fa-search-minus"></i> Zoom Out
            </button>
            <button 
              className="btn btn-sm btn-light" 
              onClick={this.handleResetCamera.bind(this)}
            >
              <i className="fas fa-sync"></i> Reset View
            </button>
          </div>
          
          {/* Artwork Details Panel */}
          {selectedArtwork && (
            <div className="artwork-details-panel">
              <button 
                type="button" 
                className="btn-close float-end" 
                onClick={this.handleCloseArtworkDetails.bind(this)}
              ></button>
              <h4>{selectedArtwork.title}</h4>
              <img 
                src={selectedArtwork.imageUrl} 
                alt={selectedArtwork.title}
                className="img-fluid mb-3"
                style={{ maxHeight: '200px' }}
              />
              <p><strong>Artist:</strong> {selectedArtwork.artist}</p>
              <p>{selectedArtwork.description}</p>
              <p><strong>Price:</strong> ${selectedArtwork.price ? selectedArtwork.price.toFixed(2) : 'N/A'}</p>
              <p>
                <strong>Status:</strong> {selectedArtwork.forSale ? 'For Sale' : 'Not For Sale'}
              </p>
              <a 
                href={`/artworksurl/${selectedArtwork.id}`} 
                className="btn btn-primary btn-sm"
              >
                View Details
              </a>
            </div>
          )}
          
          {/* Control Instructions */}
          <div className="control-instructions">
            <p><strong>Controls:</strong> {isFirstPerson ? 'WASD/Arrow Keys to move' : 'Click and drag to rotate, scroll to zoom'}</p>
          </div>
        </div>
      );
    }
  }