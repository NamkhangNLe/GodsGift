import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import pdfParse from 'pdf-parse';
import './style.css';

let API_KEY = 'AIzaSyC-_7mZuoHuxGrWS4P750XVMHiuxUuPocU';

let form = document.querySelector('form');
let promptInput = document.querySelector('input[name="prompt"]');
let output = document.querySelector('.output');

async function parseResume(resumeBuffer) {
  const data = await pdfParse(resumeBuffer);
  return data.text;
}

function extractInfoFromResume(resumeText) {
  // This is a very basic example. You'd likely want to use a more sophisticated approach in a real application.
  const skills = resumeText.match(/(JavaScript|Python|Java|C#|Ruby|PHP)/g);
  return { skills };
}

function startVideoInterview() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      const video = document.querySelector('video');
      video.srcObject = stream;
    })
    .catch(err => {
      console.error('Error accessing media devices.', err);
    });
}

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';

  try {
    // Parse the resume and extract information
    const resumeBuffer = form.elements.namedItem('resume').files[0];
    const resumeText = await parseResume(resumeBuffer);
    const info = extractInfoFromResume(resumeText);

    // Generate questions based on the extracted skills
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro-vision",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const contents = info.skills.map(skill => ({prompt: `Tell me about your experience with ${skill}.`}));
    const result = await model.generateContentStream({ contents });

    // Read from the stream and interpret the output as markdown
    let buffer = [];
    let md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
      output.innerHTML = md.render(buffer.join(''));
    }

    // Start a video interview
    startVideoInterview();
  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }
};

// form.onsubmit = async (ev) => {
//   ev.preventDefault();
//   output.textContent = 'Generating...';

//   try {
//     // Load the image as a base64 string
//     let imageUrl = form.elements.namedItem('chosen-image').value;
//     let imageBase64 = await fetch(imageUrl)
//       .then(r => r.arrayBuffer())
//       .then(a => Base64.fromByteArray(new Uint8Array(a)));

//     // Assemble the prompt by combining the text with the chosen image
//     let contents = [
//       {
//         role: 'user',
//         parts: [
//           { inline_data: { mime_type: 'image/jpeg', data: imageBase64, } },
//           { text: promptInput.value }
//         ]
//       }
//     ];

//     // Call the gemini-pro-vision model, and get a stream of results
//     const genAI = new GoogleGenerativeAI(API_KEY);
//     const model = genAI.getGenerativeModel({
//       model: "gemini-pro-vision",
//       safetySettings: [
//         {
//           category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//           threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
//         },
//       ],
//     });

//     const result = await model.generateContentStream({ contents });

//     // Read from the stream and interpret the output as markdown
//     let buffer = [];
//     let md = new MarkdownIt();
//     for await (let response of result.stream) {
//       buffer.push(response.text());
//       output.innerHTML = md.render(buffer.join(''));
//     }
//   } catch (e) {
//     output.innerHTML += '<hr>' + e;
//   }
// };