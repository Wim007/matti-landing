const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3000;
const SMTP_USER = process.env.SMTP_USER || 'glashelder1@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || '';
const ONTVANGERS = 'info@slimmemaatjes.online, glashelder1@gmail.com';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

function parseBody(req, cb) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    const p = new URLSearchParams(body);
    cb({
      naam:    p.get('naam')    || '',
      school:  p.get('school')  || '',
      functie: p.get('functie') || '',
      email:   p.get('email')   || ''
    });
  });
}

const server = http.createServer((req, res) => {

  if (req.method === 'POST' && req.url === '/api/pilot-aanmelding') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      let d = {};
      try { d = JSON.parse(body); } catch(e) {}
      const notificatie = {
        from: SMTP_USER, to: ONTVANGERS,
        subject: 'Nieuwe pilot-aanmelding - VO school',
        text: `Nieuwe pilot-aanmelding:\n\nNaam:    ${d.naam}\nSchool:  ${d.school}\nE-mail:  ${d.email}\nTelefoon: ${d.telefoon || '-'}`
      };
      const bevestiging = {
        from: SMTP_USER, to: d.email,
        subject: 'Demonstratie Matti aangevraagd',
        text: `Beste ${d.naam},\n\nBedankt voor uw interesse in het pilotprogramma van Matti.\n\nIk neem binnen 2 werkdagen persoonlijk contact met u op.\n\nMet vriendelijke groet,\nWim Moddejongen\nOntwikkelaar van Matti`
      };
      transporter.sendMail(notificatie, () => {});
      transporter.sendMail(bevestiging, () => {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/aanvraag') {
    parseBody(req, (d) => {
      const notificatie = {
        from: SMTP_USER,
        to: ONTVANGERS,
        subject: 'Nieuwe aanvraag demonstratie - VO',
        text: `Nieuwe aanvraag via de Matti landingspagina:\n\nNaam:    ${d.naam}\nSchool:  ${d.school}\nFunctie: ${d.functie}\nE-mail:  ${d.email}`
      };
      const bevestiging = {
        from: SMTP_USER,
        to: d.email,
        subject: 'Demonstratie Matti - Voortgezet Onderwijs',
        text: `Dank voor uw interesse in Matti. Ik neem persoonlijk contact met u op om een demonstratie te bespreken.`
      };
      transporter.sendMail(notificatie, (err1) => {
        if (err1) {
          console.error('Notificatiemail mislukt:', err1.message);
          res.writeHead(500); res.end('Mail error'); return;
        }
        transporter.sendMail(bevestiging, (err2) => {
          if (err2) console.error('Bevestigingsmail mislukt:', err2.message);
          res.writeHead(200); res.end('OK');
        });
      });
    });
    return;
  }

  const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(__dirname, 'index.html'), (e, d) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(d);
      });
      return;
    }
    const ext = path.extname(filePath);
    const types = { '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.js': 'application/javascript' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => console.log('Running on ' + PORT));
