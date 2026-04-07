import mongoose from "mongoose";

async function fix() {
  await mongoose.connect("mongodb://localhost:27017/warehouse");
  const { Product } = await import("../server/src/models/Product.js");

  const prods = await Product.find({});
  for (const p of prods) {
    const n = p.name.toLowerCase();
    let cat = "Toys";
    
    if (n.includes("lego") || n.includes("blocks") || n.includes("jenga")) cat = "Building Sets";
    else if (n.includes("doll") || n.includes("barbie") || n.includes("princess")) cat = "Dolls";
    else if (n.includes("board") || n.includes("monopoly") || n.includes("uno") || n.includes("card game")) cat = "Board Games";
    else if (/\b(car|truck|wheels|matchbox|excavator)\b/.test(n)) cat = "Vehicles";
    else if (n.includes("rc ") || n.includes("drone") || n.includes("monster truck")) cat = "RC Vehicles";
    else if (n.includes("puzzle") || n.includes("rubik") || n.includes("wooden puzzle") || n.includes("tiles")) cat = "Puzzles";
    else if (n.includes("stem") || n.includes("robot") || n.includes("learning laptop")) cat = "Educational";
    else if (n.includes("nerf") || n.includes("blaster") || n.includes("foam sword") || n.includes("bubble")) cat = "Outdoor Play";
    else if (n.includes("piano") || n.includes("musical")) cat = "Musical Toys";
    else if (n.includes("doctor") || n.includes("kitchen play") || n.includes("play-doh")) cat = "Role Play";
    else if (n.includes("hoop") || n.includes("basketball")) cat = "Sports Toys";
    else if (n.includes("plush") || n.includes("bear")) cat = "Plush Toys";

    // Reassign
    p.category = cat;
    await p.save();
  }
  console.log("Categories fixed out successfully!");
  process.exit();
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
