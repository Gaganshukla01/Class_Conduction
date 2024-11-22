<<<<<<< HEAD
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
=======
const express=require("express")
const app=express()
const port =process.env.PORT||3000

app.get('/',(req,res)=>{
res.send("Hello i am here")
})

app.listen(port,()=>{
    console.log(`Server is running .. on that link  http://localhost:${port}/#`)
})
>>>>>>> 8bce218c31c5ae82a53d387b7782bd5e13a60512
