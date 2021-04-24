import mongoose from "mongoose";

let paymentInstruments = ["Cash", "Card", "UPI"];

let PaymentSchema = mongoose.Schema({
  paymentInstrument: {
    type: String,
    enum: paymentInstruments,
    default: "Cash",
  },
  paymentDate: { type: Date, default: Date.now },
  nextPaymentDate: { type: Date },
  client: { type: String, required: true },
  paymentAmount: { type: Number },
});

mongoose.model("Payment", PaymentSchema);
