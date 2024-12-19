// import mongoose from "mongoose";

// const options = { discriminatorKey: "kind" };

// const ProductSchema = new mongoose.Schema(
//   { 
//     name: {type: String , required: true} 
//   }, options )

// const Producttt = mongoose.model("Producttt", ProductSchema);


// Producttt.discriminator(
//   "PC",
//   new mongoose.Schema(
//     {
//       cpu: String,
//       gpu: String,
//       ram: String,
//     },
//     options
//   )
// );

// Producttt.discriminator(
//   "Projector",
//   new mongoose.Schema(
//     {
//       resolution: String,
//       lumens: String,
//       contrast: String,
//     },
//     options
//   )
// );

// export { Producttt };
