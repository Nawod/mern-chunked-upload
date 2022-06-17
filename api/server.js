import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import md5 from "md5";

const fileList = [];
const app = express();
app.use(bodyParser.raw({ type: "application/octet-stream", limit: "100mb" }));
app.use(
  cors({
    origin: "http://104.154.225.244:4200",
    // origin: "http://localhost:4200",
  })
);
app.use("/uploads", express.static("uploads"));

//get temporry file upload location
const getTempFilePath = (name, fileId) => {
  return `./uploads/${fileId}-${name}`;
};

//generate unique id for file uploading
const generateUniqueId = (name, taskId) => {
  name.split(".").pop();
  const uniqueId = md5(taskId + name);
  return uniqueId;
};
//get uploaded chunks size
const getExistedChunks = (filePath, chunkSize) => {
  const file = fs.statSync(filePath);
  const existedChunks = Math.ceil(file.size / chunkSize);
  return existedChunks;
};

//create new file path and generate unique id for new upload request
app.get("/upload-request", (req, res) => {
  const { name, taskId, chunkSize, currentFileIndex } = req.query;
  const fileId = generateUniqueId(name, taskId);
  const tempFilePath = getTempFilePath(name, fileId);

  if (fs.existsSync(tempFilePath)) {
    const existedChunks = getExistedChunks(tempFilePath, chunkSize);
    res
      .status(200)
      .json({ exists: true, existedChunks: existedChunks, fileId: fileId });
    console.log("file ", currentFileIndex + 1, " already existed! fileId : ", fileId);
  } else {
    fs.createWriteStream(tempFilePath, {
      flags: "w",
    });
    res.status(200).json({ fileId: fileId, existedChunks: 0 });
    console.log("new file path created : ", tempFilePath);
  }
});

app.post("/upload", (req, res) => {
  const { name, currentChunkIndex, totalChunks, fileId, chunkSize, currentFileIndex } = req.query;
  console.log("current recived chunk : ", currentChunkIndex, " for FileID : ", fileId);

  const tmpFilename = getTempFilePath(name, fileId);
  const existedChunks = getExistedChunks(tmpFilename, chunkSize);
  const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) - 1;
  const data = req.body.toString().split(",")[1];
  const buffer = new Buffer(data, "base64");

  fs.appendFileSync(tmpFilename, buffer);
  if (lastChunk) {
    res.status(200).json({ completed: true });
    console.log("file ", currentFileIndex + 1, " upload completed! fileId : ", fileId);
  } else {
    res
      .status(200)
      .json({ uploaded: currentChunkIndex, existedChunks: existedChunks });
  }
});


app.listen(4001);
console.log("server listen to port 4001");

