import { NextResponse } from "next/server";

const ALLOWED_HOST = "docs.google.com";

function isAllowedUrl(url: URL) {
  return (
    url.host === ALLOWED_HOST &&
    url.pathname.startsWith("/spreadsheets/")
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url." }, { status: 400 });
  }

  if (!isAllowedUrl(parsed)) {
    return NextResponse.json({ error: "URL not allowed." }, { status: 400 });
  }

  const response = await fetch(parsed.toString(), {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch CSV." }, { status: 502 });
  }

  const csv = await response.text();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
