import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { db, storage } from "../../firebase";
import type {
  AppNotification,
  AppUser,
  Complaint,
  ComplaintSeverity,
  ComplaintStatus,
  InternalNote,
  LocationVerificationStatus,
  Officer,
  PublicUpdate,
  TimelineEvent,
  TimelineEventType,
  UserRole,
} from "../types";
import { isDepartmentRole, isSuperAdminRole } from "../types";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeComplaint(id: string, data: DocumentData): Complaint {
  const imageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls
    : data.imageUrl
      ? [data.imageUrl]
      : [];

  return {
    id,
    userId: data.userId ?? "",
    userEmail: data.userEmail ?? "",
    userName: data.userName ?? "Citizen",
    userPhone: data.userPhone ?? "",
    issueType: data.issueType ?? data.category ?? "Other",
    severity: data.severity ?? "Medium",
    priority: data.priority ?? data.severity ?? "Medium",
    titleEn: data.titleEn ?? data.title ?? data.category ?? "Civic issue",
    titleKn: data.titleKn ?? data.titleEn ?? data.title ?? "Civic issue",
    descriptionEn: data.descriptionEn ?? data.description ?? "",
    descriptionKn: data.descriptionKn ?? data.descriptionEn ?? data.description ?? "",
    department: data.department ?? "Other",
    urgency: data.urgency ?? "",
    confidence: Number(data.confidence ?? 0),
    location: data.location ?? "Location unavailable",
    reverseGeocodedAddress: data.reverseGeocodedAddress ?? data.location ?? "",
    coords: data.coords ?? null,
    extraDesc: data.extraDesc ?? "",
    imageUrl: data.imageUrl ?? imageUrls[0] ?? "",
    imageUrls,
    imagePath: data.imagePath,
    status: data.status ?? "Pending",
    locationVerification: data.locationVerification ?? data.verificationStatus ?? "pending",
    verificationStatus: data.verificationStatus ?? data.locationVerification ?? "pending",
    assignedTo: data.assignedTo ?? "",
    assignedOfficerId: data.assignedOfficerId ?? "",
    assignedOfficerName: data.assignedOfficerName ?? "",
    adminNote: data.adminNote ?? "",
    votes: {
      urgent: Number(data.votes?.urgent ?? 0),
      needsAttention: Number(data.votes?.needsAttention ?? data.votes?.notUrgent ?? 0),
      alreadyFixed: Number(data.votes?.alreadyFixed ?? 0),
    },
    voterIds: data.voterIds ?? {},
    heroPoints: Number(data.heroPoints ?? 50),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? data.createdAt ?? null,
    statusHistory: data.statusHistory ?? [],
    timeline: data.timeline ?? [],
    internalNotes: data.internalNotes ?? [],
    publicUpdates: data.publicUpdates ?? [],
  };
}

function normalizeOfficer(id: string, data: DocumentData): Officer {
  return {
    id,
    name: data.name ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    department: data.department ?? "",
    designation: data.designation ?? "",
    active: data.active !== false,
    assignedCount: Number(data.assignedCount ?? 0),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function normalizeNotification(id: string, data: DocumentData): AppNotification {
  return {
    id,
    userId: data.userId ?? "",
    complaintId: data.complaintId ?? "",
    type: data.type ?? "status_change",
    title: data.title ?? "",
    message: data.message ?? "",
    read: Boolean(data.read),
    createdAt: data.createdAt ?? null,
  };
}

function newestFirst(items: Complaint[]) {
  return items.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

function parseAdminEmails(envKey: string, fallback: string) {
  return (import.meta.env[envKey] ?? fallback)
    .split(",")
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);
}

function resolveRole(email: string): UserRole {
  const superEmails = parseAdminEmails("VITE_ADMIN_EMAILS", "admin@prajashakthi.in");
  const deptConfig = (import.meta.env.VITE_DEPT_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry: string) => entry.trim())
    .filter(Boolean);

  if (superEmails.includes(email.toLowerCase())) return "super_admin";

  for (const entry of deptConfig) {
    const [deptEmail] = entry.split(":").map((part) => part.trim());
    if (deptEmail?.toLowerCase() === email.toLowerCase()) return "department_admin";
  }

  return "citizen";
}

function resolveDepartment(email: string): string {
  const deptConfig = (import.meta.env.VITE_DEPT_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry: string) => entry.trim())
    .filter(Boolean);

  for (const entry of deptConfig) {
    const [deptEmail, department] = entry.split(":").map((part) => part.trim());
    if (deptEmail?.toLowerCase() === email.toLowerCase()) return department ?? "";
  }
  return "";
}

