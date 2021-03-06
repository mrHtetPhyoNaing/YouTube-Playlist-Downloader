const express = require("express");
const bodyParser = require("body-parser");
const linkCheck = require("link-check");
const { PythonShell } = require("python-shell");
const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "hbs");
app.use(express.static(`${__dirname}/public`));

app.post("/single", singleVideo);
app.post("/playlist", playlist);

app.get("/about", (req, res) => res.render("about"));
app.get("/contact", (req, res) => res.render("contact"));
app.get("/single", (req, res) => res.render("single"));
app.get("/", (req, res) => res.render("index"));

async function singleVideo(req, res) {
  const link = req.body.link;

  if (!link || !link.match(/(https?:\/\/[^\s]+)/))
    return res
      .status(400)
      .json({ error: true, message: "Please provide a youtube video linkd." });

  try {
    linkCheck(link, (error, result) => {
      if (error || result.status === "dead") {
        console.log(error, link + " is " + result.status);
        return res.status(400).json({
          error: true,
          message:
            "Your link might be unalive or youtube has removed the video associated with the link.",
        });
      }
      // valid...
      let pyshell = new PythonShell("./scripts/singlevideo.py");
      pyshell.send(JSON.stringify([link]));

      pyshell.on("message", (message) => {
        if (message === "downloaded")
          return res.status(200).json({
            success: true,
            message: "Successfully downloaded! Check your folder.",
          });
      });

      pyshell.end(function (err) {
        if (err) {
          return res.status(500).json({
            error: true,
            message: "Something went wrong. Please try again.",
          });
        }
      });
    });
  } catch (error) {
    console.log("catched");
    return res.status(400).json({
      error,
      message:
        "Your link might be unalive or youtube has removed the video associated with the link.",
    });
  }
}

async function playlist(req, res) {
  const link = req.body.link;

  if (!link || !link.match(/(https?:\/\/[^\s]+)/))
    return res
      .status(400)
      .json({ error: true, message: "Please provide a youtube video link." });

  try {
    linkCheck(link, (error, result) => {
      if (error || result.status === "dead") {
        return res.status(400).json({
          error: true,
          message:
            "Your link might be unalive or youtube has removed the video associated with the link.",
        });
      }

      // valid...
      let pyshell = new PythonShell("./scripts/playlist.py");
      pyshell.send(JSON.stringify([link]));

      pyshell.on("message", (message) => {
        if (message === "downloaded")
          return res.status(200).json({
            success: true,
            message: "Successfully downloaded! Check your folder.",
          });
      });

      pyshell.end(function (err) {
        if (err) {
          return res.status(500).json({
            error: true,
            message: "Something went wrong. Please try again.",
          });
        }
      });
    });
  } catch (error) {
    console.log("catched");
    return res.status(400).json({
      error,
      message:
        "Your link might seem unalive or youtube has removed the video associated with the link.",
    });
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}...`);
});
