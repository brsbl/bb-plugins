export const COMMENT_BODY_CODE_POINT_LIMIT = 10_000;

export function commentBodyError(value: string): string | null {
  if (value.trim() === "") return "Comment body is required";
  if (Array.from(value).length > COMMENT_BODY_CODE_POINT_LIMIT)
    return "Comment body must be at most 10,000 Unicode code points";
  return null;
}
