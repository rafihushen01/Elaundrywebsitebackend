const Review = require("../model/Review.js");
const Order = require("../model/Order.js");

const addReview = async (req, res) => {
  try {
    const userid = req.userId;
    const { itemid, orderid, ironRating, washRating, ironReview, washReview } = req.body;

    const order = await Order.findById(orderid);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (String(order.userid) !== String(userid))
      return res.status(403).json({ message: "Not authorized" });
    if (order.status !== "completed")
      return res.status(400).json({ message: "Only completed orders can be reviewed" });

    // find item in order
    const orderedItem = order.items.find(i => String(i.itemid) === String(itemid));
    if (!orderedItem)
      return res.status(400).json({ message: "Item not found in this order" });

    // if they used iron service → allow iron rating
    if (ironRating && !orderedItem.services.iron)
      return res.status(400).json({ message: "Iron service not used" });

    // if they used washing service → allow wash rating
    if (washRating && !orderedItem.services.wash)
      return res.status(400).json({ message: "Wash service not used" });

    const review = new Review({
      userid,
      itemid,
      orderid,
      ironRating,
      washRating,
      ironReview,
      washReview
    });

    await review.save();

    res.status(201).json({ message: "Review added", data: review });
  } catch (err) {
    res.status(500).json({ message: "Review failed", error: err.message });
  }
};

const getItemReviews = async (req, res) => {
  try {
    const itemid = req.params.id;

    const reviews = await Review.find({ itemid })
      .populate("userid", "username email mobile  ");

    res.status(200).json({ data: reviews });
  } catch (err) {
    res.status(500).json({ message: "Get reviews failed", error: err.message });
  }
};

module.exports = { addReview, getItemReviews };
