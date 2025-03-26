# Virtual Art Gallery with 3D Exhibitions

A full-stack Node.js web application that allows artists to showcase their artwork in immersive 3D exhibition spaces. Users can browse artwork, create accounts, purchase art, and explore virtual galleries built with Three.js.

## Features

- **User Authentication:** Register, login, profile management with different user roles (visitor, artist, admin)
- **Artist Profiles:** Artists can create profiles and upload their artwork
- **Artwork Management:** Create, read, update, delete artworks with detailed information
- **3D Exhibitions:** Create and explore immersive 3D exhibitions using Three.js
- **Artwork Purchase System:** Buy and sell artwork with transaction tracking
- **Weather-based Art Recommendations:** Integration with weather API to recommend art based on current conditions
- **External API Integration:** Fetch data from external APIs (Weather API, Art Institute of Chicago API)
- **Responsive Design:** Mobile-friendly interface with Bootstrap

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** Passport.js (Local Strategy)
- **Template Engine:** EJS with layouts and partials
- **Frontend:** Bootstrap 5, Custom CSS, JavaScript
- **3D Visualization:** Three.js
- **File Upload:** Multer
- **External APIs:** OpenWeatherMap API, Art Institute of Chicago API

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- API keys for OpenWeatherMap and Art Institute of Chicago

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/virtual-art-gallery.git
   cd virtual-art-gallery
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb+srv://your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   WEATHER_API_KEY=your_openweathermap_api_key
   ART_INSTITUTE_API_KEY=your_art_institute_api_key
   ```

4. Create the uploads directory:
   ```
   mkdir -p public/uploads
   ```

5. Start the application:
   ```
   npm start
   ```
   
   For development with auto-restart:
   ```
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
virtual-art-gallery/
├── config/               # Configuration files
│   ├── db.js             # Database configuration
│   └── passport.js       # Passport authentication configuration
├── controllers/          # Route controllers
│   ├── artworkController.js
│   ├── exhibitionController.js
│   ├── indexController.js
│   ├── purchaseController.js
│   └── userController.js
├── middleware/           # Custom middleware
│   ├── auth.js           # Authentication middleware
│   └── upload.js         # File upload middleware
├── models/               # Mongoose models
│   ├── Artwork.js
│   ├── Exhibition.js
│   ├── Purchase.js
│   └── User.js
├── public/               # Static files
│   ├── css/              # Stylesheets
│   ├── js/               # Client-side JavaScript
│   │   └── exhibition3D.js  # Three.js integration
│   └── uploads/          # Uploaded images
├── routes/               # Express routes
│   ├── artworkRoutes.js
│   ├── exhibitionRoutes.js
│   ├── indexRoutes.js
│   ├── purchaseRoutes.js
│   └── userRoutes.js
├── services/             # External services
│   └── apiService.js     # API integration
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

## Deployment

### Deploying to Render:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - **Build Command:** `npm install`
   - **Start Command:** `node app.js`
4. Add environment variables in the Render dashboard
5. Deploy the application

## Version Control Guidelines

- Maintain clear and logical folder organization
- Use proper `.gitignore` file to exclude `node_modules` and `.env`
- Make regular commits with descriptive messages
- Use environment variables for sensitive data

## License

MIT

## Author

Terrence Han