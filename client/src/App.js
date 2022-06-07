import { useState, useEffect } from "react";
import axios from "axios";
import "./App.scss";
import Worker from "./Worker";
import WorkerBuilder from "./worker-builder";

function App() {
  const chunkSize = 6000000;
  // const chunkSize = 50120;
  const projectId = 1234;
  const [files, setFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [lastUploadedFileIndex, setLastUploadedFileIndex] = useState(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [detail, setDetail] = useState("");
  const [btnTitle, setBtnTitle] = useState("Upload");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // const worker = new WorkerBuilder(Worker);

  // useEffect(() => {
  //   worker.onmessage = (e) => {
  //     console.log("from worker : ", e);
  //   };
  // }, []);

  // const handleWorker = () => {
  //   worker.postMessage({
  //     files: files,
  //     currentFileIndex: currentFileIndex,
  //     projectId: projectId,
  //   });
  // };

  //upload request
  const requestNewUpload = () => {
    const file = files[currentFileIndex];

    const params = new URLSearchParams();
    params.set("name", file.name);
    params.set("projectId", projectId);

    const headers = { "Content-Type": "application/octet-stream" };
    const url =
      "http://104.154.225.244:4001/upload-request?" + params.toString();

    axios
      .post(url, file, { headers })
      .then((res) => {
        console.log("from upload request", res.data);
        const fileId = res.data.fileId;
        const totalChunks = Math.ceil(files[currentFileIndex].size / chunkSize);
        const existedChunks = res.data.existedChunks;
        if (res.data.exists) {
          console.log("file already exists!", totalChunks);
          setDetail("file already exists! Uploaded Chunks :" + existedChunks);
          if (totalChunks === existedChunks) {
            file.completed = true;
            console.log(currentFileIndex, " - Uploaded");
            setLastUploadedFileIndex(currentFileIndex);
            setCurrentChunkIndex(null);
          } else {
            // setCurrentChunkIndex(existedChunks);
            readAndUploadCurrentChunk(fileId, existedChunks);
          }
        } else {
          readAndUploadCurrentChunk(fileId, existedChunks);
        }
      })
      .catch((error) => {
        console.log("error : ", error);
      });
  };

  //split the select file into chunks
  const readAndUploadCurrentChunk = (fileId, existedChunks) => {
    const reader = new FileReader();
    const file = files[currentFileIndex];
    if (!file) {
      return;
    }

    const from = existedChunks * chunkSize;
    const to = from + chunkSize;
    const blob = file.slice(from, to);
    reader.onload = (e) => uploadChunk(e, fileId, existedChunks);
    reader.readAsDataURL(blob);
  };

  //upload the chunk file
  const uploadChunk = (readerEvent, fileId, existedChunks) => {
    const file = files[currentFileIndex];
    const data = readerEvent.target.result;

    const params = new URLSearchParams();
    params.set("name", file.name);
    params.set("size", file.size);
    params.set("fileId", fileId);
    params.set("currentChunkIndex", existedChunks);
    params.set("totalChunks", Math.ceil(file.size / chunkSize));

    const headers = { "Content-Type": "application/octet-stream" };
    const url = "http://104.154.225.244:4001/upload?" + params.toString();

    axios
      .post(url, data, { headers })
      .then((res) => {
        console.log("from upload", res.data);

        if (res.data.completed) {
          file.completed = true;
          setDetail("File upload completed!");
          console.log(currentFileIndex, " - Uploaded");
          setLastUploadedFileIndex(currentFileIndex);
          setCurrentChunkIndex(null);
        } else {
          setCurrentChunkIndex(existedChunks + 1);
        }
      })
      .catch((error) => {
        console.log("error : ", error);
      });
  };

  useEffect(() => {
    if (lastUploadedFileIndex === null) {
      return;
    }
    const isLastFile = lastUploadedFileIndex === files.length - 1;
    const nextFileIndex = isLastFile ? null : currentFileIndex + 1;
    setIsUploading(isLastFile ? false : true);
    setBtnTitle(isLastFile ? "Upload" : "Resume");
    setCurrentFileIndex(nextFileIndex);
  }, [lastUploadedFileIndex]);

  //set current uploading file index
  useEffect(() => {
    if (files.length > 0) {
      if (currentFileIndex === null) {
        setCurrentFileIndex(
          lastUploadedFileIndex === null ? 0 : lastUploadedFileIndex + 1
        );
      }
    }
  }, [files.length]);

  // when uploading new file change current chunk index to initail state
  useEffect(() => {
    if (currentFileIndex !== null) {
      setCurrentChunkIndex(0);
      setBtnTitle("Upload");
    }
  }, [currentFileIndex]);

  useEffect(() => {
    if (isUploading && currentChunkIndex !== null) {
      requestNewUpload();
    }
  }, [currentChunkIndex, isUploading]);

  //add selected files to the list
  const selectFiles = (e) => {
    setFiles([...files, ...e.target.files]);
  };

  const uploadButtonHandler = () => {
    if (currentChunkIndex !== null) {
      // requestNewUpload();
      if (isUploading) {
        setIsUploading(false);
        setBtnTitle("Resume");
      } else {
        setIsUploading(true);
        setBtnTitle("Pause");
      }
    }
    // handleWorker();
  };

  //get user's online statues
  const updateOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };
  useEffect(() => {
    document.addEventListener("DOMContentLoaded", function () {
      updateOnlineStatus();
      window.addEventListener("online", updateOnlineStatus);
      window.addEventListener("offline", updateOnlineStatus);
    });
  }, []);

  return (
    <div className="main-container">
      <div className="monitor">{detail}</div>
      <div className="button-row">
        <input
          className="upload-button"
          type="file"
          multiple
          onChange={selectFiles}
        />
        <button className="upload" onClick={uploadButtonHandler}>
          {currentChunkIndex === null ? "Upload" : btnTitle}
        </button>
      </div>
      <div className="files">
        {files.map((file, fileIndex) => {
          let progress = 0;
          if (file.completed) {
            progress = 100;
          } else {
            const uploading = fileIndex === currentFileIndex;
            const chunks = Math.ceil(file.size / chunkSize);
            if (uploading) {
              progress = Math.round((currentChunkIndex / chunks) * 100);
            } else {
              progress = 0;
            }
          }
          return (
            <div className="progress-container" key={fileIndex}>
              <div
                className={"progress-bar " + (progress === 100 ? "done" : "")}
                style={{ width: progress + "%" }}
              >
                {progress}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
