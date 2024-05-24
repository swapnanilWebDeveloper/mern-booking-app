import express, { Request, Response, Router } from "express";
import Hotel from "../models/hotel";
import { HotelSearchResponse } from "../shared/types";

const router = express.Router();

router.get("/search", async (req: Request, res: Response) => {
  try {
    const pageSize = 5;
    const pageNumber = parseInt(
      req.query.page ? req.query.page.toString() : "1"
    );
    const skip = (pageNumber - 1) * pageSize;

    // {$and:[{"sex":"Male"},{"grd_point":{ $gte: 31 }},{"class":"VI"}]}
    let hotels, total;
    if (req.query.destination) {
      hotels = await Hotel.find({
        $and: [
          { country: req.query.destination },
          { adultCount: { $gte: req.query.adultCount } },
          { childCount: { $gte: req.query.childCount } },
        ],
      })
        .skip(skip)
        .limit(pageSize);

      total = await Hotel.countDocuments({
        $and: [
          { country: req.query.destination },
          { adultCount: { $gte: req.query.adultCount } },
          { childCount: { $gte: req.query.childCount } },
        ],
      });
    } else {
      hotels = await Hotel.find({
        $and: [
          { adultCount: { $gte: req.query.adultCount } },
          { childCount: { $gte: req.query.childCount } },
        ],
      })
        .skip(skip)
        .limit(pageSize);

      total = await Hotel.countDocuments({
        $and: [
          { adultCount: { $gte: req.query.adultCount } },
          { childCount: { $gte: req.query.childCount } },
        ],
      });
    }

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
