import express from "express";
import cors from "cors";

import usersRoute from "./routes/usersRoute";
import schoolsRoute from "./routes/schoolsRoute";
import devicesRoute from "./routes/devicesRoute";

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
  return res.send("penwwws!");
});

app.listen(port, () => {
  console.log(`App is listening to port: ${port}`);
});

app.use("/api", usersRoute);
app.use("/api", schoolsRoute);
app.use("/api", devicesRoute);
