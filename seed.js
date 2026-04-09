const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('./models/Book');
const User = require('./models/User');

dotenv.config();

const sampleBooks = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    description: "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.",
    isbn: "9780743273565",
    category: "Fiction",
    price: 12.99,
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400",
    publishedDate: new Date("1925-04-10"),
    publisher: "Scribner",
    pages: 180,
    language: "English"
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    description: "A gripping tale of racial injustice and childhood innocence in the American South.",
    isbn: "9780061120084",
    category: "Fiction",
    price: 14.99,
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
    publishedDate: new Date("1960-07-11"),
    publisher: "J.B. Lippincott & Co.",
    pages: 324,
    language: "English"
  },
  {
    title: "1984",
    author: "George Orwell",
    description: "A dystopian social science fiction novel and cautionary tale about totalitarianism.",
    isbn: "9780451524935",
    category: "Fiction",
    price: 13.99,
    stock: 60,
    imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400",
    publishedDate: new Date("1949-06-08"),
    publisher: "Secker & Warburg",
    pages: 328,
    language: "English"
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    description: "A romantic novel of manners that follows the character development of Elizabeth Bennet.",
    isbn: "9780141439518",
    category: "Romance",
    price: 11.99,
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
    publishedDate: new Date("1813-01-28"),
    publisher: "T. Egerton",
    pages: 432,
    language: "English"
  },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    description: "A story about teenage rebellion and alienation, narrated by the cynical Holden Caulfield.",
    isbn: "9780316769174",
    category: "Fiction",
    price: 12.99,
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400",
    publishedDate: new Date("1951-07-16"),
    publisher: "Little, Brown and Company",
    pages: 277,
    language: "English"
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    description: "The magical story of a young wizard's first year at Hogwarts School of Witchcraft and Wizardry.",
    isbn: "9780590353427",
    category: "Fantasy",
    price: 15.99,
    stock: 100,
    imageUrl: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400",
    publishedDate: new Date("1997-06-26"),
    publisher: "Bloomsbury",
    pages: 309,
    language: "English"
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    description: "A fantasy adventure about Bilbo Baggins' unexpected journey with dwarves to reclaim their treasure.",
    isbn: "9780547928227",
    category: "Fantasy",
    price: 14.99,
    stock: 55,
    imageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400",
    publishedDate: new Date("1937-09-21"),
    publisher: "Allen & Unwin",
    pages: 310,
    language: "English"
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    description: "An exploration of human history from the Stone Age to the modern age.",
    isbn: "9780062316097",
    category: "History",
    price: 18.99,
    stock: 70,
    imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
    publishedDate: new Date("2011-01-01"),
    publisher: "Harper",
    pages: 443,
    language: "English"
  },
  {
    title: "Educated",
    author: "Tara Westover",
    description: "A memoir about a woman who grows up in a survivalist family and eventually earns a PhD from Cambridge.",
    isbn: "9780399590504",
    category: "Biography",
    price: 16.99,
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
    publishedDate: new Date("2018-02-20"),
    publisher: "Random House",
    pages: 334,
    language: "English"
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    description: "A groundbreaking tour of the mind explaining the two systems that drive the way we think.",
    isbn: "9780374533557",
    category: "Non-Fiction",
    price: 17.99,
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400",
    publishedDate: new Date("2011-10-25"),
    publisher: "Farrar, Straus and Giroux",
    pages: 499,
    language: "English"
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    description: "A handbook of agile software craftsmanship teaching principles of writing clean, maintainable code.",
    isbn: "9780132350884",
    category: "Technology",
    price: 32.99,
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400",
    publishedDate: new Date("2008-08-01"),
    publisher: "Prentice Hall",
    pages: 464,
    language: "English"
  },
  {
    title: "The Lean Startup",
    author: "Eric Ries",
    description: "A revolutionary approach to building businesses based on validated learning and iterative development.",
    isbn: "9780307887894",
    category: "Business",
    price: 19.99,
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=400",
    publishedDate: new Date("2011-09-13"),
    publisher: "Crown Business",
    pages: 336,
    language: "English"
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    description: "An easy and proven way to build good habits and break bad ones through tiny changes.",
    isbn: "9780735211292",
    category: "Self-Help",
    price: 16.99,
    stock: 80,
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
    publishedDate: new Date("2018-10-16"),
    publisher: "Avery",
    pages: 320,
    language: "English"
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    description: "A mystical story about following your dreams and listening to your heart.",
    isbn: "9780062315007",
    category: "Fiction",
    price: 13.99,
    stock: 65,
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400",
    publishedDate: new Date("1988-01-01"),
    publisher: "HarperOne",
    pages: 197,
    language: "English"
  },
  {
    title: "The Da Vinci Code",
    author: "Dan Brown",
    description: "A mystery thriller following symbologist Robert Langdon as he investigates a murder in the Louvre.",
    isbn: "9780307474278",
    category: "Mystery",
    price: 15.99,
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=400",
    publishedDate: new Date("2003-03-18"),
    publisher: "Doubleday",
    pages: 454,
    language: "English"
  },
  {
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    description: "A coming-of-age story and murder mystery set in the marshes of North Carolina.",
    isbn: "9780735219090",
    category: "Fiction",
    price: 16.99,
    stock: 75,
    imageUrl: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400",
    publishedDate: new Date("2018-08-14"),
    publisher: "G.P. Putnam's Sons",
    pages: 384,
    language: "English"
  },
  {
    title: "The Subtle Art of Not Giving a F*ck",
    author: "Mark Manson",
    description: "A counterintuitive approach to living a good life by caring less about more and more about less.",
    isbn: "9780062457714",
    category: "Self-Help",
    price: 15.99,
    stock: 60,
    imageUrl: "https://images.unsplash.com/photo-1472173148041-00294f0814a2?w=400",
    publishedDate: new Date("2016-09-13"),
    publisher: "HarperOne",
    pages: 224,
    language: "English"
  },
  {
    title: "The Power of Now",
    author: "Eckhart Tolle",
    description: "A guide to spiritual enlightenment focusing on living in the present moment.",
    isbn: "9781577314806",
    category: "Self-Help",
    price: 14.99,
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400",
    publishedDate: new Date("1997-01-01"),
    publisher: "New World Library",
    pages: 236,
    language: "English"
  },
  {
    title: "Good Omens",
    author: "Neil Gaiman & Terry Pratchett",
    description: "A comedic apocalyptic novel about an angel and demon trying to prevent Armageddon.",
    isbn: "9780060853983",
    category: "Fantasy",
    price: 14.99,
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400",
    publishedDate: new Date("1990-05-01"),
    publisher: "William Morrow",
    pages: 383,
    language: "English"
  },
  {
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    description: "A powerful framework for personal effectiveness and character development.",
    isbn: "9781451639612",
    category: "Self-Help",
    price: 17.99,
    stock: 55,
    imageUrl: "https://images.unsplash.com/photo-1531956656798-56686eeef3d4?w=400",
    publishedDate: new Date("1989-08-15"),
    publisher: "Free Press",
    pages: 381,
    language: "English"
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Book.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@bookstore.com',
      password: 'admin123',
      isAdmin: true
    });
    console.log('Admin user created');

    // Create regular test users
    const testUsers = await User.create([
      {
        name: 'John Doe',
        email: 'john@test.com',
        password: 'test123'
      },
      {
        name: 'Jane Smith',
        email: 'jane@test.com',
        password: 'test123'
      }
    ]);
    console.log('Test users created');

    // Insert books
    const books = await Book.insertMany(sampleBooks);
    console.log(`${books.length} books inserted`);

    // Add some sample interactions for recommendation testing
    const user1 = testUsers[0];
    const user2 = testUsers[1];

    // User 1 purchases and likes some books
    user1.purchaseHistory.push(
      { bookId: books[0]._id, quantity: 1, price: books[0].price },
      { bookId: books[2]._id, quantity: 1, price: books[2].price },
      { bookId: books[5]._id, quantity: 2, price: books[5].price }
    );
    user1.likedBooks.push(books[1]._id, books[3]._id, books[7]._id);
    
    // User 2 purchases and likes some overlapping books
    user2.purchaseHistory.push(
      { bookId: books[0]._id, quantity: 1, price: books[0].price },
      { bookId: books[1]._id, quantity: 1, price: books[1].price },
      { bookId: books[6]._id, quantity: 1, price: books[6].price }
    );
    user2.likedBooks.push(books[2]._id, books[4]._id, books[8]._id);

    await user1.save();
    await user2.save();
    console.log('Sample purchase history and likes added');

    console.log('\n=== Seed Data Summary ===');
    console.log(`Admin credentials: admin@bookstore.com / admin123`);
    console.log(`Test user 1: john@test.com / test123`);
    console.log(`Test user 2: jane@test.com / test123`);
    console.log(`Books added: ${books.length}`);
    console.log('========================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
