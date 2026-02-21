// CartController.js
const Cart = require("../model/Cart.js");
const Item = require("../model/Item.js");

// ---------- ADD TO CART ----------
// const addtocart = async (req, res) => {
//   try {
//     const userid = req.userId || req.userData?._id;
//     if (!userid) return res.status(401).json({ message: "Unauthorized" });

//     const { itemid, services = {} } = req.body;
//     if (!itemid) return res.status(400).json({ message: "itemid required" });

//     const it = await Item.findById(itemid);
//     if (!it) return res.status(404).json({ message: "Item not found" });

//     // Calculate per-service quantities & prices
//     const ironQty = Number(services.iron) || 0;
//     const washQty = Number(services.wash) || 0;

//     const ironTotal = ironQty * (it.price || 0);
//     const washTotal = washQty * (it.washingprice || 0);
//     const grandTotal = ironTotal + washTotal;

//     if (ironQty === 0 && washQty === 0)
//       return res.status(400).json({ message: "Select at least one service" });

//     // Check if a cart item for same user/item/services combo exists
//     const exist = await Cart.findOne({
//       userid,
//       itemid,
//       "services.iron.quantity": ironQty,
//       "services.wash.quantity": washQty,
//     });

//     if (exist) {
//       // Update quantities if user adds same services again
//       exist.services.iron.quantity += ironQty;
//       exist.services.iron.price += ironTotal;

//       exist.services.wash.quantity += washQty;
//       exist.services.wash.price += washTotal;

//       exist.totalprice = exist.services.iron.price + exist.services.wash.washingprice;
//       await exist.save();

//       return res.status(200).json({ message: "Cart updated", data: exist });
//     }

//     // Create new cart item
//     const newcart = new Cart({
//       userid,
//       itemid,
//       services: {
//         iron: { quantity: ironQty, price: ironTotal },
//         wash: { quantity: washQty, price: washTotal },
//       },
//       totalprice: grandTotal,
//     });

//     await newcart.save();
//     return res.status(201).json({ message: "Added to cart", data: newcart });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Add to cart failed", error: error.message });
//   }
// };
const addtocart = async (req, res) => {
  try {
    const userid = req.userId || req.userData?._id;
    if (!userid) return res.status(401).json({ message: "Unauthorized" });

    const { itemid, services = {} } = req.body;
    if (!itemid) return res.status(400).json({ message: "itemid required" });

    // Fetch item
    const item = await Item.findById(itemid);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Convert quantities
    const ironQty = Number(services.iron) || 0;
    const washQty = Number(services.wash) || 0;

    if (ironQty === 0 && washQty === 0)
      return res.status(400).json({ message: "Select at least one service" });

    // Calculate totals
    const ironTotal = ironQty * Number(item.price || 0);
    const washTotal = washQty * Number(item.washingprice || 0);

    // Check for existing cart item with same service types
    const exist = await Cart.findOne({
      userid,
      itemid,
      "services.iron.quantity": ironQty,
      "services.wash.quantity": washQty,
    });

    // --------------------------------------------
    // UPDATE EXISTING CART ENTRY
    // --------------------------------------------
    if (exist) {
      exist.services.iron.quantity += ironQty;
      exist.services.iron.price += ironTotal;

      exist.services.wash.quantity += washQty;
      exist.services.wash.washingprice += washTotal; // IMPORTANT FIX

      exist.totalprice =
        Number(exist.services.iron.price) +
        Number(exist.services.wash.washingprice);

      await exist.save();

      return res.status(200).json({
        message: "Cart updated successfully",
        data: exist,
      });
    }

    // --------------------------------------------
    // CREATE NEW CART ENTRY
    // --------------------------------------------
    const newcart = new Cart({
      userid,
      itemid,
      services: {
        iron: {
          quantity: ironQty,
          price: ironTotal,
        },
        wash: {
          quantity: washQty,
          washingprice: washTotal, // IMPORTANT FIELD!
        },
      },
      totalprice: ironTotal + washTotal,
    });

    await newcart.save();

    return res.status(201).json({
      message: "Item added to cart",
      data: newcart,
    });

  } catch (err) {
    console.error("Add to cart error:", err);
    return res.status(500).json({
      message: "Add to cart failed",
      error: err.message,
    });
  }
};







// const addtocart = async (req, res) => {
//   try {
//     const userid = req.userId || req.userData?._id;
//     if (!userid) return res.status(401).json({ message: "Unauthorized" });

