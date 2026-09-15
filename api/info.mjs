export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      error: "Method not allowed"
    });
  }

  const id = String(req.query?.id ?? "").trim();

  if (!id) {
    return res.status(400).json({
      status: false,
      error: "Query parameter 'id' is required"
    });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      status: false,
      error: "YOUTUBE_API_KEY is not configured"
    });
  }

  try {
    const params = new URLSearchParams({
      part: "snippet,contentDetails,statistics",
      id,
      key: apiKey
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        status: false,
        error: data.error?.message || "YouTube API request failed"
      });
    }

    const video = data.items?.[0];

    if (!video) {
      return res.status(404).json({
        status: false,
        error: "Video not found"
      });
    }

    return res.status(200).json({
      status: true,
      result: {
        id: video.id,
        title: video.snippet?.title ?? null,
        artist: video.snippet?.channelTitle ?? null,
        thumbnail: video.snippet?.thumbnails?.high?.url ?? null,
        duration: video.contentDetails?.duration ?? null,
        viewCount: video.statistics?.viewCount
          ? Number(video.statistics.viewCount)
          : null,
        publishedAt: video.snippet?.publishedAt ?? null
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: false,
      error: error.message || "Failed to get video info"
    });
  }
}
