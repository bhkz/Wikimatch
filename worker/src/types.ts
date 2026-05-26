export interface WikimediaRecentChange {
  meta?: {
    id?: string;
    domain?: string;
  };
  type?: "edit" | "new" | "log" | "categorize" | "external";
  namespace?: number;
  title?: string;
  comment?: string;
  timestamp?: number;
  user?: string;
  bot?: boolean;
  length?: { old?: number | null; new?: number | null };
  revision?: { old?: number | null; new?: number | null };
  wiki?: string;
}

export interface MonitoredArticle {
  articleId: string;
  entityId: string;
  wikiCode: string;
  languageCode: string;
  pageTitle: string;
  canonicalUrl: string;
}

export interface RevisionTraceInsert {
  article_id: string;
  wikimedia_event_id: string;
  revision_id: number | null;
  previous_revision_id: number | null;
  observed_at: string;
  revision_timestamp: string;
  source_revision_url: string;
  source_diff_url: string | null;
  section_label: string | null;
  size_delta: number | null;
  revision_comment_sanitized: string | null;
  change_kind: string | null;
  public_status: "private_raw";
  ingest_status: "observed";
}

export interface PrivateContentInsert {
  trace_id: string;
  raw_added_text: string | null;
  raw_removed_text: string | null;
  moderation_status: "unreviewed";
}

