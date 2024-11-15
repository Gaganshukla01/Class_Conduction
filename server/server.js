const express=require("express")
const app=express()
const port =process.env.PORT||3000

app.get('/',(req,res)=>{
res.send("Hello i am here")
})

app.listen(port,()=>{
    console.log(`Server is running .. on that link  http://localhost:${port}/#`)
})