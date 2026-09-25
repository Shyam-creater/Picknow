import { Cart } from "../models/Cart.js";
import productModel from "../models/Product.js";
import { shipfeeModelSchema } from "../models/shipfee.js";

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const {
      productId,
      quantity,
      variantType,
      variantValue,
      price,
      variantId,
      comboName,
      comboImage,
    } = req.body;
    const userId = req.user._id;

    // console.log(req.body);

    // console.log("Cart Controller - Request Body:", {
    //   productId,
    //   quantity,
    //   variantType,
    //   variantValue,
    //   price,
    //   variantId,
    //   comboName,
    //   comboImage,
    // });

    // Input validation
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: `Missing fields. Received: ${JSON.stringify(req.body)}`,
      });
    }

    // Special handling for combo items
    if (variantType === "combo") {
      // Find user's cart or create new one
      let cart = await Cart.findOne({ user: userId });

      if (!cart) {
        cart = new Cart({ user: userId, items: [], totalAmount: 0 });
      }



      // Create combo item with explicit fields
      const comboItem = {
        product: productId,
        quantity: quantity,
        variantType: "combo",
        variantValue: variantValue,
        price: price,
        variantId: variantId || `combo-${productId}`,
        comboName: variantValue || "Combo Offer",
        comboImage: comboImage,
        tax: 0,
        offer: 0,
      };

      // console.log("Combo item being added:", comboItem);

      // Add to cart
      cart.items.push(comboItem);

      // Calculate total amount and fees
      let subtotal = cart.items.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      // Calculate platform fee (fixed amount of ₹8)
      const platformFee = 8;

      // Shipping charges disabled
      const shippingCharges = 0;

      // Set the total amount including all charges
      cart.totalAmount = subtotal;
      cart.platformFee = platformFee;
      cart.shippingCharges = shippingCharges;
      cart.finalAmount = subtotal + platformFee + shippingCharges;

      // Ensure all amounts are valid numbers
      if (isNaN(cart.totalAmount)) cart.totalAmount = 0;
      if (isNaN(cart.platformFee)) cart.platformFee = 0;
      if (isNaN(cart.shippingCharges)) cart.shippingCharges = 0;
      if (isNaN(cart.finalAmount)) cart.finalAmount = 0;

      // Save cart
      const savedCart = await cart.save();
      // console.log(
      //   "Saved cart item:",
      //   savedCart.items[savedCart.items.length - 1]
      // );

      // Return populated cart without populating product for combo items
      const finalCart = await Cart.findById(cart._id).populate({
        path: "items.product",
        select: "pName pPrice pPreviousPrice pOffer pQuantity pImage pStock pBrand",
        match: { _id: { $exists: true } }, // Only populate if product exists
      });

      return res.status(200).json({
        success: true,
        message: "Combo added to cart successfully",
        cart: finalCart,
      });
    }

    // Regular product handling
    const product = await productModel.findById(productId).populate("variants");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Determine correct price and check stock based on variant or product
    let finalPrice = price;
    let availableStock = product.pStock || 0;

    if (variantId) {
      // Import ProductVariant if not available, but usually it's in the models or already populated
      // Since variants are populated in product, we can find it there
      const variant = product.variants.find(v => v._id.toString() === variantId.toString());
      if (variant) {
        if (!finalPrice || finalPrice === 0) {
          finalPrice = variant.price;
        }
        availableStock = variant.stock || 0;
      }
    }

    if (!finalPrice || finalPrice === 0) {
      finalPrice = product.pPrice || 0;
    }

    // Check stock
    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: availableStock <= 0 
          ? "This product is currently out of stock" 
          : `Only ${availableStock} units available in stock`,
      });
    }

    // Find user's cart or create new one
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [], totalAmount: 0 });
    }

    // Check if product with same variant already exists in cart
    const existingItemIndex = cart.items.findIndex((item) => {
      const matchProduct = item.product?.toString() === productId.toString();
      const matchVariant = String(item.variantId || "") === String(variantId || "");
      return matchProduct && matchVariant;
    });

    if (existingItemIndex > -1) {
      // Update quantity if product with same variant exists
      cart.items[existingItemIndex].quantity += quantity;
      // Update price if it was 0 or missing
      if (!cart.items[existingItemIndex].price || cart.items[existingItemIndex].price === 0) {
        cart.items[existingItemIndex].price = finalPrice;
      }
    } else {
      cart.items.push({
        product: productId,
        quantity,
        variantType: variantType || null,
        variantValue: variantValue || null,
        price: finalPrice || null,
        variantId: variantId || null,
        comboName: comboName || null,
        comboImage: comboImage || null,
      });
    }

    // Calculate total amount
    const populatedCart = await cart.populate("items.product");
    let subtotal = 0;
    let platformFee = 0;

    populatedCart.items.forEach((item) => {
      // Use the item's price if available, otherwise use the product's price
      const itemPrice =
        item.price ||
        (item.product && typeof item.product.pPrice === "number"
          ? item.product.pPrice
          : 0);
      const itemQuantity = item.quantity || 0;
      const itemTotal = itemPrice * itemQuantity;
      subtotal += itemTotal;
    });

    // Calculate platform fee (fixed amount of ₹8)
    platformFee = 8;

    // Shipping charges disabled
    const shippingCharges = 0;

    // Set the total amount including all charges
    cart.totalAmount = subtotal;
    cart.platformFee = platformFee;
    cart.shippingCharges = shippingCharges;
    cart.finalAmount = subtotal + platformFee + shippingCharges;

    // Ensure all amounts are valid numbers
    if (isNaN(cart.totalAmount)) cart.totalAmount = 0;
    if (isNaN(cart.platformFee)) cart.platformFee = 0;
    if (isNaN(cart.shippingCharges)) cart.shippingCharges = 0;
    if (isNaN(cart.finalAmount)) cart.finalAmount = 0;

    var aaa = await cart.save();
    // Return populated cart with all necessary fields
    const finalCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "pName pPrice pPreviousPrice pOffer pQuantity pImage pStock pBrand",
    });

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart: finalCart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add item to cart",
    });
  }
};

