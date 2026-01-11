import { genreList, getRandomGenre } from "../constants/genre.ts";
import * as dotenv from "dotenv";
dotenv.config();

// Update the function signatures to include username
export const nextSong = async ({
  token,
  username,
}: {
  token: string;
  username: string;
}) => {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/next", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 204) {
      return {
        success: false,
        message: "Failed to skip to next song",
        username,
      };
    }

    return {
      success: true,
      message: "Skipped to the next song",
      username,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "An error occurred while skipping to the next song",
      error: err instanceof Error ? err.message : String(err),
      username,
    };
  }
};

export const currentTrack = async ({
  token,
  username,
}: {
  token: string;
  username: string;
}) => {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      return {
        success: false,
        message: "Failed to get current track",
        username,
      };
    }

    const data = await response.json();
    if (data.item) {
      return {
        success: true,
        trackName: data.item.name,
        artist: data.item.artists[0].name,
        trackUri: data.item.uri,
        album: data.item.album.name,
        albumArt: data.item.album.images[0]?.url,
        isPlaying: data.is_playing,
        username,
      };
    }

    return {
      success: false,
      message: "No music is currently playing",
      isPlaying: false,
      username,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "An error occurred while getting the current track",
      error: err instanceof Error ? err.message : String(err),
      username,
    };
  }
};

export const playTrack = async ({
  token,
  username,
  track,
}: {
  token: string;
  username: string;
  track: string;
}) => {
  try {
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        track
      )}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (searchResponse.status !== 200) {
      return {
        success: false,
        message: "Failed to search for track",
        username,
      };
    }

    const searchData = await searchResponse.json();
    if (searchData.tracks.items.length === 0) {
      return {
        success: false,
        message: `Could not find the track "${track}"`,
        username,
      };
    }

    const foundTrack = searchData.tracks.items[0];
    const trackUri = foundTrack.uri;

    const response = await fetch(`https://api.spotify.com/v1/me/player/play`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [trackUri] }),
    });

    if (response.status !== 204) {
      return {
        success: false,
        message: "Failed to play track",
        username,
      };
    }

    return {
      success: true,
      trackName: foundTrack.name,
      artist: foundTrack.artists[0].name,
      album: foundTrack.album.name,
      trackUri: foundTrack.uri,
      albumArt: foundTrack.album.images[0]?.url,
      username,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "An error occurred while playing the track",
      error: err instanceof Error ? err.message : String(err),
      username,
    };
  }
};

export const randomTrack = async ({
  token,
  username,
  genre,
}: {
  token: string;
  username: string;
  genre: string;
}) => {
  try {
    let selectedGenre = genre;
    if (genre === "random" || !genreList.includes(genre)) {
      selectedGenre = getRandomGenre();
    }

    const searchResponse = await fetch(
      `https://api.spotify.com/v1/recommendations?seed_genres=${encodeURIComponent(
        selectedGenre
      )}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (searchResponse.status !== 200) {
      return {
        success: false,
        message: "Failed to get recommendations",
        requestedGenre: genre,
        selectedGenre,
        username,
      };
    }

    const searchData = await searchResponse.json();
    if (searchData.tracks.length === 0) {
      return {
        success: false,
        message: "No tracks found for the selected genre",
        requestedGenre: genre,
        selectedGenre,
        username,
      };
    }

    const foundTrack = searchData.tracks[0];
    const trackUri = foundTrack.uri;

    const response = await fetch(`https://api.spotify.com/v1/me/player/play`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [trackUri] }),
    });

    if (response.status !== 204) {
      return {
        success: false,
        message: "Failed to play track",
        requestedGenre: genre,
        selectedGenre,
        username,
      };
    }

    return {
      success: true,
      trackName: foundTrack.name,
      artist: foundTrack.artists[0].name,
      album: foundTrack.album.name,
      trackUri: foundTrack.uri,
      albumArt: foundTrack.album.images[0]?.url,
      requestedGenre: genre,
      selectedGenre,
      username,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "An error occurred while playing a random track",
      error: err instanceof Error ? err.message : String(err),
      requestedGenre: genre,
      username,
    };
  }
};
