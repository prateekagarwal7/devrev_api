

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');


//var admin = require("firebase-admin");

var serviceAccount = require("./permissions.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});





const express = require('express');
const app = express();
const db = admin.firestore();

const cors = require('cors');
app.use(cors({origin:true}));
app.use(bodyParser.json());

const port = 5000;
//route
app.get('/hello-world',(req,res)=>{
    return res.status(200).send('Hello World');
});

app.get('/',(req,res)=>{
    return res.send('Hello World prateek');
});

app.listen(port, ()=>{
    console.log("Server is running");
})



//create

app.post('/api/addBook', async (req, res) => {
    try {
      // Extract data from the request body
      const { name, author, genre, copies, price, rent } = req.body;
  
      // Check if required fields are present
      if (!name || !author || !genre || !copies || !price || !rent) {
        return res.status(400).json({ error: 'All fields are required.' });
      }
  
      // Create a new document in the "books" collection with an automatically generated ID
      const newBookRef = await db.collection('books').add({
        name,
        author,
        genre,
        copies,
        price,
        rent,
      });
  
      // Send a success response with the ID of the newly created document
      return res.status(201).json({ message: 'Book added successfully', id: newBookRef.id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while adding the book.' });
    }
  });

 
//read



app.get('/api/getAllBooks', async (req, res) => {
  try {
    // Query Firestore to get all books
    const querySnapshot = await db.collection('books').get();

    // Check if any books were found
    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'No books found' });
    }

    // Create an array to store book data
    const booksData = [];

    // Loop through the query result to collect book data
    querySnapshot.forEach((doc) => {
      const bookData = doc.data();
      booksData.push(bookData);
    });

    return res.status(200).json({ books: booksData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'An error occurred while fetching the books.' });
  }
});


// GET endpoint to fetch a book by name
app.get('/api/getBookByName/:name', async (req, res) => {
    try {
      // Extract the book name from the URL parameter
      const bookName = req.params.name;
  
      // Query Firestore to find the book by name
      const querySnapshot = await db.collection('books').where('name', '==', bookName).get();
  
      // Check if a book with the given name was found
      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'Book not found' });
      }
  
      // Get the book data from the query result
      const bookData = querySnapshot.docs[0].data();
  
      return res.status(200).json({ book: bookData });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while fetching the book.' });
    }
  });




// GET endpoint to fetch a book by author
app.get('/api/getBookByAuthor/:author', async (req, res) => {
    try {
      // Extract the author's name from the URL parameter
      const authorName = req.params.author;
  
      // Query Firestore to find the book by author
      const querySnapshot = await db.collection('books').where('author', '==', authorName).get();
  
      // Check if a book by the given author was found
      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'Book by this author not found' });
      }
  
      // Get the book data from the query result
      const bookData = [];
      querySnapshot.forEach((doc) => {
        bookData.push(doc.data());
      });
  
      return res.status(200).json({ books: bookData });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while fetching books by author.' });
    }
  });  

// GET endpoint to fetch books by multiple genres
app.get('/api/getBooksByGenres/:genres', async (req, res) => {
    try {
      // Extract the genres from the URL parameter and split them into an array
      const genreString = req.params.genres;
      const genres = genreString.split(',');
  
      // Query Firestore to find books by multiple genres
      const querySnapshot = await db.collection('books').where('genre', 'in', genres).get();
  
      // Check if books in the given genres were found
      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'No books in these genres found' });
      }
  
      // Get the book data from the query result
      const bookData = [];
      querySnapshot.forEach((doc) => {
        bookData.push(doc.data());
      });
  
      return res.status(200).json({ books: bookData });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while fetching books by genres.' });
    }
  });
  

  // GET endpoint to fetch books by multiple price ranges
