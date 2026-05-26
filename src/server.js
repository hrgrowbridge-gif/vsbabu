require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const helmet = require("helmet");
const morgan = require("morgan");
const { insertComplaint, getAllComplaints } = require("./db");
const { isAuthenticated, isValidAdminPassword } = require("./auth");

const app = express();
const port = process.env.PORT || 3000;

const publicPath = path.join(__dirname, "public");
const idProofPath = path.join(__dirname, "uploads", "id-proof");
const complaintPhotosPath = path.join(__dirname, "uploads", "complaint-photos");

fs.mkdirSync(idProofPath, { recursive: true });
fs.mkdirSync(complaintPhotosPath, { recursive: true });

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "unsafe-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use(express.static(publicPath));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const acceptedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];

function fileFilter(req, file, cb) {
  if (acceptedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP, and PDF files are allowed."));
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "idProof") {
      cb(null, idProofPath);
      return;
    }
    cb(null, complaintPhotosPath);
  },
  filename: (req, file, cb) => {
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safeOriginalName}`);
  }
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6
  }
});

const complaintUpload = upload.fields([
  { name: "idProof", maxCount: 1 },
  { name: "complaintPhotos", maxCount: 5 }
]);

function validateComplaint(body, files) {
  const errors = [];
  const fullName = (body.fullName || "").trim();
  const phone = (body.phone || "").trim();
  const streetName = (body.streetName || "").trim();
  const area = (body.area || "").trim();
  const email = (body.email || "").trim();
  const grievance = (body.grievance || "").trim();

  if (!fullName) errors.push("Name is required.");
  if (!/^\d{10}$/.test(phone)) errors.push("Phone number must be 10 digits.");
  if (!streetName) errors.push("Street name is required.");
  if (area.toLowerCase() !== "kolathur") errors.push("Area must be Kolathur only.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required.");
  if (!grievance || grievance.length < 20) {
    errors.push("Please enter grievance details (minimum 20 characters).");
  }

  const idProof = files?.idProof?.[0];
  if (!idProof) errors.push("ID proof upload is required.");

  return {
    errors,
    normalized: {
      fullName,
      phone,
      streetName,
      area: "Kolathur",
      email,
      grievance
    }
  };
}

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/portfolio", (req, res) => {
  res.render("portfolio");
});

app.get("/tvk-vakuruthigal", (req, res) => {
  res.render("tvk-vakuruthigal");
});

app.get("/initiatives", (req, res) => {
  res.render("initiatives");
});

app.get("/complaint", (req, res) => {
  res.render("complaint", {
    successMessage: req.query.success || "",
    errorMessage: req.query.error || ""
  });
});

app.post("/complaints", (req, res) => {
  complaintUpload(req, res, (err) => {
    if (err) {
      return res.redirect(`/complaint?error=${encodeURIComponent(err.message)}`);
    }

    const { errors, normalized } = validateComplaint(req.body, req.files);

    if (errors.length) {
      return res.redirect(`/complaint?error=${encodeURIComponent(errors.join(" "))}`);
    }

    const idProofFilename = req.files.idProof[0].filename;
    const complaintPhotoFilenames = (req.files.complaintPhotos || []).map((f) => f.filename);

    insertComplaint({
      ...normalized,
      idProofFilename,
      complaintPhotoFilenames,
      createdAt: new Date().toISOString()
    });

    return res.redirect("/complaint?success=Your complaint has been submitted successfully.");
  });
});

app.get("/secure-mla-login", (req, res) => {
  res.render("admin-login", {
    errorMessage: req.query.error || ""
  });
});

app.post("/secure-mla-login", async (req, res) => {
  const username = (req.body.username || "").trim();
  const password = req.body.password || "";

  if (username !== process.env.ADMIN_USERNAME) {
    return res.redirect("/secure-mla-login?error=Invalid credentials");
  }

  const passwordOk = await isValidAdminPassword(password);

  if (!passwordOk) {
    return res.redirect("/secure-mla-login?error=Invalid credentials");
  }

  req.session.isAdminLoggedIn = true;
  req.session.adminUsername = username;

  return res.redirect("/admin/dashboard");
});

app.post("/admin/logout", isAuthenticated, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/secure-mla-login");
  });
});

app.get("/admin/dashboard", isAuthenticated, (req, res) => {
  const complaints = getAllComplaints();
  res.render("admin-dashboard", {
    complaints,
    adminUsername: req.session.adminUsername
  });
});

app.get("/admin/uploads/:type/:filename", isAuthenticated, (req, res) => {
  const { type, filename } = req.params;

  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return res.status(400).send("Invalid file name");
  }

  let baseDir;
  if (type === "id-proof") {
    baseDir = idProofPath;
  } else if (type === "complaint-photos") {
    baseDir = complaintPhotosPath;
  } else {
    return res.status(404).send("File type not found");
  }

  const absoluteFile = path.join(baseDir, filename);
  if (!absoluteFile.startsWith(baseDir)) {
    return res.status(400).send("Invalid path");
  }

  if (!fs.existsSync(absoluteFile)) {
    return res.status(404).send("File not found");
  }

  return res.sendFile(absoluteFile);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong.");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
