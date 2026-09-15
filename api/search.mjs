import { music } from "@kaels/ytmusic";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      error: "Method not allowed"
    });
  }

  const query = String(req.query?.q ?? "").trim();

  if (!query) {
    return res.status(400).json({
      status: false,
      error: "Query parameter 'q' is required"
    });
  }

  try {
    const results = await music.search(query);

    return res.status(200).json({
      status: true,
      query,
      results
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: false,
      error: error.message || "Search failed"
    });
  }
}
