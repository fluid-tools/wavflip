import {
  pgTable,
  text,
  timestamp,
  integer,
  bigint,
  real,
  json,
  pgEnum,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Access type enum for projects and tracks
export const accessTypeEnum = pgEnum("access_type", [
  "private",
  "public", 
  "invite-only"
]);

// Folders table - contains projects and other folders (nested)
export const folder = pgTable("folder", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  parentFolderId: text("parent_folder_id"), // nullable - null means root level folder
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}, (table) => ({
  // Self-referencing foreign key for nested folders
  parentFolderRef: foreignKey({
    columns: [table.parentFolderId],
    foreignColumns: [table.id],
    name: "folder_parent_fk"
  }),
}));

// Projects table - contains tracks, can be in folders or vault root
export const project = pgTable("project", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  folderId: text("folder_id").references(() => folder.id, { 
    onDelete: "cascade" 
  }), // nullable - projects can exist in vault root
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessType: accessTypeEnum("access_type").notNull().default("private"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  metadata: json("metadata"),
});

// Tracks table - metadata only, actual audio data in track_versions
export const track = pgTable("track", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeVersionId: text("active_version_id"), // Will reference track_version.id
  accessType: accessTypeEnum("access_type").notNull().default("private"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  metadata: json("metadata"),
});

// Track versions table - actual file data and version history
export const trackVersion = pgTable("track_version", {
  id: text("id").primaryKey(),
  trackId: text("track_id")
    .notNull()
    .references(() => track.id, { onDelete: "cascade" }),
  version: integer("version").notNull(), // Auto-increment per track
  fileUrl: text("file_url").notNull(), // Points to storage (Vercel Blob, S3, etc.)
  size: bigint("size", { mode: "number" }), // File size in bytes
  duration: real("duration"), // Duration in seconds
  mimeType: text("mime_type"), // audio/mpeg, audio/wav, etc.
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  metadata: json("metadata"), // Version-specific metadata
}, (table) => ({
  // Unique version numbers per track
  uniqueVersionPerTrack: unique().on(table.trackId, table.version),
}));

// Types for use in the application
export type Folder = typeof folder.$inferSelect;
export type NewFolder = typeof folder.$inferInsert;

export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;

export type Track = typeof track.$inferSelect;
export type NewTrack = typeof track.$inferInsert;

export type TrackVersion = typeof trackVersion.$inferSelect;
export type NewTrackVersion = typeof trackVersion.$inferInsert;

// Extended types with relationships
export type FolderWithProjects = Folder & {
  projects: (Project & { trackCount: number })[];
  subFolders?: Folder[];
};

export type NestedFolderStructure = Folder & {
  projects: (Project & { trackCount: number })[];
  subFolders: NestedFolderStructure[];
};

export type ProjectWithTracks = Project & {
  tracks: (Track & {
    activeVersion?: TrackVersion;
    versions: TrackVersion[];
  })[];
};

export type TrackWithVersions = Track & {
  activeVersion?: TrackVersion;
  versions: TrackVersion[];
  project: Project;
};

export type ProjectWithTrackCount = Project & {
  trackCount: number;
}; 