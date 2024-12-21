import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static("public")); // Serve static files
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.json()); // Parse JSON data

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads")); // Save files to the "uploads" directory
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage });

// Utility function to list files recursively
const getFilesRecursively = (
  dirPath: string,
  basePath: string = ""
): string[] => {
  const files: string[] = [];
  const items = fs.readdirSync(dirPath);

  items.forEach((item) => {
    const fullPath = path.join(dirPath, item);
    const relativePath = path.join(basePath, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getFilesRecursively(fullPath, relativePath));
    } else {
      files.push(relativePath);
    }
  });

  return files;
};

// Get local network IP address
const getLocalIPAddress = (): string | null => {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const networkInterfaces = interfaces[interfaceName];
    if (!networkInterfaces) continue;

    for (const iface of networkInterfaces) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
};

// Routes
app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

app.get("/download", (req: Request, res: Response) => {
  const files = getFilesRecursively(path.join(__dirname, "../../"));
  res.render("download", { files });
});

app.get("/download/:fileName", (req: Request, res: Response) => {
  const filePath = path.join(__dirname, "../../", req.params.fileName);
  res.download(filePath);
});

app.get("/upload", (req: Request, res: Response) => {
  res.render("upload");
});

app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).send("No file uploaded.");
  }
  res.redirect("/");
});

// Start the server
app.listen(PORT, () => {
  const localIP = getLocalIPAddress();
  console.log(`Server running at:`);
  console.log(`- Local: http://localhost:${PORT}`);
  if (localIP) {
    console.log(`- Network: http://${localIP}:${PORT}`);
  }
});
