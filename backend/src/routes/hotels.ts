import express, { Request, Response, Router } from "express";
import Hotel from "../models/hotel";
import { HotelSearchResponse } from "../shared/types";

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

export default router;