export function subscribeToComplaints(
  callback: (complaints: Complaint[]) => void,
  userId?: string,
  onError?: (error: Error) => void,
): Unsubscribe {
  const base = collection(db, "complaints");
  const source = userId ? query(base, where("userId", "==", userId)) : base;
  return onSnapshot(
    source,
    (snapshot) => {
      callback(newestFirst(snapshot.docs.map((item) => normalizeComplaint(item.id, item.data()))));
    },
    (error) => onError?.(error),
  );
}

export function subscribeToAllComplaints(
  callback: (complaints: Complaint[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const base = collection(db, "complaints");
  return onSnapshot(
    base,
    (snapshot) => {
      callback(newestFirst(snapshot.docs.map((item) => normalizeComplaint(item.id, item.data()))));
    },
    (error) => onError?.(error),
  );
}

export function subscribeToComplaint(
  id: string,
  callback: (complaint: Complaint | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, "complaints", id),
    (snapshot) => {
      callback(snapshot.exists() ? normalizeComplaint(snapshot.id, snapshot.data()) : null);
    },
    (error) => onError?.(error),
  );
}

export async function getComplaint(id: string) {
  const snapshot = await getDoc(doc(db, "complaints", id));
  return snapshot.exists() ? normalizeComplaint(snapshot.id, snapshot.data()) : null;
}

export async function uploadComplaintImage(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void,
) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `complaints/${userId}/${Date.now()}-${safeName}`;
  const imageRef = ref(storage, path);
  const task = uploadBytesResumable(imageRef, file, { contentType: file.type });

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => onProgress?.((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      reject,
      resolve,
    );
  });

  return { imageUrl: await getDownloadURL(task.snapshot.ref), imagePath: path };
}

export async function ensureUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}) {
  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);
  const email = user.email ?? "";
  const role = resolveRole(email);
  const department = resolveDepartment(email);

  if (!existing.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email,
      displayName: user.displayName ?? email.split("@")[0] ?? "Citizen",
      photoURL: user.photoURL ?? "",
      role,
      department: department || null,
      heroPoints: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    const existingData = existing.data();
    const updates: Record<string, unknown> = {
      email,
      displayName: user.displayName ?? existingData.displayName ?? "Citizen",
      photoURL: user.photoURL ?? existingData.photoURL ?? "",
      updatedAt: serverTimestamp(),
    };
    if (isSuperAdminRole(role) && existingData.role === "citizen") {
      updates.role = role;
      updates.department = department || null;
    }
    await updateDoc(userRef, updates);
  }
}

export function subscribeToUserProfile(
  uid: string,
  callback: (profile: AppUser | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as AppUser) : null);
  });
}

export function subscribeToUsers(callback: (users: AppUser[]) => void): Unsubscribe {
  return onSnapshot(collection(db, "users"), (snapshot) => {
    callback(snapshot.docs.map((item) => item.data() as AppUser));
  });
}

export function subscribeToOfficers(
  callback: (officers: Officer[]) => void,
  department?: string,
): Unsubscribe {
  const base = collection(db, "officers");
  const source = department ? query(base, where("department", "==", department)) : base;
  return onSnapshot(source, (snapshot) => {
    callback(snapshot.docs.map((item) => normalizeOfficer(item.id, item.data())));
  });
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void,
): Unsubscribe {
  const source = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(source, (snapshot) => {
    callback(snapshot.docs.map((item) => normalizeNotification(item.id, item.data())));
  });
}

async function createNotification(input: {
  userId: string;
  complaintId: string;
  type: AppNotification["type"];
  title: string;
  message: string;
}) {
  await addDoc(collection(db, "notifications"), {
    ...input,
    read: false,
    createdAt: serverTimestamp(),
  });
}

function buildTimelineEvent(
  type: TimelineEventType,
  title: string,
  actor?: { id: string; name: string },
  extra?: Partial<TimelineEvent>,
): TimelineEvent {
  return {
    id: generateId(),
    type,
    title,
    actorId: actor?.id,
    actorName: actor?.name,
    at: serverTimestamp() as TimelineEvent["at"],
    isPublic: extra?.isPublic ?? false,
    description: extra?.description,
    status: extra?.status,
  };
}

export async function updateComplaintStatus(
  complaintId: string,
  status: ComplaintStatus,
  assignedTo: string,
  adminNote: string,
) {
  return updateComplaintWorkflow(complaintId, {
    status,
    assignedTo,
    adminNote,
    actor: { id: "system", name: "Department" },
  });
}

