import express from "express";
import mongoose from "mongoose";
import moment from "moment";
import unix from "moment";
import auth from "../auth.js";

let clientRouter = express.Router();
let Client = mongoose.model("Client");
let Payment = mongoose.model("Payment");

// Validate helpers
const validatePaymentAndSubscriptionPeriod = (
  subscriptionPeriod,
  paymentAmount
) => {
  let subscriptionPeriodOptions = [1, 3, 6, 12];
  if (!subscriptionPeriodOptions.includes(subscriptionPeriod)) {
    return {
      status: false,
      message: "Invalid subscription period",
    };
  }
  if (subscriptionPeriod === 1 && paymentAmount === 2000) {
    return { status: true };
  } else if (subscriptionPeriod === 3 && paymentAmount === 5000) {
    return { status: true };
  } else if (subscriptionPeriod === 6 && paymentAmount === 9000) {
    return { status: true };
  } else if (subscriptionPeriod === 12 && paymentAmount === 12000) {
    return { status: false };
  }
  return {
    status: false,
    message: "Invalid fee for subscription period",
  };
};

const isDateValid = (input) => {
  let today = moment();
  let inputDate = unix(input);
  return inputDate > today || today.isSame(inputDate, "date");
};

clientRouter.get("/", (req, res, next) => {
  return res.json({ message: "Client portal ping success!" });
});

// Register a new client
clientRouter.post("/register", auth.required, (req, res, next) => {
  if (
    !req.body.username ||
    !req.body.subscription ||
    !req.body.clientId ||
    !req.body.phoneNumber ||
    !req.body.email ||
    !req.body.paymentInstrument ||
    !req.body.subscriptionPeriod ||
    !req.body.paymentAmount ||
    !req.body.joiningDate ||
    !req.body.dateOfBirth
  ) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }
  if (!isDateValid(req.body.joiningDate)) {
    return res.status(400).json({ message: "Joining date is invalid" });
  }
  let validationResult = validatePaymentAndSubscriptionPeriod(
    req.body.subscriptionPeriod,
    req.body.paymentAmount
  );
  if (validationResult.status === false) {
    return res.status(400).json({ message: validationResult.message });
  }
  let client = new Client();
  let payment = new Payment();
  let joiningDate = unix(req.body.joiningDate).toString();
  client.joiningDate = unix(req.body.joiningDate).toString();
  client.subscriptionStartDate = joiningDate;
  client.subscriptionEndDate = moment(unix(req.body.joiningDate))
    .add(req.body.subscriptionPeriod, "M")
    .toString();

  client.clientName = req.body.username;
  client.clientId = req.body.clientId;
  client.phone = { personal: req.body.phoneNumber };
  client.dateOfBirth = unix(req.body.dateOfBirth).toString();
  if (req.body.email) {
    client.email = {
      personal: req.body.email,
    };
  }

  payment.paymentInstrument = req.body.paymentInstrument;
  payment.paymentDate = joiningDate;
  payment.nextPaymentDate = moment(unix(req.body.joiningDate))
    .add(req.body.subscriptionPeriod, "M")
    .toString();
  payment.client = req.body.clientId;
  payment.paymentAmount = req.body.paymentAmount;

  payment.save((err) => {
    if (err) {
      return next(err);
    }
    client.payments.push(payment);
    client.save((err) => {
      if (err) {
        next(err);
      }
      return res.json(client);
    });
  });
});

// Get all clients
clientRouter.get("/", auth.required, (req, res, next) => {
  Client.find((err, clients) => {
    if (err) {
      return next(err);
    }
    return res.json(clients);
  });
});

// Get client by id
clientRouter.get("/:clientId", auth.required, (req, res, next) => {
  let clientId = req.params.clientId;
  Client.findOne({ clientId: clientId }, (err, client) => {
    if (err) {
      next(err);
    }
    if (client === null) {
      return res.json({
        message: "Client with id: " + clientId + " not found!",
      });
    }
    return res.json({
      userName: client.clientName,
      userId: client.clientId,
    });
  });
});

// Remove client
clientRouter.delete("/:clientId", auth.required, (req, res, next) => {
  let clientId = req.params.clientId;
  Client.findOne({ clientId: clientId }, (err, client) => {
    if (err) {
      next(err);
    }
    if (client === null) {
      return res.json({
        message: "Client with id: " + clientId + " not found!",
      });
    }
    client.remove((err) => {
      if (err) {
        next(err);
      }
      return res.json({
        username: client.clientName,
        clientId: client.clientId,
      });
    });
  });
});

// Record payment
clientRouter.post("/payment", auth.required, (req, res, next) => {
  if (
    !req.body.clientId ||
    !req.body.subscriptionPeriod ||
    !req.body.amount ||
    !req.body.subscription ||
    !req.body.paymentInstrument
  ) {
    return res.status(400).json({ message: "Fill in all the fields" });
  }
  let payment = new Payment();
  let now = moment();

  // Find client based on clientId
  let clientId = req.body.clientId;
  Client.findOne({ clientId: clientId }, (err, client) => {
    if (err) {
      next(err);
    }
    if (client === null) {
      return res.json({
        message: "Client with id: " + req.body.clientId + " not found!",
      });
    }

    // Validate payment amount and subscription period match
    if (
      !validatePaymentAndSubscriptionPeriod(
        req.body.subscriptionPeriod,
        req.body.amount
      ).status
    ) {
      return res
        .status(400)
        .json({ message: "Invalid amount for subscription period" });
    }

    let currentSubscriptionEndDate = moment(client.subscriptionEndDate);
    if (Math.abs(now.diff(currentSubscriptionEndDate, "d")) > 7) {
      return res.json({ message: "Too soon to pay for further subscription" });
    }

    payment.client = req.body.clientId;
    payment.paymentAmount = req.body.amount;
    payment.paymentInstrument = req.body.paymentInstrument;
    payment.paymentDate = now.valueOf();
    payment.nextPaymentDate = now
      .add(req.body.subscriptionPeriod, "M")
      .valueOf();

    payment.save((err) => {
      if (err) {
        next(err);
      }
    });

    let clientPayments = client.payments;
    client.subscriptionStartDate = payment.paymentDate;
    client.subscriptionEndDate = payment.nextPaymentDate;
    clientPayments.push(payment);
    client.payments = clientPayments;
    client.save((err) => {
      if (err) {
        return next(err);
      }
      return res.json(payment);
    });
  });
});

export default clientRouter;