//     const { itemid, services = {} } = req.body;
//     if (!itemid) return res.status(400).json({ message: "itemid required" });

//     const it = await Item.findById(itemid);
//     if (!it) return res.status(404).json({ message: "Item not found" });

//     // Ensure prices exist and are valid numbers
//     const itemPrice = Number(it.price);
//     const washingPrice = Number(it.washingprice);

//     if (isNaN(itemPrice) || isNaN(washingPrice)) {
//       return res.status(500).json({
//         message: "Item price/washing price is invalid in database",
//       });
//     }

//     // Service quantities
//     const ironQty = Number(services.iron) || 0;
//     const washQty = Number(services.wash) || 0;

//     if (ironQty === 0 && washQty === 0) {
//       return res.status(400).json({ message: "Select at least one service" });
//     }

//     // Calculate totals
//     const ironTotal = ironQty * itemPrice;
//     const washTotal = washQty * washingPrice;
//     const grandTotal = ironTotal + washTotal;

//     // Validate totals
//     if (
//       isNaN(ironTotal) ||
//       isNaN(washTotal) ||
//       isNaN(grandTotal)
//     ) {
//       return res.status(500).json({ message: "Price calculation failed (NaN)" });
//     }

//     // Check existing cart
//     const exist = await Cart.findOne({
//       userid,
//       itemid,
//       "services.iron.quantity": ironQty,
//       "services.wash.quantity": washQty,
//     });

//     if (exist) {
//       exist.services.iron.quantity += ironQty;
//       exist.services.iron.price += ironTotal;

//       exist.services.wash.quantity += washQty;
//       exist.services.wash.price += washTotal;

//       exist.totalprice =
//         exist.services.iron.price + exist.services.wash.price;

//       // Final validation before save
//       if (isNaN(exist.totalprice)) {
//         return res.status(500).json({ message: "Total price became NaN!" });
//       }

//       await exist.save();
//       return res.status(200).json({ message: "Cart updated", data: exist });
//     }

//     // Create new
//     const newcart = new Cart({
//       userid,
//       itemid,
//       services: {
//         iron: { quantity: ironQty, price: ironTotal },
//         wash: { quantity: washQty, price: washTotal },
//       },
//       totalprice: grandTotal,
//     });

//     if (isNaN(newcart.totalprice)) {
//       return res.status(500).json({ message: "Cart total is NaN!" });
//     }

//     await newcart.save();
//     return res.status(201).json({ message: "Added to cart", data: newcart });

//   } catch (error) {
//     console.error("Add to cart error:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

 
// ---------- GET CART ----------
const getcart = async (req, res) => {
  try {
    const userid = req.userId || req.userData?._id;
    if (!userid) return res.status(401).json({ message: "Unauthorized" });

    const cart = await Cart.find({ userid }).populate("itemid");
    const grandtotal = cart.reduce((sum, c) => sum + Number(c.totalprice || 0), 0);

    return res.status(200).json({ message: "Cart fetched", cart, grandtotal });
  } catch (err) {
    return res.status(500).json({ message: "Fetch cart failed", error: err.message });
  }
};

const updatecart = async (req, res) => {
  try {
    const { cartid, services } = req.body;
    if (!cartid) return res.status(400).json({ message: "Cart ID required" });

    const cart = await Cart.findById(cartid).populate("itemid");
    if (!cart) return res.status(404).json({ message: "Cart item not found" });

    // Handle quantity per service
    const ironQty = Number(services?.iron) || 0;
    const washQty = Number(services?.wash) || 0;

    const ironTotal = ironQty * (cart.itemid.price || 0);
    const washTotal = washQty * (cart.itemid.washingprice || 0);

    cart.services.iron.quantity = ironQty;
    cart.services.iron.price = ironTotal;
    cart.services.wash.quantity = washQty;
    cart.services.wash.price = washTotal;

    cart.totalprice = ironTotal + washTotal;

    await cart.save();
    return res.status(200).json({ message: "Cart updated", data: cart });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Update failed", error: err.message });
  }
};


// ---------- DELETE CART ITEM ----------
const deletecart = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Cart ID required" });

    const removed = await Cart.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ message: "Cart item not found" });

    return res.status(200).json({ message: "Cart item removed", removed });
  } catch (err) {
    return res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

module.exports = { addtocart, getcart, updatecart, deletecart };
