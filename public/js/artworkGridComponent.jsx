// public/js/artworkGridComponent.jsx
class ArtworkGrid extends React.Component {
    constructor(props) {
      super(props);
      
      this.state = {
        artworks: props.artworks || [],
        filteredArtworks: props.artworks || [],
        categories: props.categories || [],
        filter: {
          category: '',
          minPrice: '',
          maxPrice: '',
          sort: '-createdAt'
        },
        view: 'grid', // 'grid' or 'list'
        currentPage: 1,
        itemsPerPage: 12
      };
    }
    
    componentDidMount() {
      // Initialize any external components (like tooltips)
      if (typeof $ !== 'undefined') {
        $('[data-toggle="tooltip"]').tooltip();
      }
    }
    
    handleFilterChange(e) {
      const { name, value } = e.target;
      this.setState(prevState => ({
        filter: {
          ...prevState.filter,
          [name]: value
        },
        currentPage: 1 // Reset to first page when filter changes
      }), this.applyFilters);
    }
    
    handleViewChange(view) {
      this.setState({ view });
    }
    
    handlePageChange(page) {
      this.setState({ currentPage: page });
    }
    
    applyFilters() {
      const { artworks, filter } = this.state;
      let filtered = [...artworks];
      
      // Apply category filter
      if (filter.category) {
        filtered = filtered.filter(artwork => artwork.category === filter.category);
      }
      
      // Apply price filters
      if (filter.minPrice) {
        filtered = filtered.filter(artwork => artwork.price >= parseFloat(filter.minPrice));
      }
      
      if (filter.maxPrice) {
        filtered = filtered.filter(artwork => artwork.price <= parseFloat(filter.maxPrice));
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        const sortField = filter.sort.startsWith('-') ? filter.sort.substring(1) : filter.sort;
        const sortDirection = filter.sort.startsWith('-') ? -1 : 1;
        
        if (sortField === 'price') {
          return sortDirection * (a.price - b.price);
        } else if (sortField === 'title') {
          return sortDirection * a.title.localeCompare(b.title);
        } else {
          // Default to date
          return sortDirection * (new Date(b.createdAt) - new Date(a.createdAt));
        }
      });
      
