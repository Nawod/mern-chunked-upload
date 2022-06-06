import axios from "axios";

//Worker.js
// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  // eslint-disable-next-line no-restricted-globals
  onmessage = (e) => {
    console.log("message received : ", e);

    //upload request
    const requestNewUpload = (data) => {
      const files = data.files;
      const currentFileIndex = data.currentFileIndex;
      const projectId = data.projectId;

      const file = files[currentFileIndex];

      const params = new URLSearchParams();
      params.set("name", file.name);
      params.set("projectId", projectId);

      const headers = { "Content-Type": "application/octet-stream" };
      const url = "http://localhost:4001/upload-request?" + params.toString();

      axios
        .post(url, file, { headers })
        .then((res) => {
          console.log(res.data);
          const fileId = res.data.fileId;
          const existedChunks = res.data.existedChunks;
          if (res.data.exists) {
            return {
              existed: true,
              fileId: fileId,
              existedChunks: existedChunks,
            };
          } else {
            return {
              existed: true,
              fileId: fileId,
              existedChunks: existedChunks,
            };
          }
        })
        .catch((error) => {
          console.log("error : ", error);
        });
    };

    const result = requestNewUpload(e.data);
    postMessage(result);
  };
};

// let code = Workercode.toString();
// code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));

// const blob = new Blob([code], { type: "application/javascript" });
// const worker_script = URL.createObjectURL(blob);

// module.exports = worker_script;
