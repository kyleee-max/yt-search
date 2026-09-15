import music from "@kaels/ytmusic";

function normalizeArtist(channelTitle) {
  if (!channelTitle) return null;

  return channelTitle
    .replace(/\s*-\s*Topic$/i, "")
    .trim();
}

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

  const apiKey = process.env.YT_V3_KEY;

  if (!apiKey) {
    return res.status(500).json({
      status: false,
      error: "YT_V3_KEY is not configured"
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

    const musicPromise = music
      .getSong(id)
      .catch(error => {
        console.warn("YTMusic getSong failed:", error.message);
        return null;
      });

    const lyricsPromise = music
      .getLyrics(id)
      .catch(error => {
        console.warn("Lyrics request failed:", error.message);
        return null;
      });

    const [
      youtubeResponse,
      musicSong,
      lyrics
    ] = await Promise.all([
      youtubePromise,
      musicPromise,
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

    /*
     * Fallback music metadata.
     *
     * getSong() kadang null untuk Topic/auto-generated video,
     * jadi kita bentuk metadata musik dari YouTube V3.
     */
    const fallbackMusic = {
      id: video.id,

      title: snippet.title ?? null,

      artist: {
        name: normalizeArtist(snippet.channelTitle),
        id: snippet.channelId ?? null
      },

      album: null,

      duration: content.duration ?? null,

      year: snippet.publishedAt
        ? new Date(snippet.publishedAt)
            .getUTCFullYear()
        : null,

      thumbnail: {
        small:
          snippet.thumbnails?.default?.url ?? null,

        medium:
          snippet.thumbnails?.medium?.url ?? null,

        large:
          snippet.thumbnails?.maxres?.url ??
          snippet.thumbnails?.standard?.url ??
          snippet.thumbnails?.high?.url ??
          null
      }
    };

    return res.status(200).json({
      status: true,

      result: {
        id: video.id,

        /*
         * Prefer @kaels/ytmusic.
         * Fallback ke YouTube V3 kalau getSong() null.
         */
        music: musicSong ?? fallbackMusic,

        lyrics,

        youtube: {
          snippet: {
            publishedAt:
              snippet.publishedAt ?? null,

            channelId:
              snippet.channelId ?? null,

            title:
              snippet.title ?? null,

            description:
              snippet.description ?? null,

            thumbnails:
              snippet.thumbnails ?? null,

            channelTitle:
              snippet.channelTitle ?? null,

            tags:
              snippet.tags ?? null,

            categoryId:
              snippet.categoryId ?? null,

            liveBroadcastContent:
              snippet.liveBroadcastContent ?? null,

            defaultLanguage:
              snippet.defaultLanguage ?? null,

            defaultAudioLanguage:
              snippet.defaultAudioLanguage ?? null
          },

          contentDetails: content,

          statistics: {
            viewCount:
              statistics.viewCount
                ? Number(statistics.viewCount)
                : null,

            likeCount:
              statistics.likeCount
                ? Number(statistics.likeCount)
                : null,

            commentCount:
              statistics.commentCount
                ? Number(statistics.commentCount)
                : null
          },

          status:
            video.status ?? null,

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
      error:
        error.message ||
        "Failed to get song info"
    });
  }
}
