//@ts-check
import * as cheerio from "cheerio";
import * as mongoose from "mongoose";
import Temperature from "./models/temperature.js";

async function run() {
  // Got this func while creating a new DB on MongoDB Atlas
  const clientOptions = {
    serverApi: { version: "1", strict: true, deprecationErrors: true },
  };
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    const uri = process.env.DB_URI;
    await mongoose.connect(uri, clientOptions);
    // Don't know why the next wouldn't work
    //await mongoose.connection.db.admin().command({ ping: 1 });
    console.info(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

function parse(html, extreme) {
  const cityTemperatures = [];
  let dateSelector = "";
  let tableSelector = "";

  const $ = cheerio.load(html);

  if (extreme === "min") {
    dateSelector = "i.fa-temperature-low";
    tableSelector = "table#minTempTable";
  } else {
    dateSelector = "i.fa-temperature-high";
    tableSelector = "table#maxTempTable";
  }

  const dateString = $(dateSelector).parent().next().text();

  if (!dateString) {
    throw new Error("Date not found!");
  }

  // AI Gemini
  $(`${tableSelector} tr`).each((i, element) => {
    const firstTd = $(element).find("td").first();
    const temperatureTd = $(element).find("td").eq(1);

    const cityName = firstTd.text().trim().toLowerCase();
    const temperatureString = temperatureTd.text().trim();
    const temperature = parseFloat(temperatureString);

    if (
      (cityName === "multan airport" || cityName === "multan city") &&
      !isNaN(temperature)
    ) {
      cityTemperatures.push({
        city: cityName,
        temperature: temperature,
        dateString,
        extreme,
      });
    }
  });

  return cityTemperatures;
}

async function createRecords(cityTemperatures) {
  const isConnected = await run();
  if (!isConnected) {
    return;
  }
  for (let temp of cityTemperatures) {
    const station = temp.city.split(" ")[1];

    const newObj = {
      city: `Multan`,
      station,
      temperature: temp.temperature,
      type: temp.extreme,
      dateString: temp.dateString,
    };

    // Check if today's temperatures already exist in DB

    const existingTemp = await Temperature.findOne({
      station,
      dateString: temp.dateString,
    });

    if (!existingTemp) {
      // await Temperature.create(newObj);
    }
  }
  await mongoose.disconnect();
  console.info(`Disconnected`);
}

async function main() {
  try {
    const init = {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    };

    const response = await fetch(
      "https://weather.gov.pk/regional/Punjab/print-highlights",
      init,
    );
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const html = await response.text();
    const extremes = ["min", "max"];

    for (let extreme of extremes) {
      const cityTemperatures = parse(html, extreme);
      createRecords(cityTemperatures);
    }
  } catch (err) {
    console.error(err);
  }
}

// Need this as PMD server SSL is misconfigured.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
main();
