const { reportService } = require('./services/reportService.cjs');

async function test() {
    console.log('--- TEST START ---');
    try {
        const result = await reportService.generateAndSendReport(['test@example.com']);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    }
    console.log('--- TEST END ---');
}

test();
