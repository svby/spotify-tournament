module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "/spotify-tournament/" : "/",

  pages: {
    index: {
      entry: "src/main.ts",
      title: "Spotify bracket",
    },
  },
};
