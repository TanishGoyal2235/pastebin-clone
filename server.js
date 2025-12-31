import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";

dotenv.config();
const app = express();

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser:true, useUnifiedTopology:true });

const PasteSchema = new mongoose.Schema({
  pasteId:String,
  content:String,
  title:String,
  createdAt:{ type:Date, default:Date.now },
  expireAt:Date
});

PasteSchema.index({ expireAt:1 }, { expireAfterSeconds:0 });
const Paste = mongoose.model("Paste", PasteSchema);

app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended:false }));

app.get("/", (req,res)=>{
  res.render("index");
});

app.post("/create", async(req,res)=>{
  const { content,title,expires } = req.body;
  const pasteId = uuidv4().slice(0,8);

  let expireTime;
  if (expires === "10m") expireTime = new Date(Date.now()+10*60000);
  else if (expires === "1h") expireTime = new Date(Date.now()+60*60000);
  else expireTime = null;

  await Paste.create({ pasteId, content, title, expireAt:expireTime });
  res.redirect("/p/" + pasteId);
});

app.get("/p/:id", async(req,res)=>{
  const paste = await Paste.findOne({ pasteId:req.params.id });
  if(!paste) return res.send("Paste not found or expired");
  res.render("paste",{ content:paste.content, title:paste.title, id:req.params.id });
});

app.listen(3000, ()=> console.log("Running http://localhost:3000"));