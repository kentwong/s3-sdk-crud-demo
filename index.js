const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const { S3 } = require("@aws-sdk/client-s3");

const app = express();

// const s3Client = new S3({});
// await s3Client.createBucket(params);

app.use(express.static("public"));

const BUCKET_NAME = "s3-bucket-sdk-demo";

AWS.config.update({
  accessKeyId: "",
  secretAccessKey: "",
  region: "ap-southeast-2",
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/upload", upload.array("files"), (req, res) => {
  console.log("uploading...");
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files were uploaded");
  }
  const s3 = new AWS.S3();
  const uploadPromises = req.files.map((file) => {
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: file.originalname,
      Body: file.buffer,
    };
    return s3.upload(uploadParams).promise();
  });

  Promise.all(uploadPromises).then((data) => {
    data.forEach((uploadResult) => {
      console.log("file uploaded successfully");
      res.redirect("/");
    });
  });
});

app.get("/files", (req, res) => {
  const s3 = new AWS.S3();

  const listParams = {
    Bucket: BUCKET_NAME,
  };

  s3.listObjectsV2(listParams, (err, data) => {
    if (err) {
      console.error("Error fetching files: ", err);
      return res.status(500).send("internal server error");
    }

    const files = data.Contents.map((file) => ({
      name: file.Key,
      url: `https://${BUCKET_NAME}.s3.ap-southeast-2.amazonaws.com/${file.Key}`,
    }));

    res.json(files);
  });
});

app.get("/files/:name/download", (req, res) => {
  const s3 = new AWS.S3();
  const downloadParams = {
    Bucket: BUCKET_NAME,
    Key: req.params.name,
  };

  s3.getObject(downloadParams, (err, data) => {
    if (err) {
      console.error("Error downloading file: ", err);
      return res.status(500).send("internal server error");
    }
    res.attachment(req.params.name);
    res.send(data.Body);
  });
});

app.listen(5000, () => {
  console.log("App is listening on port 5000");
});
