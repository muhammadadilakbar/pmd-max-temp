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
    //await mongoose.connection.db.admin().command({ ping: 1 });
    console.info(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

function parse(html) {
  const $ = cheerio.load(html);
  const cityTemperatures = [];

  const h3 = $("h3").text().trim();
  const parenthesisIndex = h3.indexOf("(");
  if (parenthesisIndex === -1) {
    throw new Error("Date not found!");
  }
  const dateString = h3.substring(0, parenthesisIndex).trim();

  // AI Gemini
  $("table tbody tr").each((i, element) => {
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
    const newObj = {
      city: `Multan`,
      station: temp.city.split(" ")[1],
      temperature: temp.temperature,
      type: "max",
      dateString: temp.dateString,
    };
    await Temperature.create(newObj);
  }
  await mongoose.disconnect();
  console.info(`Disconnected`);
}

async function main() {
  try {
    const init = { method: "GET" };
    const response = await fetch(
      "https://www.pmd.gov.pk/datadecoders/pmd-maxtemp-print-filtered.php?rmc=3",
      init
    );
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const html = await response.text();
    const cityTemperatures = parse(html);
    createRecords(cityTemperatures);
  } catch (err) {
    console.error(err);
  }
}

main();
