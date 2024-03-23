const fs = require("fs");
const { Location, ReturnType, CodeLanguage } = require("@chainlink/functions-toolkit");


// Placeholder values for demonstration. In practice, these would be dynamically passed from the frontend
let candidateName = "{{candidateName}}"; // Placeholder for candidate name
let currentVoteCount = "{{currentVoteCount}}"; // Placeholder for current vote count as a string

// Configure the request by setting the fields below
const requestConfig = {

  source: fs.readFileSync("./vote-calculation.js").toString(),
  codeLocation: Location.Inline,
  // Dynamic args passed into the JavaScript code; these would be replaced with actual values at runtime
  args: [candidateName, currentVoteCount],
  codeLanguage: CodeLanguage.JavaScript,
  expectedReturnType: ReturnType.Uint256,
  
}

module.exports = requestConfig;
