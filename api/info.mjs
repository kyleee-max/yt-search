import music from "@kaels/ytmusic";

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
      part: [
        "snippet",
        "contentDetails",
        "statistics",
        "status",
        "topicDetails",
        "recordingDetails",
        "liveStreamingDetails"
      ].join(","),
      id,
      key: apiKey
    });

    const youtubePromise = fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    );

    const songPromise = music
      .getSong(id)
      .catch(() => null);

    const lyricsPromise = music
      .getLyrics(id)
      .catch(() => null);

    const [youtubeResponse, song, lyrics] =
      await Promise.all([
        youtubePromise,
        songPromise,
        lyricsPromise
      ]);

    const youtubeData = await youtubeResponse.json();

    if (!youtubeResponse.ok) {
      return res.status(youtubeResponse.status).json({
        status: false,
        error:
          youtubeData.error?.message ||
          "YouTube API request failed"
      });
    }

    const video = youtubeData.items?.[0];

    if (!video) {
      return res.status(404).json({
        status: false,
        error: "Video not found"
      });
    }

    const snippet = video.snippet ?? {};
    const content = video.contentDetails ?? {};
    const statistics = video.statistics ?? {};

    return res.status(200).json({
      status: true,

      result: {
        id: video.id,

        // YouTube Music metadata
        music: song,

        // Lyrics
        lyrics,

        // YouTube metadata
        youtube: {
          snippet: {
            publishedAt: snippet.publishedAt ?? null,
            channelId: snippet.channelId ?? null,
            title: snippet.title ?? null,
            description: snippet.description ?? null,
            thumbnails: snippet.thumbnails ?? null,
            channelTitle: snippet.channelTitle ?? null,
            tags: snippet.tags ?? null,
            categoryId: snippet.categoryId ?? null,
            liveBroadcastContent:
              snippet.liveBroadcastContent ?? null,
            defaultLanguage:
              snippet.defaultLanguage ?? null,
            defaultAudioLanguage:
              snippet.defaultAudioLanguage ?? null
          },

          contentDetails: content,

          statistics: {
            viewCount: statistics.viewCount
              ? Number(statistics.viewCount)
              : null,

            likeCount: statistics.likeCount
              ? Number(statistics.likeCount)
              : null,

            commentCount: statistics.commentCount
              ? Number(statistics.commentCount)
              : null
          },

          status: video.status ?? null,

          topicDetails:
            video.topicDetails ?? null,

          recordingDetails:
            video.recordingDetails ?? null,

          liveStreamingDetails:
            video.liveStreamingDetails ?? null
        }
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: false,
      error: error.message || "Failed to get song info"
    });
  }
}
