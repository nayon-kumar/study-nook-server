const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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

const JWKS = createRemoteJWKSet(new URL(process.env.JWKS_URL));

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    // await client.connect();

    const db = client.db("study-nook");
    const roomsCollection = db.collection("rooms");
    const bookingsCollection = db.collection("bookings");

    // Get all rooms
    app.get("/rooms", async (req, res) => {
      const result = await roomsCollection.find().toArray();
      res.json(result);
    });

    // Get latest 6 room
    app.get("/rooms/latest", async (req, res) => {
      const result = await roomsCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      res.json(result);
    });

    // Add room
    app.post("/rooms", verifyToken, async (req, res) => {
      const newRoomData = req.body;
      const result = await roomsCollection.insertOne(newRoomData);
      res.json(result);
    });

    // Get only one room by ID
    app.get("/rooms/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await roomsCollection.findOne(query);
      res.json(result);
    });

    // Edit room details
    app.patch("/rooms/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      // Update room
      const result = await roomsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );

      // Update only display fields in bookings
      const bookingUpdate = {};

      if (updatedData.name) bookingUpdate.roomName = updatedData.name;
      if (updatedData.image) bookingUpdate.roomImage = updatedData.image;

      // Only update bookings if needed fields exist
      if (Object.keys(bookingUpdate).length > 0) {
        await bookingsCollection.updateMany(
          { roomID: id },
          { $set: bookingUpdate },
        );
      }

      res.json(result);
    });

    // Delete room
    app.delete("/rooms/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await roomsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    // Get my listings by userID
    app.get("/my-listings/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = {
        userID: id,
      };
      const result = await roomsCollection.find(query).toArray();
      res.json(result);
    });

    // Bookings
    app.post("/bookings", verifyToken, async (req, res) => {
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
    app.get("/bookings/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = {
        userId: id,
      };
      const result = await bookingsCollection.find(query).toArray();
      res.json(result);
    });

    // Cancel booking
    app.patch("/bookings/cancel/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      const result = await bookingsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: "cancelled",
          },
        },
      );

      res.json(result);
    });

    // await client.db("admin").command({ ping: 1 });
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
