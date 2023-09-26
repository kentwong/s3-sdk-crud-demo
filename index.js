const express = require("express");
const multer = require("multer");

const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");
const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");

const app = express();

app.use(express.static("public"));

async function getS3Client() {
  // generate temporary credentials
  const stsClient = new STSClient({ region: "ap-southeast-2" });

  // Build unique session name
  const now = new Date();
  const sessionName = `session-${now.getTime()}`;

  const assumeRoleCommand = new AssumeRoleCommand({
    RoleArn: "arn:aws:iam::724090930373:role/s3-test-role",
    RoleSessionName: sessionName,
  });

  const creds = await stsClient.send(assumeRoleCommand);

  const s3Client = new S3Client({
    region: "ap-southeast-2",
    credentials: {
      accessKeyId: creds.Credentials.AccessKeyId,
      secretAccessKey: creds.Credentials.SecretAccessKey,
      sessionToken: creds.Credentials.SessionToken,
    },
  });

  return s3Client;
}

const BUCKET_NAME = "s3-bucket-sdk-demo";

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/upload", upload.array("files"), async (req, res) => {
  console.log("uploading...");
  const s3 = await getS3Client();

  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files were uploaded");
  }

  const uploadPromises = req.files.map(async (file) => {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.originalname,
      Body: file.buffer,
    });

    await s3.send(command);
  });

  await Promise.all(uploadPromises);

  console.log("All files uploaded");
  res.redirect("/");
});

app.get("/files", async (req, res) => {
  const s3 = await getS3Client();
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
  });

  try {
    const data = await s3.send(command);

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
  const s3 = await getS3Client();
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: req.params.name,
  });

  try {
    const data = await s3.send(command);

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
