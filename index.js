const express = require("express");
const multer = require("multer");

const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");

const app = express();

app.use(express.static("public"));

const BUCKET_NAME = "s3-bucket-sdk-demo";

const s3Client = new S3Client({
  region: "ap-southeast-2",
  credentials: {
    accessKeyId: "AKIA2RFZOYTCWC6KBD5A",
    secretAccessKey: "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",
  },
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/upload", upload.array("files"), async (req, res) => {
  console.log("uploading...");

  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files were uploaded");
  }

  const uploadPromises = req.files.map(async (file) => {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.originalname,
      Body: file.buffer,
    });

    await s3Client.send(command);
  });

  await Promise.all(uploadPromises);

  console.log("All files uploaded");
  res.redirect("/");
});

app.get("/files", async (req, res) => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
  });

  try {
    const data = await s3Client.send(command);

    const files = data.Contents.map((file) => ({
      name: file.Key,
      url: `https://${BUCKET_NAME}.s3.ap-southeast-2.amazonaws.com/${file.Key}`,
    }));

    res.json(files);
  } catch (err) {
    console.error("Error fetching files", err);
    res.status(500).send("Error fetching files");
  }
});

app.get("/files/:name/download", async (req, res) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: req.params.name,
  });

  try {
    const data = await s3Client.send(command);

    // Body property returned by GetObjectCommand is a stream, and Express is trying to JSON.stringify
    // By piping the Body stream to the response, it will stream the download data instead of trying to stringify it.
    // piping directly to the response is the simplest in this case.
    data.Body.pipe(res);
    res.attachment(req.params.name);
  } catch (err) {
    console.error("Error downloading file", err);
    res.status(500).send("Error downloading file");
  }
});

app.listen(5000, () => {
  console.log("App is listening on port 5000");
});
