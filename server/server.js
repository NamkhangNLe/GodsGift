const express = require('express');
const fileUpload = require('express-fileupload');
const pdfParse = require('pdf-parse');

// npm install express express-fileupload pdf-parse
const app = express();

app.use(fileUpload());

app.post('/parse-pdf', async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "resume") is used to retrieve the uploaded file
  let resumeFile = req.files.resume;

  // Use the mv() method to place the file somewhere on your server
  resumeFile.mv('/somewhere/on/your/server', async function(err) {
    if (err)
      return res.status(500).send(err);

    const data = await pdfParse(resumeFile.data);
    res.send(data.text);
  });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});