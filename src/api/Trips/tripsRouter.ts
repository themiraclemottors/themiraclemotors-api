import { tripsValidationSchema } from "./tripsValidation";
import { TripsController } from "./tripsController";
import express, { Request } from "express";
import { controllerHandler } from "../../utils";
import { validation } from "../../middleware";

const router = express.Router();
const call = controllerHandler;
const Trips = new TripsController();

router.use(validation(tripsValidationSchema));

router.post("/", call(Trips.createTrip, (req, _res, _next) => [req.body]));
router.get("/search", call(Trips.searchTrips, (req: Request, _res, _next) => [req.query]));
router.get("/:status", call(Trips.getTripsByStatus, (req, _res, _next) => [req.params.status]));
router.get("/", call(Trips.getAllTrips , (req, _res, _next) => [req.query]));

export const tripsRouter = router;
