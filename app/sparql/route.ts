import { NextRequest } from "next/server";

const RDF4J_API_URI = process.env.NEXT_API_URL!;
console.log(RDF4J_API_URI);
function getClientIp(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        req.headers.get("x-real-ip") ??
        "unknown"
    );
}

function withStandardHeaders(res: Response): Response {
    res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
}

export async function GET(req: NextRequest) {
    const accept = req.headers.get("accept") || "";
    const url = new URL(req.url);

    if (!accept.includes("text/html")) {
        const query = url.searchParams.get("query") ?? "";
        const target = `${RDF4J_API_URI}?query=${encodeURIComponent(query)}`;

        const proxied = await fetch(target, {
            method: "GET",
            headers: {
                "Accept": accept,
                "X-Real-IP": getClientIp(req),
                "X-Forwarded-For": getClientIp(req),
                "X-Forwarded-Proto": req.headers.get("x-forwarded-proto") || "http",
                "Host": req.headers.get("host") || "localhost:3000"
            }
        });

        const data = await proxied.text();

        return withStandardHeaders(
            new Response(data, {
                status: proxied.status,
                headers: {
                    "Content-Type": proxied.headers.get("content-type") || "text/plain"
                }
            })
        );
    }

    return withStandardHeaders(new Response("SPARQL endpoint", { status: 200 }));
}

export async function POST(req: NextRequest) {
    const accept = req.headers.get("accept") || "";

    if (!accept.includes("text/html")) {
        const body = await req.text();

        const proxied = await fetch(RDF4J_API_URI, {
            method: "POST",
            headers: {
                "Content-Type": req.headers.get("content-type") || "application/sparql-query",
                "Accept": accept,
                "X-Real-IP": getClientIp(req),
                "X-Forwarded-For": getClientIp(req),
                "X-Forwarded-Proto": req.headers.get("x-forwarded-proto") || "http",
                "Host": req.headers.get("host") || "localhost:3000"
            },
            body
        });

        const responseBody = await proxied.text();

        return withStandardHeaders(
            new Response(responseBody, {
                status: proxied.status,
                headers: {
                    "Content-Type": proxied.headers.get("content-type") || "text/plain"
                }
            })
        );
    }

    return withStandardHeaders(new Response("POST with HTML Accept not allowed", { status: 406 }));
}
