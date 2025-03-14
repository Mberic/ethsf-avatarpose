// XXX even though ethers is not used in the code below, it's very likely
// it will be used by any DApp, so we are already including it here
const { ethers } = require("ethers");
const { Image } = require('image-js');

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

async function detectEdges(inputPath, outputPath) {
  try {
      const image = await Image.load(inputPath);
      const gray = image.grey(); // Convert to grayscale

      // Sobel filter
      const kernelX = [
          [-1, 0, 1],
          [-2, 0, 2],
          [-1, 0, 1]
      ];
      const kernelY = [
          [-1, -2, -1],
          [ 0,  0,  0],
          [ 1,  2,  1]
      ];

      const sobelX = gray.convolution(kernelX);
      const sobelY = gray.convolution(kernelY);

      // Compute gradient magnitude
      const edgeImage = sobelX.hypotenuse(sobelY);

      // Normalize and save
      await edgeImage.save(outputPath);
      console.log(`Edge detection complete. Saved as ${outputPath}`);
  } catch (error) {
      console.error('Error processing image:', error);
  }
}

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));
  detectEdges('image.jpeg', 'edges.jpeg');

  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));
  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();