export async function updateComplaintWorkflow(
  complaintId: string,
  input: {
    status?: ComplaintStatus;
    assignedTo?: string;
    assignedOfficerId?: string;
    assignedOfficerName?: string;
    adminNote?: string;
    actor: { id: string; name: string };
    timelineTitle?: string;
    timelineDescription?: string;
    notifyCitizen?: boolean;
  },
) {
  const complaintRef = doc(db, "complaints", complaintId);
  const snapshot = await getDoc(complaintRef);
  if (!snapshot.exists()) throw new Error("Complaint not found");

  const data = snapshot.data();
  const history = data.statusHistory ?? [];
  const timeline: TimelineEvent[] = data.timeline ?? [];
  const status = input.status ?? data.status;
  const adminNote = input.adminNote ?? data.adminNote ?? "";
  const assignedTo = input.assignedTo ?? data.assignedTo ?? "";
  const assignedOfficerId = input.assignedOfficerId ?? data.assignedOfficerId ?? "";
  const assignedOfficerName = input.assignedOfficerName ?? data.assignedOfficerName ?? "";

  const statusChanged = status !== data.status;
  const timelineEvent = buildTimelineEvent(
    statusChanged ? "progress" : "note",
    input.timelineTitle ?? `Status updated to ${status}`,
    input.actor,
    {
      description: input.timelineDescription ?? adminNote,
      status,
      isPublic: Boolean(adminNote),
    },
  );

  const updates: Record<string, unknown> = {
    status,
    assignedTo,
    assignedOfficerId,
    assignedOfficerName,
    adminNote,
    updatedAt: serverTimestamp(),
    statusHistory: statusChanged
      ? [
          ...history,
          {
            status,
            at: new Date(),
            note: adminNote,
            actorId: input.actor.id,
            actorName: input.actor.name,
          },
        ]
      : history,
    timeline: [...timeline, timelineEvent],
  };

  if (status === "Resolved") {
    updates.heroPoints = Number(data.heroPoints ?? 50) + 100;
  }

  await updateDoc(complaintRef, updates);

  if (input.notifyCitizen !== false && statusChanged) {
    const notificationType =
      status === "Resolved" ? "resolved" : status === "Rejected" ? "rejected" : "status_change";
    await createNotification({
      userId: data.userId,
      complaintId,
      type: notificationType,
      title: `Complaint ${status}`,
      message: adminNote || `Your complaint status has been updated to ${status}.`,
    });
  }

  if (assignedOfficerId && assignedOfficerId !== data.assignedOfficerId) {
    const officerRef = doc(db, "officers", assignedOfficerId);
    const officerSnap = await getDoc(officerRef);
    if (officerSnap.exists()) {
      await updateDoc(officerRef, {
        assignedCount: Number(officerSnap.data().assignedCount ?? 0) + 1,
        updatedAt: serverTimestamp(),
      });
    }
    if (data.assignedOfficerId) {
      const prevRef = doc(db, "officers", data.assignedOfficerId);
      const prevSnap = await getDoc(prevRef);
      if (prevSnap.exists()) {
        await updateDoc(prevRef, {
          assignedCount: Math.max(0, Number(prevSnap.data().assignedCount ?? 1) - 1),
          updatedAt: serverTimestamp(),
        });
      }
    }
  }
}

export async function verifyComplaintLocation(
  complaintId: string,
  verification: LocationVerificationStatus,
  actor: { id: string; name: string },
  note?: string,
) {
  const complaintRef = doc(db, "complaints", complaintId);
  const snapshot = await getDoc(complaintRef);
  if (!snapshot.exists()) throw new Error("Complaint not found");

  const timeline: TimelineEvent[] = snapshot.data().timeline ?? [];
  const labels: Record<LocationVerificationStatus, string> = {
    pending: "Location pending verification",
    verified: "Location verified",
    fake: "Location marked as fake",
    duplicate: "Location marked as duplicate",
    outside_jurisdiction: "Location outside jurisdiction",
  };

  await updateDoc(complaintRef, {
    locationVerification: verification,
    verificationStatus: verification,
    updatedAt: serverTimestamp(),
    timeline: [
      ...timeline,
      buildTimelineEvent("location_verified", labels[verification], actor, {
        description: note,
        isPublic: verification === "verified",
      }),
    ],
  });
}

export async function addInternalNote(
  complaintId: string,
  text: string,
  author: { id: string; name: string },
) {
  const complaintRef = doc(db, "complaints", complaintId);
  const snapshot = await getDoc(complaintRef);
  if (!snapshot.exists()) throw new Error("Complaint not found");

  const internalNotes: InternalNote[] = snapshot.data().internalNotes ?? [];
  const timeline: TimelineEvent[] = snapshot.data().timeline ?? [];
  const note: InternalNote = {
    id: generateId(),
    text,
    authorId: author.id,
    authorName: author.name,
    createdAt: serverTimestamp() as InternalNote["createdAt"],
  };

  await updateDoc(complaintRef, {
    internalNotes: [...internalNotes, note],
    timeline: [
      ...timeline,
      buildTimelineEvent("note", "Internal note added", author, {
        description: text,
        isPublic: false,
      }),
    ],
    updatedAt: serverTimestamp(),
  });
}

