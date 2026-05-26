const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "data", "complaints.json");

function ensureDbFile() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ nextId: 1, complaints: [] }, null, 2), "utf8");
  }
}

function readDb() {
  ensureDbFile();
  const raw = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
}

function insertComplaint(complaint) {
  const db = readDb();

  const row = {
    id: db.nextId,
    full_name: complaint.fullName,
    phone: complaint.phone,
    street_name: complaint.streetName,
    area: complaint.area,
    email: complaint.email,
    grievance: complaint.grievance,
    id_proof_filename: complaint.idProofFilename,
    complaint_photo_filenames: complaint.complaintPhotoFilenames || [],
    created_at: complaint.createdAt
  };

  db.complaints.push(row);
  db.nextId += 1;

  writeDb(db);
  return row;
}

function getAllComplaints() {
  const db = readDb();
  return [...db.complaints].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

module.exports = {
  insertComplaint,
  getAllComplaints
};
