import Router from "express";

const indexRouter = Router();

/* GET index page. */
indexRouter.get("/", (req, res) => {
  res.json({
    title: "Gym",
  });
});

export default indexRouter;