      this.setState({ filteredArtworks: filtered });
    }
    
    render() {
      const { 
        filteredArtworks, 
        categories, 
        filter, 
        view, 
        currentPage, 
        itemsPerPage 
      } = this.state;
      
      // Pagination
      const totalPages = Math.ceil(filteredArtworks.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentArtworks = filteredArtworks.slice(startIndex, endIndex);
      
      return (
        <div className="artwork-grid-component">
          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-3">
                  <label htmlFor="category" className="form-label">Category</label>
                  <select 
                    name="category" 
                    id="category" 
                    className="form-select"
                    value={filter.category}
                    onChange={this.handleFilterChange.bind(this)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label htmlFor="minPrice" className="form-label">Min Price</label>
                  <input 
                    type="number" 
                    name="minPrice" 
                    id="minPrice" 
                    className="form-control"
                    value={filter.minPrice}
                    onChange={this.handleFilterChange.bind(this)}
                    min="0" 
                    placeholder="Min"
                  />
                </div>
                <div className="col-md-2">
                  <label htmlFor="maxPrice" className="form-label">Max Price</label>
                  <input 
                    type="number" 
                    name="maxPrice" 
                    id="maxPrice" 
                    className="form-control"
                    value={filter.maxPrice}
                    onChange={this.handleFilterChange.bind(this)}
                    min="0" 
                    placeholder="Max"
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="sort" className="form-label">Sort By</label>
                  <select 
                    name="sort" 
                    id="sort" 
                    className="form-select"
                    value={filter.sort}
                    onChange={this.handleFilterChange.bind(this)}
                  >
                    <option value="-createdAt">Newest First</option>
                    <option value="createdAt">Oldest First</option>
                    <option value="price">Price: Low to High</option>
                    <option value="-price">Price: High to Low</option>
                    <option value="title">Title: A-Z</option>
                    <option value="-title">Title: Z-A</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <div className="btn-group w-100">
                    <button 
                      type="button" 
                      className={`btn btn-outline-secondary ${view === 'grid' ? 'active' : ''}`}
                      onClick={() => this.handleViewChange('grid')}
                    >
                      <i className="fas fa-th"></i>
                    </button>
                    <button 
                      type="button" 
                      className={`btn btn-outline-secondary ${view === 'list' ? 'active' : ''}`}
                      onClick={() => this.handleViewChange('list')}
                    >
                      <i className="fas fa-list"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* No Results */}
          {currentArtworks.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-palette fa-3x text-muted mb-3"></i>
              <p className="lead">No artworks found matching your criteria</p>
              <button 
                className="btn btn-primary"
                onClick={() => this.setState({
                  filter: {
                    category: '',
                    minPrice: '',
                    maxPrice: '',
                    sort: '-createdAt'
                  },
                  currentPage: 1
                }, this.applyFilters)}
              >
                Clear Filters
              </button>
            </div>
          )}
          
          {/* Grid View */}
          {view === 'grid' && currentArtworks.length > 0 && (
            <div className="row">
              {currentArtworks.map(artwork => (
                <div className="col-md-3 mb-4" key={artwork._id}>
                  <div className="card h-100 shadow-sm artwork-card">
                    <img 
                      src={artwork.imageUrl || `/uploads/${artwork.image}`} 
                      className="card-img-top" 
                      alt={artwork.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => {e.target.src = '/img/image-not-found.jpg'}}
                    />
                    <div className="card-body">
                      <h5 className="card-title">{artwork.title}</h5>
                      <p className="card-text text-muted">
                        by {artwork.artist.name}
                      </p>
                      <p className="card-text">
                        <strong>${artwork.price.toFixed(2)}</strong>
                      </p>
                      <p className="card-text">
                        <span className="badge bg-primary">{artwork.category}</span>
                        {artwork.forSale ? (
                          <span className="badge bg-success ms-2">For Sale</span>
                        ) : (
                          <span className="badge bg-secondary ms-2">Not For Sale</span>
                        )}
                      </p>
                      <div className="d-grid">
                        <a 
                          href={artwork.imageUrl ? `/artworksurl/${artwork._id}` : `/artworks/${artwork._id}`} 
                          className="btn btn-outline-primary"
                        >
                          View Details
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* List View */}
          {view === 'list' && currentArtworks.length > 0 && (
            <div className="list-group">
              {currentArtworks.map(artwork => (
                <a 
                  href={artwork.imageUrl ? `/artworksurl/${artwork._id}` : `/artworks/${artwork._id}`}
                  className="list-group-item list-group-item-action" 
                  key={artwork._id}
                >
                  <div className="d-flex">
                    <div className="flex-shrink-0">
                      <img 
                        src={artwork.imageUrl || `/uploads/${artwork.image}`} 
                        alt={artwork.title}
                        className="img-thumbnail me-3" 
                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                        onError={(e) => {e.target.src = '/img/image-not-found.jpg'}}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-1">{artwork.title}</h5>
                        <span className="text-primary fw-bold">${artwork.price.toFixed(2)}</span>
                      </div>
                      <p className="mb-1">by {artwork.artist.name}</p>
                      <p className="mb-1 small">{artwork.description.substring(0, 150)}...</p>
                      <div>
                        <span className="badge bg-primary">{artwork.category}</span>
                        {artwork.forSale ? (
                          <span className="badge bg-success ms-2">For Sale</span>
                        ) : (
                          <span className="badge bg-secondary ms-2">Not For Sale</span>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Page navigation" className="my-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => this.handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                
                {[...Array(totalPages)].map((_, index) => (
                  <li 
                    className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                    key={index}
                  >
                    <button 
                      className="page-link" 
                      onClick={() => this.handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => this.handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      );
    }
  }