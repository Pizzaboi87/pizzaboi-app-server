const express = require("express");
const app = express();
const stripe = require("stripe")(`${process.env.API_SECRET_KEY}`);

app.use(express.json());

app.post("/payment-sheet", async (req, res) => {
  const { amount, userName, phone, address, email, uid } = req.body;

  let customer;

  try {
    customer = await stripe.customers.retrieve(uid);
  } catch (err) {
    if (err.statusCode === 404) {
      customer = await stripe.customers.create({
        id: uid,
        name: userName,
        phone: phone,
        address: address,
        email: email,
      });
    } else {
      throw err;
    }
  }

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: "2022-11-15" }
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "eur",
    customer: customer.id,
    payment_method_types: ["card"],
  });

  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    publishableKey: `${process.env.API_PUBLISH_KEY}`,
  });
});
app.listen(process.env.PORT || 3000);