app.get('/api/getBooksByMultiplePriceRanges', async (req, res) => {
    try {
      // Extract the price ranges from the "priceRanges" query parameter
      const priceRanges = req.query.priceRanges.split(',');
  
      // Query Firestore to find books within the specified price ranges
      const bookData = [];
  
      for (const range of priceRanges) {
        const [minPrice, maxPrice] = range.split('-').map(Number);
  
        // Query Firestore for books within the current price range
        const querySnapshot = await db.collection('books')
          .where('price', '>=', minPrice)
          .where('price', '<=', maxPrice)
          .get();
  
        // Append the book data from the current price range to the results
        querySnapshot.forEach((doc) => {
          bookData.push(doc.data());
        });
      }
  
      // Check if any books were found in the specified price ranges
      if (bookData.length === 0) {
        return res.status(404).json({ error: 'No books found within the specified price ranges' });
      }
  
      return res.status(200).json({ books: bookData });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while fetching books by price ranges.' });
    }
  });

// GET endpoint to fetch the authors of all books
app.get('/api/getAllAuthors', async (req, res) => {
    try {
      // Create a reference to the "books" collection
      const booksCollection = db.collection('books');
  
      // Query Firestore to get all documents in the "books" collection
      const querySnapshot = await booksCollection.get();
  
      // Initialize a Set to store unique authors
      const authorsSet = new Set();
  
      // Loop through each document and extract the author
      querySnapshot.forEach((doc) => {
        const bookData = doc.data();
        authorsSet.add(bookData.author);
      });
  
      // Convert the Set of authors to an array
      const authorsArray = Array.from(authorsSet);
  
      return res.status(200).json({ authors: authorsArray });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while fetching authors.' });
    }
  });
  
  

// GET endpoint to fetch books by multiple rent price ranges
app.get('/api/getBooksByMultipleRentRanges', async (req, res) => {
    try {
      // Extract the rent price ranges from the "rentRanges" query parameter
      const rentRanges = req.query.rentRanges.split(',');
  
      // Initialize an array to store book data matching the specified rent price ranges
      const booksMatchingRanges = [];
  
      // Loop through each rent price range
      for (const range of rentRanges) {
        const [minRent, maxRent] = range.split('-').map(Number);
  
        // Query Firestore for books within the current rent price range
        const querySnapshot = await db.collection('books')
          .where('rent', '>=', minRent)
          .where('rent', '<=', maxRent)
          .get();
  
        // Append the book data from the current rent price range to the results
        querySnapshot.forEach((doc) => {
          booksMatchingRanges.push(doc.data());
        });
      }
  
      // Check if any books were found in the specified rent price ranges
      if (booksMatchingRanges.length === 0) {
        return res.status(404).json({ error: 'No books found within the specified rent price ranges' });
      }
  
      return res.status(200).json({ books: booksMatchingRanges });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while fetching books by rent price ranges.' });
    }
  });
  
  

// GET endpoint to search for books by keyword
app.get('/api/searchBooks', async (req, res) => {
    try {
      // Extract the search keyword from the "keyword" query parameter
      const searchKeyword = req.query.keyword.toLowerCase();
  
      // Create an array to store matching books
      const matchingBooks = [];
  
      // Query Firestore to find books that contain the keyword in their name, author, or genre
      const booksCollection = db.collection('books');
      const querySnapshot = await booksCollection.get();
  
      querySnapshot.forEach((doc) => {
        const bookData = doc.data();
  
        // Check if the keyword exists in the name, author, or genre (case-insensitive)
        if (
          bookData.name.toLowerCase().includes(searchKeyword) ||
          bookData.author.toLowerCase().includes(searchKeyword) ||
          bookData.genre.toLowerCase().includes(searchKeyword)
        ) {
          matchingBooks.push(bookData);
        }
      });
  
      // Check if any matching books were found
      if (matchingBooks.length === 0) {
        return res.status(404).json({ error: 'No books found matching the search keyword.' });
      }
  
      return res.status(200).json({ books: matchingBooks });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while searching for books.' });
    }
  });
  

  

//update



//delete




//exporting api to firebase cloud functions
exports.app = functions.https.onRequest(app);

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
