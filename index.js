const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();
const port = process.env.PORT || 8000;
const uri = process.env.MONGODB_URI;

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("study-nook");
    const roomsCollection = db.collection("rooms");
    const bookingsCollection = db.collection("bookings");

    // Get all rooms
    app.get("/rooms", async (req, res) => {
      const result = await roomsCollection.find().toArray();
      res.json(result);
    });

    // Add room
    app.post("/rooms", async (req, res) => {
      const newRoomData = req.body;
      const result = await roomsCollection.insertOne(newRoomData);
      res.json(result);
    });

    // Get only one room by ID
    app.get("/rooms/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await roomsCollection.findOne(query);
      res.json(result);
    });

    // Edit room details
    app.patch("/rooms/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await roomsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );
      res.json(result);
    });

    // Delete room
    app.delete("/rooms/:id", async (req, res) => {
      const id = req.params.id;
      const result = await roomsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    // Get my listings by userID
    app.get("/my-listings/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        userID: id,
      };
      const result = await roomsCollection.find(query).toArray();
      res.json(result);
    });

    // Bookings
    app.post("/bookings", async (req, res) => {
      try {
        const bookingData = req.body;

        const newStart = bookingData.startTime;
        const newEnd = bookingData.endTime;

        // CHECK CONFLICT
        const conflict = await bookingsCollection.findOne({
          roomID: bookingData.roomID,
          bookingDate: bookingData.bookingDate,
          $expr: {
            $and: [
              { $lt: [newStart, { $toInt: "$endTime" }] },
              { $gt: [newEnd, { $toInt: "$startTime" }] },
            ],
          },
        });

        if (conflict) {
          return res.status(409).json({
            success: false,
            message: "This time slot is already booked",
          });
        }

        // Insert booking
        const result = await bookingsCollection.insertOne({
          ...bookingData,
          createdAt: new Date(),
        });

        // update room count
        await roomsCollection.updateOne(
          { _id: new ObjectId(bookingData.roomID) },
          { $inc: { bookings: 1 } },
        );

        res.json({
          success: true,
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });

    // Get my bookings by userID
    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        userId: id,
      };
      const result = await bookingsCollection.find(query).toArray();
      res.json(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running fine");
});

app.listen(port, () => {
  console.log(`Server is running on: ${port}`);
});
