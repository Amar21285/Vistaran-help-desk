import { reportService } from '../services/reportService.js';
import fs from 'fs';
import path from 'path';

async function test() {
    console.log('Starting Report Verification...');
    
    // 1. Manually trigger report generation
    // We'll pass a dummy recipient to avoid actual email send if not configured
    const result = await reportService.generateAndSendReport(['test-dsr@vistaran.in']);
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
        const today = new Date().toISOString().split('T')[0];
        const pdfPath = path.join(process.cwd(), 'data', 'reports', `DSR_${today}.pdf`);
        const excelPath = path.join(process.cwd(), 'data', 'reports', `DSR_${today}.xlsx`);
        
        const pdfExists = fs.existsSync(pdfPath);
        const excelExists = fs.existsSync(excelPath);
        
        console.log(`PDF Generated: ${pdfExists} (${pdfPath})`);
        console.log(`Excel Generated: ${excelExists} (${excelPath})`);
        
        if (pdfExists && excelExists) {
            console.log('SUCCESS: Reports generated correctly.');
        } else {
            console.error('FAILURE: Reports not found on disk.');
            process.exit(1);
        }
    } else {
        console.error('FAILURE: Report service returned error.');
        process.exit(1);
    }
}

test().catch(err => {
    console.error('Test Error:', err);
    process.exit(1);
});
