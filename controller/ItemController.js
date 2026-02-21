// controller/ItemController.js
const item = require("../model/Item.js");
const user = require("../model/User.js");
const uploadoncloudinary = require("../utils/Cloudinary.jsx");
const Review = require("../model/Review.js");
const Order = require("../model/Order.js");
// ---------- CHECK ADMIN OR SUPER-ADMIN ----------
// const checkadmin = async (req) => {
//   if (!req.user) return false;
//   return req.user.role === "SuperAdmin" || req.user.role === "Admin";
// };
// const checkonlyadmin = async (req) => {
//   if (!req.user) return false;
//   return req.user.role === "SuperAdmin" ;
// };
// =========== ADD ITEM ===========
const additem = async (req, res) => {
  try {
    // const isadmin = await checkadmin(req);
    // if (!isadmin) return res.status(403).json({ message: "Only Admin or Super-Admin can add items" });

    const { name, price,washingprice } = req.body;

    let image ;
    if (req.file) {
      const uploaded = await uploadoncloudinary(req.file.path);
      image = uploaded
    }

    const newitem = new item({ name, price, washingprice, image });
    await newitem.save();

    return res.status(201).json({ message: "Item added successfully", data: newitem });
  } catch (error) {
    return res.status(500).json({ message: "Add item failed", error: error.message });
  }
};

// =========== EDIT ITEM ===========
const edititem = async (req, res) => {
  try {
    const itemid = req.params.id;

    let updateData = { ...req.body };

    if (req.file) {
      const uploaded = await uploadoncloudinary(req.file.path);
      updateData.image = uploaded;
    }

    const updated = await item.findByIdAndUpdate(itemid, updateData, {
      new: true,
    });

    if (!updated) return res.status(404).json({ message: "Item not found" });

    return res.status(200).json({
      message: "Item updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Edit item failed", error: error.message });
  }
};


// =========== DELETE ITEM ===========
const deleteitem = async (req, res) => {
  try {
    // const isadmin = await checkonlyadmin(req);
    // if (!isadmin) return res.status(403).json({ message: "Only Admin or Super-Admin can delete items" });

    const itemid = req.params.id;
    const deleted = await item.findByIdAndDelete(itemid);

    if (!deleted) return res.status(404).json({ message: "Item not found" });

    return res.status(200).json({ message: "Item deleted successfully", deleted });
  } catch (error) {
    return res.status(500).json({ message: "Delete item failed", error: error.message });
  }
};

// =========== GET ALL ITEMS ===========
// const getallitems = async (req, res) => {
//   try {
//     const allitems = await item.find().sort({ createdAt: -1 });

//     return res.status(200).json({
//       message: "All items fetched successfully",
//       data: allitems,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Get all items failed",
//       error: error.message,
//     });
//   }
// };

const getallitems = async (req, res) => {
  try {
    // optional user id (if auth middleware ran and set req.userId). If not set, it stays undefined.
    const userid = req.userId || req.userData?._id || null;

    // fetch items
    const allitems = await item.find().sort({ createdAt: -1 }).lean();

    // for performance: fetch all reviews for these items in one query
    const itemIds = allitems.map((it) => it._id);
    const reviews = await Review.find({ itemid: { $in: itemIds } }).populate("userid", "username mobile email ").lean();

    // group reviews by item id
    const reviewsByItem = reviews.reduce((acc, r) => {
      const key = String(r.itemid);
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});

    // if user present, fetch user's orders that are completed/delivered and include these items
    let userOrders = [];
    if (userid) {
      // only orders that are completed/delivered (your code uses 'delivered' in last messages)
      userOrders = await Order.find({
        userid,
        status: "completed",
        "items.itemid": { $in: itemIds },
      }).lean();
    }

    // build enriched items
    const enriched = allitems.map((it) => {
      const rid = String(it._id);
      const itemReviews = reviewsByItem[rid] || [];

      // compute avg from both iron & wash ratings
      let total = 0;
      let count = 0;
      itemReviews.forEach((r) => {
        if (typeof r.ironRating === "number") {
          total += r.ironRating;
          count++;
        }
        if (typeof r.washRating === "number") {
          total += r.washRating;
          count++;
        }
      });
      const avgRating = count ? +(total / count).toFixed(1) : 0;

      // prepare userEligibleOrders (only if userid present)
      const userEligibleOrders = [];
      if (userid) {
        userOrders.forEach((o) => {
          const orderedItem = (o.items || []).find((x) => String(x.itemid) === rid);
          if (!orderedItem) return;

          // determine which services were used
          const usedIron = Boolean(orderedItem.services?.iron && Number(orderedItem.services.iron.quantity) > 0);
          const usedWash = Boolean(orderedItem.services?.wash && Number(orderedItem.services.wash.quantity) > 0);

          // check if user already reviewed this item for the order
          const alreadyReview = itemReviews.some((rev) => String(rev.userid._id) === String(userid) && String(rev.orderid) === String(o._id));

          userEligibleOrders.push({
            orderid: o._id,
            orderCreatedAt: o.createdAt,
            usedIron,
            usedWash,
            alreadyReview,
          });
        });
      }

      return {
        ...it,
        reviews: itemReviews,
        avgRating,
        reviewCount: itemReviews.length,
        userEligibleOrders, // array (empty if no userid or none eligible)
      };
    });

    return res.status(200).json({
      message: "All items fetched successfully (enriched)",
      data: enriched,
    });
  } catch (error) {
    console.error("getallitems error", error);
    return res.status(500).json({
      message: "Get all items failed",
      error: error.message,
    });
    }}






module.exports = { additem, edititem, deleteitem,getallitems };
