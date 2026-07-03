const mongoose = require("mongoose");

const uri =
  "mongodb+srv://matrientry:eW9gqkL1frPLyavl@matrientry-db.mwwqcbw.mongodb.net/?retryWrites=true&w=majority&appName=matrientry-db";

mongoose
  .connect(uri)
  .then(() => {
    console.log("✅ Connected Successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ ERROR:");
    console.error(err);
    process.exit(1);
  });