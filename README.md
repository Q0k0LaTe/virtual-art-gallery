# Virtual Art Gallery with 3D Exhibitions

A full-stack Node.js web application that allows artists to showcase their artwork in immersive 3D exhibition spaces. This platform enables artists to create detailed profiles, upload artwork, and design virtual exhibitions, while visitors can browse artwork, create accounts, purchase art, and explore virtual galleries powered by Three.js.

## 🌟 Features

- **User Authentication:** Secure registration and login with role-based access control (visitor, artist, admin)
- **Artist Profiles:** Comprehensive artist profiles with portfolio management
- **Artwork Management:** Full CRUD functionality for artwork with detailed metadata
- **3D Exhibitions:** Create and explore immersive virtual exhibitions using Three.js
- **Purchase System:** Fully integrated artwork transactions with transaction tracking
- **Weather-based Art Recommendations:** Integration with weather API to suggest art based on current conditions
- **External API Integration:** Connections with Weather API and Art Institute of Chicago API
- **Responsive Design:** Fully mobile-friendly interface built with Bootstrap 5

## 🛠️ Technologies Used

- **Backend:** 
  - Node.js with Express.js
  - MongoDB with Mongoose ODM
  - Passport.js authentication

- **Frontend:**
  - EJS template engine with layouts and partials
  - Bootstrap 5 and custom CSS
  - Three.js for 3D visualization
  - JavaScript for interactive elements

- **Additional Tools:**
  - Multer for file uploads
  - Connect-flash for notifications
  - Method-override for RESTful routes

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- API keys for:
  - OpenWeatherMap API
  - Art Institute of Chicago API

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```
   git clone https://github.com/yourusername/virtual-art-gallery.git
   cd virtual-art-gallery
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Create a `.env` file in the root directory with the following variables:**
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb+srv://your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   WEATHER_API_KEY=your_openweathermap_api_key
   ART_INSTITUTE_API_KEY=your_art_institute_api_key
   ```

4. **Create the uploads directory:**
   ```
   mkdir -p public/uploads
   ```

5. **Start the application:**
   ```
   npm start
   ```
   
   For development with auto-restart:
   ```
   npm run dev
   ```

6. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
virtual-art-gallery/
├── config/               # Configuration files
├── controllers/          # Route controllers
├── middleware/           # Custom middleware
├── models/               # Mongoose models
├── public/               # Static files
│   ├── css/              # Stylesheets
│   ├── js/               # Client-side JavaScript
│   └── uploads/          # Uploaded images
├── routes/               # Express routes
├── services/             # External services
├── views/                # EJS templates
│   ├── artworks/         # Artwork-related templates
│   ├── exhibitions/      # Exhibition-related templates
│   ├── layouts/          # Layout templates
│   ├── pages/            # Page templates
│   ├── partials/         # Reusable template parts
│   ├── purchases/        # Purchase-related templates
│   └── users/            # User-related templates
├── .env                  # Environment variables
├── .gitignore            # Git ignore file
├── app.js                # Main application file
├── package.json          # Project dependencies
└── README.md             # Project documentation
```

## 🌐 Key Features Detail

### 3D Exhibition Spaces
Artists can create customizable virtual galleries with:
- Adjustable room dimensions and colors
- Automatic artwork placement on walls
- Interactive viewing with camera controls
- Artwork information display on click

### Artwork Management
Comprehensive artwork handling with:
- High-quality image uploads
- Detailed metadata including dimensions and categories
- Price and availability settings
- Related artwork recommendations

### User Roles
Three distinct user roles:
- **Visitors:** Browse and purchase artwork
- **Artists:** All visitor capabilities plus artwork creation and exhibition curation
- **Admins:** Full system access and management

## 🚢 Deployment

### Deploying to Render:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - **Build Command:** `npm install`
   - **Start Command:** `node app.js`
4. Add environment variables in the Render dashboard
5. Deploy the application

## 🧪 Testing

Run tests with:
```
npm test
```

## 🔄 Upcoming Features

- User favorites and collections
- Artist messaging system
- Advanced search and filtering
- Social sharing integration
- Analytics dashboard for artists

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Authors

- Terrence Han

## 🙏 Acknowledgments

- Three.js community for 3D visualization libraries
- MongoDB Atlas for database hosting
- Weather API and Art Institute of Chicago API for data integration
- Bootstrap team for responsive design framework