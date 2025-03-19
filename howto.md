# OMOP Concept Graph Viewer - Setup Guide

This guide explains how to set up and run the OMOP Concept Graph Viewer application, which allows you to visualize relationships between OMOP concepts.

## Prerequisites

1. Node.js (v14 or higher)
2. PostgreSQL (v12 or higher)
3. OMOP Vocabulary data loaded in PostgreSQL

## Database Setup

1. Ensure PostgreSQL is running on your system
   Default configuration is intended for OHDSI/Broadsea instances
2. Create a database named `postgres` (or update the configuration in `server.js` to match your database name)
3. Run the table creation scripts:
   ```bash
   cd ohdsi/ConceptGraph
   node scripts/create-tables.js
   ```
   This will create the necessary tables in the `omop_vocab` schema.

## Application Setup

1. Install dependencies:
   ```bash
   cd ohdsi/ConceptGraph
   npm install
   ```

2. Configure database connection:
   - Open `server.js`
   - Update the database configuration if needed:
     ```javascript
     const dbConfig = {
         user: 'postgres',
         host: 'localhost',
         database: 'postgres',
         password: 'mypass',
         port: 5432
     }
     ```

## Running the Application

The application consists of two parts: a backend server and a frontend development server.

### Backend Server

1. Start the backend server:
   ```bash
   cd ohdsi/ConceptGraph
   node server.js
   ```
   The server will start on port 3000 by default.

2. Verify the server is running:
   - Open a web browser and navigate to `http://localhost:3000/api/test`
   - You should see a JSON response: `{"message":"Server is running!"}`

### Frontend Server

1. In a new terminal window, start the frontend development server:
   ```bash
   cd ohdsi/ConceptGraph
   npm run dev
   ```
   The frontend will be available at `http://localhost:5174`

## Using the Application

1. Open your web browser and navigate to `http://localhost:5174`
2. Enter one or more OMOP concept IDs in the search bar (comma-separated)
3. Click "Fetch Concepts" or press Enter
4. The graph will display the concepts and their relationships

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Verify database credentials in `server.js`
   - Check if the database and tables exist

2. **Frontend Not Loading**
   - Ensure both servers are running
   - Check browser console for errors
   - Verify you're using the correct URL

3. **Graph Not Displaying**
   - Check browser console for errors
   - Verify the concept IDs exist in your database
   - Ensure the backend API is responding correctly

### Logs

- Backend logs appear in the terminal where `server.js` is running
- Frontend logs appear in the browser console (F12 to open developer tools)

## Development

### Project Structure

```
ohdsi/ConceptGraph/
├── src/              # Frontend source code
├── scripts/          # Utility scripts
├── omop_vocab/       # SQL files for OMOP vocabulary
├── server.js         # Backend server
├── index.html        # Main HTML file
└── package.json      # Project dependencies
```

### Making Changes

1. Frontend changes:
   - Edit files in the `src` directory
   - The development server will automatically reload

2. Backend changes:
   - Edit `server.js`
   - Restart the server to apply changes

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review the server logs
3. Verify database connectivity and data
4. Check the OMOP documentation for concept IDs and relationships 