import express from "express";
import { controllerHandler } from "../../utils";
import { validation } from "../../middleware";
import { bookingsValidationSchema } from "./bookingsValidation";
import { BookingsController } from "./bookingsController";

const router = express.Router();
const call = controllerHandler;
const Bookings = new BookingsController();

router.use(validation(bookingsValidationSchema));

router.post("/", call(Bookings.bookATrip, (req, _res, _next) => [req.body, req.user]));
router.get("/me", call(Bookings.getUserBookings, (req, _res, _next) => [req.user]));
router.get("/:userId", call(Bookings.getUserBookings, (req, _res, _next) => [req.params.userId]));
router.get("/", call(Bookings.getBookings, (req, _res, _next) => [req.query]));

export const bookingsRouter = router;
