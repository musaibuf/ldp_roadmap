require('dotenv').config();
const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const fs = require('fs');
// --- FIX: We will import this dynamically later ---
// const { GoogleSpreadsheet } = require('google-spreadsheet'); 
const { JWT } = require('google-auth-library');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Google Sheets Setup ---
const creds = require('./credentials.json');
const SPREADSHEEET_ID = process.env.SPREADSHEET_ID; 

const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// --- FIX: Initialize doc variable here, but load it inside an async function ---
let doc;

async function accessSheet() {
    try {
        // --- FIX: Use dynamic import() to load the ESM module ---
        const { GoogleSpreadsheet } = await import('google-spreadsheet');
        doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

        await doc.loadInfo();
        console.log(`Successfully connected to Google Sheet: "${doc.title}"`);
    } catch (error) {
        console.error('Error loading Google Sheet:', error);
    }
}

accessSheet(); // Initialize connection on server start

// --- API Endpoints ---

app.post('/api/submit', async (req, res) => {
    try {
        if (!doc) { // Safety check in case the initial connection failed
            throw new Error('Google Sheet not initialized.');
        }
        const sheet = doc.sheetsByIndex[0];
        const { userInfo, formData } = req.body;

        if (!userInfo || !formData) return res.status(400).json({ message: "Missing data." });

        const newRow = { Timestamp: new Date().toLocaleString(), Name: userInfo.name, Organization: userInfo.organization, 'Vision 1': formData.vision1, 'Vision 2': formData.vision2, 'Focus Self': formData.focusSelf.join(', '), 'Focus Relational': formData.focusRelational.join(', '), 'Focus Strategic': formData.focusStrategic.join(', '), 'Goal Self 1': formData.goalSelf1, 'Goal Self 2': formData.goalSelf2, 'Goal Relational 1': formData.goalRelational1, 'Goal Relational 2': formData.goalRelational2, 'Goal Strategic 1': formData.goalStrategic1, 'Goal Strategic 2': formData.goalStrategic2, 'Dev Stretch': formData.devStretch, 'Dev Coaching': formData.devCoaching, 'Dev Learning': formData.devLearning, 'Dev Reflection': formData.devReflection, 'Measure Behaviors': formData.measureBehaviors, 'Measure Feedback': formData.measureFeedback, 'Measure Indicators': formData.measureIndicators, 'Accountability': formData.accountability };

        await sheet.addRow(newRow);
        res.status(200).json({ message: "Response submitted successfully!" });
    } catch (error) {
        console.error('Error saving to Google Sheet:', error);
        res.status(500).json({ message: "Failed to save results." });
    }
});

