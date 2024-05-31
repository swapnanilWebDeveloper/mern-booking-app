import express, { Request, Response, Router } from "express";
import Hotel from "../models/hotel";
import { BookingType, HotelSearchResponse } from "../shared/types";
import { param, validationResult } from "express-validator";
import Stripe from "stripe";
import verifyToken from "../middleware/auth";

const stripe = new Stripe(process.env.STRIPE_API_KEY as string);

const router = express.Router();

router.get("/search", async (req: Request, res: Response) => {
  try {
    let constructSearchQuery = (queryParams: any) => {
      let constructedQuery: any = {};

      if (queryParams.destination) {
        constructedQuery.$or = [
          { city: new RegExp(queryParams.destination, "i") },
          { country: new RegExp(queryParams.destination, "i") },
        ];
      }

      if (queryParams.adultCount) {
        constructedQuery.adultCount = {
          $gte: parseInt(queryParams.adultCount),
        };
      }

      if (queryParams.childCount) {
        constructedQuery.childCount = {
          $gte: parseInt(queryParams.childCount),
        };
      }

      if (queryParams.facilities) {
        constructedQuery.facilities = {
          $all: Array.isArray(queryParams.facilities)
            ? queryParams.facilities
            : [queryParams.facilities],
        };
      }

      if (queryParams.types) {
        constructedQuery.type = {
          $in: Array.isArray(queryParams.types)
            ? queryParams.types
            : [queryParams.types],
        };
      }

      if (queryParams.stars) {
        const starRating = parseInt(queryParams.stars.toString());
        constructedQuery.starRating = { $eq: starRating };
      }

      if (queryParams.maxPrice) {
        constructedQuery.pricePerNight = {
          $lte: parseInt(queryParams.maxPrice).toString(),
        };
      }

      return constructedQuery;
    };

    const query = constructSearchQuery(req.query);

    let sortOptions = {};

    switch (req.query.sortOption) {
      case "starRating":
        sortOptions = { starRating: -1 };
        break;
      case "pricePerNightAsc":
        sortOptions = { pricePerNight: 1 };
        break;
      case "pricePerNightDesc":
        sortOptions = { pricePerNight: -1 };
        break;
    }

    const pageSize = 5;
    const pageNumber = parseInt(
      req.query.page ? req.query.page.toString() : "1"
    );
    const skip = (pageNumber - 1) * pageSize;

    // {$and:[{"sex":"Male"},{"grd_point":{ $gte: 31 }},{"class":"VI"}]}
    const hotels = await Hotel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    const total = await Hotel.countDocuments(query);

    const response: HotelSearchResponse = {
      data: hotels,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

    return res.json(response);
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find().sort("-lastUpdated");
    return res.json(hotels);
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      message: "Error fetching hotels",
    });
  }
});

router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Hotel ID is required")],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const id = req.params.id.toString();

    try {
      const hotel = await Hotel.findById(id);
      return res.json(hotel);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Error fetching hotel",
      });
    }
  }
);

router.post(
  "/:hotelId/bookings/payment-intent",
  verifyToken,
  async (req: Request, res: Response) => {
    const { numberOfNights } = req.body;
    const hotelId = req.params.hotelId;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(400).json({
        message: "Hotel not found",
      });
    }

    //  console.log(hotel);
    //  console.log(hotel.pricePerNight);

    const totalCost = hotel.pricePerNight * numberOfNights;
    //  console.log("Current Total Cost = " + totalCost);
    //console.log("Previous Total cost ="+hotel.totalCost)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCost * 100,
      currency: "usd",
      metadata: {
        hotelId,
        userId: req.userId,
      },
    });

    if (!paymentIntent.client_secret) {
      return res.status(500).json({
        message: "Error creating payment intent",
      });
    }

    const response = {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret.toString(),
      totalCost,
    };

    // console.log(response);

    res.send(response);
  }
);

router.post(
  "/:hotelId/bookings",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const paymentIntentId = req.body.paymentIntentId;

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId as string
      );

      if (!paymentIntent) {
        return res.status(400).json({
          message: "payment intent not found",
        });
      }

      if (
        paymentIntent.metadata.hotelId !== req.params.hotelId ||
        paymentIntent.metadata.userId !== req.userId
      ) {
        return res.status(400).json({
          message: "payment intent mismatch",
        });
      }

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: `payment intent not succedded. Status: ${paymentIntent.status}`,
        });
      }

      const newBooking: BookingType = {
        ...req.body,
        userId: req.userId,
      };

      //  console.log("new Booking is done here :");
      //  console.log(newBooking);

      const hotel = await Hotel.findOneAndUpdate(
        { _id: req.params.hotelId },
        {
          $push: { bookings: newBooking },
        }
      );
      console.log("Hello Bookings start here...");
      console.log(hotel?.bookings);
      /* if (hotel?.bookings) {
        console.log(hotel?.bookings[hotel?.bookings.length - 1].totalCost);
        console.log(hotel?.bookings.length);
      } */

      if (!hotel) {
        return res.status(400).json({
          message: "hotel not found",
        });
      }

      await hotel.save();
      return res.status(200).send();
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "something went wrong",
      });
    }
  }
);

export default router;
