"use strict";

import * as mongoose from "mongoose";
const { Schema } = mongoose;

const temperatureSchema = new Schema(
  {
    city: {
      type: String,
      required: [true, "City name is required"],
      index: true,
    },
    station: {
      // e.g., city, airport etc.
      type: String,
      default: null,
    },
    temperature: {
      // degree centigrade
      type: Number,
      default: null,
    },
    type: {
      type: String,
      enum: ["min", "max"],
      required: [true, "Min or max is required"],
    },
    dateString: {
      type: String,
      required: [true, "Date string is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Temperature = mongoose.model("Temperature", temperatureSchema);
export default Temperature;
