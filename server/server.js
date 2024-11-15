const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());




app.get("/", (req, res) => {
  res.send("Hello World!");
});



app.get("/api/data", (req, res) => {
  res.json({
    message: "This is some sample data.",
    success: true,
  });
});

app.post("/api/data", (req, res) => {
  const data = req.body;
  res.json({
    message: "Data received successfully!",
    data: data,
  });
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
