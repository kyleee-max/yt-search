import { YtdlCore } from "@ybd-project/ytdl-core/serverless";

const ytdl = new YtdlCore();

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

  try {
    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;

    const info = await ytdl.getBasicInfo(url);
    const video = info.videoDetails;

    return res.status(200).json({
      status: true,
      result: {
        id: video.videoId,
        title: video.title,
        artist: video.author?.name ?? null,
        duration: Number(video.lengthSeconds) || null,
        thumbnail: video.thumbnails?.at(-1)?.url ?? null,
        viewCount: Number(video.viewCount) || null,
        publishDate: video.publishDate ?? null
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
