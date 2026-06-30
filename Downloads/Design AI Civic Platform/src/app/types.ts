import type { Timestamp } from "firebase/firestore";

export type UserRole = "citizen" | "admin" | "super_admin" | "department_admin";

export type ComplaintStatus =
  | "Pending"
  | "Submitted"
  | "Under Review"
  | "Verified"
  | "Assigned"
  | "In Progress"
  | "Resolved"
  | "Rejected"
  | "Closed";

export type ComplaintSeverity = "Critical" | "High" | "Medium" | "Low";

export type LocationVerificationStatus =
  | "pending"
  | "verified"
  | "fake"
  | "duplicate"
  | "outside_jurisdiction";

export type TimelineEventType =
  | "submitted"
  | "received"
  | "verified"
  | "rejected"
  | "assigned"
  | "progress"
  | "resolved"
  | "closed"
  | "location_verified"
  | "note"
  | "public_update";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  status?: ComplaintStatus;
  actorId?: string;
  actorName?: string;
  at: Timestamp;
  isPublic?: boolean;
}

export interface InternalNote {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
}

export interface PublicUpdate {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
}

export interface Complaint {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  issueType: string;
  severity: ComplaintSeverity;
  priority?: ComplaintSeverity;
  titleEn: string;
  titleKn: string;
  descriptionEn: string;
  descriptionKn: string;
  department: string;
  urgency: string;
  confidence: number;
  location: string;
  reverseGeocodedAddress?: string;
  coords: { lat: number; lng: number } | null;
  extraDesc: string;
  imageUrl: string;
  imageUrls?: string[];
  imagePath?: string;
  status: ComplaintStatus;
  locationVerification?: LocationVerificationStatus;
  verificationStatus?: LocationVerificationStatus;
  assignedTo?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  adminNote?: string;
  votes: {
    urgent: number;
    needsAttention: number;
    alreadyFixed: number;
  };
  voterIds?: Record<string, string>;
  heroPoints: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  statusHistory?: Array<{
    status: ComplaintStatus;
    at: Timestamp;
    note?: string;
    actorId?: string;
    actorName?: string;
  }>;
  timeline?: TimelineEvent[];
  internalNotes?: InternalNote[];
  publicUpdates?: PublicUpdate[];
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: UserRole;
  department?: string;
  heroPoints: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Officer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation?: string;
  active: boolean;
  assignedCount: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  complaintId: string;
  type: "status_change" | "resolved" | "rejected" | "public_update" | "assigned";
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | null;
}

export interface AIAnalysisResult {
  issueType: string;
  severity: ComplaintSeverity;
  titleEn: string;
  titleKn: string;
  descriptionEn: string;
  descriptionKn: string;
  department: string;
  urgency: string;
  confidence: number;
}

export interface ComplaintFilters {
  search: string;
  status: string;
  department: string;
  priority: string;
  category: string;
  verification: string;
  officer: string;
  dateFrom: string;
  dateTo: string;
  sortBy: "newest" | "oldest" | "priority" | "status";
}

export const ALL_STATUSES: ComplaintStatus[] = [
  "Submitted",
  "Pending",
  "Under Review",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
  "Rejected",
  "Closed",
];

export const WORKFLOW_STATUSES: ComplaintStatus[] = [
  "Submitted",
  "Under Review",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
  "Rejected",
  "Closed",
];

export function displayStatus(status: ComplaintStatus): string {
  if (status === "Pending") return "Submitted";
  return status;
}

export function isDepartmentRole(role?: UserRole): boolean {
  return role === "admin" || role === "super_admin" || role === "department_admin";
}

export function isSuperAdminRole(role?: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

export const PRIORITY_ORDER: Record<ComplaintSeverity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};