// Get cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: "items.product",
        model: "products",
        select:
          "pName pPrice pPreviousPrice pOffer pQuantity pImage pStock pType pis_voucher_100 pis_voucher_50 freeshipping pBrand",
        populate: {
          path: "variants",
          model: "ProductVariant",
          select: "stock size price previousPrice offer",
        },
      });

    // If no cart found, return an empty structure
    if (!cart) {
      return res.json({
        success: true,
        cart: {
          items: [],
          totalAmount: 0,
          platformFee: 0,
          shippingCharges: 0,
          finalAmount: 0,
        },
      });
    }

    // Filter out items where the product no longer exists (deleted products)
    const originalItemCount = cart.items.length;
    cart.items = cart.items.filter(item => item.product !== null);

    // If some products were deleted, save the cart to clean up the database
    if (cart.items.length !== originalItemCount) {
      // Recalculate totals since some items were removed
      let subtotal = 0;
      cart.items.forEach(item => {
        subtotal += (item.price || 0) * (item.quantity || 0);
      });
      cart.totalAmount = subtotal;
      cart.finalAmount = subtotal + (cart.platformFee || 0) + (cart.shippingCharges || 0);
      await cart.save();
    }

    // Convert to plain object to allow adding dynamic properties
    const cartObj = cart.toObject();

    // Directly attach variant details and ensure price is correct
    cartObj.items.forEach((item) => {
      const { product, variantId } = item;

      // If price is missing or 0 in cart, try to get it from product or variant
      if (!item.price || item.price === 0) {
        if (variantId && product?.variants?.length) {
          const variant = product.variants.find(
            (v) => v._id.toString() === variantId.toString()
          );
          if (variant) {
            item.price = variant.price;
            item.variantDetails = {
              price: variant.price,
              previousPrice: variant.previousPrice,
              offer: variant.offer,
            };
          }
        } else if (product && product.pPrice) {
          item.price = product.pPrice;
        }
      } else if (variantId && product?.variants?.length) {
        // Even if price exists, still attach variantDetails for the UI
        const variant = product.variants.find(
          (v) => v._id.toString() === variantId.toString()
        );
        if (variant) {
          item.variantDetails = {
            price: variant.price,
            previousPrice: variant.previousPrice,
            offer: variant.offer,
          };
        }
      }
    });

    res.json({ success: true, cart: cartObj });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
};



// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { variantId, productId, quantity, variantType, variantValue, price } =
      req.body;

    // console.log("updateCartItem called with:", {
    //   variantId,
    //   productId,
    //   quantity,
    //   variantType,
    //   variantValue,
    //   price,
    // });

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // console.log("Found cart with items:", cart.items.length);

    // Find item by variantId if provided, otherwise fall back to productId + variantType + variantValue
    let itemIndex = -1;
    if (variantId) {
      itemIndex = cart.items.findIndex(
        (item) => item.variantId === variantId
      );
    } else if (productId) {
      // For regular products, variantType and variantValue might be undefined/null
      if (variantType && variantValue) {
        // If variantType and variantValue are provided, use them
        itemIndex = cart.items.findIndex(
          (item) =>
            item.product.toString() === productId &&
            item.variantType === variantType &&
            item.variantValue === variantValue
        );
      } else {
        // For regular products without variants, just match by productId
        itemIndex = cart.items.findIndex(
          (item) =>
            item.product.toString() === productId &&
            (!item.variantType || item.variantType === variantType) &&
            (!item.variantValue || item.variantValue === variantValue)
        );
      }
    }

    // console.log("Item index found:", itemIndex);

    if (itemIndex === -1) {
      // console.log(
      //   "Product not found in cart. Available items:",
      //   cart.items.map((item) => ({
      //     productId: item.product.toString(),
      //     variantType: item.variantType,
      //     variantValue: item.variantValue,
      //     variantId: item.variantId,
      //   }))
      // );
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    const cartItem = cart.items[itemIndex];

    if (cartItem.variantType === "combo") {
      // For combos, just update quantity without stock check
      cartItem.quantity = quantity;
    } else {
      // For regular products, check stock
      const product = await productModel.findById(cartItem.product).populate("variants");
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      let availableStock = product.pStock || 0;
      let dbPrice = product.pPrice || 0;

      if (cartItem.variantId) {
        const variant = product.variants.find(v => v._id.toString() === cartItem.variantId.toString());
        if (variant) {
          availableStock = variant.stock || 0;
          dbPrice = variant.price;
        }
      }

      if (availableStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} items available in stock`,
        });
      }

      cartItem.quantity = quantity;

      // Ensure price is set if it was 0 or missing
      if (!cartItem.price || cartItem.price === 0) {
        cartItem.price = dbPrice;
      }
    }

    // Update price if provided
    if (price !== undefined) {
      cartItem.price = price;
    }

    // Generate variantId if it doesn't exist
    if (!cartItem.variantId) {
      cartItem.variantId =
        cartItem.variantType === "combo"
          ? `combo-${cartItem.product}`
          : `${cartItem.product}-${cartItem.variantType || "default"}-${cartItem.variantValue || "default"
          }`;
    }

    // Recalculate total amount
    const populatedCart = await cart.populate("items.product");
    let subtotal = 0;
    let platformFee = 0;

    populatedCart.items.forEach((item) => {
      const itemPrice =
        item.price ||
        (item.product && typeof item.product.pPrice === "number"
          ? item.product.pPrice
          : 0);
      const itemQuantity = item.quantity || 0;
      subtotal += itemPrice * itemQuantity;
    });

    // Calculate platform fee (fixed amount of ₹8)
    platformFee = 8;

    // Shipping charges disabled
    const shippingCharges = 0;
    cart.totalAmount = subtotal;
    cart.platformFee = platformFee;
    cart.shippingCharges = shippingCharges;
    cart.finalAmount = subtotal + platformFee + shippingCharges;
    if (isNaN(cart.totalAmount)) cart.totalAmount = 0;
    if (isNaN(cart.platformFee)) cart.platformFee = 0;
    if (isNaN(cart.shippingCharges)) cart.shippingCharges = 0;
    if (isNaN(cart.finalAmount)) cart.finalAmount = 0;

    await cart.save();
    // console.log(
    //   "Cart saved successfully. Updated quantity:",
    //   cartItem.quantity
    // );

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "pName pPrice pPreviousPrice pOffer pQuantity pImage pStock pBrand",
    });

    // console.log("Sending response with updated cart");
    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { variantId, productId, variantType, variantValue } = req.query;
    if (!variantId && !productId) {
      return res.status(400).json({
        success: false,
        message: "Either variantId or productId is required",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Remove the item from cart by variantId if provided, otherwise by productId + variantType + variantValue
    if (variantId) {
      // New approach: remove by variantId (using toString() for safe comparison)
      cart.items = cart.items.filter((item) => item.variantId?.toString() !== variantId.toString());
    } else {
      // Legacy approach: remove by productId + variantType + variantValue
      cart.items = cart.items.filter(
        (item) =>
          !(
            item.product.toString() === productId.toString() &&
            (!variantType || item.variantType === variantType) &&
            (!variantValue || item.variantValue === variantValue)
          )
      );
    }

    // Recalculate total amount
    const populatedCart = await cart.populate("items.product");
    let subtotal = 0;
    let platformFee = 0;

    populatedCart.items.forEach((item) => {
      // Use the item's price if available, otherwise use the product's price
      const itemPrice =
        item.price ||
        (item.product && typeof item.product.pPrice === "number"
          ? item.product.pPrice
          : 0);
      const itemQuantity = item.quantity || 0;
      const itemTotal = itemPrice * itemQuantity;
      subtotal += itemTotal;
    });

    // Calculate platform fee (fixed amount of ₹8)
    platformFee = 8;

    // Shipping charges disabled
    const shippingCharges = 0;

    // Set the total amount including all charges
    cart.totalAmount = subtotal;
    cart.platformFee = platformFee;
    cart.shippingCharges = shippingCharges;
    cart.finalAmount = subtotal + platformFee + shippingCharges;

    // Ensure all amounts are valid numbers
    if (isNaN(cart.totalAmount)) cart.totalAmount = 0;
    if (isNaN(cart.platformFee)) cart.platformFee = 0;
    if (isNaN(cart.shippingCharges)) cart.shippingCharges = 0;
    if (isNaN(cart.finalAmount)) cart.finalAmount = 0;

    await cart.save();

    // Return populated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "pName pPrice pPreviousPrice pOffer pQuantity pImage pStock pBrand",
    });

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove item from cart",
    });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
