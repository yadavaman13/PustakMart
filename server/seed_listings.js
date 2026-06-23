import mongoose from "mongoose";
import { userModel } from "./src/models/user.model.js";
import { listingModel } from "./src/models/listing.model.js";

const MONGO_URL = "mongodb+srv://yadavaman8511005211_db_user:cscWol639cAbUryF@pustakmart.yaeo3ya.mongodb.net/pustakMart";

const realBooks = [
  {
    listingType: "book",
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen, Charles E. Leiserson",
    description: "The standard textbook for algorithms and data structures. In brand new condition, no highlights, hardly used.",
    price: 650,
    condition: "like_new",
    category: "engineering",
    department: "Computer Science",
    semester: 3,
    images: [
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=60"
    ],
    city: "Mumbai",
    collegeName: "IIT Bombay"
  },
  {
    listingType: "book",
    title: "Concepts of Physics - Vol 1",
    author: "H.C. Verma",
    description: "Essential book for physics fundamentals. Some highlights on key chapters, otherwise in very clean condition.",
    price: 280,
    condition: "good",
    category: "competitive_exam",
    department: "Applied Physics",
    semester: 1,
    images: [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=60"
    ],
    city: "Pilani",
    collegeName: "BITS Pilani"
  },
  {
    listingType: "book",
    title: "Atomic Habits",
    author: "James Clear",
    description: "An easy and proven way to build good habits and break bad ones. Read once, pristine condition.",
    price: 180,
    condition: "new",
    category: "novel",
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=60"
    ],
    city: "Surat",
    collegeName: "SVNIT"
  },
  {
    listingType: "book",
    title: "Modern Operating Systems",
    author: "Andrew S. Tanenbaum",
    description: "Perfect for CS/IT undergraduates studying operating systems. Includes chapters on virtualization, security, and multi-core systems.",
    price: 490,
    condition: "good",
    category: "engineering",
    department: "Computer Engineering",
    semester: 4,
    images: [
      "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&auto=format&fit=crop&q=60"
    ],
    city: "Dahod",
    collegeName: "GEC Dahod"
  },
  {
    listingType: "book",
    title: "Quantitative Aptitude for Competitive Examinations",
    author: "R.S. Aggarwal",
    description: "One of the most popular books for CAT, GATE, Bank PO, and campus placements preparation. Useful shortcut techniques included.",
    price: 290,
    condition: "good",
    category: "competitive_exam",
    images: [
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=60"
    ],
    city: "Delhi",
    collegeName: "Delhi Technological University"
  },
  {
    listingType: "book",
    title: "The Alchemist",
    author: "Paulo Coelho",
    description: "A beautiful fable about following your dream. Highly inspiring read, pages are in good condition, softcover.",
    price: 120,
    condition: "good",
    category: "novel",
    images: [
      "https://images.unsplash.com/photo-1474932430478-367db26836c1?w=600&auto=format&fit=crop&q=60"
    ],
    city: "Delhi",
    collegeName: "NSUT"
  },
  {
    listingType: "book",
    title: "Fundamentals of Database Systems",
    author: "Ramez Elmasri, Shamkant B. Navathe",
    description: "Clear introduction to database fundamentals, models, designs, and security. Essential for database management courses.",
    price: 450,
    condition: "like_new",
    category: "engineering",
    department: "Information Technology",
    semester: 3,
    images: [
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=60"
    ],
    city: "Delhi",
    collegeName: "IIT Delhi"
  },
  {
    listingType: "book",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    description: "Pulitzer prize-winning classic. Excellent addition to any book lover's library. Paperback edition in clean state.",
    price: 150,
    condition: "good",
    category: "novel",
    images: [
      "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=600&auto=format&fit=crop&q=60"
    ],
    city: "Pilani",
    collegeName: "BITS Pilani"
  }
];

async function seed() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGO_URL);
    console.log("DB Connected!");

    const adminUser = await userModel.findOne({ email: "yadavaman8511005211@gmail.com" });
    if (!adminUser) {
      console.error("Admin user not found in the DB. Make sure the user is registered first.");
      process.exit(1);
    }

    console.log("Found seller user:", adminUser.name, "(ID:", adminUser._id, ")");

    // Clear existing active listings to keep data clean
    console.log("Deleting old active listings...");
    await listingModel.deleteMany({ seller: adminUser._id });

    const listingsToInsert = realBooks.map(book => ({
      ...book,
      seller: adminUser._id,
      status: "active"
    }));

    console.log("Seeding", listingsToInsert.length, "listings...");
    await listingModel.insertMany(listingsToInsert);
    console.log("Seeding completed successfully!");

    mongoose.connection.close();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
