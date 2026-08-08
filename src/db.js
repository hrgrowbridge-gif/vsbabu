const fs = require("fs");
const path = require("path");
const os = require("os");
const { isSupabaseConfigured, getSupabaseClient } = require("./supabase");

const isVercel = Boolean(process.env.VERCEL);
const defaultDbPath = isVercel
  ? path.join(os.tmpdir(), "vs-babu", "data", "complaints.json")
  : path.join(__dirname, "data", "complaints.json");
const dbPath = process.env.COMPLAINTS_DB_PATH || defaultDbPath;

function ensureDbFile() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
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

function normalizeComplaintRow(row) {
  return {
    ...row,
    id_proof_path: row.id_proof_path || (row.id_proof_filename ? `id-proof/${row.id_proof_filename}` : ""),
    complaint_photo_paths: row.complaint_photo_paths || (row.complaint_photo_filenames || []).map((name) => `complaint-photos/${name}`)
  };
}

async function insertComplaint(complaint) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const row = {
      full_name: complaint.fullName,
      phone: complaint.phone,
      street_name: complaint.streetName,
      area: complaint.area,
      email: complaint.email,
      grievance: complaint.grievance,
      id_proof_path: complaint.idProofPath,
      complaint_photo_paths: complaint.complaintPhotoPaths || [],
      created_at: complaint.createdAt
    };

    const { data, error } = await supabase
      .from("complaints")
      .insert(row)
      .select()
      .single();

    if (!error) {
      return normalizeComplaintRow(data);
    }

    const legacyRow = {
      full_name: complaint.fullName,
      phone: complaint.phone,
      street_name: complaint.streetName,
      area: complaint.area,
      email: complaint.email,
      grievance: complaint.grievance,
      id_proof_filename: (complaint.idProofPath || "").replace(/^id-proof\//, ""),
      complaint_photo_filenames: (complaint.complaintPhotoPaths || []).map((p) => p.replace(/^complaint-photos\//, "")),
      created_at: complaint.createdAt
    };

    const { data: legacyData, error: legacyError } = await supabase
      .from("complaints")
      .insert(legacyRow)
      .select()
      .single();

    if (legacyError) {
      throw new Error(`Failed to insert complaint: ${legacyError.message}`);
    }

    return normalizeComplaintRow(legacyData);
  }

  const db = readDb();

  const row = {
    id: db.nextId,
    full_name: complaint.fullName,
    phone: complaint.phone,
    street_name: complaint.streetName,
    area: complaint.area,
    email: complaint.email,
    grievance: complaint.grievance,
    id_proof_path: complaint.idProofPath,
    complaint_photo_paths: complaint.complaintPhotoPaths || [],
    created_at: complaint.createdAt
  };

  db.complaints.push(row);
  db.nextId += 1;

  writeDb(db);
  return row;
}

async function getAllComplaints() {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("complaints")
      .select("id, full_name, phone, street_name, area, email, grievance, id_proof_path, complaint_photo_paths, created_at")
      .order("created_at", { ascending: false });

    if (!error) {
      return (data || []).map(normalizeComplaintRow);
    }

    const { data: legacyData, error: legacyError } = await supabase
      .from("complaints")
      .select("id, full_name, phone, street_name, area, email, grievance, id_proof_filename, complaint_photo_filenames, created_at")
      .order("created_at", { ascending: false });

    if (legacyError) {
      throw new Error(`Failed to fetch complaints: ${legacyError.message}`);
    }

    return (legacyData || []).map(normalizeComplaintRow);
  }

  const db = readDb();
  return [...db.complaints]
    .map(normalizeComplaintRow)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

module.exports = {
  insertComplaint,
  getAllComplaints
};
