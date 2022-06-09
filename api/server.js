import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import md5 from "md5";

const chunkSize = 6000000;
// const chunkSize = 50120;
const fileList = [];
const app = express();
app.use(bodyParser.raw({ type: "application/octet-stream", limit: "100mb" }));
app.use(
  cors({
    origin: "http://104.154.225.244:4002",
    // origin: "http://localhost:4002",
  })
);
app.use("/uploads", express.static("uploads"));

//get temporry file upload location
const getTempFilePath = (name, fileId) => {
  return `./uploads/${fileId}-${name}`;
};

//generate unique id for file uploading
const generateUniqueId = (name, projectId) => {
  name.split(".").pop();
  const uniqueId = md5(projectId + name);
  return uniqueId;
};
//get uploaded chunks size
const getExistedChunks = (filePath) => {
  const file = fs.statSync(filePath);
  const existedChunks = Math.ceil(file.size / chunkSize);
  return existedChunks;
};

//create new file path and generate unique id for new upload request
app.get("/upload-request", (req, res) => {
  const { name, projectId } = req.query;
  const fileId = generateUniqueId(name, projectId);
  const tempFilePath = getTempFilePath(name, fileId);

  if (fs.existsSync(tempFilePath)) {
    const existedChunks = getExistedChunks(tempFilePath);
    res
      .status(200)
      .json({ exists: true, existedChunks: existedChunks, fileId: fileId });
    console.log("file already existed!");
  } else {
    fs.createWriteStream(tempFilePath, {
      flags: "w",
    });
    res.status(200).json({ fileId: fileId, existedChunks: 0 });
    console.log("new file path created : ", tempFilePath);
  }
});

app.post("/upload", (req, res) => {
  const { name, currentChunkIndex, totalChunks, fileId } = req.query;
  console.log("current recived chunk : ", currentChunkIndex);

  const tmpFilename = getTempFilePath(name, fileId);
  const existedChunks = getExistedChunks(tmpFilename);
  const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) - 1;
  const data = req.body.toString().split(",")[1];
  const buffer = new Buffer(data, "base64");

  fs.appendFileSync(tmpFilename, buffer);
  if (lastChunk) {
    res.status(200).json({ completed: true });
    console.log("file upload completed!");
  } else {
    res
      .status(200)
      .json({ uploaded: currentChunkIndex, existedChunks: existedChunks });
  }
});


app.listen(4001);
console.log("server listen to port 4001");