export async function addPublicUpdate(
  complaintId: string,
  text: string,
  author: { id: string; name: string },
) {
  const complaintRef = doc(db, "complaints", complaintId);
  const snapshot = await getDoc(complaintRef);
  if (!snapshot.exists()) throw new Error("Complaint not found");

  const data = snapshot.data();
  const publicUpdates: PublicUpdate[] = data.publicUpdates ?? [];
  const timeline: TimelineEvent[] = data.timeline ?? [];
  const update: PublicUpdate = {
    id: generateId(),
    text,
    authorId: author.id,
    authorName: author.name,
    createdAt: serverTimestamp() as PublicUpdate["createdAt"],
  };

  await updateDoc(complaintRef, {
    publicUpdates: [...publicUpdates, update],
    adminNote: text,
    timeline: [
      ...timeline,
      buildTimelineEvent("public_update", "Public update posted", author, {
        description: text,
        isPublic: true,
      }),
    ],
    updatedAt: serverTimestamp(),
  });

  await createNotification({
    userId: data.userId,
    complaintId,
    type: "public_update",
    title: "New update on your complaint",
    message: text,
  });
}

export async function assignOfficerToComplaint(
  complaintId: string,
  officer: Officer,
  actor: { id: string; name: string },
) {
  await updateComplaintWorkflow(complaintId, {
    status: "Assigned",
    assignedTo: officer.department,
    assignedOfficerId: officer.id,
    assignedOfficerName: officer.name,
    actor,
    timelineTitle: `Assigned to ${officer.name}`,
    timelineDescription: `${officer.designation || "Officer"} — ${officer.department}`,
    notifyCitizen: true,
  });
}

export async function createOfficer(
  input: Omit<Officer, "id" | "assignedCount" | "createdAt" | "updatedAt">,
) {
  const docRef = await addDoc(collection(db, "officers"), {
    ...input,
    assignedCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateOfficer(
  officerId: string,
  input: Partial<Omit<Officer, "id" | "createdAt">>,
) {
  await updateDoc(doc(db, "officers", officerId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteOfficer(officerId: string) {
  await updateDoc(doc(db, "officers", officerId), {
    active: false,
    updatedAt: serverTimestamp(),
  });
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, "notifications", notificationId), { read: true });
}

export async function voteOnComplaint(
  complaintId: string,
  userId: string,
  vote: "urgent" | "needsAttention" | "alreadyFixed",
) {
  const complaintRef = doc(db, "complaints", complaintId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(complaintRef);
    if (!snapshot.exists()) throw new Error("Complaint not found");
    const data = snapshot.data();
    const voterIds = data.voterIds ?? {};
    const previousVote = voterIds[userId];
    const votes = {
      urgent: Number(data.votes?.urgent ?? 0),
      needsAttention: Number(data.votes?.needsAttention ?? data.votes?.notUrgent ?? 0),
      alreadyFixed: Number(data.votes?.alreadyFixed ?? 0),
    };

    if (previousVote === vote) return;
    if (previousVote && previousVote in votes) {
      votes[previousVote as keyof typeof votes] = Math.max(
        0,
        votes[previousVote as keyof typeof votes] - 1,
      );
    }
    votes[vote] += 1;

    transaction.update(complaintRef, {
      votes,
      voterIds: { ...voterIds, [userId]: vote },
      updatedAt: serverTimestamp(),
    });
  });
}

export function formatDate(value: Complaint["createdAt"]) {
  if (!value?.toDate) return "Just now";
  return value.toDate().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isToday(timestamp: Complaint["createdAt"]) {
  if (!timestamp?.toDate) return false;
  const date = timestamp.toDate();
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export function filterComplaintsForDepartment(
  complaints: Complaint[],
  profile: AppUser | null,
): Complaint[] {
  if (!profile || isSuperAdminRole(profile.role)) return complaints;
  if (profile.role === "department_admin" && profile.department) {
    return complaints.filter((item) => item.department === profile.department);
  }
  return complaints;
}

export function getComplaintImages(complaint: Complaint): string[] {
  if (complaint.imageUrls?.length) return complaint.imageUrls.filter(Boolean);
  return complaint.imageUrl ? [complaint.imageUrl] : [];
}

export function compressImageToBase64(
  file: File,
  maxWidth = 800,
  quality = 0.6,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export { isDepartmentRole, isSuperAdminRole };
