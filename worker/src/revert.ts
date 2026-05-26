const REVERT_PATTERNS =
  /Undid revision|Reverted|Annulation|Rückgängig|Annullato|Revertido|Reverted edits|Rv |отмена/i;

export function isRevertComment(comment: string | null | undefined): boolean {
  if (!comment) return false;
  return REVERT_PATTERNS.test(comment);
}