app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { userInfo, formData } = req.body;
        if (!userInfo || !formData) return res.status(400).send('Missing data for PDF generation.');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Leadership-Roadmap-${userInfo.name.replace(/\s+/g, '-')}.pdf`);

        const pdfDoc = new PDFDocument({ size: 'A4', margin: 50 });
        pdfDoc.pipe(res);

        const BRAND_COLOR_RED = '#B31B1B';
        const BRAND_COLOR_ORANGE = '#F57C00';
        const TEXT_COLOR = '#34495e';
        
        const addPageHeader = (title) => {
            pdfDoc.fontSize(22).fillColor(BRAND_COLOR_RED).font('Helvetica-Bold').text(title, { align: 'center' });
            pdfDoc.moveDown(2);
        };

        const addContentBlock = (title, items) => {
            if (pdfDoc.y > pdfDoc.page.height - 200) { pdfDoc.addPage(); addPageHeader("Your Responses (continued)"); }
            pdfDoc.fontSize(18).fillColor(BRAND_COLOR_ORANGE).font('Helvetica-Bold').text(title);
            pdfDoc.moveDown(0.7);
            items.forEach(item => {
                pdfDoc.fontSize(12).fillColor(TEXT_COLOR).font('Helvetica-Bold').text(item.label + ':');
                pdfDoc.fontSize(12).font('Helvetica').text(item.value || 'No response provided.', { indent: 15 });
                pdfDoc.moveDown(0.8);
            });
            pdfDoc.moveDown(1.5);
        };

        if (fs.existsSync('./logo.png')) {
            const imageWidth = 80;
            const xPosition = (pdfDoc.page.width - imageWidth) / 2;
            pdfDoc.image('./logo.png', xPosition, 60, { width: imageWidth });
        }
        
        const titleY = 150;
        pdfDoc.y = titleY;

        pdfDoc.fontSize(28).fillColor(BRAND_COLOR_ORANGE).font('Helvetica-Bold').text('Leader\'s Development Roadmap', { align: 'center' });
        pdfDoc.moveDown(0.5);
        pdfDoc.fontSize(16).fillColor(TEXT_COLOR).font('Helvetica').text('Your Responses', { align: 'center' });
        pdfDoc.moveDown(1.5);
        pdfDoc.strokeColor(BRAND_COLOR_ORANGE).lineWidth(1.5).moveTo(100, pdfDoc.y).lineTo(pdfDoc.page.width - 100, pdfDoc.y).stroke();
        pdfDoc.moveDown(3);

        pdfDoc.fontSize(14).fillColor(TEXT_COLOR).font('Helvetica-Bold').text('Name:', { continued: true }).font('Helvetica').text(` ${userInfo.name}`);
        pdfDoc.moveDown(0.5);
        pdfDoc.font('Helvetica-Bold').text('Organization:', { continued: true }).font('Helvetica').text(` ${userInfo.organization}`);
        pdfDoc.moveDown(0.5);
        pdfDoc.font('Helvetica-Bold').text('Date:', { continued: true }).font('Helvetica').text(` ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);

        pdfDoc.addPage();
        addPageHeader('Your Submitted Responses');

        addContentBlock('1. My Leadership Vision', [
            { label: 'Where I want to be in 12 months', value: formData.vision1 },
            { label: 'The kind of leader I aspire to be', value: formData.vision2 },
        ]);
        addContentBlock('2. Focus Areas for Growth', [
            { label: 'Self-Leadership', value: formData.focusSelf.join(' | ') },
            { label: 'Relational Leadership', value: formData.focusRelational.join(' | ') },
            { label: 'Strategic Leadership', value: formData.focusStrategic.join(' | ') },
        ]);
        addContentBlock('3. My Development Goals', [
            { label: 'Self-Leadership Goal 1', value: formData.goalSelf1 },
            { label: 'Self-Leadership Goal 2', value: formData.goalSelf2 },
            { label: 'Relational Leadership Goal 1', value: formData.goalRelational1 },
            { label: 'Relational Leadership Goal 2', value: formData.goalRelational2 },
            { label: 'Strategic Leadership Goal 1', value: formData.goalStrategic1 },
            { label: 'Strategic Leadership Goal 2', value: formData.goalStrategic2 },
        ]);

        pdfDoc.addPage();
        addPageHeader('Your Action Plan');

        addContentBlock('4. Development Activities', [
            { label: 'Stretch Assignments', value: formData.devStretch },
            { label: 'Coaching/Mentorship', value: formData.devCoaching },
            { label: 'Learning', value: formData.devLearning },
            { label: 'Reflection Practices', value: formData.devReflection },
        ]);
        addContentBlock('5. Success Measures & Accountability', [
            { label: 'Key Behaviors', value: formData.measureBehaviors },
            { label: 'Feedback Sources', value: formData.measureFeedback },
            { label: 'Indicators of Success', value: formData.measureIndicators },
            { label: 'Who will keep me accountable', value: formData.accountability },
        ]);

        console.log('PDF Generated Successfully.');
        pdfDoc.end();

    } catch (error) {
        console.error('FATAL ERROR generating PDF:', error);
        if (!res.headersSent) {
            res.status(500).send('An internal server error occurred while generating the PDF.');
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});