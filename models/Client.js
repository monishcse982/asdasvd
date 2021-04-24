import mongoose from "mongoose";
import moment from "moment";
import unix from "moment";
import validator from "validator";

let subscriptionModels = ["fitness", "cricket"];

let ClientSchema = mongoose.Schema({
  clientName: { type: String },
  subscription: { type: String, enum: subscriptionModels },
  joiningDate: { type: Date, default: Date.now },
  subscriptionStartDate: { type: Date, default: Date.now },
  subscriptionEndDate: { type: Date },
  dateOfBirth: { type: Date, required: false },
  phone: {
    type: String,
    required: true,
    validate: [validator.isMobilePhone, "invalid mobile phone"],
    isAsync: false,
  },
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, "invalid email"],
    isAsync: false,
  },
  clientId: { type: String, unique: true, sparse: true, required: true },
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],
});

ClientSchema.methods.getPaymentHistory = () => {
  return this.payments;
};

ClientSchema.methods.setSubscription = (subscription, callback) => {
  if (subscriptionModels.includes(subscription.toLocaleLowerCase())) {
    this.subscription = subscription;
    this.save(callback);
  }
};

ClientSchema.methods.setSubscriptionDate = (
  subscriptionDate,
  subscriptionPeriod,
  payment,
  callback
) => {
  this.subscriptionStartDate = unix(subscriptionDate).toString();
  this.subscriptionEndDate = moment(unix(subscriptionDate))
    .add(subscriptionPeriod, "M")
    .toString();
  this.payment.push(payment);
  this.save(callback);
};

ClientSchema.methods.getSubscription = () => {
  return this.subscription;
};

ClientSchema.methods.toProfileJSON = () => {
  return {
    username: this.clientName,
    email: this.email.personal,
    phone: this.phone.personal,
    id: this.clientId,
    subscription: this.subscription,
  };
};
mongoose.model("Client", ClientSchema);
