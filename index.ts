import express from "express";
import cors from "cors";

const port = process.env.PORT || 5555;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin: "*",
    exposedHeaders: ["Authorization"],
  })
);

app.get("/", (req, res) => {
  return res.send("School managment system!");
});

app.listen(port, () => {
  console.log(`App is listening to port: ${port}`);
});
